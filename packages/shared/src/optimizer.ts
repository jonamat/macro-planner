// ---------- Config ----------
/**
 * Maximum allowed percentage deviation per macronutrient.
 * If after all retries a macro deviation is still above this threshold,
 * the solver throws an error.
 */
export const TOLERANCE = 25; // <-- adjust to your needs (percent)

// ---------- Types from the prompt ----------
export interface MacroTarget {
    name: string;
  carbo: number;
  protein: number;
  fat: number;
}

export type Ingredients = Array<IngredientData>;
export interface IngredientData {
  name: string;
  min?: number;         // base floor in grams if defined
  max?: number;         // available grams
  mandatory?: number;   // hard-required grams if defined
  indivisible?: number; // if set, only use multiples of this step (e.g., 5g)
  carbo100g: number;
  protein100g: number;
  fat100g: number;
}

export interface Output {
  total: { carbo: number; protein: number; fat: number; kcal: number };
  ingredients: Array<{
    name: string;
    weight: number;
    carbo: number;
    protein: number;
    fat: number;
    kcal: number;
  }>;
  deviation: {
    carbo: number;   // % deviation from target carbs
    protein: number; // % deviation from target proteins
    fat: number;     // % deviation from target fats
  };
}

// ---------- Internal safe index helper ----------
/** Safe index accessor to satisfy noUncheckedIndexedAccess. Throws if out of bounds. */
function at<T>(arr: T[], i: number): T {
  const v = arr[i];
  if (v === undefined) throw new Error(`Index ${i} out of bounds (length=${arr.length})`);
  return v;
}

// ---------- Solver implementation ----------
/**
 * Optimize a meal composition to match macronutrient targets.
 *
 * Strategy (MILP/MIQP-inspired):
 * 1) Pre-allocate all "mandatory" grams (hard constraints).
 * 2) Greedy bounded-knapsack by priority (protein -> fat -> carbs).
 * 3) Discrete MIQP-like hill-climbing refinement.
 * 4) Up to 3 additional retries with shuffled order/weights if deviation > TOLLERANCE.
 * 5) If after retries some macro deviation still exceeds TOLLERANCE, throw an error.
 */
export function optimizeMealToMacro(
  macroTarget: MacroTarget,
  ingredients: Ingredients
): Output {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const nearlyEqual = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;
  const kcal = (c: number, p: number, f: number) => 4 * c + 4 * p + 9 * f;

  // per-gram macro density
  const dens = (ing: IngredientData) => ({
    c: ing.carbo100g / 100,
    p: ing.protein100g / 100,
    f: ing.fat100g / 100,
  });

  function totals(weights: number[], AA: Array<ReturnType<typeof dens>>) {
    let c = 0, p = 0, f = 0;
    const m = Math.min(weights.length, AA.length);
    for (let i = 0; i < m; i++) {
      const Ai = at(AA, i);
      const w = at(weights, i);
      c += Ai.c * w;
      p += Ai.p * w;
      f += Ai.f * w;
    }
    return { c, p, f, kcal: kcal(c, p, f) };
  }

  function pctDev(total: number, target: number) {
    if (target === 0) {
      if (total === 0) return 0;
      return total > 0 ? 100 : -100;
    }
    return ((total - target) / target) * 100;
  }

  function objective(
    T: { c: number; p: number; f: number },
    target: MacroTarget,
    w: { wp: number; wf: number; wc: number },
    l1: number,
    weights: number[]
  ) {
    const dP = T.p - target.protein;
    const dF = T.f - target.fat;
    const dC = T.c - target.carbo;
    const quad = w.wp * dP * dP + w.wf * dF * dF + w.wc * dC * dC;
    const l1pen = l1 * weights.reduce((s, x) => s + Math.abs(x), 0);
    return quad + l1pen;
  }

  function roundToStep(value: number, step: number) {
    if (step <= 0) return value;
    return Math.round(value / step) * step;
  }

  function projectToFeasible(x: number, step: number, lo: number, hi: number) {
    let y = x;
    if (step > 0) y = roundToStep(y, step);
    y = clamp(y, lo, hi);
    if (step > 0) {
      const k = Math.round((y - lo) / step);
      y = clamp(lo + k * step, lo, hi);
    }
    return y;
  }

  // Build per-ingredient constraints
  const n = ingredients.length;
  const steps: number[] = new Array<number>(n).fill(0);
  const lo: number[] = new Array<number>(n).fill(0);
  const hi: number[] = new Array<number>(n).fill(0);
  const baseMandatory: number[] = new Array<number>(n).fill(0);
  const A: Array<ReturnType<typeof dens>> = ingredients.map(dens);

  for (let i = 0; i < n; i++) {
    const ing = at(ingredients, i);
    const step = ing.indivisible && ing.indivisible > 0 ? ing.indivisible : 1; // 1g grid by default
    const minBase = Math.max(ing.min ?? 0, 0);
    const maxBase = Math.max(ing.max ?? Number.POSITIVE_INFINITY, 0);
    const mandatory = Math.max(ing.mandatory ?? 0, 0);

    baseMandatory[i] = mandatory;

    const residMin = Math.max(minBase - mandatory, 0);
    const residMax = Math.max(maxBase - mandatory, 0);

    steps[i] = step;
    lo[i] = residMin;
    hi[i] = residMax;

    if (at(steps, i) > 0) {
      lo[i] = roundToStep(at(lo, i), at(steps, i));
      hi[i] = Math.floor(at(hi, i) / at(steps, i)) * at(steps, i);
      hi[i] = Math.max(at(hi, i), at(lo, i));
    }
  }

  // Quick infeasibility checks
  for (let i = 0; i < n; i++) {
    const ing = at(ingredients, i);
    if ((ing.max ?? Infinity) < at(baseMandatory, i)) {
      return emptyInfeasible(ingredients, "Mandatory grams exceed available max for " + ing.name);
    }
  }

  // Build initial solution: start from mandatory baseline
  const x0: number[] = baseMandatory.slice();

  function buildGreedy(seedOrder: number[], target: MacroTarget) {
    const y: number[] = new Array<number>(n).fill(0);

    const T0 = totals(x0, A);

    const R = {
      c: Math.max(target.carbo - T0.c, 0),
      p: Math.max(target.protein - T0.p, 0),
      f: Math.max(target.fat - T0.f, 0),
    };

    const proteinDensity = (i: number) => {
      const Ai = at(A, i);
      const d = kcal(Ai.c, Ai.p, Ai.f);
      return Ai.p <= 0 ? -Infinity : Ai.p / Math.max(d, 1e-9);
    };
    const fatDensity = (i: number) => {
      const Ai = at(A, i);
      const d = kcal(Ai.c, Ai.p, Ai.f);
      return Ai.f <= 0 ? -Infinity : Ai.f / Math.max(d, 1e-9);
    };
    const carbDensity = (i: number) => {
      const Ai = at(A, i);
      const d = kcal(Ai.c, Ai.p, Ai.f);
      return Ai.c <= 0 ? -Infinity : Ai.c / Math.max(d, 1e-9);
    };

    function packToward(
      residual: number,
      pickScore: (i: number) => number,
      macroPick: (i: number) => number
    ) {
      if (residual <= 0) return;
      const idx = seedOrder
        .filter(i => at(hi, i) > 0)
        .sort((i, j) => {
          const di = pickScore(i);
          const dj = pickScore(j);
          if (di === dj) return seedOrder.indexOf(i) - seedOrder.indexOf(j);
          return dj - di;
        });

      let remain = residual;
      for (const i of idx) {
        if (remain <= 0) break;
        const step = Math.max(at(steps, i), 1);

        if (macroPick(i) <= 0) continue;

        const cap = at(hi, i) - at(y, i);
        if (cap <= 0) continue;

        const perStepGain = macroPick(i) * step;
        if (perStepGain <= 0) continue;

        const k = Math.min(Math.floor(remain / perStepGain), Math.floor(cap / step));
        if (k <= 0) continue;

        const add = k * step;
        y[i] = at(y, i) + add;
        remain -= perStepGain * k;
      }
    }

    packToward(R.p, proteinDensity, (i) => at(A, i).p);
    packToward(R.f, fatDensity, (i) => at(A, i).f);
    packToward(R.c, carbDensity, (i) => at(A, i).c);

    const x = x0.map((b, i) => clamp(b + at(y, i), 0, (at(ingredients, i).max ?? Infinity)));

    for (let i = 0; i < n; i++) {
      x[i] =
        projectToFeasible(
          at(x, i) - at(baseMandatory, i),
          at(steps, i),
          at(lo, i),
          at(hi, i)
        ) + at(baseMandatory, i);
    }
    return x;
  }

  function refineLocal(
    xStart: number[],
    weightsQP: { wp: number; wf: number; wc: number },
    l1: number,
    maxIter = 4000
  ) {
    const x = xStart.slice();
    const stepDirs = [1, -1];

    const yLo = lo;
    const yHi = hi;

    let T = totals(x, A);
    let bestObj = objective({ c: T.c, p: T.p, f: T.f }, macroTarget, weightsQP, l1, x);

    for (let iter = 0; iter < maxIter; iter++) {
      let improved = false;

      const order = priorityOrderIndices(A);

      for (const i of order) {
        const s = Math.max(at(steps, i), 1);
        for (const dir of stepDirs) {
          const cand = at(x, i) + dir * s;
          const yCand = cand - at(baseMandatory, i);
          if (yCand < at(yLo, i) || yCand > at(yHi, i)) continue;

          const old = at(x, i);
          x[i] = cand;
          T = totals(x, A);
          const obj = objective({ c: T.c, p: T.p, f: T.f }, macroTarget, weightsQP, l1, x);

          if (obj + 1e-9 < bestObj) {
            bestObj = obj;
            improved = true;
          } else {
            x[i] = old;
          }
        }
      }

      if (!improved) break;
    }

    for (let i = 0; i < n; i++) {
      x[i] =
        projectToFeasible(
          at(x, i) - at(baseMandatory, i),
          at(steps, i),
          at(lo, i),
          at(hi, i)
        ) + at(baseMandatory, i);
    }
    return x;
  }

  function priorityOrderIndices(Ain: Array<ReturnType<typeof dens>>) {
    const idx = Array.from({ length: Ain.length }, (_, i) => i);
    return idx.sort((i, j) => {
      const Ai = at(Ain, i);
      const Aj = at(Ain, j);
      const di = (Ai.p || 0) - (Aj.p || 0);
      if (!nearlyEqual(di, 0)) return di > 0 ? -1 : 1;
      const fi = (Ai.f || 0) - (Aj.f || 0);
      if (!nearlyEqual(fi, 0)) return fi > 0 ? -1 : 1;
      const ci = (Ai.c || 0) - (Aj.c || 0);
      if (!nearlyEqual(ci, 0)) return ci > 0 ? -1 : 1;
      return 0;
    });
  }

  function buildOutput(x: number[]): Output {
    const t = totals(x, A);
    const outIngs = x.map((w, i) => {
      const Ai = at(A, i);
      const ing = at(ingredients, i);
      const cc = Ai.c * w;
      const pp = Ai.p * w;
      const ff = Ai.f * w;
      return {
        name: ing.name,
        weight: round1(w),
        carbo: round1(cc),
        protein: round1(pp),
        fat: round1(ff),
        kcal: Math.round(kcal(cc, pp, ff)),
      };
    });

    const dev = {
      carbo: round1(pctDev(t.c, macroTarget.carbo)),
      protein: round1(pctDev(t.p, macroTarget.protein)),
      fat: round1(pctDev(t.f, macroTarget.fat)),
    };

    return {
      total: {
        carbo: round1(t.c),
        protein: round1(t.p),
        fat: round1(t.f),
        kcal: Math.round(t.kcal),
      },
      ingredients: outIngs.filter(row => row.weight > 0),
      deviation: dev,
    };
  }

  function round1(v: number) {
    return Math.round(v * 10) / 10;
  }

  function emptyInfeasible(ings: Ingredients, _reason: string): Output {
    return {
      total: { carbo: 0, protein: 0, fat: 0, kcal: 0 },
      ingredients: ings.map(i => ({
        name: i.name, weight: 0, carbo: 0, protein: 0, fat: 0, kcal: 0
      })),
      deviation: { carbo: 100, protein: 100, fat: 100 },
    };
  }

  // ---------- Multi-try orchestration ----------
  type TryConfig = {
    shuffle: boolean;
    weights: { wp: number; wf: number; wc: number };
    l1: number;
  };

  const tries: TryConfig[] = [
    { shuffle: false, weights: { wp: 1.0, wf: 0.25, wc: 0.10 }, l1: 1e-3 },
    { shuffle: true,  weights: { wp: 1.0, wf: 0.35, wc: 0.12 }, l1: 2e-3 },
    { shuffle: true,  weights: { wp: 1.0, wf: 0.30, wc: 0.20 }, l1: 2e-3 },
    { shuffle: true,  weights: { wp: 1.0, wf: 0.30, wc: 0.15 }, l1: 5e-3 },
  ];

  let bestOutput: Output | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < tries.length; attempt++) {
    const cfg = at(tries, attempt);

    // Seed order for greedy packing
    const seedOrder: number[] = Array.from({ length: n }, (_, i) => i);
    if (cfg.shuffle) {
      for (let k = seedOrder.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        const tmp = seedOrder[k]!;
        seedOrder[k] = seedOrder[r]!;
        seedOrder[r] = tmp!;
      }
    }

    // Greedy build
    const xGreedy = buildGreedy(seedOrder, macroTarget);

    // Light random “shake” if shuffled
    if (cfg.shuffle) {
      for (let i = 0; i < n; i++) {
        if (at(hi, i) <= 0) continue;
        const s = Math.max(at(steps, i), 1);
        const jitter = (Math.random() < 0.3 ? 1 : 0) * (Math.random() < 0.5 ? -s : s);
        const yCand = clamp(at(xGreedy, i) + jitter, at(baseMandatory, i) + at(lo, i), at(baseMandatory, i) + at(hi, i));
        const snapped =
          projectToFeasible(
            yCand - at(baseMandatory, i),
            at(steps, i),
            at(lo, i),
            at(hi, i)
          ) + at(baseMandatory, i);
        xGreedy[i] = snapped;
      }
    }

    // MIQP-like refinement
    const xRefined = refineLocal(xGreedy, cfg.weights, cfg.l1);

    // Score and keep the best
    const Tfin = totals(xRefined, A);
    const score = objective({ c: Tfin.c, p: Tfin.p, f: Tfin.f }, macroTarget, cfg.weights, cfg.l1, xRefined);
    const out = buildOutput(xRefined);

    // Check against tolerance (per macro)
    const exceedsTolerance =
      Math.abs(out.deviation.carbo) > TOLERANCE ||
      Math.abs(out.deviation.protein) > TOLERANCE ||
      Math.abs(out.deviation.fat) > TOLERANCE;

    if (!bestOutput || score < bestScore) {
      bestScore = score;
      bestOutput = out;
    }

    // Accept early if all deviations are within tolerance
    if (!exceedsTolerance) {
      return out;
    }
    // else continue and try next configuration
  }

  // If here, every attempt exceeded tolerance; throw with the best attempt info.
  if (bestOutput) {
    const d = bestOutput.deviation;
    throw new Error(
      `Unable to meet macros within TOLLERANCE=${TOLERANCE}% with given ingredients. ` +
      `Best deviations: protein=${d.protein}%, fat=${d.fat}%, carbs=${d.carbo}%.`
    );
  }

  // Defensive fallback (should not be reached)
  throw new Error(`Optimization failed with no feasible output constructed.`);
}
