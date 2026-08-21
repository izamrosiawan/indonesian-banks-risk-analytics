import unittest
import numpy as np
import pandas as pd
from src.risk_engine import BankRiskEngine

class TestBankRiskEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BankRiskEngine()

    def test_log_returns_shape(self):
        returns = self.engine.log_returns
        self.assertGreater(len(returns), 1000)
        self.assertEqual(len(returns.columns), 4)

    def test_var_and_es_metrics(self):
        metrics = self.engine.calculate_var_es(alpha=0.95)
        self.assertEqual(len(metrics), 4)
        # Expected Shortfall harus selalu >= VaR
        self.assertTrue(np.all(metrics['Daily_ES_pct'] >= metrics['Daily_VaR_pct']))
        self.assertTrue(np.all(metrics['Daily_VaR_pct'] > 0))

    def test_stationarity_adf(self):
        adf_res = self.engine.run_adf_test()
        self.assertEqual(len(adf_res), 4)
        self.assertTrue(np.all(adf_res['p_value'] < 0.05))

    def test_summary_statistics(self):
        summary = self.engine.get_summary_statistics()
        self.assertEqual(len(summary), 5)  # 4 emiten + 1 EW Portfolio
        self.assertIn('Sharpe_Ratio', summary.columns)
        self.assertIn('Max_Drawdown_pct', summary.columns)
        self.assertLess(summary.loc['EW_Portfolio', 'Max_Drawdown_pct'], 0)

    def test_markowitz_optimization(self):
        opt = self.engine.optimize_portfolio(risk_free_rate=0.05)
        self.assertIn('max_sharpe', opt)
        self.assertIn('min_volatility', opt)
        self.assertIn('efficient_frontier', opt)

        max_s_weights = opt['max_sharpe']['weights']
        self.assertEqual(len(max_s_weights), 4)
        self.assertTrue(np.isclose(sum(max_s_weights.values()), 1.0, atol=1e-2))

        min_v_weights = opt['min_volatility']['weights']
        self.assertEqual(len(min_v_weights), 4)
        self.assertTrue(np.isclose(sum(min_v_weights.values()), 1.0, atol=1e-2))

if __name__ == '__main__':
    unittest.main()
