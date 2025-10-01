import ingredientService from '../ingredient.service';
import { HttpError } from '../../utils/http-error';

jest.mock('../../config/prisma', () => {
  const ingredient = {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn()
  };

  return {
    __esModule: true,
    default: { ingredient },
    prisma: { ingredient }
  };
});

const prisma = jest.requireMock('../../config/prisma').default as {
  ingredient: {
    findMany: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    aggregate: jest.Mock;
  };
};

describe('IngredientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when max is lower than min', async () => {
    await expect(
      ingredientService.create('user-1', {
        name: 'Test',
        carbo100g: 10,
        protein100g: 5,
        fat100g: 2,
        min: 50,
        max: 40
      })
    ).rejects.toBeInstanceOf(HttpError);

    expect(prisma.ingredient.create).not.toHaveBeenCalled();
  });

  it('creates ingredient with sanitized data', async () => {
    prisma.ingredient.aggregate.mockResolvedValue({ _max: { sequence: 3 } });
    prisma.ingredient.create.mockResolvedValue({
      id: 'ing-1',
      name: 'Chicken',
      carbo100g: 0,
      protein100g: 30,
      fat100g: 3,
      min: null,
      max: null,
      mandatory: null,
      indivisible: null,
      sequence: 4
    });

    const result = await ingredientService.create('user-1', {
      name: '  Chicken  ',
      carbo100g: 0,
      protein100g: 30,
      fat100g: 3
    });

    expect(prisma.ingredient.create).toHaveBeenCalledWith({
      data: {
        name: 'Chicken',
        carbo100g: 0,
        protein100g: 30,
        fat100g: 3,
        min: null,
        max: null,
        mandatory: null,
        indivisible: null,
        sequence: 4,
        userId: 'user-1'
      }
    });

    expect(result).toEqual({
      id: 'ing-1',
      name: 'Chicken',
      carbo100g: 0,
      protein100g: 30,
      fat100g: 3,
      min: null,
      max: null,
      mandatory: null,
      indivisible: null,
      sequence: 4
    });
  });

  it('updates ingredient and allows clearing optional fields', async () => {
    prisma.ingredient.findFirst.mockResolvedValue({
      id: 'ing-1',
      name: 'Chicken',
      carbo100g: 0,
      protein100g: 30,
      fat100g: 3,
      min: 20,
      max: 100,
      mandatory: 20,
      indivisible: null,
      userId: 'user-1',
      sequence: 2
    });

    prisma.ingredient.update.mockResolvedValue({
      id: 'ing-1',
      name: 'Chicken',
      carbo100g: 0,
      protein100g: 30,
      fat100g: 3,
      min: null,
      max: 100,
      mandatory: null,
      indivisible: null,
      sequence: 1
    });

    const result = await ingredientService.update('user-1', 'ing-1', { min: null, mandatory: null, sequence: 1 });

    expect(prisma.ingredient.update).toHaveBeenCalledWith({
      where: { id: 'ing-1' },
      data: expect.objectContaining({ min: null, mandatory: null, sequence: 1 })
    });

    expect(result.min).toBeNull();
    expect(result.mandatory).toBeNull();
    expect(result.sequence).toBe(1);
  });

  it('deletes ingredient when it exists', async () => {
    prisma.ingredient.findFirst.mockResolvedValue({ id: 'ing-1', userId: 'user-1' });

    await ingredientService.delete('user-1', 'ing-1');

    expect(prisma.ingredient.delete).toHaveBeenCalledWith({ where: { id: 'ing-1' } });
  });

  it('throws when deleting missing ingredient', async () => {
    prisma.ingredient.findFirst.mockResolvedValue(null);

    await expect(ingredientService.delete('user-1', 'missing')).rejects.toBeInstanceOf(HttpError);
    expect(prisma.ingredient.delete).not.toHaveBeenCalled();
  });
});
