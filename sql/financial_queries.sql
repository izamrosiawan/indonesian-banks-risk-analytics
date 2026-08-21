-- ====================================================================
-- Financial Analytics Queries: Big Four Indonesian Banking Analytics
-- Focus: Window Functions, Rolling Volatility, Drawdowns & Compounded Returns
-- ====================================================================

-- 1. Analisis Rolling Volatility 21-Hari & Log Return per Emiten
WITH daily_returns AS (
    SELECT 
        trade_date,
        ticker,
        adjusted_close,
        LN(adjusted_close / LAG(adjusted_close, 1) OVER (PARTITION BY ticker ORDER BY trade_date)) AS daily_log_return
    FROM bank_stock_prices
)
SELECT 
    trade_date,
    ticker,
    adjusted_close,
    ROUND(daily_log_return * 100, 4) AS return_pct,
    ROUND(STDDEV_SAMP(daily_log_return) OVER (
        PARTITION BY ticker 
        ORDER BY trade_date 
        ROWS BETWEEN 20 PRECEDING AND CURRENT ROW
    ) * SQRT(252) * 100, 2) AS annualized_rolling_vol_21d_pct
FROM daily_returns
ORDER BY ticker, trade_date;

-- 2. Analisis Historical Maximum Drawdown (Peak-to-Trough)
WITH cumulative_peaks AS (
    SELECT 
        trade_date,
        ticker,
        adjusted_close,
        MAX(adjusted_close) OVER (
            PARTITION BY ticker 
            ORDER BY trade_date 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS peak_price
    FROM bank_stock_prices
),
drawdown_calc AS (
    SELECT 
        trade_date,
        ticker,
        adjusted_close,
        peak_price,
        ((adjusted_close - peak_price) / peak_price) * 100 AS drawdown_pct
    FROM cumulative_peaks
)
SELECT 
    ticker,
    ROUND(MIN(drawdown_pct), 2) AS max_drawdown_pct,
    ROUND(AVG(drawdown_pct), 2) AS avg_drawdown_pct
FROM drawdown_calc
GROUP BY ticker
ORDER BY max_drawdown_pct ASC;

-- 3. Valuasi Portofolio Tertimbang Sama (Equal-Weighted 25% Allocation)
WITH initial_prices AS (
    SELECT ticker, FIRST_VALUE(adjusted_close) OVER (PARTITION BY ticker ORDER BY trade_date) AS base_price
    FROM bank_stock_prices
),
indexed_prices AS (
    SELECT 
        p.trade_date,
        p.ticker,
        (p.adjusted_close / ip.base_price) * 100.0 AS normalized_index
    FROM bank_stock_prices p
    JOIN (SELECT DISTINCT ticker, base_price FROM initial_prices) ip ON p.ticker = ip.ticker
)
SELECT 
    trade_date,
    ROUND(AVG(normalized_index), 2) AS ew_portfolio_index,
    ROUND(AVG(CASE WHEN ticker = 'BBCA' THEN normalized_index END), 2) AS bbca_index,
    ROUND(AVG(CASE WHEN ticker = 'BBRI' THEN normalized_index END), 2) AS bbri_index,
    ROUND(AVG(CASE WHEN ticker = 'BMRI' THEN normalized_index END), 2) AS bmri_index,
    ROUND(AVG(CASE WHEN ticker = 'BBNI' THEN normalized_index END), 2) AS bbni_index
FROM indexed_prices
GROUP BY trade_date
ORDER BY trade_date;
