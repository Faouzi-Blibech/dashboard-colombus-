"""
FX Excel → CSV Converter
=========================
Reads FX_Data__1_.xlsx (Tunisian interbank rates, base = TND),
reshapes it to match the fx_clean_data.csv format produced by the
Frankfurter fetcher, adds analysis columns, and saves a clean CSV.

The Excel columns represent how many TND buy one unit of each currency
e.g. USD = 1.27 means 1 USD = 1.27 TND

Output columns (identical to fx_clean_data.csv):
  date | base | pair | rate | daily_change_pct | volatility_30d | risk_level

Usage:
    pip install pandas openpyxl
    python fx_excel_to_csv.py

Place FX_Data__1_.xlsx in the same folder as this script.
"""

import pandas as pd
from datetime import date


# ── Config ────────────────────────────────────────────────────────────────────

EXCEL_FILE  = r"dashboard-colombus-/data/FX Data (1).xlsx"
SHEET_NAME  = "InterBancaire"
OUTPUT_FILE = "fx_excel_clean.csv"

# Pairs we want — must match what Frankfurter produces
# Excel base is TND, so these are TND/XXX rates
PAIRS_WANTED = {
    "USD": "TND/USD",
    "EUR": "TND/EUR",
    "GBP": "TND/GBP",
}

# We also want EUR/USD, EUR/TND, GBP/USD, USD/TND — derived via cross rates
# (same pairs the Frankfurter script produces)


# ── 1. Load Excel ─────────────────────────────────────────────────────────────

def load_excel(path=EXCEL_FILE):
    print(f"[Loading] {path}")
    df = pd.read_excel(path, sheet_name=SHEET_NAME)

    # Drop fully empty junk columns
    df = df.dropna(axis=1, how="all")

    # Clean date column
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.rename(columns={"Date": "date"})
    df = df.sort_values("date").reset_index(drop=True)

    print(f"  → {len(df)} rows  |  {df['date'].min().date()} → {df['date'].max().date()}")
    print(f"  → Columns: {[c for c in df.columns if c != 'date']}")
    return df


# ── 2. Reshape to long format ─────────────────────────────────────────────────

def reshape_to_long(df):
    """
    The Excel is wide format (one column per currency, all vs TND).
    We melt it into long format:
      date | base | pair | rate
    matching exactly what the Frankfurter fetcher produces.

    The Excel rates are TND per 1 unit of foreign currency
    e.g. USD column = how many TND per 1 USD → that IS the TND/USD rate
    """
    currency_cols = [c for c in df.columns if c != "date"]

    rows = []
    for _, row in df.iterrows():
        for currency in currency_cols:
            rate = row[currency]
            if pd.isna(rate) or rate <= 0:
                continue
            rows.append({
                "date": row["date"],
                "base": "TND",
                "pair": f"TND/{currency}",
                "rate": round(float(rate), 6)
            })

    long_df = pd.DataFrame(rows)
    print(f"\n[Reshaped] {len(long_df)} rows across {long_df['pair'].nunique()} pairs")
    return long_df


# ── 3. Derive cross-rate pairs ────────────────────────────────────────────────

def derive_cross_rates(long_df):
    """
    From TND/USD, TND/EUR, TND/GBP we can derive:
      EUR/USD  = TND/USD ÷ TND/EUR
      EUR/TND  = 1 / TND/EUR  (how many TND per 1 EUR, inverted)
      GBP/USD  = TND/USD ÷ TND/GBP
      USD/TND  = 1 / TND/USD

    These match what the Frankfurter fetcher returns.
    """
    extra_rows = []

    # Pivot to make cross-rate math easy
    pivot = long_df.pivot(index="date", columns="pair", values="rate")

    for dt, row in pivot.iterrows():
        tnd_usd = row.get("TND/USD")
        tnd_eur = row.get("TND/EUR")
        tnd_gbp = row.get("TND/GBP")

        # EUR/USD
        if tnd_usd and tnd_eur and tnd_eur != 0:
            extra_rows.append({"date": dt, "base": "EUR", "pair": "EUR/USD",
                                "rate": round(tnd_usd / tnd_eur, 6)})

        # EUR/TND = 1 / TND/EUR
        if tnd_eur and tnd_eur != 0:
            extra_rows.append({"date": dt, "base": "EUR", "pair": "EUR/TND",
                                "rate": round(1 / tnd_eur, 6)})

        # GBP/USD
        if tnd_usd and tnd_gbp and tnd_gbp != 0:
            extra_rows.append({"date": dt, "base": "GBP", "pair": "GBP/USD",
                                "rate": round(tnd_usd / tnd_gbp, 6)})

        # USD/TND = 1 / TND/USD  (how many TND per 1 USD, inverted)
        if tnd_usd and tnd_usd != 0:
            extra_rows.append({"date": dt, "base": "USD", "pair": "USD/TND",
                                "rate": round(1 / tnd_usd, 6)})

    cross_df = pd.DataFrame(extra_rows)
    print(f"[Cross rates] {len(cross_df)} rows derived  "
          f"({cross_df['pair'].nunique()} new pairs)")
    return cross_df


# ── 4. Filter to matching pairs only ─────────────────────────────────────────

def filter_pairs(df):
    """Keep only the pairs that Frankfurter also produces."""
    target_pairs = ["EUR/USD", "EUR/TND", "EUR/GBP",
                    "GBP/USD", "USD/TND", "TND/USD",
                    "TND/EUR", "TND/GBP"]
    return df[df["pair"].isin(target_pairs)].copy()


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
    print("FX ANALYSIS SUMMARY  —  Excel source")
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
        print(f"    Daily change   : {latest['daily_change_pct']:+.4f}%  "
              f"→ {latest['risk_level']} risk")
        print(f"    High / Low     : {high} / {low}")
        print(f"    Avg volatility : {avg_vol:.2f}%  (annualised)")
        print(f"    Biggest 1d move: {max_move:.4f}% on {str(max_move_dt)[:10]}")

    most_volatile = df.groupby("pair")["volatility_30d"].mean().idxmax()
    most_stable   = df.groupby("pair")["volatility_30d"].mean().idxmin()
    print(f"\n  Most volatile pair : {most_volatile}")
    print(f"  Most stable pair   : {most_stable}")
    print("=" * 55)


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    # Step 1 — load
    raw = load_excel()

    # Step 2 — reshape to long (TND/XXX pairs)
    long_df = reshape_to_long(raw)

    # Step 3 — derive EUR/USD, EUR/TND, GBP/USD, USD/TND
    cross_df = derive_cross_rates(long_df)

    # Step 4 — combine and filter to target pairs
    combined = pd.concat([long_df, cross_df], ignore_index=True)
    combined = filter_pairs(combined)
    combined = combined.drop_duplicates(subset=["date", "pair"])
    combined = combined.sort_values(["pair", "date"]).reset_index(drop=True)

    print(f"\n[Combined] {len(combined)} rows  |  pairs: "
          f"{sorted(combined['pair'].unique())}")

    # Step 5
    df = add_analysis(combined)

    # Step 6
    print_summary(df)

    # Step 7
    df = df.drop(columns=["volatility_30d", "risk_level"])

    # Step 8
    df.to_csv(OUTPUT_FILE, index=False)