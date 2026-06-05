"""
FX Data Fetcher — Frankfurter API v2
=====================================
Fetches historical exchange rates for the FX Risk Alert & Currency Dashboard.
No API key needed. Data from the European Central Bank.

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
START_DATE = str(date.today() - timedelta(days=365))
END_DATE   = str(date.today())


# ── 1. Check available currencies ─────────────────────────────────────────────

def get_available_currencies():
    """
    Returns a dict of {code: name}.

    The v2 /currencies endpoint returns a dict keyed by currency code:
      { "EUR": { "name": "Euro", ... }, "USD": { "name": "US Dollar", ... }, ... }

    We flatten it to { "EUR": "Euro", "USD": "US Dollar", ... }
    and handle any unexpected shape gracefully.
    """
    url = f"{BASE_URL}/currencies"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    raw = response.json()

    print(f"\n[DEBUG] /currencies type: {type(raw).__name__}")
    if isinstance(raw, (list, dict)):
        sample = raw[0] if isinstance(raw, list) else next(iter(raw.values()))
        print(f"[DEBUG] First item sample: {sample}")

    # Case 1 — dict of dicts: { "EUR": {"name": "Euro", ...}, ... }
    if isinstance(raw, dict):
        first_val = next(iter(raw.values()))
        if isinstance(first_val, dict):
            return {code: info.get("name", code) for code, info in raw.items()}
        # Case 2 — simple dict: { "EUR": "Euro", ... }
        return raw

    # Case 3 — list of dicts: [{"code": "EUR", "name": "Euro"}, ...]
    if isinstance(raw, list) and isinstance(raw[0], dict):
        keys = list(raw[0].keys())
        print(f"[DEBUG] List item keys: {keys}")
        # find the short uppercase key (the code) and the longer string key (the name)
        code_key = next((k for k in keys if isinstance(raw[0][k], str) and raw[0][k].isupper()), keys[0])
        name_key = next((k for k in keys if k != code_key), keys[1])
        return {item[code_key]: item[name_key] for item in raw}

    # Fallback — just return raw so the rest of the script doesn't crash
    print("[WARNING] Unexpected /currencies format — returning raw response")
    return {}


# ── 2. Get latest rates ────────────────────────────────────────────────────────

def get_latest_rates(base=BASE_CURR, targets=TARGETS):
    """
    v2 latest rates: GET /v2/rates?base=EUR&quotes=USD,GBP,TND
    The full response may be a dict OR a list depending on the API version.
    We handle both shapes.
    """
    quotes = ",".join(targets)
    url = f"{BASE_URL}/rates?base={base}&quotes={quotes}"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    # If the whole response is a list, the first item is the latest entry
    if isinstance(data, list):
        entry = data[0]
        print(f"\n[Latest rates]  Date: {entry.get('date')}")
        for currency, rate in entry.get("rates", {}).items():
            print(f"  {base}/{currency}: {rate}")
        return data

    # Normal dict response
    rates_raw = data.get("rates", [])
    if isinstance(rates_raw, list) and rates_raw:
        entry = rates_raw[0]
    elif isinstance(rates_raw, dict):
        # fallback: pick the last date key
        last_date = sorted(rates_raw.keys())[-1]
        entry = {"date": last_date, "rates": rates_raw[last_date]}
    else:
        print(f"\n[Latest rates] Unexpected shape: {data}")
        return data

    print(f"\n[Latest rates]  Base: {data.get('base')}  Date: {entry.get('date')}")
    for currency, rate in entry.get("rates", {}).items():
        print(f"  {base}/{currency}: {rate}")
    return data


# ── 3. Get historical rates ────────────────────────────────────────────────────

def get_historical_rates(base=BASE_CURR, targets=TARGETS,
                         start=START_DATE, end=END_DATE):
    """
    v2 time series: GET /v2/rates?base=EUR&quotes=USD,GBP&from=2024-01-01&to=2025-01-01

    v2 response shape:
      {
        "base": "EUR",
        "rates": [
          { "date": "2024-01-02", "rates": { "USD": 1.09, "GBP": 0.86 } },
          ...
        ]
      }
    """
    quotes = ",".join(targets)
    url = f"{BASE_URL}/rates?base={base}&quotes={quotes}&from={start}&to={end}"

    print(f"\n[Fetching] {base} → {quotes}  |  {start} → {end}")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    data = response.json()

    # DEBUG — show exactly what the API returned
    print(f"  [DEBUG] response type : {type(data).__name__}")
    if isinstance(data, dict):
        print(f"  [DEBUG] top-level keys: {list(data.keys())}")
        sample = data.get("rates") or data.get("data") or next(iter(data.values()), None)
        print(f"  [DEBUG] rates value type: {type(sample).__name__}")
        if isinstance(sample, list) and sample:
            print(f"  [DEBUG] first entry: {sample[0]}")
        elif isinstance(sample, dict):
            first_k = next(iter(sample))
            print(f"  [DEBUG] first entry: {first_k} -> {sample[first_k]}")
    elif isinstance(data, list) and data:
        print(f"  [DEBUG] first item: {data[0]}")

    rows = []

    # Unwrap whatever shape the API returned
    if isinstance(data, list):
        entries = data
    elif isinstance(data, dict):
        # Try common key names
        entries = (data.get("rates") or data.get("data") or
                   data.get("results") or [])
    else:
        entries = []

    if isinstance(entries, list):
        for entry in entries:
            date_str = entry.get("date")
            for target_currency, rate_value in entry.get("rates", {}).items():
                rows.append({
                    "date": date_str,
                    "base": base,
                    "pair": f"{base}/{target_currency}",
                    "rate": rate_value
                })
    else:
        # v1-style dict: {"YYYY-MM-DD": {"USD": 1.09}}
        for date_str, rates in entries.items():
            for target_currency, rate_value in rates.items():
                rows.append({
                    "date": date_str,
                    "base": base,
                    "pair": f"{base}/{target_currency}",
                    "rate": rate_value
                })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    print(f"  → {len(df)} rows fetched across {df['pair'].nunique()} pairs")
    return df


# ── 4. Fetch all pair combinations ────────────────────────────────────────────

def fetch_all_pairs():
    """
    Fetches EUR/USD, EUR/GBP, EUR/TND, GBP/USD.
    Computes USD/TND via cross rate: EUR/TND ÷ EUR/USD.
    """
    all_frames = []

    df_eur = get_historical_rates(base="EUR", targets=["USD", "GBP", "TND"])
    all_frames.append(df_eur)
    time.sleep(0.5)

    # Cross rate: USD/TND = EUR/TND ÷ EUR/USD
    eur_usd = df_eur[df_eur["pair"] == "EUR/USD"][["date", "rate"]].rename(columns={"rate": "eur_usd"})
    eur_tnd = df_eur[df_eur["pair"] == "EUR/TND"][["date", "rate"]].rename(columns={"rate": "eur_tnd"})
    merged = eur_usd.merge(eur_tnd, on="date")
    merged["pair"] = "USD/TND"
    merged["base"] = "USD"
    merged["rate"] = (merged["eur_tnd"] / merged["eur_usd"]).round(6)
    all_frames.append(merged[["date", "base", "pair", "rate"]])

    df_gbp = get_historical_rates(base="GBP", targets=["USD"])
    all_frames.append(df_gbp)
    time.sleep(0.5)

    combined = pd.concat(all_frames, ignore_index=True)
    combined = combined.drop_duplicates(subset=["date", "pair"]).sort_values(["pair", "date"])
    return combined.reset_index(drop=True)


# ── 5. Add analysis columns ────────────────────────────────────────────────────

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


# ── 6. Summary ─────────────────────────────────────────────────────────────────

def print_summary(df):
    print("\n" + "=" * 55)
    print("FX ANALYSIS SUMMARY")
    print("=" * 55)
    for pair, group in df.groupby("pair"):
        latest  = group.iloc[-1]
        high    = group["rate"].max()
        low     = group["rate"].min()
        avg_vol = group["volatility_30d"].mean()
        max_move    = group["daily_change_pct"].abs().max()
        max_move_dt = group.loc[group["daily_change_pct"].abs().idxmax(), "date"]
        print(f"\n  {pair}")
        print(f"    Latest rate    : {latest['rate']}")
        print(f"    Daily change   : {latest['daily_change_pct']:+.4f}%  → {latest['risk_level']} risk")
        print(f"    High / Low     : {high} / {low}")
        print(f"    Avg volatility : {avg_vol:.2f}%  (annualised)")
        print(f"    Biggest move   : {max_move:.4f}% on {str(max_move_dt)[:10]}")

    most_volatile = df.groupby("pair")["volatility_30d"].mean().idxmax()
    most_stable   = df.groupby("pair")["volatility_30d"].mean().idxmin()
    print(f"\n  Most volatile : {most_volatile}")
    print(f"  Most stable   : {most_stable}")
    print("=" * 55)


# ── 7. Save ────────────────────────────────────────────────────────────────────

def save_to_csv(df, path="fx_clean_data.csv"):
    df.to_csv(path, index=False)
    print(f"\n[Saved] {path}  ({len(df)} rows)")


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("── Step 1: Available currencies ──")
    currencies = get_available_currencies()
    print(f"  {len(currencies)} currencies available")
    for code in ["USD", "EUR", "GBP", "TND"]:
        print(f"  {code}: {currencies.get(code, 'NOT FOUND')}")

    print("\n── Step 2: Latest rates ──")
    get_latest_rates()

    print("\n── Step 3: Historical data (12 months) ──")
    df_raw = fetch_all_pairs()

    print("\n── Step 4: Analysis columns ──")
    df = add_analysis(df_raw)

    print("\n── Step 5: Summary ──")
    print_summary(df)

    print("\n── Step 6: Save CSV ──")
    save_to_csv(df)

    print("\nDone! fx_clean_data.csv is ready for the database import step.")