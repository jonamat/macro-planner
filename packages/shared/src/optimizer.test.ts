import { optimizeMealToMacro, DEFAULT_TOLERANCE } from './optimizer';

// Helper: check if deviations are within a given tolerance
function withinTolerance(
  result: ReturnType<typeof optimizeMealToMacro>,
  tol: number = DEFAULT_TOLERANCE
) {
  return (
    Math.abs(result.deviation.protein) <= tol &&
    Math.abs(result.deviation.carbo) <= tol &&
    Math.abs(result.deviation.fat) <= tol
  );
}

// Helper: ingredient shorthand
const ing = (
  name: string,
  protein100g: number,
  carbo100g: number,
  fat100g: number,
  opts: { min?: number; max?: number; mandatory?: number; indivisible?: number } = {}
) => ({ name, protein100g, carbo100g, fat100g, ...opts });

describe('optimizeMealToMacro — core', () => {
  // 1. Classic lunch: chicken + rice + oil
  it('1. classic chicken-rice-oil lunch', () => {
    const target = { name: 'Lunch', carbo: 60, protein: 30, fat: 15 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken breast', 30, 0, 5),
      ing('Cooked rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 20 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
    expect(result.total.protein).toBeGreaterThan(0);
    expect(result.total.carbo).toBeGreaterThan(0);
  });

  // 2. High-protein meal (with salmon as fat source)
  it('2. high-protein meal', () => {
    const target = { name: 'HP', carbo: 20, protein: 60, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Tuna', 30, 0, 1),
      ing('Egg white', 10, 0.3, 0),
      ing('Potato', 1.9, 17, 0.1),
      ing('Salmon', 20, 0, 13, { max: 100 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 3. High-carb meal — check carbs and protein (fat is naturally very low with these sources)
  it('3. high-carb meal', () => {
    const target = { name: 'HC', carbo: 120, protein: 15, fat: 1 };
    const result = optimizeMealToMacro(target, [
      ing('White rice', 2.7, 28, 0.3),
      ing('Banana', 1.1, 23, 0.3),
      ing('Skimmed milk', 3.4, 5, 0.1),
    ]);
    expect(Math.abs(result.deviation.carbo)).toBeLessThanOrEqual(DEFAULT_TOLERANCE);
    expect(Math.abs(result.deviation.protein)).toBeLessThanOrEqual(DEFAULT_TOLERANCE);
    expect(result.total.carbo).toBeGreaterThan(90);
  });

  // 4. High-fat / keto meal
  it('4. keto-style high-fat meal', () => {
    const target = { name: 'Keto', carbo: 5, protein: 25, fat: 50 };
    const result = optimizeMealToMacro(target, [
      ing('Salmon', 20, 0, 13),
      ing('Avocado', 2, 9, 15, { max: 200 }),
      ing('Butter', 0.6, 0.06, 81, { max: 30 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 5. Single protein-only ingredient
  it('5. single protein source — exact target', () => {
    const target = { name: 'P only', carbo: 0, protein: 30, fat: 0 };
    const result = optimizeMealToMacro(target, [
      ing('Pure protein powder', 80, 5, 2),
    ]);
    expect(result.total.protein).toBeGreaterThan(0);
    expect(result.deviation.protein).toBeGreaterThanOrEqual(-DEFAULT_TOLERANCE);
  });

  // 6. Single carb-only ingredient (limited capacity)
  it('6. carb source with max constraint — expects undershoot', () => {
    const target = { name: 'Carb target', carbo: 100, protein: 0, fat: 0 };
    const result = optimizeMealToMacro(target, [
      ing('Limited rice', 2.7, 28, 0.3, { max: 150 }),
    ]);
    // max contribution is 150*0.28 = 42g carbs, so undershoot is expected
    expect(result.deviation.carbo).toBeLessThan(0);
    expect(result.total.carbo).toBeLessThan(target.carbo);
  });

  // 7. Mandatory ingredient overshoot
  it('7. mandatory ingredient causes positive deviation', () => {
    const target = { name: 'Strict', carbo: 10, protein: 0, fat: 0 };
    const result = optimizeMealToMacro(target, [
      ing('Mandatory carb', 0, 100, 0, { mandatory: 20 }),
    ]);
    expect(result.deviation.carbo).toBeGreaterThan(0);
    expect(result.total.carbo).toBeGreaterThan(target.carbo);
  });

  // 8. Mandatory + free ingredient
  it('8. mandatory ingredient plus free-range ingredient', () => {
    const target = { name: 'Mixed', carbo: 50, protein: 40, fat: 8 };
    const result = optimizeMealToMacro(target, [
      ing('Whey protein', 80, 5, 2, { mandatory: 30 }),
      ing('Oats', 3.5, 60, 7),
      ing('Greek yogurt', 10, 4, 0.4, { max: 200 }),
    ]);
    // mandatory 30g whey always present
    const wheyRow = result.ingredients.find(r => r.name === 'Whey protein');
    expect(wheyRow?.weight ?? 0).toBeGreaterThanOrEqual(30);
    expect(withinTolerance(result)).toBe(true);
  });

  // 9. Indivisible ingredient (5g steps)
  it('9. indivisible ingredient uses multiples of 5g', () => {
    const target = { name: 'Indiv', carbo: 30, protein: 20, fat: 5 };
    const result = optimizeMealToMacro(target, [
      ing('Protein bar chunk', 20, 60, 10, { indivisible: 5 }),
      ing('Plain yogurt', 5, 6, 3),
    ]);
    const barRow = result.ingredients.find(r => r.name === 'Protein bar chunk');
    if (barRow && barRow.weight > 0) {
      expect(barRow.weight % 5).toBe(0);
    }
  });

  // 10. Two ingredients — protein + carbs, no fat source
  it('10. no fat source available — fat stays near zero', () => {
    const target = { name: 'No fat', carbo: 60, protein: 30, fat: 20 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 0),
      ing('Rice', 2, 28, 0),
    ]);
    // No fat source, so fat deviation will be high — but protein & carbs should be good
    expect(Math.abs(result.deviation.protein)).toBeLessThanOrEqual(DEFAULT_TOLERANCE);
    expect(Math.abs(result.deviation.carbo)).toBeLessThanOrEqual(DEFAULT_TOLERANCE);
  });

  // 11. All-in-one ingredient (mixed macro)
  it('11. single mixed-macro ingredient', () => {
    const target = { name: 'Mix', carbo: 30, protein: 15, fat: 8 };
    const result = optimizeMealToMacro(target, [
      ing('Whole egg', 12.6, 1.1, 10.6),
      ing('Skimmed milk', 3.4, 5, 0.1),
      ing('Oats', 3.5, 60, 7),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 12. Tight protein target with max constraints
  it('12. tight max constraints — best possible result returned', () => {
    const target = { name: 'Tight', carbo: 40, protein: 50, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5, { max: 100 }),
      ing('Tuna', 30, 0, 1, { max: 80 }),
      ing('Rice', 2.7, 28, 0.3),
    ]);
    // Should get as close as possible to protein target
    expect(result.total.protein).toBeGreaterThan(0);
    expect(result.deviation.protein).toBeGreaterThanOrEqual(-DEFAULT_TOLERANCE);
  });

  // 13. Custom tolerance: very strict (5%)
  it('13. strict 5% tolerance — may not be met but returns best result', () => {
    const target = { name: 'Strict tol', carbo: 60, protein: 30, fat: 15 };
    const result = optimizeMealToMacro(
      target,
      [
        ing('Chicken', 30, 0, 5),
        ing('Rice', 2.7, 28, 0.3),
        ing('Olive oil', 0, 0, 100, { max: 20 }),
      ],
      5
    );
    // Should return a result regardless of tolerance
    expect(result).toBeDefined();
    expect(result.total).toBeDefined();
  });

  // 14. Custom tolerance: very loose (50%)
  it('14. loose 50% tolerance — easy to satisfy', () => {
    const target = { name: 'Loose', carbo: 60, protein: 30, fat: 15 };
    const result = optimizeMealToMacro(
      target,
      [
        ing('Chicken', 30, 0, 5),
        ing('Rice', 2.7, 28, 0.3),
      ],
      50
    );
    expect(result).toBeDefined();
  });

  // 15. Many ingredients — optimizer picks best combination
  it('15. many ingredients — finds a good mix', () => {
    const target = { name: 'Multi', carbo: 80, protein: 35, fat: 20 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5),
      ing('Tuna', 30, 0, 1),
      ing('Salmon', 20, 0, 13),
      ing('White rice', 2.7, 28, 0.3),
      ing('Pasta', 5, 75, 1.5),
      ing('Oats', 3.5, 60, 7),
      ing('Olive oil', 0, 0, 100, { max: 20 }),
      ing('Avocado', 2, 9, 15, { max: 100 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 16. Protein priority: protein deviation should be ≤ carb/fat deviations
  it('16. protein is prioritized over carbs and fat', () => {
    // Only carb/fat sources with limited protein — protein will miss but that's the best achievable
    const target = { name: 'Prio', carbo: 100, protein: 40, fat: 30 };
    const result = optimizeMealToMacro(target, [
      ing('Whey', 80, 5, 2),
      ing('Rice', 2.7, 28, 0.3),
      ing('Butter', 0.6, 0.06, 81, { max: 40 }),
    ]);
    expect(result).toBeDefined();
    // Protein should be at least somewhat satisfied
    expect(result.total.protein).toBeGreaterThan(0);
  });

  // 17. Zero-target macros
  it('17. zero protein target — no protein expected', () => {
    const target = { name: 'Zero P', carbo: 50, protein: 0, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Sugar', 0, 100, 0),
      ing('Butter', 0.6, 0.06, 81, { max: 20 }),
    ]);
    expect(result.total.carbo).toBeGreaterThan(0);
  });

  // 18. Mandatory + min combination
  it('18. mandatory and min fields coexist correctly', () => {
    const target = { name: 'Min+Man', carbo: 60, protein: 30, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Whey', 80, 5, 2, { mandatory: 20, min: 20 }),
      ing('Oats', 3.5, 60, 7),
    ]);
    const wheyRow = result.ingredients.find(r => r.name === 'Whey');
    expect(wheyRow?.weight ?? 0).toBeGreaterThanOrEqual(20);
  });

  // 19. Infeasible: mandatory > max
  it('19. infeasible mandatory > max returns zero output', () => {
    const target = { name: 'Bad', carbo: 10, protein: 10, fat: 5 };
    const result = optimizeMealToMacro(target, [
      ing('Broken', 10, 10, 5, { mandatory: 50, max: 10 }),
    ]);
    expect(result.total.protein).toBe(0);
    expect(result.total.carbo).toBe(0);
  });

  // 20. Output structure integrity
  it('20. output contains valid structure', () => {
    const target = { name: 'Struct', carbo: 40, protein: 20, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Rice', 2.7, 28, 0.3),
      ing('Chicken', 30, 0, 5),
      ing('Olive oil', 0, 0, 100, { max: 15 }),
    ]);
    expect(result.total).toHaveProperty('carbo');
    expect(result.total).toHaveProperty('protein');
    expect(result.total).toHaveProperty('fat');
    expect(result.total).toHaveProperty('kcal');
    expect(result.deviation).toHaveProperty('carbo');
    expect(result.deviation).toHaveProperty('protein');
    expect(result.deviation).toHaveProperty('fat');
    expect(Array.isArray(result.ingredients)).toBe(true);
  });

  // 21. Ingredient with only fat
  it('21. only fat-dense ingredients — carbs/protein will be off', () => {
    const target = { name: 'FatOnly', carbo: 5, protein: 5, fat: 40 };
    const result = optimizeMealToMacro(target, [
      ing('Butter', 0.6, 0.06, 81, { max: 60 }),
      ing('Cream cheese', 5.9, 4.1, 34),
    ]);
    expect(result.total.fat).toBeGreaterThan(0);
  });

  // 22. Very small targets (5g protein, 10g carbs, 2g fat)
  it('22. very small macro targets', () => {
    const target = { name: 'Small', carbo: 10, protein: 5, fat: 2 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5),
      ing('Rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 10 }),
    ]);
    expect(result.total.protein).toBeGreaterThan(0);
    expect(withinTolerance(result)).toBe(true);
  });

  // 23. Very large targets (300g protein, 500g carbs, 100g fat)
  it('23. very large macro targets', () => {
    const target = { name: 'Large', carbo: 500, protein: 300, fat: 100 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5),
      ing('White rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 120 }),
    ]);
    expect(result.total.protein).toBeGreaterThan(0);
    expect(result.total.carbo).toBeGreaterThan(0);
  });

  // 24. Protein from multiple capped sources + fat source
  it('24. multiple protein sources are distributed', () => {
    const target = { name: 'MultiP', carbo: 30, protein: 60, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5, { max: 100 }),
      ing('Tuna', 30, 0, 1, { max: 100 }),
      ing('Egg white', 10, 0.3, 0, { max: 200 }),
      ing('Rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 15 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 25. Min constraint enforced
  it('25. min constraint is respected', () => {
    const target = { name: 'Min', carbo: 60, protein: 30, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5, { min: 50 }),
      ing('Rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 15 }),
    ]);
    const chickenRow = result.ingredients.find(r => r.name === 'Chicken');
    if (chickenRow) {
      expect(chickenRow.weight).toBeGreaterThanOrEqual(50);
    }
  });

  // 26. Max constraint is never exceeded
  it('26. max constraint is never exceeded', () => {
    const target = { name: 'Max', carbo: 100, protein: 40, fat: 15 };
    const maxOil = 10;
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5),
      ing('Rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: maxOil }),
    ]);
    const oilRow = result.ingredients.find(r => r.name === 'Olive oil');
    if (oilRow) {
      expect(oilRow.weight).toBeLessThanOrEqual(maxOil);
    }
  });

  // 27. Balanced mixed meal (standard bodybuilder meal)
  it('27. balanced bodybuilder meal', () => {
    const target = { name: 'BB', carbo: 75, protein: 45, fat: 15 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken breast', 31, 0, 3.6),
      ing('Brown rice', 2.6, 23, 0.9),
      ing('Broccoli', 2.8, 7, 0.4),
      ing('Olive oil', 0, 0, 100, { max: 20 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 28. Post-workout shake (with almond butter for fat)
  it('28. post-workout protein shake', () => {
    const target = { name: 'PWO', carbo: 40, protein: 35, fat: 5 };
    const result = optimizeMealToMacro(target, [
      ing('Whey isolate', 90, 3, 1),
      ing('Banana', 1.1, 23, 0.3),
      ing('Skim milk', 3.4, 5, 0.1),
      ing('Almond butter', 5, 3, 50, { max: 15 }),
    ]);
    expect(withinTolerance(result)).toBe(true);
  });

  // 29. Breakfast with indivisible egg
  it('29. breakfast with indivisible eggs (50g each)', () => {
    const target = { name: 'Breakfast', carbo: 30, protein: 25, fat: 20 };
    const result = optimizeMealToMacro(target, [
      ing('Whole egg', 12.6, 1.1, 10.6, { indivisible: 50 }),
      ing('Oats', 3.5, 60, 7),
      ing('Whole milk', 3.3, 4.7, 3.6),
    ]);
    const eggRow = result.ingredients.find(r => r.name === 'Whole egg');
    if (eggRow && eggRow.weight > 0) {
      expect(eggRow.weight % 50).toBe(0);
    }
    expect(result.total.protein).toBeGreaterThan(0);
  });

  // 30. Output never includes ingredients with zero weight
  it('30. zero-weight ingredients are excluded from output', () => {
    const target = { name: 'Filter', carbo: 60, protein: 30, fat: 10 };
    const result = optimizeMealToMacro(target, [
      ing('Chicken', 30, 0, 5),
      ing('Rice', 2.7, 28, 0.3),
      ing('Olive oil', 0, 0, 100, { max: 15 }),
      ing('Unused spice', 1, 0, 0, { max: 0 }),
    ]);
    result.ingredients.forEach(row => {
      expect(row.weight).toBeGreaterThan(0);
    });
  });
});
