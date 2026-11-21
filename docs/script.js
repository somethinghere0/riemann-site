// Known imaginary parts of the first non-trivial zeros
const ZEROS = [14.134725, 21.022040, 25.010858, 30.424876, 32.935062,
               37.586178, 40.918719, 43.327073, 48.005151, 49.773832];
document.getElementById('zeros').innerHTML =
  ZEROS.map(t => `<li>½ + ${t.toFixed(6)}i</li>`).join('');

// Riemann–Siegel Z(t) (leading-order approximation)
function theta(t) {
  return (t / 2) * Math.log(t / (2 * Math.PI)) - t / 2 - Math.PI / 8 + 1 / (48 * t);
}
function Z(t) {
  const N = Math.floor(Math.sqrt(t / (2 * Math.PI)));
  let s = 0;
  for (let n = 1; n <= N; n++) s += Math.cos(theta(t) - t * Math.log(n)) / Math.sqrt(n);
  return 2 * s;
}

const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('tmax');
const out = document.getElementById('tmax-out');
const count = document.getElementById('count');
const T0 = 5;

function draw() {
  const tmax = +slider.value;
  out.textContent = tmax;
  const W = canvas.width, H = canvas.height, mid = H / 2, amp = 55;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#3a4470'; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

  ctx.strokeStyle = '#5cc8ff'; ctx.lineWidth = 2; ctx.beginPath();
  let prev = null, zeros = 0;
  const steps = 2000;
  for (let i = 0; i <= steps; i++) {
    const t = T0 + (tmax - T0) * i / steps;
    const z = Z(t);
    const x = (t - T0) / (tmax - T0) * W;
    const y = Math.max(8, Math.min(H - 8, mid - z * amp / 2));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    if (prev && Math.sign(prev.z) !== Math.sign(z) && t > 10) {
      zeros++;
      ctx.stroke();
      ctx.fillStyle = '#ffcf5c'; ctx.beginPath(); ctx.arc(x, mid, 5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y);
    }
    prev = { z };
  }
  ctx.stroke();
  count.textContent = `${zeros} zeros found on the critical line up to t = ${tmax}`;
}
slider.addEventListener('input', draw);
draw();

// ---- Prime counting vs Li(x) vs x/ln x ----
const pc = document.getElementById('primeplot');
const pctx = pc.getContext('2d');
const xs = document.getElementById('xmax');
const xout = document.getElementById('xmax-out');
const pnote = document.getElementById('primenote');

function sieveCounts(n) {
  const comp = new Uint8Array(n + 1), pi = new Uint32Array(n + 1);
  for (let i = 2; i * i <= n; i++) if (!comp[i]) for (let j = i * i; j <= n; j += i) comp[j] = 1;
  for (let i = 2; i <= n; i++) pi[i] = pi[i - 1] + (comp[i] ? 0 : 1);
  return pi;
}
const PI = sieveCounts(5000);
// Li(x) = integral from 2 to x of dt/ln t (Simpson), precomputed on a grid
const LI = new Float64Array(5001);
(function () {
  let acc = 0; const f = t => 1 / Math.log(t);
  for (let x = 3; x <= 5000; x++) { acc += (f(x - 1) + 4 * f(x - 0.5) + f(x)) / 6; LI[x] = acc; }
  LI[2] = 0;
})();

function drawPrimes() {
  const X = +xs.value; xout.textContent = X;
  const W = pc.width, H = pc.height, pad = 10;
  pctx.clearRect(0, 0, W, H);
  const ymax = Math.max(PI[X], LI[X], X / Math.log(X)) * 1.1;
  const series = [['#5cc8ff', x => PI[x], true], ['#ffcf5c', x => LI[x], false], ['#ff7a9c', x => x / Math.log(x), false]];
  for (const [color, f, step] of series) {
    pctx.strokeStyle = color; pctx.lineWidth = 2; pctx.beginPath();
    for (let x = 2; x <= X; x++) {
      const px = (x - 2) / (X - 2) * (W - 2 * pad) + pad, py = H - pad - f(x) / ymax * (H - 2 * pad);
      x === 2 ? pctx.moveTo(px, py) : pctx.lineTo(px, py);
    }
    pctx.stroke();
  }
  const err = LI[X] - PI[X];
  pnote.textContent = `At x = ${X}: π(x) = ${PI[X]}, Li(x) ≈ ${LI[X].toFixed(1)}, error ≈ ${err.toFixed(1)}, and √x·ln x ≈ ${(Math.sqrt(X) * Math.log(X)).toFixed(1)}.`;
}
xs.addEventListener('input', drawPrimes);
drawPrimes();
