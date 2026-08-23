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

  initThemeToggle();
  initMainChart();
  initFrontierChart();
  initPortfolioSimulator();

  function initThemeToggle() {
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      updateAllChartsTheme();
    });
  }

  function getThemeColors() {
    const isDark = currentTheme === 'dark';
    return {
      textColor: isDark ? '#8b949e' : '#6b7280',
      titleColor: isDark ? '#f0f6fc' : '#111827',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      tooltipBg: isDark ? '#161b22' : '#ffffff',
      tooltipBorder: isDark ? '#30363d' : '#e5e7eb',
      colorBBCA: isDark ? '#60a5fa' : '#1e40af',
      colorBBRI: isDark ? '#fbbf24' : '#b45309',
      colorBMRI: isDark ? '#2dd4bf' : '#0f766e',
      colorBBNI: isDark ? '#fb7185' : '#be123c',
      colorEW: isDark ? '#94a3b8' : '#475569',
      emerald: isDark ? '#34d399' : '#047857',
      blue: isDark ? '#60a5fa' : '#1d4ed8'
    };
  }

  function initMainChart() {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;

    const tc = getThemeColors();

    mainChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: rawData.dates,
        datasets: [
          { label: 'BBCA', data: rawData.normalized.BBCA, borderColor: tc.colorBBCA, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.2 },
          { label: 'BBRI', data: rawData.normalized.BBRI, borderColor: tc.colorBBRI, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.2 },
          { label: 'BMRI', data: rawData.normalized.BMRI, borderColor: tc.colorBMRI, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.2 },
          { label: 'BBNI', data: rawData.normalized.BBNI, borderColor: tc.colorBBNI, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.2 },
          { label: 'Portofolio Rata', data: rawData.normalized.EquallyWeighted, borderColor: tc.colorEW, borderWidth: 1.8, borderDash: [4, 4], pointRadius: 0, pointHoverRadius: 4, tension: 0.2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tc.tooltipBg,
            titleColor: tc.titleColor,
            bodyColor: tc.textColor,
            borderColor: tc.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: { family: 'JetBrains Mono', size: 12, weight: '600' },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tc.textColor, font: { family: 'JetBrains Mono', size: 10 } }
          },
          y: {
            grid: { color: tc.gridColor },
            ticks: {
              color: tc.textColor,
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (v) => `${v}`
            }
          }
        }
      }
    });

    initChartFilters();
  }

  function initChartFilters() {
    const periodBtns = document.querySelectorAll('#period-selector button');
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePeriod = btn.dataset.period;
        updateMainChartData();
      });
    });

    const filterBtns = document.querySelectorAll('#asset-filters button');
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

    const tc = getThemeColors();

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
            label: 'Efficient Frontier',
            data: frontierCurve,
            showLine: true,
            borderColor: tc.blue,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: tc.blue,
            fill: false,
            tension: 0.3
          },
          {
            label: 'Max Sharpe (72.4% BBCA + 27.6% BMRI)',
            data: [{ x: 24.81, y: 10.14 }],
            pointRadius: 7,
            pointBackgroundColor: tc.emerald,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Min Volatilitas (88.5% BBCA + 11.5% BMRI)',
            data: [{ x: 24.12, y: 10.02 }],
            pointRadius: 7,
            pointBackgroundColor: tc.blue,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: tc.titleColor,
              font: { family: 'Plus Jakarta Sans', size: 10.5, weight: '500' },
              boxWidth: 8,
              boxHeight: 8
            }
          },
          tooltip: {
            backgroundColor: tc.tooltipBg,
            titleColor: tc.titleColor,
            bodyColor: tc.textColor,
            borderColor: tc.tooltipBorder,
            borderWidth: 1,
            padding: 10,
            titleFont: { family: 'JetBrains Mono', size: 11, weight: '600' },
            bodyFont: { family: 'JetBrains Mono', size: 10.5 },
            callbacks: {
              label: (ctx) => ` Volatilitas: ${ctx.raw.x}% | Return: ${ctx.raw.y}%`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Volatilitas Tahunan (%)', color: tc.textColor, font: { size: 10.5 } },
            grid: { color: tc.gridColor },
            ticks: { color: tc.textColor, font: { family: 'JetBrains Mono', size: 10 } }
          },
          y: {
            title: { display: true, text: 'Imbal Hasil Ekspektasi (%)', color: tc.textColor, font: { size: 10.5 } },
            grid: { color: tc.gridColor },
            ticks: { color: tc.textColor, font: { family: 'JetBrains Mono', size: 10 } }
          }
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
      if (allocEl) {
        allocEl.textContent = `${(totalW * 100).toFixed(0)}%`;
        allocEl.style.color = Math.abs(totalW - 1.0) < 0.01 ? 'var(--color-emerald)' : 'var(--color-red)';
      }

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

      const retEl = document.getElementById('sim-res-return');
      const volEl = document.getElementById('sim-res-vol');
      const sharpeEl = document.getElementById('sim-res-sharpe');

      if (retEl) retEl.textContent = `${(pReturn * 100).toFixed(2)}%`;
      if (volEl) volEl.textContent = `${(annualVol * 100).toFixed(2)}%`;
      if (sharpeEl) sharpeEl.textContent = sharpe.toFixed(3);
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

});
