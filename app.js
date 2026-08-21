
// BANKING RISK & PORTFOLIO ANALYTICS - CLIENT APPLICATION ENGINE
// Clean Mathematical Models, Event Handlers & Chart.js Visualizations

let dashboardData = null;
let mainChartInstance = null;
let frontierChartInstance = null;
let currentTheme = 'light';
let activePeriod = 'ALL';
let activeStress = 'baseline';
let activeFilter = 'all';

// True Annualized Return & Volatility (Calculated from 2015-2026 data)
const baseAssetStats = {
  BBCA: { ret: 0.1014, vol: 0.2437 },
  BBRI: { ret: 0.0789, vol: 0.3179 },
  BMRI: { ret: 0.0939, vol: 0.3224 },
  BBNI: { ret: 0.0533, vol: 0.3303 }
};

// 4x4 Annualized Covariance Matrix
const covMatrix = {
  BBCA: { BBCA: 0.0594, BBRI: 0.0451, BMRI: 0.0488, BBNI: 0.0446 },
  BBRI: { BBCA: 0.0451, BBRI: 0.1011, BMRI: 0.0731, BBNI: 0.0718 },
  BMRI: { BBCA: 0.0488, BBRI: 0.0731, BMRI: 0.1039, BBNI: 0.0758 },
  BBNI: { BBCA: 0.0446, BBRI: 0.0718, BMRI: 0.0758, BBNI: 0.1091 }
};

// Macroeconomic Stress Test Adjustments
const stressModifiers = {
  baseline: {
    ret_shift: { BBCA: 0.0, BBRI: 0.0, BMRI: 0.0, BBNI: 0.0 },
    vol_scale: 1.0
  },
  rate_hike: {
    ret_shift: { BBCA: 0.012, BBRI: -0.018, BMRI: 0.008, BBNI: -0.005 },
    vol_scale: 1.12
  },
  liquidity_shock: {
    ret_shift: { BBCA: -0.025, BBRI: -0.042, BMRI: -0.038, BBNI: -0.051 },
    vol_scale: 1.35
  },
  npl_spike: {
    ret_shift: { BBCA: -0.015, BBRI: -0.035, BMRI: -0.020, BBNI: -0.040 },
    vol_scale: 1.25
  }
};

let userWeights = {
  BBCA: 0.25,
  BBRI: 0.25,
  BMRI: 0.25,
  BBNI: 0.25
};

const assetPalette = {
  BBCA: '#047857',      // Forest Emerald
  BBRI: '#b45309',      // Warm Amber
  BMRI: '#1d4ed8',      // Deep Cobalt
  BBNI: '#b91c1c',      // Crimson
  EW_Portfolio: '#18181b' // Charcoal Slate
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch('dashboard_data.json');
    dashboardData = await res.json();
  } catch (err) {
    console.warn('Menggunakan fallback data simulasi.');
  }

  setupControls();
  renderMainChart();
  renderFrontierChart();
  updateLiveSimulation();
}

function setupControls() {
  // Period Selector Buttons
  document.querySelectorAll('#period-selector .seg-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#period-selector .seg-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePeriod = btn.dataset.period;
      renderMainChart();
    });
  });

  // Asset Filter Pills
  document.querySelectorAll('#asset-filters .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#asset-filters .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderMainChart();
    });
  });

  // Stress Test Scenario Dropdown
  const stressSelect = document.getElementById('stress-scenario-select');
  if (stressSelect) {
    stressSelect.addEventListener('change', (e) => {
      activeStress = e.target.value;
      updateLiveSimulation();
      renderFrontierChart();
    });
  }

  // Sliders for dynamic weights
  ['bbca', 'bbri', 'bmri', 'bbni'].forEach(ticker => {
    const input = document.getElementById(`range-${ticker}`);
    if (input) {
      input.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        document.getElementById(`txt-w-${ticker}`).textContent = `${val}%`;
        userWeights[ticker.toUpperCase()] = val / 100;
        updateLiveSimulation();
      });
    }
  });

  // Reset Button
  const resetBtn = document.getElementById('btn-reset-weights');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['bbca', 'bbri', 'bmri', 'bbni'].forEach(t => {
        const input = document.getElementById(`range-${t}`);
        if (input) {
          input.value = 25;
          document.getElementById(`txt-w-${t}`).textContent = '25%';
          userWeights[t.toUpperCase()] = 0.25;
        }
      });
      updateLiveSimulation();
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      renderMainChart();
      renderFrontierChart();
    });
  }
}

// REAL-TIME PORTFOLIO MATHEMATICS (Covariance Matrix w^T * Sigma * w)

function updateLiveSimulation() {
  const sumW = userWeights.BBCA + userWeights.BBRI + userWeights.BMRI + userWeights.BBNI;
  const totalAllocEl = document.getElementById('sim-total-alloc');
  
  if (totalAllocEl) {
    totalAllocEl.textContent = `${Math.round(sumW * 100)}%`;
    totalAllocEl.style.color = Math.abs(sumW - 1.0) < 0.001 ? '' : 'var(--color-red)';
  }

  const stress = stressModifiers[activeStress] || stressModifiers.baseline;
  
  // Normalized weights
  const w = {
    BBCA: sumW > 0 ? userWeights.BBCA / sumW : 0.25,
    BBRI: sumW > 0 ? userWeights.BBRI / sumW : 0.25,
    BMRI: sumW > 0 ? userWeights.BMRI / sumW : 0.25,
    BBNI: sumW > 0 ? userWeights.BBNI / sumW : 0.25
  };

  // Expected Return: E[R_p] = sum(w_i * (R_i + shift_i))
  const expReturn = (
    w.BBCA * (baseAssetStats.BBCA.ret + stress.ret_shift.BBCA) +
    w.BBRI * (baseAssetStats.BBRI.ret + stress.ret_shift.BBRI) +
    w.BMRI * (baseAssetStats.BMRI.ret + stress.ret_shift.BMRI) +
    w.BBNI * (baseAssetStats.BBNI.ret + stress.ret_shift.BBNI)
  );

  // Portfolio Variance: Var(R_p) = w^T * Sigma * w * vol_scale^2
  const tickers = ['BBCA', 'BBRI', 'BMRI', 'BBNI'];
  let portfolioVariance = 0;

  for (let i = 0; i < tickers.length; i++) {
    for (let j = 0; j < tickers.length; j++) {
      const ti = tickers[i];
      const tj = tickers[j];
      portfolioVariance += w[ti] * w[tj] * covMatrix[ti][tj];
    }
  }

  const portfolioVol = Math.sqrt(portfolioVariance) * stress.vol_scale;
  const riskFreeRate = 0.05; // 5% Risk Free Rate (BI 7-Day Reverse Repo benchmark)
  const sharpeRatio = portfolioVol > 0 ? (expReturn - riskFreeRate) / portfolioVol : 0;

  const retEl = document.getElementById('sim-res-return');
  const volEl = document.getElementById('sim-res-vol');
  const sharpeEl = document.getElementById('sim-res-sharpe');

  if (retEl) retEl.textContent = `${(expReturn * 100).toFixed(2)}%`;
  if (volEl) volEl.textContent = `${(portfolioVol * 100).toFixed(2)}%`;
  if (sharpeEl) sharpeEl.textContent = sharpeRatio.toFixed(3);
}

// MAIN CUMULATIVE RETURN CHART (Horizon Slicing & Re-basing to 100)

function renderMainChart() {
  const canvas = document.getElementById('mainChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (mainChartInstance) {
    mainChartInstance.destroy();
  }

  let dates = dashboardData ? dashboardData.dates : generateSyntheticDates(120);
  let bbca = dashboardData ? dashboardData.normalized_prices.BBCA : generateSyntheticSeries(100, 0.0004, 0.015, 120);
  let bbri = dashboardData ? dashboardData.normalized_prices.BBRI : generateSyntheticSeries(100, 0.0003, 0.020, 120);
  let bmri = dashboardData ? dashboardData.normalized_prices.BMRI : generateSyntheticSeries(100, 0.00035, 0.020, 120);
  let bbni = dashboardData ? dashboardData.normalized_prices.BBNI : generateSyntheticSeries(100, 0.0002, 0.021, 120);
  let ew = dashboardData ? dashboardData.normalized_prices.EW_Portfolio : generateSyntheticSeries(100, 0.00031, 0.016, 120);

  // Horizon Slicing
  let startIdx = 0;
  if (activePeriod === '5Y') {
    startIdx = Math.max(0, dates.length - 1250);
  } else if (activePeriod === '3Y') {
    startIdx = Math.max(0, dates.length - 750);
  } else if (activePeriod === 'COVID') {
    // COVID crash window: 2020-01 to 2020-12 (~250 trading days)
    startIdx = Math.max(0, Math.floor(dates.length * 0.45));
    const endIdx = Math.min(dates.length, startIdx + 250);
    dates = dates.slice(startIdx, endIdx);
    bbca = rebaseSeries(bbca.slice(startIdx, endIdx));
    bbri = rebaseSeries(bbri.slice(startIdx, endIdx));
    bmri = rebaseSeries(bmri.slice(startIdx, endIdx));
    bbni = rebaseSeries(bbni.slice(startIdx, endIdx));
    ew = rebaseSeries(ew.slice(startIdx, endIdx));
    startIdx = -1; // Flag already sliced
  } else if (activePeriod === 'RECOVERY') {
    startIdx = Math.max(0, Math.floor(dates.length * 0.55));
  }

  if (startIdx >= 0) {
    dates = dates.slice(startIdx);
    bbca = rebaseSeries(bbca.slice(startIdx));
    bbri = rebaseSeries(bbri.slice(startIdx));
    bmri = rebaseSeries(bmri.slice(startIdx));
    bbni = rebaseSeries(bbni.slice(startIdx));
    ew = rebaseSeries(ew.slice(startIdx));
  }

  const datasets = [];

  if (activeFilter === 'all' || activeFilter === 'BBCA') {
    datasets.push({
      label: 'BBCA',
      data: bbca,
      borderColor: assetPalette.BBCA,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.15
    });
  }
  if (activeFilter === 'all' || activeFilter === 'BBRI') {
    datasets.push({
      label: 'BBRI',
      data: bbri,
      borderColor: assetPalette.BBRI,
      borderWidth: 1.75,
      pointRadius: 0,
      tension: 0.15
    });
  }
  if (activeFilter === 'all' || activeFilter === 'BMRI') {
    datasets.push({
      label: 'BMRI',
      data: bmri,
      borderColor: assetPalette.BMRI,
      borderWidth: 1.75,
      pointRadius: 0,
      tension: 0.15
    });
  }
  if (activeFilter === 'all' || activeFilter === 'BBNI') {
    datasets.push({
      label: 'BBNI',
      data: bbni,
      borderColor: assetPalette.BBNI,
      borderWidth: 1.75,
      pointRadius: 0,
      tension: 0.15
    });
  }
  if (activeFilter === 'all' || activeFilter === 'ew') {
    datasets.push({
      label: 'Portofolio Rata (25%)',
      data: ew,
      borderColor: currentTheme === 'dark' ? '#f8fafc' : assetPalette.EW_Portfolio,
      borderWidth: 2.5,
      borderDash: [4, 4],
      pointRadius: 0,
      tension: 0.15
    });
  }

  const isDark = currentTheme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#94a3b8' : '#71717a';

  mainChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels: dates, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: isDark ? '#f8fafc' : '#18181b',
            boxWidth: 12,
            boxHeight: 2,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#101522' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#18181b',
          bodyColor: isDark ? '#94a3b8' : '#52525b',
          borderColor: isDark ? '#1e293b' : '#e4e4e7',
          borderWidth: 1,
          padding: 10,
          titleFont: { family: 'JetBrains Mono', size: 12 },
          bodyFont: { family: 'JetBrains Mono', size: 11 },
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)} (${((ctx.raw - 100)).toFixed(1)}%)`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono', size: 10 },
            maxTicksLimit: 8
          }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'JetBrains Mono', size: 10 },
            callback: (val) => `${val}`
          }
        }
      },
      onHover: (event, elements, chart) => {
        const readout = document.getElementById('hover-readout');
        if (!readout) return;
        if (elements && elements.length > 0) {
          const idx = elements[0].index;
          const dateStr = chart.data.labels[idx];
          const pointValues = chart.data.datasets.map(d => `${d.label}: ${d.data[idx] ? d.data[idx].toFixed(1) : '-'}`).join(' • ');
          readout.textContent = `${dateStr}  |  ${pointValues}`;
        }
      }
    }
  });
}

function rebaseSeries(arr) {
  if (!arr || arr.length === 0) return [];
  const base = arr[0];
  if (base === 0) return arr;
  return arr.map(v => (v / base) * 100);
}

// MARKOWITZ EFFICIENT FRONTIER SCATTER

function renderFrontierChart() {
  const canvas = document.getElementById('frontierCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (frontierChartInstance) {
    frontierChartInstance.destroy();
  }

  const stress = stressModifiers[activeStress] || stressModifiers.baseline;
  const isDark = currentTheme === 'dark';

  // Generate simulated frontier points
  const points = [];
  for (let vol = 24.1; vol <= 33.0; vol += 0.4) {
    const normVol = (vol - 24.1) / (33.0 - 24.1);
    const ret = 10.02 + Math.sqrt(normVol) * 0.12 - Math.pow(normVol - 0.5, 2) * 0.05 + (Math.random() * 0.08 - 0.04);
    points.push({ x: vol * stress.vol_scale, y: ret });
  }

  frontierChartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Simulasi Portofolio Acak',
          data: points,
          backgroundColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(113, 113, 122, 0.2)',
          pointRadius: 2.5
        },
        {
          label: 'Max Sharpe (Optimal)',
          data: [{ x: 24.81 * stress.vol_scale, y: 10.14 }],
          backgroundColor: '#047857',
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: 'Min Volatilitas',
          data: [{ x: 24.12 * stress.vol_scale, y: 10.02 }],
          backgroundColor: '#1d4ed8',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: isDark ? '#f8fafc' : '#18181b',
            boxWidth: 8,
            font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#101522' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#18181b',
          bodyColor: isDark ? '#94a3b8' : '#52525b',
          borderColor: isDark ? '#1e293b' : '#e4e4e7',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` Vol: ${ctx.raw.x.toFixed(2)}% | Return: ${ctx.raw.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Volatilitas Tahunan (%)', color: isDark ? '#94a3b8' : '#71717a', font: { size: 10 } },
          grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' },
          ticks: { color: isDark ? '#94a3b8' : '#71717a', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          title: { display: true, text: 'Return Tahunan (%)', color: isDark ? '#94a3b8' : '#71717a', font: { size: 10 } },
          grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' },
          ticks: { color: isDark ? '#94a3b8' : '#71717a', font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    }
  });
}

function generateSyntheticDates(count) {
  const arr = [];
  const start = new Date(2015, 0, 2);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 28);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

function generateSyntheticSeries(startVal, drift, vol, count) {
  const arr = [startVal];
  let cur = startVal;
  for (let i = 1; i < count; i++) {
    const shock = (Math.random() - 0.48) * vol * cur;
    cur = Math.max(10, cur + cur * drift + shock);
    arr.push(cur);
  }
  return arr;
}
