// ---------- Config ----------
export const DEFAULT_TOLERANCE = 20;

// ---------- Types ----------
export interface MacroTarget {
  name: string;
  carbo: number;
  protein: number;
  fat: number;
}

export type Ingredients = Array<IngredientData>;
export interface IngredientData {
  name: string;
  min?: number;
  max?: number;
  mandatory?: number;
  indivisible?: number;
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
    carbo: number;
    protein: number;
    fat: number;
  };
}

// ---------- Internal helpers ----------
function at<T>(arr: T[], i: number): T {
  const v = arr[i];
  if (v === undefined) throw new Error(`Index ${i} out of bounds (length=${arr.length})`);
  return v;
}

// ---------- Solver ----------
export function optimizeMealToMacro(
  macroTarget: MacroTarget,
  ingredients: Ingredients,
  tolerancePct: number = DEFAULT_TOLERANCE
): Output {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const kcal = (c: number, p: number, f: number) => 4 * c + 4 * p + 9 * f;

  type Density = { c: number; p: number; f: number };
  const dens = (ing: IngredientData): Density => ({
    c: ing.carbo100g / 100,
    p: ing.protein100g / 100,
    f: ing.fat100g / 100,
  });

  function totals(weights: number[], AA: Density[]) {
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
    if (target === 0) return total === 0 ? 0 : total > 0 ? 100 : -100;
    return ((total - target) / target) * 100;
  }

  // Priority weights: protein >> carbs > fat
  const WP = 10, WC = 3, WF = 1;

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

  const n = ingredients.length;
  const steps: number[] = new Array<number>(n).fill(0);
  const lo: number[] = new Array<number>(n).fill(0);
  const hi: number[] = new Array<number>(n).fill(0);
  const baseMandatory: number[] = new Array<number>(n).fill(0);
  const A: Density[] = ingredients.map(dens);

  for (let i = 0; i < n; i++) {
    const ing = at(ingredients, i);
    const step = ing.indivisible && ing.indivisible > 0 ? ing.indivisible : 1;
    const minBase = Math.max(ing.min ?? 0, 0);
    const maxBase = ing.max != null && ing.max > 0 ? ing.max : Number.POSITIVE_INFINITY;
    const mandatory = Math.max(ing.mandatory ?? 0, 0);

    baseMandatory[i] = mandatory;

    const residMin = Math.max(minBase - mandatory, 0);
    const residMax = Math.max(maxBase - mandatory, 0);

    steps[i] = step;
    lo[i] = residMin;
    hi[i] = residMax;

    if (step > 0) {
      lo[i] = roundToStep(lo[i]!, step);
      hi[i] = Math.floor(hi[i]! / step) * step;
      hi[i] = Math.max(hi[i]!, lo[i]!);
    }
  }

  // Infeasibility: mandatory exceeds max
  for (let i = 0; i < n; i++) {
    const ing = at(ingredients, i);
    const maxVal = ing.max != null && ing.max > 0 ? ing.max : Infinity;
    if (maxVal < at(baseMandatory, i)) {
      return emptyInfeasible("Mandatory grams exceed max for " + ing.name);
    }
  }

  // Mandatory baseline
  const x0: number[] = baseMandatory.slice();

  // Compute current totals from a given allocation
  function currentDeficits(y: number[]) {
    const x = x0.map((b, i) => b + (y[i] ?? 0));
    const T = totals(x, A);
    return {
      p: Math.max(macroTarget.protein - T.p, 0),
      c: Math.max(macroTarget.carbo - T.c, 0),
      f: Math.max(macroTarget.fat - T.f, 0),
    };
  }

  // Pack a single macro using best-density-first, respecting remaining per-ingredient capacity
  function packMacro(
    y: number[],
    deficit: number,
    macroPick: (i: number) => number,
    seedOrder: number[]
  ) {
    if (deficit <= 0) return;
    // Sort seed order by macro density descending
    const idx = [...seedOrder]
      .filter(i => macroPick(i) > 0 && at(hi, i) - at(y, i) > 0)
      .sort((a, b) => macroPick(b) - macroPick(a));

    let remain = deficit;
    for (const i of idx) {
      if (remain <= 0) break;
      const s = Math.max(at(steps, i), 1);
      const cap = at(hi, i) - at(y, i);
      if (cap <= 0) continue;
      const perStepGain = macroPick(i) * s;
      if (perStepGain <= 0) continue;
      const k = Math.min(Math.ceil(remain / perStepGain), Math.floor(cap / s));
      if (k <= 0) continue;
      y[i] = at(y, i) + k * s;
      remain -= perStepGain * k;
    }
  }

  function buildGreedy(seedOrder: number[]): number[] {
    const y: number[] = new Array<number>(n).fill(0);

    // Pass 1: fill protein
    const d0 = currentDeficits(y);
    packMacro(y, d0.p, i => at(A, i).p, seedOrder);

    // Pass 2: fill carbs (re-compute deficit after protein packing)
    const d1 = currentDeficits(y);
    packMacro(y, d1.c, i => at(A, i).c, seedOrder);

    // Pass 3: fill fat (re-compute deficit after carb packing)
    const d2 = currentDeficits(y);
    packMacro(y, d2.f, i => at(A, i).f, seedOrder);

    return x0.map((b, i) =>
      projectToFeasible(at(y, i), at(steps, i), at(lo, i), at(hi, i)) + b
    );
  }

  // Priority order: highest protein density first, then carbs, then fat
  function priorityOrderIndices(): number[] {
    return Array.from({ length: n }, (_, i) => i).sort((i, j) => {
      const Ai = at(A, i), Aj = at(A, j);
      const dp = Ai.p - Aj.p;
      if (Math.abs(dp) > 1e-9) return dp > 0 ? -1 : 1;
      const dc = Ai.c - Aj.c;
      if (Math.abs(dc) > 1e-9) return dc > 0 ? -1 : 1;
      const df = Ai.f - Aj.f;
      if (Math.abs(df) > 1e-9) return df > 0 ? -1 : 1;
      return 0;
    });
  }

  // Multi-scale coordinate descent: try large steps first, progressively smaller
  function refineLocal(
    xStart: number[],
    weightsQP: { wp: number; wf: number; wc: number },
    l1: number,
  ): number[] {
    const x = xStart.slice();
    const priorityOrder = priorityOrderIndices();
    const stepScales = [50, 20, 10, 5, 2, 1];
    const dirs = [1, -1];

    let T = totals(x, A);
    let bestObj = objective({ c: T.c, p: T.p, f: T.f }, macroTarget, weightsQP, l1, x);

    for (const scale of stepScales) {
      let improved = true;
      let safetyIter = 0;
      while (improved && safetyIter < 2000) {
        improved = false;
        safetyIter++;

        for (const i of priorityOrder) {
          const s = Math.max(at(steps, i), 1) * scale;
          for (const dir of dirs) {
            const cand = at(x, i) + dir * s;
            const yResid = cand - at(baseMandatory, i);
            if (yResid < at(lo, i) || yResid > at(hi, i)) continue;

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
      }
    }

    for (let i = 0; i < n; i++) {
      x[i] =
        projectToFeasible(at(x, i) - at(baseMandatory, i), at(steps, i), at(lo, i), at(hi, i)) +
        at(baseMandatory, i);
    }
    return x;
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

    return {
      total: {
        carbo: round1(t.c),
        protein: round1(t.p),
        fat: round1(t.f),
        kcal: Math.round(t.kcal),
      },
      ingredients: outIngs.filter(row => row.weight > 0),
      deviation: {
        carbo: round1(pctDev(t.c, macroTarget.carbo)),
        protein: round1(pctDev(t.p, macroTarget.protein)),
        fat: round1(pctDev(t.f, macroTarget.fat)),
      },
    };
  }

  function round1(v: number) {
    return Math.round(v * 10) / 10;
  }

  function emptyInfeasible(reason: string): Output {
    void reason;
    return {
      total: { carbo: 0, protein: 0, fat: 0, kcal: 0 },
      ingredients: ingredients.map(i => ({
        name: i.name, weight: 0, carbo: 0, protein: 0, fat: 0, kcal: 0,
      })),
      deviation: { carbo: 100, protein: 100, fat: 100 },
    };
  }

  function shuffle(arr: number[]) {
    for (let k = arr.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      const tmp = arr[k]!;
      arr[k] = arr[r]!;
      arr[r] = tmp;
    }
  }

  type TryConfig = {
    shuffle: boolean;
    weights: { wp: number; wf: number; wc: number };
    l1: number;
  };

  // Six strategies: vary carb/fat weights and randomization to escape local minima
  const tries: TryConfig[] = [
    { shuffle: false, weights: { wp: WP, wc: WC,       wf: WF       }, l1: 1e-4 },
    { shuffle: true,  weights: { wp: WP, wc: WC,       wf: WF       }, l1: 2e-4 },
    { shuffle: true,  weights: { wp: WP, wc: WC * 1.5, wf: WF * 0.5 }, l1: 2e-4 },
    { shuffle: true,  weights: { wp: WP, wc: WC * 0.5, wf: WF * 1.5 }, l1: 2e-4 },
    { shuffle: true,  weights: { wp: WP, wc: WC,       wf: WF       }, l1: 1e-3 },
    { shuffle: false, weights: { wp: WP, wc: WC * 2,   wf: WF * 2   }, l1: 5e-4 },
  ];

  let bestOutput: Output | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const cfg of tries) {
    const seedOrder: number[] = Array.from({ length: n }, (_, i) => i);
    if (cfg.shuffle) shuffle(seedOrder);

    const xGreedy = buildGreedy(seedOrder);

    // Light random jitter on shuffled tries
    if (cfg.shuffle) {
      for (let i = 0; i < n; i++) {
        if (at(hi, i) <= 0) continue;
        const s = Math.max(at(steps, i), 1);
        const jitter = (Math.random() < 0.3 ? 1 : 0) * (Math.random() < 0.5 ? -s : s);
        const yCand = clamp(
          at(xGreedy, i) + jitter,
          at(baseMandatory, i) + at(lo, i),
          at(baseMandatory, i) + at(hi, i)
        );
        xGreedy[i] =
          projectToFeasible(yCand - at(baseMandatory, i), at(steps, i), at(lo, i), at(hi, i)) +
          at(baseMandatory, i);
      }
    }

    const xRefined = refineLocal(xGreedy, cfg.weights, cfg.l1);

    const Tfin = totals(xRefined, A);
    const score = objective(
      { c: Tfin.c, p: Tfin.p, f: Tfin.f },
      macroTarget,
      cfg.weights,
      cfg.l1,
      xRefined
    );
    const out = buildOutput(xRefined);

    if (!bestOutput || score < bestScore) {
      bestScore = score;
      bestOutput = out;
    }

    const withinTolerance =
      Math.abs(out.deviation.carbo) <= tolerancePct &&
      Math.abs(out.deviation.protein) <= tolerancePct &&
      Math.abs(out.deviation.fat) <= tolerancePct;

    if (withinTolerance) return out;
  }

  // Return best result found — deviations are visible in output.deviation
  return bestOutput!;
}
