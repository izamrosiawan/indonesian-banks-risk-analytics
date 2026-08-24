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

  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width = (heroCanvas.width = heroCanvas.offsetWidth);
    let height = (heroCanvas.height = heroCanvas.offsetHeight);

    window.addEventListener('resize', () => {
      width = heroCanvas.width = heroCanvas.offsetWidth;
      height = heroCanvas.height = heroCanvas.offsetHeight;
    });

    const particles = [];
    const numParticles = 35;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 1,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.4 + 0.15
      });
    }

    function renderCanvas() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity * 0.5})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(renderCanvas);
    }
    renderCanvas();
  }

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

    valCar.textContent = `${car.toFixed(1)}%`;
    valNpl.textContent = `${npl.toFixed(1)}%`;
    valLdr.textContent = `${ldr}%`;
    valNim.textContent = `${nim.toFixed(1)}%`;

    let score = 50 + (car - 12) * 2.5 - (npl - 2) * 8.0 + (nim - 4) * 4.0 - Math.abs(ldr - 85) * 0.8;
    score = Math.max(10, Math.min(100, Math.round(score)));

    simHealthValue.textContent = score;
    const degrees = (score / 100) * 360;
    simGaugeProgress.style.background = `conic-gradient(var(--color-primary) ${degrees}deg, var(--bg-surface-elevated) ${degrees}deg)`;

    if (score >= 80) {
      simTierBadge.style.color = '#10b981';
      simTierBadge.style.borderColor = '#10b981';
      simStatusText.textContent = 'HIGHLY SOLVENT & RESILIENT';
      simExplanationText.textContent = `Permodalan prima (CAR ${car}%) dengan bantalan tebal. Mampu menyerap lonjakan NPL hingga skenario stress-test terberat.`;
    } else if (score >= 60) {
      simTierBadge.style.color = '#f59e0b';
      simTierBadge.style.borderColor = '#f59e0b';
      simStatusText.textContent = 'MODERATE HEALTH BUFFER';
      simExplanationText.textContent = `Kondisi keuangan berada dalam ambang batas aman OJK, namun memerlukan pemantauan ketat pada kualitas portofolio kredit.`;
    } else {
      simTierBadge.style.color = '#ef4444';
      simTierBadge.style.borderColor = '#ef4444';
      simStatusText.textContent = 'SOLVENCY WATCHLIST RISK';
      simExplanationText.textContent = `Tekanan NPL (${npl}%) menggerus modal bank. Diperlukan injeksi modal tambahan atau pengetatan penyaluran kredit.`;
    }
  }

  [simCar, simNpl, simLdr, simNim].forEach(input => {
    if (input) input.addEventListener('input', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      calculateSimulator();
    });
  });

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      simCar.value = chip.dataset.car;
      simNpl.value = chip.dataset.npl;
      simLdr.value = chip.dataset.ldr;
      simNim.value = chip.dataset.nim;
      calculateSimulator();
    });
  });

  document.querySelectorAll('.bento-card, .console-deck-panel, .gauge-console-card, .math-telemetry-card, .analytics-panel').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from('.hero-content > *', {
      opacity: 0,
      y: 28,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out'
    });

    document.querySelectorAll('.chapter-section').forEach(section => {
      const heading = section.querySelector('.chapter-heading-box');
      const cards = section.querySelectorAll('.bento-card, .math-telemetry-card, .analytics-panel');

      if (heading) {
        gsap.from(heading, {
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%'
          },
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power2.out'
        });
      }

      if (cards.length > 0) {
        gsap.from(cards, {
          scrollTrigger: {
            trigger: cards[0],
            start: 'top 85%'
          },
          opacity: 0,
          y: 35,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    });
  }

  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
  }

  let equityChart = null;
  let metricsChart = null;

  function renderCharts() {
    const isLight = document.body.classList.contains('light-theme');
    const textCol = isLight ? '#475569' : '#94a3b8';
    const gridCol = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

    const eCtx = document.getElementById('banksEquityChart');
    if (eCtx) {
      if (equityChart) equityChart.destroy();
      equityChart = new Chart(eCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: sampleDates,
          datasets: [
            { label: 'BBCA', data: bbcaSeries, borderColor: '#10b981', tension: 0.3, borderWidth: 2, pointRadius: 2 },
            { label: 'BBRI', data: bbriSeries, borderColor: '#3b82f6', tension: 0.3, borderWidth: 1.8, pointRadius: 2 },
            { label: 'BMRI', data: bmriSeries, borderColor: '#f59e0b', tension: 0.3, borderWidth: 1.8, pointRadius: 2 },
            { label: 'BBNI', data: bbniSeries, borderColor: '#94a3b8', tension: 0.3, borderWidth: 1.5, pointRadius: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          },
          scales: {
            y: {
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
            { label: 'Sharpe Ratio', data: banksSharpe.map(b => b.sharpe), backgroundColor: '#10b981b0', borderRadius: 4 },
            { label: 'Annualized Return (%)', data: banksSharpe.map(b => b.returnPct), backgroundColor: '#3b82f6b0', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 10 } }
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
              ticks: { color: textCol, font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          }
        }
      });
    }
  }

  renderCharts();

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.chapter-section').forEach(section => {
      const heading = section.querySelector('.chapter-heading-box');
      const cards = section.querySelectorAll('.double-bezel-card, .console-bezel-outer, .gauge-console-card');

      if (heading) {
        gsap.from(heading, {
          scrollTrigger: {
            trigger: heading,
            start: 'top 88%'
          },
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: 'power2.out'
        });
      }

      if (cards.length > 0) {
        gsap.from(cards, {
          scrollTrigger: {
            trigger: cards[0],
            start: 'top 88%'
          },
          opacity: 0,
          y: 28,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out'
        });
      }
    });
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

  renderAllKaTeX();
  setTimeout(renderAllKaTeX, 250);
});
