-- ====================================================================
-- DDL Schema: Big Four Indonesian Banking Risk & Price Analytics
-- PostgreSQL / DuckDB / SQLite Compatible Schema
-- ====================================================================

CREATE TABLE IF NOT EXISTS bank_stock_prices (
    trade_date DATE NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    adjusted_close NUMERIC(12, 4) NOT NULL,
    log_return NUMERIC(10, 6),
    PRIMARY KEY (trade_date, ticker)
);

CREATE TABLE IF NOT EXISTS bank_fundamentals (
    ticker VARCHAR(10) PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    core_segment VARCHAR(100) NOT NULL,
    roe_pct NUMERIC(5, 2) NOT NULL,
    npl_gross_pct NUMERIC(5, 2) NOT NULL,
    nim_pct NUMERIC(5, 2) NOT NULL,
    pe_ratio NUMERIC(5, 2) NOT NULL,
    pb_ratio NUMERIC(5, 2) NOT NULL
);

-- Seed metadata emiten perbankan
INSERT INTO bank_fundamentals (ticker, bank_name, core_segment, roe_pct, npl_gross_pct, nim_pct, pe_ratio, pb_ratio) VALUES
('BBCA', 'PT Bank Central Asia Tbk', 'Ritel & CASA (Dana Murah)', 20.50, 1.90, 5.50, 24.50, 4.80),
('BBRI', 'PT Bank Rakyat Indonesia (Persero) Tbk', 'Kredit Mikro & UMKM', 18.20, 3.10, 7.80, 14.20, 2.30),
('BMRI', 'PT Bank Mandiri (Persero) Tbk', 'Korporasi & Digital Banking', 21.10, 1.20, 5.40, 11.50, 2.10),
('BBNI', 'PT Bank Negara Indonesia (Persero) Tbk', 'Korporasi & Global Banking', 14.50, 2.30, 4.40, 9.80, 1.20)
ON CONFLICT (ticker) DO NOTHING;
