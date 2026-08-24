if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  if (window.lucide) {
    lucide.createIcons();
  }

  const sampleDates = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];
  const bbcaSeries = [1.0, 1.18, 1.45, 1.72, 2.15, 2.05, 2.45, 2.95, 3.25, 3.75];
  const bbriSeries = [1.0, 1.05, 1.35, 1.55, 1.85, 1.65, 1.95, 2.40, 2.75, 2.90];
  const bmriSeries = [1.0, 0.98, 1.25, 1.40, 1.68, 1.45, 1.75, 2.25, 2.65, 2.85];
  const bbniSeries = [1.0, 0.92, 1.20, 1.35, 1.55, 1.25, 1.48, 1.85, 2.10, 2.25];

  const banksSharpe = [
    { bank: "BBCA", sharpe: 1.18, returnPct: 15.8 },
    { bank: "BBRI", sharpe: 0.92, returnPct: 13.5 },
    { bank: "BMRI", sharpe: 0.88, returnPct: 12.9 },
    { bank: "BBNI", sharpe: 0.72, returnPct: 10.4 }
  ];

  const simCar = document.getElementById('sim-car');
  const simNpl = document.getElementById('sim-npl');
  const simLdr = document.getElementById('sim-ldr');
  const simNim = document.getElementById('sim-nim');

  const valCar = document.getElementById('val-car');
  const valNpl = document.getElementById('val-npl');
  const valLdr = document.getElementById('val-ldr');
  const valNim = document.getElementById('val-nim');

  const simHealthValue = document.getElementById('sim-health-value');
  const simGaugeProgress = document.getElementById('sim-gauge-progress');
  const simTierBadge = document.getElementById('sim-tier-badge');
  const simStatusText = document.getElementById('sim-status-text');
  const simExplanationText = document.getElementById('sim-explanation-text');

  function calculateSimulator() {
    if (!simCar || !simNpl || !simLdr || !simNim) return;

    const car = parseFloat(simCar.value);
    const npl = parseFloat(simNpl.value);
    const ldr = parseFloat(simLdr.value);
    const nim = parseFloat(simNim.value);

    if (valCar) valCar.textContent = `${car.toFixed(1)}%`;
    if (valNpl) valNpl.textContent = `${npl.toFixed(1)}%`;
    if (valLdr) valLdr.textContent = `${ldr.toFixed(1)}%`;
    if (valNim) valNim.textContent = `${nim.toFixed(1)}%`;

    let score = 50 + (car - 12) * 2.5 - (npl - 2) * 8.0 + (nim - 4) * 4.0 - Math.abs(ldr - 85) * 0.8;
    score = Math.max(10, Math.min(100, Math.round(score)));

    if (simHealthValue) simHealthValue.textContent = score;
    if (simGaugeProgress) {
      const degrees = (score / 100) * 360;
      simGaugeProgress.style.background = `conic-gradient(var(--color-primary) ${degrees}deg, var(--bg-surface-elevated) ${degrees}deg)`;
    }

    if (simTierBadge && simStatusText && simExplanationText) {
      if (score >= 80) {
        simStatusText.textContent = 'HIGHLY SOLVENT & RESILIENT';
        simExplanationText.textContent = `Permodalan prima (CAR ${car.toFixed(1)}%) dengan bantalan tebal. Mampu menyerap lonjakan NPL hingga skenario stress-test terberat.`;
      } else if (score >= 60) {
        simStatusText.textContent = 'MODERATE HEALTH BUFFER';
        simExplanationText.textContent = `Kondisi keuangan berada dalam ambang batas aman OJK, namun memerlukan pemantauan ketat pada kualitas portofolio kredit.`;
      } else {
        simStatusText.textContent = 'SOLVENCY WATCHLIST RISK';
        simExplanationText.textContent = `Tekanan NPL (${npl.toFixed(1)}%) menggerus modal bank. Diperlukan injeksi modal tambahan atau pengetatan penyaluran kredit.`;
      }
    }
  }

  [simCar, simNpl, simLdr, simNim].forEach(input => {
    if (input) input.addEventListener('input', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      calculateSimulator();
    });
  });

  document.querySelectorAll('.preset-chip[data-car]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (simCar && chip.dataset.car) simCar.value = chip.dataset.car;
      if (simNpl && chip.dataset.npl) simNpl.value = chip.dataset.npl;
      if (simLdr && chip.dataset.ldr) simLdr.value = chip.dataset.ldr;
      if (simNim && chip.dataset.nim) simNim.value = chip.dataset.nim;
      calculateSimulator();
    });
  });

  let equityChart = null;
  let metricsChart = null;

  function renderCharts() {
    const textCol = '#475569';
    const gridCol = 'rgba(15, 23, 42, 0.06)';

    const eCtx = document.getElementById('banksEquityChart');
    if (eCtx) {
      if (equityChart) equityChart.destroy();
      equityChart = new Chart(eCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: sampleDates,
          datasets: [
            { label: 'BBCA', data: bbcaSeries, borderColor: '#059669', tension: 0.3, borderWidth: 2.2, pointRadius: 3, pointBackgroundColor: '#059669' },
            { label: 'BBRI', data: bbriSeries, borderColor: '#2563eb', tension: 0.3, borderWidth: 1.8, pointRadius: 2.5, pointBackgroundColor: '#2563eb' },
            { label: 'BMRI', data: bmriSeries, borderColor: '#d97706', tension: 0.3, borderWidth: 1.8, pointRadius: 2.5, pointBackgroundColor: '#d97706' },
            { label: 'BBNI', data: bbniSeries, borderColor: '#94a3b8', tension: 0.3, borderWidth: 1.5, pointRadius: 2, pointBackgroundColor: '#94a3b8' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              labels: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#94a3b8',
              borderColor: '#059669',
              borderWidth: 1
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: gridCol },
              ticks: { color: textCol, font: { family: 'JetBrains Mono', size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          }
        }
      });
    }

    const mCtx = document.getElementById('banksMetricsChart');
    if (mCtx) {
      if (metricsChart) metricsChart.destroy();
      metricsChart = new Chart(mCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: banksSharpe.map(b => b.bank),
          datasets: [
            { label: 'Sharpe Ratio', data: banksSharpe.map(b => b.sharpe), backgroundColor: '#059669b0', hoverBackgroundColor: '#059669', borderRadius: 4 },
            { label: 'Annualized Return (%)', data: banksSharpe.map(b => b.returnPct), backgroundColor: '#2563ebb0', hoverBackgroundColor: '#2563eb', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              labels: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#94a3b8',
              borderColor: '#059669',
              borderWidth: 1
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: gridCol },
              ticks: { color: textCol, font: { family: 'JetBrains Mono', size: 10 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 10, weight: 600 } }
            }
          }
        }
      });
    }
  }

  function renderAllKaTeX() {
    if (!window.katex) return;
    document.querySelectorAll('.katex-formula-box').forEach(el => {
      let tex = el.getAttribute('data-tex');
      if (!tex) {
        tex = el.textContent.trim().replace(/^\$\$|\$\$$/g, '').trim();
        if (tex) el.setAttribute('data-tex', tex);
      }
      if (tex) {
        try {
          katex.render(tex, el, { displayMode: true, throwOnError: false });
        } catch (err) {
          console.warn('KaTeX render warning:', err);
        }
      }
    });
  }

  function initApp() {
    calculateSimulator();
    renderCharts();
    renderAllKaTeX();
  }

  initApp();
  setTimeout(initApp, 250);
  setTimeout(initApp, 750);
  window.addEventListener('load', initApp);
});
