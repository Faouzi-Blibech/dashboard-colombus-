from pydantic import BaseModel
from datetime import date
from typing import Optional


class CurrencyOut(BaseModel):
    code: str
    name: str
    model_config = {"from_attributes": True}


class RatePoint(BaseModel):
    date: date
    rate: float


class DailyChangeOut(BaseModel):
    date: date
    rate: float
    prev_rate: float
    change_pct: float


class PerformanceOut(BaseModel):
    period: str
    start_date: date
    end_date: date
    start_rate: float
    end_rate: float
    change_pct: float


class HighLowOut(BaseModel):
    high: float
    high_date: date
    low: float
    low_date: date


class VolatilityOut(BaseModel):
    rolling_21d_std: float
    annualized_vol: float
    latest_date: date


class AlertOut(BaseModel):
    date: date
    risk_level: str
    daily_change_pct: float
    message: str


class PairSummary(BaseModel):
    pair: str
    daily_change_pct: float
    volatility: Optional[float]
    risk_level: str


class AnalysisSummaryOut(BaseModel):
    most_volatile: str
    most_stable: str
    biggest_mover: str
    pairs: list[PairSummary]


class CommentaryRequest(BaseModel):
    base: str
    quote: str
    date: date


class CommentaryOut(BaseModel):
    commentary: str
    date: date
    cached: bool
