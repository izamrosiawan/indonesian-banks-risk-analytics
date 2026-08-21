import os
import json
import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize

try:
    from statsmodels.tsa.stattools import adfuller
except ImportError:
    adfuller = None

class BankRiskEngine:
    """
    Quantitative Risk & Portfolio Optimization Engine for Indonesian Big Four Banks.
    Implements Parametric & Historical VaR/ES, ADF Stationarity Tests,
    Modern Portfolio Theory (Markowitz Mean-Variance Efficient Frontier),
    and Monte Carlo Portfolio Simulations.
    """
    def __init__(self, data_path: str = None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'combined_close.csv')
        self.df = pd.read_csv(data_path, index_col=0, parse_dates=True)
        self.tickers = list(self.df.columns)
        self.log_returns = np.log(self.df / self.df.shift(1)).dropna()
        self.trading_days = 252

    def calculate_var_es(self, alpha: float = 0.95) -> pd.DataFrame:
        """Computes Historical Daily Value at Risk and Expected Shortfall at confidence level alpha."""
        var_res = {}
        es_res = {}
        for col in self.log_returns.columns:
            rets = self.log_returns[col]
            var_val = np.percentile(rets, (1 - alpha) * 100)
            es_val = rets[rets <= var_val].mean()
            var_res[col] = float(-var_val * 100)
            es_res[col] = float(-es_val * 100)
        return pd.DataFrame({'Daily_VaR_pct': var_res, 'Daily_ES_pct': es_res})

    def run_adf_test(self) -> pd.DataFrame:
        """Executes Augmented Dickey-Fuller stationarity tests on daily log returns."""
        adf_stats = {}
        p_vals = {}
        if adfuller is not None:
            for col in self.log_returns.columns:
                res = adfuller(self.log_returns[col])
                adf_stats[col] = float(res[0])
                p_vals[col] = float(res[1])
        else:
            # Fallback estimation using OLS t-statistic proxy if statsmodels is not installed
            for col in self.log_returns.columns:
                series = self.log_returns[col].values
                dy = np.diff(series)
                y_lag = series[:-1]
                slope, _, _, _, std_err = stats.linregress(y_lag, dy)
                t_stat = slope / std_err if std_err > 0 else -10.0
                adf_stats[col] = float(t_stat)
                p_vals[col] = 0.0001 if t_stat < -3.4 else 0.05
        return pd.DataFrame({'ADF_Statistic': adf_stats, 'p_value': p_vals})

    def get_summary_statistics(self, risk_free_rate: float = 0.05) -> pd.DataFrame:
        """Calculates Annualized Return, Volatility, Sharpe Ratio, and Max Drawdown per asset and for EW portfolio."""
        mean_daily = self.log_returns.mean()
        ann_return = mean_daily * self.trading_days
        ann_vol = self.log_returns.std() * np.sqrt(self.trading_days)
        sharpe = (ann_return - risk_free_rate) / ann_vol

        # Max Drawdown calculation
        mdd_res = {}
        for col in self.df.columns:
            prices = self.df[col]
            peak = prices.cummax()
            dd = (prices - peak) / peak
            mdd_res[col] = float(dd.min() * 100)

        summary = pd.DataFrame({
            'Annualized_Return_pct': ann_return * 100,
            'Annualized_Volatility_pct': ann_vol * 100,
            'Sharpe_Ratio': sharpe,
            'Max_Drawdown_pct': pd.Series(mdd_res)
        })

        # Equal-weighted portfolio metrics
        ew_rets = self.log_returns.mean(axis=1)
        ew_ann_ret = float(ew_rets.mean() * self.trading_days)
        ew_ann_vol = float(ew_rets.std() * np.sqrt(self.trading_days))
        ew_sharpe = float((ew_ann_ret - risk_free_rate) / ew_ann_vol)
        
        ew_cum = np.exp(ew_rets.cumsum())
        ew_peak = ew_cum.cummax()
        ew_mdd = float(((ew_cum - ew_peak) / ew_peak).min() * 100)

        summary.loc['EW_Portfolio'] = [
            ew_ann_ret * 100,
            ew_ann_vol * 100,
            ew_sharpe,
            ew_mdd
        ]
        return summary

    def portfolio_performance(self, weights: np.ndarray, risk_free_rate: float = 0.05):
        """Calculates expected annualized return, volatility, and Sharpe ratio for given portfolio weights."""
        weights = np.array(weights)
        ann_ret = np.sum(self.log_returns.mean() * weights) * self.trading_days
        cov_matrix = self.log_returns.cov() * self.trading_days
        ann_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        sharpe = (ann_ret - risk_free_rate) / ann_vol
        return ann_ret, ann_vol, sharpe

    def optimize_portfolio(self, risk_free_rate: float = 0.05) -> dict:
        """
        Calculates Markowitz Mean-Variance Optimal Portfolios:
        1. Max Sharpe Ratio Portfolio
        2. Minimum Volatility Portfolio
        3. Efficient Frontier curve (target returns)
        """
        num_assets = len(self.tickers)
        bounds = tuple((0.0, 1.0) for _ in range(num_assets))
        init_guess = num_assets * [1.0 / num_assets]
        constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})

        # 1. Max Sharpe Portfolio
        def neg_sharpe(w):
            ret, vol, sh = self.portfolio_performance(w, risk_free_rate)
            return -sh

        opt_sharpe = minimize(neg_sharpe, init_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        max_sharpe_weights = dict(zip(self.tickers, np.round(opt_sharpe.x, 4)))
        ret_s, vol_s, sh_s = self.portfolio_performance(opt_sharpe.x, risk_free_rate)

        # 2. Min Volatility Portfolio
        def min_vol(w):
            return self.portfolio_performance(w, risk_free_rate)[1]

        opt_min_vol = minimize(min_vol, init_guess, method='SLSQP', bounds=bounds, constraints=constraints)
        min_vol_weights = dict(zip(self.tickers, np.round(opt_min_vol.x, 4)))
        ret_v, vol_v, sh_v = self.portfolio_performance(opt_min_vol.x, risk_free_rate)

        # 3. Efficient Frontier Curve
        target_returns = np.linspace(ret_v, ret_s * 1.15, 30)
        frontier_volatilities = []
        for target_ret in target_returns:
            cons = (
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
                {'type': 'eq', 'fun': lambda w: self.portfolio_performance(w, risk_free_rate)[0] - target_ret}
            )
            res = minimize(min_vol, init_guess, method='SLSQP', bounds=bounds, constraints=cons)
            if res.success:
                frontier_volatilities.append(float(res.fun))
            else:
                frontier_volatilities.append(None)

        valid_points = [
            {'return_pct': float(r * 100), 'volatility_pct': float(v * 100)}
            for r, v in zip(target_returns, frontier_volatilities) if v is not None
        ]

        return {
            'max_sharpe': {
                'weights': max_sharpe_weights,
                'annualized_return_pct': float(ret_s * 100),
                'annualized_volatility_pct': float(vol_s * 100),
                'sharpe_ratio': float(sh_s)
            },
            'min_volatility': {
                'weights': min_vol_weights,
                'annualized_return_pct': float(ret_v * 100),
                'annualized_volatility_pct': float(vol_v * 100),
                'sharpe_ratio': float(sh_v)
            },
            'efficient_frontier': valid_points
        }

    def simulate_monte_carlo(self, num_portfolios: int = 10000, risk_free_rate: float = 0.05, seed: int = 42) -> pd.DataFrame:
        """Runs random Dirichlet / Dirichlet-uniform Monte Carlo portfolio allocations."""
        np.random.seed(seed)
        num_assets = len(self.tickers)
        weights_arr = np.random.dirichlet(np.ones(num_assets), size=num_portfolios)
        
        cov_matrix = self.log_returns.cov() * self.trading_days
        mean_returns = self.log_returns.mean() * self.trading_days

        port_returns = np.dot(weights_arr, mean_returns)
        port_vols = np.sqrt(np.einsum('ij,jk,ik->i', weights_arr, cov_matrix, weights_arr))
        sharpe_ratios = (port_returns - risk_free_rate) / port_vols

        sim_df = pd.DataFrame({
            'Return_pct': port_returns * 100,
            'Volatility_pct': port_vols * 100,
            'Sharpe_Ratio': sharpe_ratios
        })
        for idx, ticker in enumerate(self.tickers):
            sim_df[f'Weight_{ticker}'] = weights_arr[:, idx]

        return sim_df

    def export_dashboard_payload(self, output_path: str = None) -> dict:
        """Generates structured JSON payload for the interactive web dashboard."""
        if output_path is None:
            output_path = os.path.join(os.path.dirname(__file__), '..', 'dashboard_data.json')

        # Normalized price history (resampled monthly to keep payload lean)
        monthly_df = self.df.resample('ME').last()
        norm_prices = (monthly_df / monthly_df.iloc[0]) * 100

        dates = [d.strftime('%Y-%m') for d in monthly_df.index]
        series = {}
        for col in self.tickers:
            series[col] = [round(float(v), 2) for v in norm_prices[col]]

        # Equal-weighted portfolio cumulative
        ew_monthly = norm_prices.mean(axis=1)
        series['EW_Portfolio'] = [round(float(v), 2) for v in ew_monthly]

        # Correlations
        corr_matrix = self.log_returns.corr().round(3).to_dict()

        # Risk metrics & optimization
        var_es = self.calculate_var_es()
        summary_stats = self.get_summary_statistics()
        opt_results = self.optimize_portfolio()

        payload = {
            'tickers': self.tickers,
            'dates': dates,
            'normalized_series': series,
            'correlation_matrix': corr_matrix,
            'var_es_metrics': var_es.to_dict(orient='index'),
            'summary_statistics': summary_stats.round(3).to_dict(orient='index'),
            'optimization': opt_results
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2)

        return payload
