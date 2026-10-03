'use strict';

const CONFIG = {
  email: 'agarwalvivaan09@gmail.com',

  socials: [
    { label: 'LinkedIn',  url: 'https://www.linkedin.com/in/vivaan-agarwal-65663b39a/' },
    { label: 'GitHub',    url: 'https://github.com/agarwalvivaan09-ai' },
    { label: 'Instagram', url: 'https://www.instagram.com/vivaan_agarwal__/' },
    { label: 'Website',   url: 'https://agarwalvivaan09-ai.github.io/vivaan-dev/index.html' }
  ],
  links: {
  paper: 'https://agarwalvivaan09-ai.github.io/vivaan-dev/Household_Financial_Resiliance_Index_Vivaan_Agarwal%20(1).pdf',
  code: 'https://colab.research.google.com/drive/1uz_USmIzrsyE7bu4OyV3C2V7j-ltlNxL?usp=sharing',
  arbor: 'https://agarwalvivaan09-ai.github.io/arbor-v2/',
  website: 'https://agarwalvivaan09-ai.github.io/vivaan-dev/index.html',
  github: 'https://github.com/agarwalvivaan09-ai',
  linkedin: 'https://www.linkedin.com/in/vivaan-agarwal-65663b39a/',
  instagram: 'https://www.instagram.com/vivaan_agarwal__/',
  email: 'mailto:agarwalvivaan09@gmail.com'
},

desmos: {
  savings: 'https://www.desmos.com/calculator/viw3r7j9pn',
  dti: 'https://www.desmos.com/calculator/sm6ui1oaan',
  dsti: 'https://www.desmos.com/calculator/tnir0duni6',
  emergency: 'https://www.desmos.com/calculator/5xr0tuvzbk',
  stability: 'https://www.desmos.com/calculator/xvnar7ksid'
}
};

/* =====================================================================
   2. THE HFRI MODEL  (pure functions, no page code)
   Formulas and constants are taken directly from the paper.
   ===================================================================== */
const HFRI = (() => {
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // Savings Strength: SR = (Y - C) / Y
  const scoreSavings = (sr) =>
    sr <= -0.10 ? 0 : 100 * (1 - Math.exp(-5.89681 * (sr + 0.10)));

  // Debt Sustainability, stock: DTI = debt / annual income
  const scoreDTI = (dti) =>
    100 * Math.exp(-0.0573534 * Math.pow(Math.max(dti, 0), 2.13509));

  // Debt Sustainability, flow: DSTI = annual debt service / annual income
  const scoreDSTI = (dsti) =>
    clamp(-521.45598 * dsti * dsti + 9.08245 * dsti + 100.00523, 0, 100);

  // Emergency Coverage: EC = liquid savings / monthly essential spending
  const scoreEC = (ec) =>
    100 * (1 - Math.exp(-0.37028 * Math.pow(Math.max(ec, 0), 0.901391)));

  // Expense Stability: CV = std dev / mean of monthly spending
  const scoreCV = (cv) =>
    100 * Math.exp(-3.13957 * Math.pow(Math.max(cv, 0), 1.30837));

  const WEIGHTS = { S: 0.25, D: 0.25, E: 0.25, X: 0.25 };
  const DEBT_WEIGHTS = { dti: 0.40, dsti: 0.60 };

  // inp: monthly figures in rupees plus cv
  function compute(inp) {
    const Y = inp.income * 12;
    const C = inp.spending * 12;
    const sr = (Y - C) / Y;
    const dti = inp.debt / Y;
    const dsti = (inp.debtService * 12) / Y;
    const ec = inp.liquid / inp.essential;
    const cv = inp.cv;

    const S = scoreSavings(sr);
    const dtiScore = scoreDTI(dti);
    const dstiScore = scoreDSTI(dsti);
    const D = DEBT_WEIGHTS.dti * dtiScore + DEBT_WEIGHTS.dsti * dstiScore;
    const E = scoreEC(ec);
    const X = scoreCV(cv);

    const total = WEIGHTS.S * S + WEIGHTS.D * D + WEIGHTS.E * E + WEIGHTS.X * X;
    return { sr, dti, dsti, ec, cv, S, D, E, X, dtiScore, dstiScore, total };
  }

  // Bands come from how shock survival changed across score ranges in the simulation.
  const BANDS = [
    { max: 60,       key: 'very-low',   label: 'Very low',        text: 'Very low simulated shock-absorption capacity.' },
    { max: 65,       key: 'low',        label: 'Low',             text: 'Low simulated shock-absorption capacity.' },
    { max: 70,       key: 'transition', label: 'Transition zone', text: 'In the transition zone, where simulated shock survival rises steeply. Small gains in liquidity matter most here.' },
    { max: 75,       key: 'high',       label: 'High',            text: 'High simulated shock-absorption capacity.' },
    { max: Infinity, key: 'very-high',  label: 'Very high',       text: 'Very high simulated shock-absorption capacity.' }
  ];
  const bandFor = (score) => BANDS.find((b) => score < b.max);

  // Percentiles of the paper's 1,000-household simulation.
  const PERCENTILES = [
    [0, 16.270], [10, 48.402], [25, 67.569], [50, 82.043],
    [75, 87.687], [90, 91.354], [95, 92.966], [100, 97.235]
  ];
  const SIM_MIN = PERCENTILES[0][1];
  const SIM_MAX = PERCENTILES[PERCENTILES.length - 1][1];

  // Linear interpolation between the published percentiles (an approximation).
  function percentileOf(score) {
    if (score <= SIM_MIN) return 0;
    if (score >= SIM_MAX) return 100;
    for (let i = 1; i < PERCENTILES.length; i++) {
      const [p0, s0] = PERCENTILES[i - 1];
      const [p1, s1] = PERCENTILES[i];
      if (score <= s1) return p0 + ((score - s0) / (s1 - s0)) * (p1 - p0);
    }
    return 100;
  }

  // What-if scenarios built from the same formulas.
  function levers(inp, base) {
    const out = [];
    const gain = (changes) => compute({ ...inp, ...changes }).total - base.total;
    const add = (title, detail, changes) => {
      const g = gain(changes);
      if (g >= 0.05) out.push({ title, detail, gain: g, result: base.total + g });
    };

    add('Hold one more month of essential spending in liquid savings',
        'Adds {m1} to liquid savings.',
        { liquid: inp.liquid + inp.essential });

    const cut = Math.min(0.05 * inp.income, Math.max(0, inp.spending - inp.essential));
    if (cut > 0) {
      add('Spend a little less each month',
          'Cuts monthly spending by {cut}, which raises the savings rate by ' +
          ((cut / inp.income) * 100).toFixed(1) + ' points (never below essential spending).',
          { spending: inp.spending - cut });
    }

    if (inp.debt > 0) {
      add('Reduce debt and repayments by a quarter',
          'Debt falls to {debt75} and repayments to {ds75}. This ignores how the reduction is paid for.',
          { debt: inp.debt * 0.75, debtService: inp.debtService * 0.75 });
    }

    if (inp.cv > 0.02) {
      add('Make spending a quarter steadier',
          'Lowers spending variation (CV) from ' + inp.cv.toFixed(2) + ' to ' + (inp.cv * 0.75).toFixed(2) + '.',
          { cv: inp.cv * 0.75 });
    }

    return out.sort((a, b) => b.gain - a.gain).slice(0, 4);
  }

  // type: 'income' (income falls by pct) or 'spending' (spending rises by pct)
  function shock(inp, type, pct, months) {
    const Y = inp.income, C = inp.spending, DS = inp.debtService, L = inp.liquid;
    const cost = type === 'income' ? pct * Y * months : pct * C * months;   // the paper's liquidity test
    const baseMonthly = Y - C - DS;
    const shockMonthly = type === 'income' ? Y * (1 - pct) - C - DS : Y - C * (1 + pct) - DS;
    const drawdown = shockMonthly < 0 ? -shockMonthly : 0;
    return {
      cost,
      covered: L >= cost,
      coverRatio: cost > 0 ? L / cost : Infinity,
      baseMonthly,
      shockMonthly,
      runway: drawdown > 0 ? L / drawdown : Infinity,
      shortfall: drawdown > 0 ? Math.max(0, drawdown * months - L) : 0
    };
  }

  return {
    scoreSavings, scoreDTI, scoreDSTI, scoreEC, scoreCV,
    compute, BANDS, bandFor, percentileOf, SIM_MIN, SIM_MAX, levers, shock
  };
})();

/* =====================================================================
   3. PAGE CODE
   ===================================================================== */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage);
  else initPage();
}

function initPage() {
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  /* ---------- formatting ---------- */
  const money = (n) => '\u20B9' + Math.round(n).toLocaleString('en-IN');
  const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

  function parseNum(str) {
    if (str == null) return null;
    const cleaned = String(str).replace(/[\u20B9,\s]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  const val = (id) => parseNum($(id).value);

  function safeUrl(u) {
    return typeof u === 'string' && /^(https?:\/\/|mailto:)/i.test(u.trim()) ? u.trim() : '';
  }

  /* ---------- band segments and rulers ---------- */
  const SEGMENTS = [
    { key: 'very-low', from: 0, to: 60 },
    { key: 'low', from: 60, to: 65 },
    { key: 'transition', from: 65, to: 70 },
    { key: 'high', from: 70, to: 75 },
    { key: 'very-high', from: 75, to: 100 }
  ];
  const segmentsHTML = () =>
    SEGMENTS.map((s) => `<span class="seg seg--${s.key}" style="width:${s.to - s.from}%"></span>`).join('');

  const TICKS = [
    { v: 16.27, name: 'lowest', row: 'up' },
    { v: 48.40, name: '10th percentile', row: 'down' },
    { v: 67.57, name: '25th percentile', row: 'up', minor: true },
    { v: 82.04, name: 'median', row: 'down', median: true },
    { v: 91.35, name: '90th percentile', row: 'up', minor: true },
    { v: 97.24, name: 'highest', row: 'down', end: true }
  ];

  function buildHeroRuler() {
    const ticks = TICKS.map((t) => {
      const cls = ['tick', 'tick--' + t.row];
      if (t.minor) cls.push('tick--minor');
      if (t.median) cls.push('tick--median');
      if (t.end) cls.push('tick--end');
      return `<div class="${cls.join(' ')}" style="left:${t.v}%"><span class="tick-label"><b>${t.v.toFixed(1)}</b>${t.name}</span></div>`;
    }).join('');
    const summary = 'Simulated HFRI scores: lowest 16.3, 10th percentile 48.4, 25th percentile 67.6, median 82.0, 90th percentile 91.4, highest 97.2.';
    $('hero-ruler').innerHTML =
      `<div class="ruler hero-ruler" role="img" aria-label="${summary}"><div class="ruler-bar">${segmentsHTML()}</div>${ticks}</div>`;

    const legendItems = [
      ['very-low', 'Under 60: very low'],
      ['low', '60 to 65: low'],
      ['transition', '65 to 70: transition zone'],
      ['high', '70 to 75: high'],
      ['very-high', '75 and above: very high']
    ];
    $('hero-legend').innerHTML = legendItems
      .map(([k, t]) => `<li><span class="swatch seg--${k}"></span>${t}</li>`).join('');
  }

  function buildResultRuler() {
    const axis = [0, 60, 65, 70, 75, 100].map((n) => {
      const cls = 'axis-num' + (n === 0 ? ' is-first' : n === 100 ? ' is-last' : '');
      return `<span class="${cls}" style="left:${n}%">${n}</span>`;
    }).join('');
    $('result-ruler').innerHTML =
      `<div class="ruler" role="img" aria-label="Your score on the 0 to 100 HFRI scale with the five bands">` +
      `<div class="ruler-bar">${segmentsHTML()}</div>` +
      `<div class="ruler-marker" id="marker" style="left:0%"><span class="ruler-marker-label" id="marker-label">You</span></div>` +
      axis + `</div>`;
  }

  function placeMarker(score) {
    const x = clamp(score, 0, 100);
    const m = $('marker');
    m.style.left = x + '%';
    m.classList.toggle('is-left', x < 10);
    m.classList.toggle('is-right', x > 90);
    $('marker-label').textContent = 'You ' + score.toFixed(1);
  }

  /* ---------- scoring curves ---------- */
  const CURVES = [
{ id: 'savings', title: 'Savings rate', desmos: CONFIG.desmos.savings, xmin: -0.10, xmax: 0.40, ticks: [-0.1, 0, 0.1, 0.2, 0.3, 0.4],
      fmt: (v) => Math.round(v * 100) + '%', fn: HFRI.scoreSavings, get: (r) => r.sr,
      anchors: [[-0.10, 0], [-0.04, 25], [0, 50], [0.03, 55], [0.07, 62], [0.12, 70], [0.17, 77], [0.25, 88], [0.30, 95]] },
     { id: 'dti', title: 'Debt to annual income', desmos: CONFIG.desmos.dti, xmin: 0, xmax: 6, ticks: [0, 2, 4, 6],
      fmt: (v) => v + '\u00D7', fn: HFRI.scoreDTI, get: (r) => r.dti,
      anchors: [[0, 100], [2.5, 65], [3, 55], [3.5, 45], [4.5, 25], [6, 5]] },
    { id: 'dsti', title: 'Repayments to income', desmos: CONFIG.desmos.dsti, xmin: 0, xmax: 0.45, ticks: [0, 0.1, 0.2, 0.3, 0.4],
      fmt: (v) => Math.round(v * 100) + '%', fn: HFRI.scoreDSTI, get: (r) => r.dsti,
      anchors: [[0, 100], [0.25, 70], [0.30, 55], [0.35, 40], [0.40, 20]] },
    { id: 'ec', title: 'Emergency cover (months)', desmos: CONFIG.desmos.emergency, xmin: 0, xmax: 12, ticks: [0, 3, 6, 9, 12],
      fmt: (v) => String(v), fn: HFRI.scoreEC, get: (r) => r.ec,
      anchors: [[0, 0], [0.6, 20], [1, 30], [3, 65], [6, 85], [9, 92], [12, 96]] },
    { id: 'cv', title: 'Spending variation (CV)', desmos: CONFIG.desmos.stability, xmin: 0, xmax: 1, ticks: [0, 0.25, 0.5, 0.75, 1],
      fmt: (v) => String(v), fn: HFRI.scoreCV, get: (r) => r.cv,
      anchors: [[0, 100], [0.05, 92], [0.10, 83], [0.20, 68], [0.30, 53], [0.33, 50], [0.40, 40], [0.50, 28], [0.60, 19], [0.80, 8], [1, 3]] }
  ];

  const GEO = { W: 260, H: 170, ml: 34, mr: 12, mt: 10, mb: 28 };
  GEO.pw = GEO.W - GEO.ml - GEO.mr;
  GEO.ph = GEO.H - GEO.mt - GEO.mb;
  const cx = (spec, v) => GEO.ml + ((v - spec.xmin) / (spec.xmax - spec.xmin)) * GEO.pw;
  const cy = (s) => GEO.mt + (1 - s / 100) * GEO.ph;

  function buildCurves() {
    $('curves').innerHTML = CURVES.map((spec) => {
      let path = '';
      for (let i = 0; i <= 120; i++) {
        const x = spec.xmin + ((spec.xmax - spec.xmin) * i) / 120;
        path += (i ? 'L' : 'M') + cx(spec, x).toFixed(1) + ' ' + cy(spec.fn(x)).toFixed(1);
      }
      const grid = [0, 50, 100].map((s) =>
        `<line class="c-grid" x1="${GEO.ml}" x2="${GEO.W - GEO.mr}" y1="${cy(s)}" y2="${cy(s)}"/>` +
        `<text class="c-text" x="${GEO.ml - 6}" y="${cy(s) + 3}" text-anchor="end">${s}</text>`).join('');
      const xt = spec.ticks.map((t) =>
        `<text class="c-text" x="${cx(spec, t)}" y="${GEO.H - GEO.mb + 14}" text-anchor="middle">${spec.fmt(t)}</text>`).join('');
      const anchors = spec.anchors.map(([x, s]) =>
        `<circle class="c-anchor" cx="${cx(spec, x).toFixed(1)}" cy="${cy(s).toFixed(1)}" r="3"/>`).join('');
      return `<div class="curve-card"><h4>${spec.title}</h4>` +
        `<svg viewBox="0 0 ${GEO.W} ${GEO.H}" role="img" aria-label="Scoring curve for ${spec.title}">` +
        grid + xt +
        `<line class="c-axis" x1="${GEO.ml}" x2="${GEO.ml}" y1="${GEO.mt}" y2="${GEO.mt + GEO.ph}"/>` +
        `<line class="c-axis" x1="${GEO.ml}" x2="${GEO.W - GEO.mr}" y1="${GEO.mt + GEO.ph}" y2="${GEO.mt + GEO.ph}"/>` +
        `<path class="c-line" d="${path}"/>${anchors}` +
        `<g id="cu-${spec.id}" visibility="hidden"><line class="c-user-line" id="cl-${spec.id}"/><circle class="c-user-dot" id="cd-${spec.id}" r="5"/></g>` +
        `</svg>` +
`<p class="small" id="cc-${spec.id}"></p>` +
`<a class="model-link" href="${spec.desmos}" target="_blank" rel="noopener noreferrer">Open this model in Desmos ↗</a>` +
`</div>`;
    }).join('');
  }

  function updateCurves(r) {
    CURVES.forEach((spec) => {
      const raw = spec.get(r);
      const x = clamp(raw, spec.xmin, spec.xmax);
      const s = spec.fn(raw);
      const px = cx(spec, x), py = cy(spec.fn(x));
      const line = $('cl-' + spec.id), dot = $('cd-' + spec.id);
      line.setAttribute('x1', px); line.setAttribute('x2', px);
      line.setAttribute('y1', py); line.setAttribute('y2', GEO.mt + GEO.ph);
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      $('cu-' + spec.id).setAttribute('visibility', 'visible');
      const offScale = raw < spec.xmin || raw > spec.xmax ? ' (off the chart, shown at the edge)' : '';
      const shown = spec.id === 'savings' || spec.id === 'dsti' ? pct(raw)
        : spec.id === 'dti' ? raw.toFixed(2) + '\u00D7'
        : spec.id === 'ec' ? raw.toFixed(1) + ' months' : raw.toFixed(2);
      $('cc-' + spec.id).textContent = 'This household: ' + shown + ', score ' + Math.round(s) + offScale;
    });
  }

  /* ---------- inputs ---------- */
  const FIELD_IDS = ['income', 'spending', 'essential', 'liquid', 'debt', 'debtService', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6'];
  const MONTH_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
  const spendMode = () => document.querySelector('input[name="spendMode"]:checked').value;

  function updateModeUI() {
    const detailed = spendMode() === 'detailed';
    $('spend-quick').hidden = detailed;
    $('spend-detailed').hidden = !detailed;
  }

  // Population standard deviation (divides by n).
  function meanAndCV(values) {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
    return { mean, cv: mean > 0 ? Math.sqrt(variance) / mean : NaN };
  }

  function readInputs() {
    const missing = [];
    const need = (ok, label, id) => { if (!ok) missing.push({ label, id }); };

    FIELD_IDS.forEach((id) => {
      const v = val(id);
      $(id).setAttribute('aria-invalid', v !== null && v < 0 ? 'true' : 'false');
    });

    const income = val('income');
    need(income !== null && income > 0, 'monthly income', 'income');

    let spending = null, cv = null;
    if (spendMode() === 'quick') {
      spending = val('spending');
      need(spending !== null && spending > 0, 'average monthly spending', 'spending');
      cv = parseFloat($('steadiness').value);
      $('months-readout').textContent = 'Enter all six months to see the average and variation.';
    } else {
      const vals = MONTH_IDS.map(val);
      const firstBad = MONTH_IDS.find((id, i) => vals[i] === null || vals[i] < 0);
      const ok = !firstBad;
      need(ok, 'all six months of spending', firstBad || 'm1');
      if (ok) {
        const st = meanAndCV(vals);
        if (st.mean > 0) {
          spending = st.mean; cv = st.cv;
          $('months-readout').textContent =
            'Average ' + money(st.mean) + ' per month. Variation (CV) ' + st.cv.toFixed(2) + '.';
        } else {
          need(false, 'spending above zero', 'm1');
        }
      } else {
        $('months-readout').textContent = 'Enter all six months to see the average and variation.';
      }
    }

    const essential = val('essential');
    need(essential !== null && essential > 0, 'essential monthly spending', 'essential');
    const liquid = val('liquid');
    need(liquid !== null && liquid >= 0, 'liquid savings (enter 0 if none)', 'liquid');

    const debt = val('debt') === null ? 0 : val('debt');
    const debtService = val('debtService') === null ? 0 : val('debtService');
    need(debt >= 0, 'debt as zero or a positive number', 'debt');
    need(debtService >= 0, 'repayments as zero or a positive number', 'debtService');

    if (missing.length) return { missing };
    return { inputs: { income, spending, essential, liquid, debt, debtService, cv }, missing: [] };
  }

  /* ---------- rendering ---------- */
  const state = { inputs: null, result: null, shownScore: 0 };

  function animateScore(target) {
    const el = $('score-value');
    const from = state.shownScore;
    state.shownScore = target;
    if (reduceMotion || Math.abs(target - from) < 0.05) { el.textContent = target.toFixed(1); return; }
    const start = performance.now(), dur = 550;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (target - from) * eased).toFixed(1);
      if (t < 1 && state.shownScore === target) requestAnimationFrame(step);
      else el.textContent = target.toFixed(1);
    };
    requestAnimationFrame(step);
  }

  function percentileText(score) {
    if (score < HFRI.SIM_MIN) return 'Lower than every one of the 1,000 simulated households.';
    if (score > HFRI.SIM_MAX) return 'Higher than every one of the 1,000 simulated households.';
    return 'Higher than roughly ' + Math.round(HFRI.percentileOf(score)) +
      '% of the 1,000 simulated households. This compares against the model, not against real families.';
  }

  function render(fromSubmit) {
    const read = readInputs();

    if (read.missing.length) {
      state.inputs = null;
      $('results-body').hidden = true;
      $('results-empty').hidden = false;
      const anyTyped = FIELD_IDS.some((id) => val(id) !== null);
      $('empty-message').textContent = anyTyped
        ? 'Still needed: ' + read.missing.map((m) => m.label).join(', ') + '.'
        : 'Enter monthly income, spending, essential spending and liquid savings to begin, or start from one of the examples.';
      if (fromSubmit) $(read.missing[0].id).focus();
      return;
    }

    const inp = read.inputs;
    const r = HFRI.compute(inp);
    state.inputs = inp;
    state.result = r;

    $('results-empty').hidden = true;
    $('results-body').hidden = false;

    animateScore(r.total);
    const band = HFRI.bandFor(r.total);
    $('band-label').textContent = band.label;
    $('band-text').textContent = band.text + ' These bands are provisional and come from the paper\u2019s simulation.';
    $('percentile-text').textContent = percentileText(r.total);
    placeMarker(r.total);

    // notices
    const notices = [];
    const monthlyBalance = inp.income - inp.spending - inp.debtService;
    if (inp.spending > inp.income) notices.push('Spending is higher than income, so the savings rate is negative and Savings Strength is low or zero.');
    if (inp.essential > inp.spending) notices.push('Essential spending is higher than total spending. Check that essentials are part of the spending figure.');
    if (inp.debtService > 0 && inp.debt === 0) notices.push('Loan repayments are entered but debt is zero. Check the debt figure.');
    if (monthlyBalance < 0) notices.push('After spending and loan repayments, this household runs a deficit of ' + money(-monthlyBalance) + ' a month.');
    $('notices').innerHTML = notices.map((n) => `<li>${n}</li>`).join('');

    // dimensions
    const dims = { S: r.S, D: r.D, E: r.E, X: r.X };
    const weakest = Object.keys(dims).reduce((a, b) => (dims[b] < dims[a] ? b : a));
    Object.keys(dims).forEach((k) => {
      $('dim-' + k + '-score').textContent = Math.round(dims[k]);
      $('dim-' + k + '-fill').style.width = clamp(dims[k], 0, 100) + '%';
      document.querySelector(`.dims li[data-dim="${k}"]`).classList.toggle('is-weakest', k === weakest);
    });
    $('dim-S-note').textContent = 'Saves ' + pct(r.sr) + ' of income after spending (loan repayments counted under debt).';
    $('dim-D-note').textContent = 'Debt is ' + r.dti.toFixed(2) + '\u00D7 annual income and repayments take ' + pct(r.dsti) +
      ' of income. Sub-scores: debt size ' + Math.round(r.dtiScore) + ', repayments ' + Math.round(r.dstiScore) + '.';
    $('dim-E-note').textContent = 'Liquid savings cover ' + r.ec.toFixed(1) + ' months of essential spending.';
    $('dim-X-note').textContent = 'Spending varies with a CV of ' + r.cv.toFixed(2) + ' around its monthly average.';

    // levers
    const levers = HFRI.levers(inp, r);
    const fill = (t) => t
      .replace('{m1}', money(inp.essential))
      .replace('{cut}', money(Math.min(0.05 * inp.income, Math.max(0, inp.spending - inp.essential))))
      .replace('{debt75}', money(inp.debt * 0.75))
      .replace('{ds75}', money(inp.debtService * 0.75));
    $('levers').innerHTML = levers.length
      ? levers.map((l) =>
          `<li><span>${l.title}</span><span class="lever-gain">+${l.gain.toFixed(1)} points</span>` +
          `<p class="lever-sub">${fill(l.detail)} The score would be ${l.result.toFixed(1)}.</p></li>`).join('')
      : '<li><span>No single change below moves the score by more than 0.05 points.</span></li>';

    updateCurves(r);
    renderShock();

    if (fromSubmit && window.innerWidth <= 980) {
      $('results').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function renderShock() {
    const inp = state.inputs;
    if (!inp) return;
    const type = document.querySelector('input[name="shockType"]:checked').value;
    const p = parseFloat($('shock-pct').value);
    const months = parseInt($('shock-months').value, 10);
    const s = HFRI.shock(inp, type, p, months);
    const what = Math.round(p * 100) + '% ' + (type === 'income' ? 'fall in income' : 'rise in spending');

    const ratioPct = Number.isFinite(s.coverRatio) ? Math.round(s.coverRatio * 100) : 100;
    const ratioText = ratioPct > 999 ? 'more than 999%' : ratioPct + '%';
    const barWidth = Math.min(100, ratioPct);

    const liquidityStatus = s.covered
      ? 'Covered by liquid savings.'
      : 'Short by ' + money(s.cost - inp.liquid) + '.';

    let cash;
    if (s.shockMonthly >= 0) {
      cash = `<p>During the shock, ${money(s.shockMonthly)} is still left each month after spending and repayments, so savings are not drawn down.</p>`;
    } else {
      cash = `<p>During the shock there is a gap of ${money(-s.shockMonthly)} each month. Liquid savings would last ${s.runway.toFixed(1)} months.</p>` +
        (s.shortfall > 0
          ? `<p class="shock-status">Over ${plural(months, 'month')} that leaves ${money(s.shortfall)} to borrow or cut.</p>`
          : `<p class="shock-status">Liquid savings cover the full ${plural(months, 'month')}.</p>`);
    }

    $('shock-out').innerHTML =
      `<div class="shock-row"><h4>Liquidity test (the paper\u2019s method)</h4>` +
      `<p>A ${what} for ${plural(months, 'month')} costs ${money(s.cost)}. Liquid savings of ${money(inp.liquid)} cover ${ratioText} of it.</p>` +
      `<div class="cover-track"><div class="cover-fill${s.covered ? '' : ' is-short'}" style="width:${barWidth}%"></div></div>` +
      `<p class="shock-status">${liquidityStatus}</p></div>` +
      `<div class="shock-row"><h4>Cash-flow test (added in this calculator)</h4>` +
      `<p>Today ${s.baseMonthly >= 0 ? money(s.baseMonthly) + ' is left' : 'there is a gap of ' + money(-s.baseMonthly)} each month after spending and repayments.</p>` +
      cash + `</div>`;
  }

  /* ---------- examples ---------- */
  const PRESETS = {
    cushion:   { income: 60000, spending: 38000, essential: 26000, liquid: 180000, debt: 200000,  debtService: 4500,  cv: '0.10' },
    stretched: { income: 45000, spending: 33000, essential: 24000, liquid: 15000,  debt: 1200000, debtService: 15000, cv: '0.20' },
    gig:       { income: 28000, spending: 24000, essential: 16000, liquid: 8000,   debt: 60000,   debtService: 3000,  cv: '0.33' },
    saver:     { income: 90000, spending: 45000, essential: 30000, liquid: 600000, debt: 0,       debtService: 0,     cv: '0.05' }
  };

  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    $('mode-quick').checked = true;
    updateModeUI();
    ['income', 'spending', 'essential', 'liquid', 'debt', 'debtService'].forEach((id) => {
      $(id).value = p[id].toLocaleString('en-IN');
    });
    $('steadiness').value = p.cv;
    render(false);
  }

  /* ---------- summary and print ---------- */
  function summaryText() {
    const r = state.result, inp = state.inputs;
    if (!r) return '';
    const band = HFRI.bandFor(r.total);
    return [
      'HFRI score: ' + r.total.toFixed(1) + ' / 100 (' + band.label + ')',
      'Savings Strength ' + Math.round(r.S) + ', Debt Sustainability ' + Math.round(r.D) +
        ', Emergency Coverage ' + Math.round(r.E) + ', Expense Stability ' + Math.round(r.X),
      'Inputs: income ' + money(inp.income) + '/month, spending ' + money(inp.spending) + '/month, essential ' +
        money(inp.essential) + '/month, liquid savings ' + money(inp.liquid) + ', debt ' + money(inp.debt) +
        ', repayments ' + money(inp.debtService) + '/month, spending CV ' + inp.cv.toFixed(2),
      'Model: Household Financial Resilience Index by Vivaan Agarwal. Calibrated on simulated households and not validated on real outcomes. Not financial advice.'
    ].join('\n');
  }

  function copySummary() {
    const text = summaryText();
    const status = $('copy-status');
    const done = (msg) => { status.textContent = msg; setTimeout(() => { status.textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => done('Copied.'), () => done('Copy failed. Select the numbers manually.'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done('Copied.'); } catch (e) { done('Copy failed. Select the numbers manually.'); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- contact and links ---------- */
  function renderLinks() {
    const row = (label, inner) => `<li><span class="c-label">${label}</span><span>${inner}</span></li>`;
    const link = (url, text) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    const pending = (text) => `<span class="pending">${text}</span>`;

    const rows = [];
    const email = CONFIG.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(CONFIG.email) ? CONFIG.email : '';
    rows.push(row('Email', email ? `<a href="mailto:${email}">${email}</a>` : pending('To be added')));

    CONFIG.socials.forEach((s) => {
      const u = safeUrl(s.url);
      rows.push(row(s.label, u ? link(u, u.replace(/^https?:\/\/(www\.)?/, '')) : pending('To be added')));
    });

    const paper = safeUrl(CONFIG.links.paper);
    const code = safeUrl(CONFIG.links.code);
    const arbor = safeUrl(CONFIG.links.arbor);
    rows.push(row('Research paper', paper ? link(paper, 'Read the paper') : pending('To be added')));
    rows.push(row('Code', code ? link(code, 'Open the notebook') : pending('To be added')));
    rows.push(row('Arbor', arbor ? link(arbor, 'Visit Arbor') : pending('To be added')));
    $('contact-list').innerHTML = rows.join('');

    if (arbor) $('arbor-link-slot').innerHTML = link(arbor, 'Visit Arbor');
    if (paper) {
      const a = $('link-paper-hero');
      a.href = paper; a.textContent = 'Read the paper';
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    }
    const researchLinks = {
  paper: document.getElementById('link-paper'),
  code: document.getElementById('link-code'),
  arbor: document.getElementById('link-arbor')
};

if (researchLinks.paper && CONFIG.links.paper) {
  researchLinks.paper.href = CONFIG.links.paper;
}

if (researchLinks.code && CONFIG.links.code) {
  researchLinks.code.href = CONFIG.links.code;
}

if (researchLinks.arbor && CONFIG.links.arbor) {
  researchLinks.arbor.href = CONFIG.links.arbor;
}
  }

  /* ---------- wiring ---------- */
  buildHeroRuler();
  buildResultRuler();
  buildCurves();
  renderLinks();
  updateModeUI();

  const form = $('calc-form');
  let timer = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(() => render(false), 120); };

  form.addEventListener('input', schedule);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'spendMode') updateModeUI();
    render(false);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); render(true); });
  form.addEventListener('reset', () => {
    setTimeout(() => {
      updateModeUI();
      state.shownScore = 0;
      render(false);
      FIELD_IDS.forEach((id) => $(id).setAttribute('aria-invalid', 'false'));
    }, 0);
  });

  // tidy number formatting when leaving a field
  FIELD_IDS.forEach((id) => {
    $(id).addEventListener('blur', () => {
      const n = val(id);
      if (n !== null && n >= 0) $(id).value = n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    });
  });

  document.querySelectorAll('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => loadPreset(b.dataset.preset)));

  ['shock-income', 'shock-spending', 'shock-pct', 'shock-months'].forEach((id) =>
    $(id).addEventListener('change', renderShock));

  $('copy-summary').addEventListener('click', copySummary);
  $('print-result').addEventListener('click', () => window.print());

  render(false);
}

// Allows the model to be tested in Node without a browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HFRI;
}
