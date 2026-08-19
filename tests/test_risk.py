import pytest
import pandas as pd
import numpy as np
from src.risk_engine import BankRiskEngine

@pytest.fixture
def risk_engine():
    return BankRiskEngine()

def test_log_returns_shape(risk_engine):
    returns = risk_engine.log_returns
    assert len(returns) > 1000
    assert 'BBCA.JK' in returns.columns or 'BBCA' in returns.columns or len(returns.columns) == 4

def test_var_and_es_metrics(risk_engine):
    metrics = risk_engine.calculate_var_es(alpha=0.95)
    assert len(metrics) == 4
    # Expected Shortfall harus selalu lebih besar atau sama dengan VaR
    assert np.all(metrics['Daily_ES_pct'] >= metrics['Daily_VaR_pct'])
    assert np.all(metrics['Daily_VaR_pct'] > 0)

def test_stationarity_adf(risk_engine):
    adf_res = risk_engine.run_adf_test()
    assert len(adf_res) == 4
    # Seluruh p-value ADF log returns harus signifikan stasioner (< 0.05)
    assert np.all(adf_res['p_value'] < 0.05)
