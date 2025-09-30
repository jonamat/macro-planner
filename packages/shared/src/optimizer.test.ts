import { optimizeMealToMacro } from './optimizer';

describe('optimizeMealToMacro', () => {
  it('returns totals close to target macros', () => {
    const target = { name: 'Lunch', carbo: 60, protein: 30, fat: 15 };
    const ingredients: Parameters<typeof optimizeMealToMacro>[1] = [
      { name: 'Chicken breast', carbo100g: 0, protein100g: 30, fat100g: 5 },
      { name: 'Cooked rice', carbo100g: 28, protein100g: 2.7, fat100g: 0.3 },
      { name: 'Olive oil', carbo100g: 0, protein100g: 0, fat100g: 100, max: 10 }
    ];

    const result = optimizeMealToMacro(target, ingredients);

    expect(result.total.carbo).toBeGreaterThan(0);
    expect(result.total.protein).toBeGreaterThan(0);
    expect(result.total.fat).toBeGreaterThan(0);

    expect(result.total.carbo).toBeCloseTo(target.carbo, 0);
    expect(result.total.protein).toBeCloseTo(target.protein, 0);
    expect(result.total.fat).toBeCloseTo(target.fat, 0);
  });

  it('produces negative deviation when totals fall short of the target', () => {
    const target = { name: 'Carb target', carbo: 20, protein: 0, fat: 0 };
    const ingredients: Parameters<typeof optimizeMealToMacro>[1] = [
      {
        name: 'Limited carb source',
        carbo100g: 10,
        protein100g: 0,
        fat100g: 0,
        max: 150
      }
    ];

    const result = optimizeMealToMacro(target, ingredients);

    expect(result.deviation.carbo).toBeLessThan(0);
    expect(result.total.carbo).toBeLessThan(target.carbo);
  });

  it('produces positive deviation when mandatory weight exceeds the target', () => {
    const target = { name: 'Strict target', carbo: 10, protein: 0, fat: 0 };
    const ingredients: Parameters<typeof optimizeMealToMacro>[1] = [
      {
        name: 'Mandatory carb',
        carbo100g: 100,
        protein100g: 0,
        fat100g: 0,
        mandatory: 12
      }
    ];

    const result = optimizeMealToMacro(target, ingredients);

    expect(result.deviation.carbo).toBeGreaterThan(0);
    expect(result.total.carbo).toBeGreaterThan(target.carbo);
  });
});
