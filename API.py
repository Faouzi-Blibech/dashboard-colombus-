"""
FX Data Fetcher — Frankfurter API v2
=====================================
Fetches historical exchange rates for the FX Risk Alert & Currency Dashboard.
No API key needed. Data from the European Central Bank.

Confirmed v2 response shapes (from live API debug):
  /currencies → list of {"iso_code": "EUR", "name": "Euro", ...}
  /rates      → flat list of {"date": "2025-06-05", "base": "EUR", "quote": "USD", "rate": 1.09}
               one object per currency per date — NOT nested

Usage:
    pip install requests pandas
    python fx_data_fetcher.py
"""

import requests
import pandas as pd
from datetime import date, timedelta
import time


# ── Config ────────────────────────────────────────────────────────────────────

BASE_URL   = "https://api.frankfurter.dev/v2"
BASE_CURR  = "EUR"
TARGETS    = ["USD", "GBP", "TND"]
START_DATE = "2026-01-27"
END_DATE   = str(date.today())


# ── 1. Check available currencies ─────────────────────────────────────────────

def get_available_currencies():
    """
    v2 returns: [{"iso_code": "EUR", "name": "Euro", ...}, ...]
    We return a plain {iso_code: name} dict.
    """
    url = f"{BASE_URL}/currencies"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    raw = response.json()

    if isinstance(raw, list):
        return {item["iso_code"]: item["name"] for item in raw}
    if isinstance(raw, dict):
        first = next(iter(raw.values()))
        if isinstance(first, dict):
            return {code: info.get("name", code) for code, info in raw.items()}
        return raw
    return {}


# ── 2. Get latest rates ────────────────────────────────────────────────────────

def get_latest_rates(base=BASE_CURR, targets=TARGETS):
    """
    v2 returns a flat list, one object per quote:
      [{"date": "2026-06-05", "base": "EUR", "quote": "USD", "rate": 1.09}, ...]
    """
    quotes = ",".join(targets)
    url = f"{BASE_URL}/rates?base={base}&quotes={quotes}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    entries = data if isinstance(data, list) else data.get("rates", [])
    if entries:
        print(f"\n[Latest rates]  Base: {base}  Date: {entries[0].get('date')}")
        for entry in entries:
            print(f"  {entry['base']}/{entry['quote']}: {entry['rate']}")
    return data


# ── 3. Get historical rates ────────────────────────────────────────────────────

def get_historical_rates(base=BASE_CURR, targets=TARGETS,
                         start=START_DATE, end=END_DATE):
    """
    v2 timeseries returns a flat list — one row per date per quote currency:
      [
        {"date": "2025-06-05", "base": "EUR", "quote": "GBP", "rate": 0.842},
        {"date": "2025-06-05", "base": "EUR", "quote": "USD", "rate": 1.091},
        {"date": "2025-06-06", "base": "EUR", "quote": "GBP", "rate": 0.845},
        ...
      ]
    We read each flat entry directly using entry["quote"] and entry["rate"].
    """
    quotes = ",".join(targets)
    url = f"{BASE_URL}/rates?base={base}&quotes={quotes}&from={start}&to={end}"

    print(f"\n[Fetching] {base} → {quotes}  |  {start} → {end}")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    data = response.json()

    # v2 confirmed: entire response is a flat list
    entries = data if isinstance(data, list) else data.get("rates", [])

    if not entries:
        print("  [WARNING] Empty response — check dates or currency codes")
        return pd.DataFrame(columns=["date", "base", "pair", "rate"])

    rows = []
    for entry in entries:
        # Each entry: {"date": "...", "base": "EUR", "quote": "USD", "rate": 1.09}
        rows.append({
            "date": entry["date"],
            "base": entry["base"],
            "pair": f"{entry['base']}/{entry['quote']}",
            "rate": entry["rate"]
        })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["pair", "date"]).reset_index(drop=True)
    print(f"  → {len(df)} rows across {df['pair'].nunique()} pairs")
    return df


# ── 4. Fetch all pairs ────────────────────────────────────────────────────────

def fetch_all_pairs():
    """
    Pulls EUR/USD, EUR/GBP, EUR/TND directly.
    Derives USD/TND via cross rate: EUR/TND ÷ EUR/USD.
    Pulls GBP/USD directly.
    """
    all_frames = []

    # EUR base: EUR/USD, EUR/GBP, EUR/TND
    df_eur = get_historical_rates(base="EUR", targets=["USD", "GBP", "TND"])
    all_frames.append(df_eur)
    time.sleep(0.5)

    # Cross rate: USD/TND = EUR/TND ÷ EUR/USD
    eur_usd = df_eur[df_eur["pair"] == "EUR/USD"][["date", "rate"]].rename(columns={"rate": "eur_usd"})
    eur_tnd = df_eur[df_eur["pair"] == "EUR/TND"][["date", "rate"]].rename(columns={"rate": "eur_tnd"})
    cross = eur_usd.merge(eur_tnd, on="date")
    cross["pair"] = "USD/TND"
    cross["base"] = "USD"
    cross["rate"] = (cross["eur_tnd"] / cross["eur_usd"]).round(6)
    all_frames.append(cross[["date", "base", "pair", "rate"]])

    # GBP/USD directly
    df_gbp = get_historical_rates(base="GBP", targets=["USD"])
    all_frames.append(df_gbp)
    time.sleep(0.5)

    combined = pd.concat(all_frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=["date", "pair"]).sort_values(["pair", "date"])
    return combined.reset_index(drop=True)


# ── 5. Analysis columns ───────────────────────────────────────────────────────

def add_analysis(df):
    """Adds daily % change, 30-day rolling volatility, and risk alert level."""
    df = df.copy().sort_values(["pair", "date"])

    df["daily_change_pct"] = (
        df.groupby("pair")["rate"].pct_change() * 100
    ).round(4)

    df["volatility_30d"] = (
        df.groupby("pair")["daily_change_pct"]
          .transform(lambda x: x.rolling(30).std() * (252 ** 0.5))
    ).round(4)

    def risk_level(chg):
        if pd.isna(chg):
            return None
        a = abs(chg)
        return "low" if a < 0.5 else "medium" if a <= 1.0 else "high"

    df["risk_level"] = df["daily_change_pct"].apply(risk_level)
    return df


# ── 6. Summary ────────────────────────────────────────────────────────────────

def print_summary(df):
    print("\n" + "=" * 55)
    print("FX ANALYSIS SUMMARY  —  last 12 months")
    print("=" * 55)
    for pair, group in df.groupby("pair"):
        latest      = group.iloc[-1]
        high        = group["rate"].max()
        low         = group["rate"].min()
        avg_vol     = group["volatility_30d"].mean()
        max_move    = group["daily_change_pct"].abs().max()
        max_move_dt = group.loc[group["daily_change_pct"].abs().idxmax(), "date"]
        print(f"\n  {pair}")
        print(f"    Latest rate    : {latest['rate']}")
        print(f"    Daily change   : {latest['daily_change_pct']:+.4f}%  → {latest['risk_level']} risk")
        print(f"    High / Low     : {high} / {low}")
        print(f"    Avg volatility : {avg_vol:.2f}%  (annualised)")
        print(f"    Biggest 1d move: {max_move:.4f}% on {str(max_move_dt)[:10]}")

    most_volatile = df.groupby("pair")["volatility_30d"].mean().idxmax()
    most_stable   = df.groupby("pair")["volatility_30d"].mean().idxmin()
    print(f"\n  Most volatile pair : {most_volatile}")
    print(f"  Most stable pair   : {most_stable}")
    print("=" * 55)


# ── 7. Save ───────────────────────────────────────────────────────────────────

def save_to_csv(df, path="fx_clean_data.csv"):
    df.to_csv(path, index=False)
    print(f"\n[Saved] {path}  ({len(df)} rows, {df['pair'].nunique()} pairs, 12 months)")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("── Step 1: Available currencies ──")
    currencies = get_available_currencies()
    print(f"  {len(currencies)} currencies available")
    for code in ["USD", "EUR", "GBP", "TND"]:
        print(f"  {code}: {currencies.get(code, 'NOT FOUND')}")

    print("\n── Step 2: Latest rates ──")
    get_latest_rates()

    print("\n── Step 3: Historical data — 12 months ──")
    df_raw = fetch_all_pairs()

    print("\n── Step 4: Analysis columns ──")
    df = add_analysis(df_raw)

    print("\n── Step 5: Summary ──")
    print_summary(df)

    print("\n── Step 6: Save CSV ──")
    save_to_csv(df)

    print("\nDone! fx_clean_data.csv is ready for the database import step.")