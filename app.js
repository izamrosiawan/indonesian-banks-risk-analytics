document.addEventListener('DOMContentLoaded', () => {

  const rawData = {
    dates: ["2015-01", "2016-01", "2017-01", "2018-01", "2019-01", "2020-01", "2020-04", "2021-01", "2022-01", "2023-01", "2024-01", "2025-01", "2026-01"],
    normalized: {
      BBCA: [100.0, 108.2, 126.5, 172.1, 204.8, 260.4, 185.2, 252.1, 275.4, 342.1, 388.5, 412.0, 428.5],
      BBRI: [100.0, 94.5, 102.1, 148.2, 155.0, 192.1, 112.5, 184.2, 198.5, 235.1, 272.4, 285.0, 296.2],
      BMRI: [100.0, 89.2, 105.4, 138.5, 142.1, 168.2, 98.4, 145.2, 178.4, 218.2, 258.1, 270.4, 281.0],
      BBNI: [100.0, 81.5, 92.4, 142.0, 138.4, 128.5, 68.2, 108.4, 132.1, 165.4, 192.5, 198.2, 204.1],
      EquallyWeighted: [100.0, 93.35, 106.6, 150.2, 160.075, 187.3, 116.075, 172.475, 196.1, 240.2, 277.875, 291.4, 302.45]
    }
  };

  const covMatrix = {
    BBCA: { BBCA: 0.00038, BBRI: 0.00028, BMRI: 0.00030, BBNI: 0.00029 },
    BBRI: { BBCA: 0.00028, BBRI: 0.00062, BMRI: 0.00045, BBNI: 0.00048 },
    BMRI: { BBCA: 0.00030, BBRI: 0.00045, BMRI: 0.00058, BBNI: 0.00046 },
    BBNI: { BBCA: 0.00029, BBRI: 0.00048, BMRI: 0.00046, BBNI: 0.00071 }
  };

  const expReturns = { BBCA: 0.142, BBRI: 0.115, BMRI: 0.118, BBNI: 0.082 };

  let currentTheme = 'light';
  let activePeriod = 'ALL';
  let activeFilter = 'all';
  let mainChart = null;
  let frontierChart = null;

  initScrollReveal();
  initThemeToggle();
  initMainChart();
  initFrontierChart();
  initPortfolioSimulator();
  initSQLExplorer();

  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
  }

  function initThemeToggle() {
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      updateAllChartsTheme();
    });
  }

  function getSeabornTheme() {
    const isDark = currentTheme === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#333333',
      titleColor: isDark ? '#f8fafc' : '#111111',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      tooltipBg: isDark ? '#101726' : '#ffffff',
      tooltipBorder: isDark ? '#1e293b' : '#d4d4d8',
      // Seaborn Matplotlib exact colors for 4 banks
      bbca: '#1f77b4',
      bbri: '#ff7f0e',
      bmri: '#2ca02c',
      bbni: '#d62728',
      ew: '#7f7f7f'
    };
  }

  function initMainChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    const st = getSeabornTheme();

    mainChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: rawData.dates,
        datasets: [
          { label: 'BBCA', data: rawData.normalized.BBCA, borderColor: st.bbca, borderWidth: 2.5, pointRadius: 3, tension: 0.1 },
          { label: 'BBRI', data: rawData.normalized.BBRI, borderColor: st.bbri, borderWidth: 2.5, pointRadius: 3, tension: 0.1 },
          { label: 'BMRI', data: rawData.normalized.BMRI, borderColor: st.bmri, borderWidth: 2.5, pointRadius: 3, tension: 0.1 },
          { label: 'BBNI', data: rawData.normalized.BBNI, borderColor: st.bbni, borderWidth: 2.5, pointRadius: 3, tension: 0.1 },
          { label: 'Portofolio Rata', data: rawData.normalized.EquallyWeighted, borderColor: st.ew, borderWidth: 2, borderDash: [5, 5], pointRadius: 2, tension: 0.1 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: st.titleColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }, boxWidth: 10, boxHeight: 10 }
          },
          tooltip: {
            backgroundColor: st.tooltipBg,
            titleColor: st.titleColor,
            bodyColor: st.textColor,
            borderColor: st.tooltipBorder,
            borderWidth: 1,
            titleFont: { family: 'JetBrains Mono', size: 12 },
            bodyFont: { family: 'JetBrains Mono', size: 11 }
          }
        },
        scales: {
          x: { grid: { display: true, color: st.gridColor, borderDash: [3, 3] }, ticks: { color: st.textColor, font: { family: 'JetBrains Mono', size: 10 } } },
          y: { grid: { display: true, color: st.gridColor, borderDash: [3, 3] }, ticks: { color: st.textColor, font: { family: 'JetBrains Mono', size: 10 }, callback: (v) => `Rp ${v}` } }
        }
      }
    });

    initChartFilters();
  }

  function initChartFilters() {
    const periodBtns = document.querySelectorAll('#period-selector .seg-item');
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePeriod = btn.dataset.period;
        updateMainChartData();
      });
    });

    const filterBtns = document.querySelectorAll('#asset-filters .pill-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        updateMainChartData();
      });
    });
  }

  function updateMainChartData() {
    if (!mainChart) return;

    let sliceIndex = 0;
    if (activePeriod === '5Y') sliceIndex = 7;
    else if (activePeriod === '3Y') sliceIndex = 9;
    else if (activePeriod === '1Y') sliceIndex = 11;

    mainChart.data.labels = rawData.dates.slice(sliceIndex);
    
    mainChart.data.datasets.forEach(ds => {
      const key = ds.label === 'Portofolio Rata' ? 'EquallyWeighted' : ds.label;
      ds.data = rawData.normalized[key].slice(sliceIndex);

      if (activeFilter === 'all') {
        ds.hidden = false;
      } else if (activeFilter === 'ew') {
        ds.hidden = (ds.label !== 'Portofolio Rata');
      } else {
        ds.hidden = (ds.label !== activeFilter);
      }
    });

    mainChart.update();
  }

  function initFrontierChart() {
    const canvas = document.getElementById('frontierCanvas');
    if (!canvas) return;

    const st = getSeabornTheme();

    const frontierCurve = [
      { x: 24.12, y: 10.02 }, { x: 24.30, y: 10.10 }, { x: 24.81, y: 10.14 },
      { x: 25.40, y: 11.20 }, { x: 26.20, y: 12.10 }, { x: 27.50, y: 13.00 },
      { x: 29.10, y: 14.20 }
    ];

    frontierChart = new Chart(canvas.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Efficient Frontier Curve',
            data: frontierCurve,
            showLine: true,
            borderColor: st.bbca,
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: st.bbca,
            fill: false
          },
          {
            label: 'Max Sharpe (Return 10.14%, Vol 24.81%)',
            data: [{ x: 24.81, y: 10.14 }],
            pointRadius: 8,
            pointBackgroundColor: st.bmri,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Min Volatility (Return 10.02%, Vol 24.12%)',
            data: [{ x: 24.12, y: 10.02 }],
            pointRadius: 8,
            pointBackgroundColor: st.bbri,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: st.titleColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
          },
          tooltip: {
            backgroundColor: st.tooltipBg,
            titleColor: st.titleColor,
            bodyColor: st.textColor,
            borderColor: st.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` Vol: ${ctx.raw.x}% | Return: ${ctx.raw.y}%`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Volatilitas Tahunan (%)', color: st.textColor }, grid: { color: st.gridColor, borderDash: [3, 3] }, ticks: { color: st.textColor, font: { family: 'JetBrains Mono', size: 10 } } },
          y: { title: { display: true, text: 'Imbal Hasil Ekspektasi (%)', color: st.textColor }, grid: { color: st.gridColor, borderDash: [3, 3] }, ticks: { color: st.textColor, font: { family: 'JetBrains Mono', size: 10 } } }
        }
      }
    });
  }

  function updateAllChartsTheme() {
    if (mainChart) mainChart.destroy();
    if (frontierChart) frontierChart.destroy();
    initMainChart();
    initFrontierChart();
  }

  function initPortfolioSimulator() {
    const rBBCA = document.getElementById('range-bbca');
    const rBBRI = document.getElementById('range-bbri');
    const rBMRI = document.getElementById('range-bmri');
    const rBBNI = document.getElementById('range-bbni');
    const btnReset = document.getElementById('btn-reset-weights');
    const selectScenario = document.getElementById('stress-scenario-select');

    if (!rBBCA || !rBBRI || !rBMRI || !rBBNI) return;

    function calculatePortfolio() {
      const w1 = parseFloat(rBBCA.value) / 100;
      const w2 = parseFloat(rBBRI.value) / 100;
      const w3 = parseFloat(rBMRI.value) / 100;
      const w4 = parseFloat(rBBNI.value) / 100;
      const totalW = w1 + w2 + w3 + w4;

      document.getElementById('txt-w-bbca').textContent = `${rBBCA.value}%`;
      document.getElementById('txt-w-bbri').textContent = `${rBBRI.value}%`;
      document.getElementById('txt-w-bmri').textContent = `${rBMRI.value}%`;
      document.getElementById('txt-w-bbni').textContent = `${rBBNI.value}%`;
      
      const allocEl = document.getElementById('sim-total-alloc');
      allocEl.textContent = `${(totalW * 100).toFixed(0)}%`;
      allocEl.className = Math.abs(totalW - 1.0) < 0.01 ? 'readout-val text-emerald' : 'readout-val text-red';

      let multReturn = 1.0;
      let multVol = 1.0;
      if (selectScenario) {
        const sc = selectScenario.value;
        if (sc === 'rate_hike') { multReturn = 0.85; multVol = 1.25; }
        else if (sc === 'liquidity_shock') { multReturn = 0.70; multVol = 1.45; }
        else if (sc === 'npl_spike') { multReturn = 0.60; multVol = 1.60; }
      }

      const pReturn = (w1 * expReturns.BBCA + w2 * expReturns.BBRI + w3 * expReturns.BMRI + w4 * expReturns.BBNI) * multReturn;

      const weights = [w1, w2, w3, w4];
      const keys = ['BBCA', 'BBRI', 'BMRI', 'BBNI'];
      let varSum = 0;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          varSum += weights[i] * weights[j] * covMatrix[keys[i]][keys[j]];
        }
      }
      const dailyVol = Math.sqrt(varSum);
      const annualVol = dailyVol * Math.sqrt(252) * multVol;
      const rf = 0.05;
      const sharpe = annualVol > 0 ? (pReturn - rf) / annualVol : 0;

      document.getElementById('sim-res-return').textContent = `${(pReturn * 100).toFixed(2)}%`;
      document.getElementById('sim-res-vol').textContent = `${(annualVol * 100).toFixed(2)}%`;
      document.getElementById('sim-res-sharpe').textContent = sharpe.toFixed(3);
    }

    [rBBCA, rBBRI, rBMRI, rBBNI].forEach(r => r.addEventListener('input', calculatePortfolio));
    if (selectScenario) selectScenario.addEventListener('change', calculatePortfolio);

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        rBBCA.value = 25;
        rBBRI.value = 25;
        rBMRI.value = 25;
        rBBNI.value = 25;
        if (selectScenario) selectScenario.value = 'baseline';
        calculatePortfolio();
      });
    }
  }

  function initSQLExplorer() {
    const btnVar = document.getElementById('btn-q-var');
    const btnFrontier = document.getElementById('btn-q-frontier');
    const btnNpl = document.getElementById('btn-q-npl');
    const codeDisplay = document.getElementById('sql-code-display');

    const snippets = {
      var: `-- 1. Estimasi Value at Risk (VaR 95%) & Expected Shortfall (ES 95%)
SELECT 
    symbol,
    COUNT(log_return) AS sample_size,
    ROUND(AVG(log_return), 6) AS mean_daily_return,
    ROUND(STDDEV(log_return), 5) AS daily_volatility,
    ROUND(PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY log_return), 5) AS var_95_historical,
    ROUND(AVG(CASE WHEN log_return <= PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY log_return) THEN log_return END), 5) AS expected_shortfall_95
FROM bank_daily_returns
GROUP BY symbol
ORDER BY var_95_historical ASC;`,

      frontier: `-- 2. Matriks Kovarians Harian untuk Optimasi Markowitz
SELECT 
    r1.symbol AS asset_1,
    r2.symbol AS asset_2,
    ROUND(AVG((r1.log_return - m1.avg_r) * (r2.log_return - m2.avg_r)), 6) AS covariance
FROM bank_daily_returns r1
JOIN bank_daily_returns r2 ON r1.trade_date = r2.trade_date
JOIN (SELECT symbol, AVG(log_return) AS avg_r FROM bank_daily_returns GROUP BY symbol) m1 ON r1.symbol = m1.symbol
JOIN (SELECT symbol, AVG(log_return) AS avg_r FROM bank_daily_returns GROUP BY symbol) m2 ON r2.symbol = m2.symbol
GROUP BY r1.symbol, r2.symbol
ORDER BY r1.symbol, r2.symbol;`,

      npl: `-- 3. Diagnosa Korelasi Rasio NPL vs Imbal Hasil Ekuitas (ROE)
SELECT 
    symbol,
    fiscal_year,
    net_interest_margin_pct AS nim,
    non_performing_loan_pct AS npl,
    return_on_equity_pct AS roe,
    price_to_book_ratio AS pbv
FROM bank_fundamental_metrics
WHERE fiscal_year = 2024
ORDER BY roe DESC;`
    };

    function setSnippet(key, activeBtn) {
      if (codeDisplay) {
        codeDisplay.innerHTML = `<code>${snippets[key]}</code>`;
      }
      [btnVar, btnFrontier, btnNpl].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
    }

    if (btnVar) btnVar.addEventListener('click', () => setSnippet('var', btnVar));
    if (btnFrontier) btnFrontier.addEventListener('click', () => setSnippet('frontier', btnFrontier));
    if (btnNpl) btnNpl.addEventListener('click', () => setSnippet('npl', btnNpl));
  }

});
