import mealService from '../meal.service';
import { HttpError } from '../../utils/http-error';

jest.mock('../../config/prisma', () => {
  const meal = {
    findFirst: jest.fn(),
    delete: jest.fn()
  };

  return {
    __esModule: true,
    default: { meal },
    prisma: { meal }
  };
});

const prisma = jest.requireMock('../../config/prisma').default as {
  meal: {
    findFirst: jest.Mock;
    delete: jest.Mock;
  };
};

describe('MealService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a meal when found', async () => {
    prisma.meal.findFirst.mockResolvedValue({ id: 'meal-1', userId: 'user-1' });

    await mealService.delete('user-1', 'meal-1');

    expect(prisma.meal.delete).toHaveBeenCalledWith({ where: { id: 'meal-1' } });
  });

  it('throws when deleting a missing meal', async () => {
    prisma.meal.findFirst.mockResolvedValue(null);

    await expect(mealService.delete('user-1', 'missing')).rejects.toBeInstanceOf(HttpError);
    expect(prisma.meal.delete).not.toHaveBeenCalled();
  });
});
