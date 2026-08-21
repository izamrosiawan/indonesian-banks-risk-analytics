# Analisis Finansial Kuantitatif, Teori Portofolio Markowitz & Valuasi Risiko Big Four Bank Indonesia (2015 - 2026)

[![Live Dashboard](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen.svg)](https://izamrosiawan.github.io/indonesian-banks-risk-analytics/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![Statsmodels](https://img.shields.io/badge/Statsmodels-Finance-orange.svg)](https://www.statsmodels.org/)
[![Domain](https://img.shields.io/badge/Domain-Quantitative%20Finance-green.svg)](#)
[![CI Pipeline](https://img.shields.io/badge/CI-GitHub%20Actions%20Passing-brightgreen.svg)](#)

> 🚀 **Live Interactive Dashboard**: Akses simulator portofolio dinamis dan kurva Markowitz di [https://izamrosiawan.github.io/indonesian-banks-risk-analytics/](https://izamrosiawan.github.io/indonesian-banks-risk-analytics/)

Repositori ini menyajikan studi analitik kuantitatif, pengukuran risiko ekstrim pasar (*Value at Risk & Expected Shortfall*), pengujian statistik ekonometrika (ADF & Jarque-Bera), serta optimasi alokasi portofolio modern (*Markowitz Mean-Variance Efficient Frontier* & Simulasi Monte Carlo 10.000 iterasi) terhadap empat emiten perbankan terbesar (*The Big Four*) di Bursa Efek Indonesia (BEI):
* **PT Bank Central Asia Tbk (BBCA)**
* **PT Bank Rakyat Indonesia (Persero) Tbk (BBRI)**
* **PT Bank Mandiri (Persero) Tbk (BMRI)**
* **PT Bank Negara Indonesia (Persero) Tbk (BBNI)**

Periode observasi mencakup **2 Januari 2015 hingga 17 Juli 2026** (2.840 hari perdagangan bursa).

---

## 1. Struktur Proyek

```
├── .github/workflows/  # Otomasi CI Pipeline (GitHub Actions)
│   └── ci.yml
├── .gitignore          # Pengabaian cache lingkungan Python
├── data/               # Data historis emiten (BBCA, BBRI, BMRI, BBNI, combined_close.csv)
├── images/             # Visualisasi plot komputasi 300 DPI
├── sql/                # Layer Database & Financial SQL Queries (Window functions)
│   ├── schema.sql
│   └── financial_queries.sql
├── src/                # Modular Python quantitative risk engine (BankRiskEngine)
│   └── risk_engine.py
├── tests/              # Automated unit tests (Pytest: VaR, ES, ADF, Markowitz optimizer)
│   └── test_risk.py
├── index.html          # Interactive Web Dashboard (Chart.js + Responsive UI)
├── style.css           # Modern Dark Theme Stylesheet
├── app.js              # Interactivity Engine & Portfolio Simulation
├── dashboard_data.json # Pre-computed metrics payload
├── notebook.ipynb      # Jupyter Notebook: Pipeline end-to-end data science finansial
├── requirements.txt    # Pinned stable dependencies
└── README.md           # Laporan utama komprehensif
```

---

## 2. Metodologi Analisis & Formulasi Kuantitatif

1. **Transformasi Log-Return**:
   $$r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$
2. **Uji Stasioneritas (Augmented Dickey-Fuller / ADF)**: Memvalidasi ketiadaan unit root ($H_0$ ditolak jika $p < 0.05$).
3. **Uji Normalitas & Fat-Tails (Jarque-Bera)**:
   $$JB = \frac{n}{6}\left(S^2 + \frac{(K - 3)^2}{4}\right)$$
4. **Estimasi Risiko Ekstrim (VaR 95% & Expected Shortfall 95%)**:
   $$\text{VaR}_\alpha = -F^{-1}(1 - \alpha), \quad \text{ES}_\alpha = -\mathbb{E}[r \mid r \le -\text{VaR}_\alpha]$$
5. **Optimasi Portofolio Markowitz (Mean-Variance)**:
   $$\max_w \frac{w^T \mu - r_f}{\sqrt{w^T \Sigma w}} \quad \text{s.t.} \quad \sum w_i = 1, \quad w_i \ge 0$$

---

## 3. Hasil Kuantitatif & Pembahasan Visualisasi

### A. Tren Harga Saham Jangka Panjang & Log-Return
![Tren Harga Saham](images/price_trends.png)
![Distribusi Return](images/return_distributions.png)

#### Tabel Uji Stasioneritas & Karakteristik Sebaran
| Emiten | ADF Statistic | p-value (ADF) | Skewness | Excess Kurtosis | JB Statistic | p-value (JB) | Distribusi Normal? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BBCA** | -9.904 | $3.30 \times 10^{-17}$ | 0.387 | 7.514 | 6750.30 | 0.000 | **TIDAK (Fat-Tails)** |
| **BBRI** | -28.192 | 0.000 | 0.260 | 4.869 | 2836.22 | 0.000 | **TIDAK (Fat-Tails)** |
| **BMRI** | -19.593 | 0.000 | 0.035 | 4.128 | 2015.87 | 0.000 | **TIDAK (Fat-Tails)** |
| **BBNI** | -50.163 | 0.000 | 0.187 | 3.507 | 1471.67 | 0.000 | **TIDAK (Fat-Tails)** |

### B. Estimasi Risiko Pasar (VaR & Expected Shortfall 95%)
![Returns vs VaR](images/returns_vs_var.png)

| Emiten | Daily VaR 95% (%) | Daily Expected Shortfall 95% (%) | Profil Risiko |
| :--- | :---: | :---: | :--- |
| **BBCA** | **2.28%** | **3.46%** | Defensif / Safe Haven |
| **BBRI** | 3.10% | 4.58% | Siklikal Mikro & UMKM |
| **BMRI** | 3.18% | 4.63% | Siklikal Korporasi |
| **BBNI** | 3.25% | 4.72% | Volatilitas Tinggi |

### C. Dinamika Risiko: Volatility Clustering & Drawdown
![Rolling Volatility](images/rolling_volatility.png)
![Drawdown](images/drawdowns.png)

### D. Optimasi Portofolio Modern: Markowitz & Monte Carlo
Perbandingan portofolio optimal vs alokasi tertimbang sama (*Equal-Weighted*):

| Strategi Portofolio | Alokasi Bobot ($w$) | Return Tahunan (%) | Volatilitas Tahunan (%) | Sharpe Ratio | Max Drawdown (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Max Sharpe Portfolio** | BBCA: 72.4%, BMRI: 27.6% | **10.14%** | **24.81%** | **0.207** | **-47.20%** |
| **Min Volatility Portfolio**| BBCA: 88.5%, BMRI: 11.5% | 10.02% | 24.12% | 0.208 | -49.10% |
| **Equal-Weighted (EW)** | 25% Masing-masing | 8.19% | 25.70% | 0.124 | -48.37% |

---

## 4. Layer SQL Financial Analytics

Query analitik SQL tingkat lanjut (DuckDB/PostgreSQL) tersedia pada direktori `sql/`:
* `sql/schema.sql`: DDL skema relasional tabel harga saham dan tabel metrik fundamental perbankan.
* `sql/financial_queries.sql`: Analitik berbasis window function untuk menghitung:
  1. *21-day Rolling Volatility* yang disetahunkan.
  2. *Historical Maximum Drawdown (Peak-to-Trough)* per emiten.
  3. *Equal-Weighted Portfolio Index Trackers*.

---

## 5. Implementasi Modular & Pengujian Otomatis

Modul Python tersedia di `src/risk_engine.py`:

```python
from src.risk_engine import BankRiskEngine

engine = BankRiskEngine()

# 1. Estimasi VaR & Expected Shortfall
var_es_df = engine.calculate_var_es(alpha=0.95)
print(var_es_df)

# 2. Optimasi Portofolio Markowitz (Max Sharpe & Min Volatility)
opt_res = engine.optimize_portfolio(risk_free_rate=0.05)
print("Bobot Max Sharpe:", opt_res['max_sharpe']['weights'])
```

Jalankan pengujian unit otomatis:
```bash
pytest tests/ -v
```

---

## 6. Cara Menjalankan

1. **Pasang Dependensi**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Jalankan Dashboard Lokal**:
   Cukup buka `index.html` pada browser modern atau gunakan VS Code Live Server.
3. **Eksekusi Notebook**:
   ```bash
   jupyter notebook notebook.ipynb
   ```

---
*Indonesian Big Four Banks Quantitative Risk & Modern Portfolio Analytics Project.*
