import os
import pandas as pd
import numpy as np
from scipy import stats
from statsmodels.tsa.stattools import adfuller

class BankRiskEngine:
    def __init__(self, data_path: str = None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'combined_close.csv')
        self.df = pd.read_csv(data_path, index_col=0, parse_dates=True)
        self.log_returns = np.log(self.df / self.df.shift(1)).dropna()

    def calculate_var_es(self, alpha: float = 0.95) -> pd.DataFrame:
        var_res = {}
        es_res = {}
        for col in self.log_returns.columns:
            rets = self.log_returns[col]
            var_val = np.percentile(rets, (1 - alpha) * 100)
            es_val = rets[rets <= var_val].mean()
            var_res[col] = -var_val * 100
            es_res[col] = -es_val * 100
        return pd.DataFrame({'Daily_VaR_pct': var_res, 'Daily_ES_pct': es_res})

    def run_adf_test(self) -> pd.DataFrame:
        adf_stats = {}
        p_vals = {}
        for col in self.log_returns.columns:
            res = adfuller(self.log_returns[col])
            adf_stats[col] = res[0]
            p_vals[col] = res[1]
        return pd.DataFrame({'ADF_Statistic': adf_stats, 'p_value': p_vals})
