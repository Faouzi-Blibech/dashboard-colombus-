import pandas as pd
from datetime import date
from sqlalchemy.orm import Session


def load_rates_df(db: Session, base: str, quote: str, from_date: date, to_date: date) -> pd.DataFrame:
    raise NotImplementedError("Implemented in Task 5")


def calc_daily_change(df: pd.DataFrame) -> dict:
    raise NotImplementedError("Implemented in Task 5")


def calc_performance(df: pd.DataFrame, period: str) -> dict:
    raise NotImplementedError("Implemented in Task 5")


def calc_high_low(df: pd.DataFrame) -> dict:
    raise NotImplementedError("Implemented in Task 5")


def calc_volatility(df: pd.DataFrame) -> dict:
    raise NotImplementedError("Implemented in Task 5")


def is_spike(df: pd.DataFrame) -> bool:
    raise NotImplementedError("Implemented in Task 5")
