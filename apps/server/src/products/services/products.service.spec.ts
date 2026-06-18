import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { Product } from '../schemas/product.schema';
import { Order } from '../../orders/schemas/order.schema';

// Minimal Mongoose model mock — only the methods ProductsService uses
const mockProductModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  insertMany: jest.fn(),
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
};

const mockOrderModel = {
  findOne: jest.fn(),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByFilters', () => {
    type FindByFiltersArgs = Parameters<typeof service.findByFilters>[0];

    const buildQueryChain = (resolvedValue: unknown = []) => ({
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(resolvedValue),
    });
    
    const expectedQueryFor = (filters: FindByFiltersArgs): Record<string, unknown> => {
      const { brand, category, minPrice, maxPrice, keywords } = filters;
      const query: Record<string, unknown> = {};

      if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
      }

      if (category) {
        query.category = { $regex: category, $options: 'i' };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        const price: Record<string, number> = {};
        if (minPrice !== undefined) price.$gte = minPrice;
        if (maxPrice !== undefined) price.$lte = maxPrice;
        query.price = price;
      }

      if (keywords) {
        const terms = keywords.split(' ').filter(Boolean);
        query.$and = terms.map(term => ({
          $or: [
            { name: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
          ],
        }));
      }
      return query;
    };

    const candidateFilters: Array<Partial<FindByFiltersArgs>> = [
      { brand: 'LG' },
      { category: 'Electronics' },
      { minPrice: 100 },
      { maxPrice: 500 },
      { keywords: '16 inch 120Hz' },
    ];

    const powerSet = <T>(items: T[]): T[][] =>
      items.reduce<T[][]>(
        (subsets, item) => subsets.concat(subsets.map(subset => [...subset, item])),
        [[]],
      );

    const generatedCases: FindByFiltersArgs[] = powerSet(candidateFilters).map(combo =>
      combo.reduce<FindByFiltersArgs>((merged, partial) => ({ ...merged, ...partial }), {}),
    );

    test.each(generatedCases)(
      'builds the correct query for filters: %j',
      async filters => {
        const chain = buildQueryChain();
        mockProductModel.find.mockReturnValue(chain);

        await service.findByFilters(filters);

        expect(mockProductModel.find).toHaveBeenCalledWith(expectedQueryFor(filters));
      },
    );

    const limitCases = [undefined, 1, 3, 10, 20, 50];

    test.each(limitCases)('applies limit=%s correctly (defaulting to 10)', async limit => {
      const chain = buildQueryChain();
      mockProductModel.find.mockReturnValue(chain);

      await service.findByFilters({ brand: 'LG', limit });

      expect(chain.limit).toHaveBeenCalledWith(limit ?? 10);
    });

    it('returns whatever documents the query resolves with', async () => {
      const fakeProducts = [{ _id: '1', name: 'LG Monitor' }, { _id: '2', name: 'LG TV' }];
      const chain = buildQueryChain(fakeProducts);
      mockProductModel.find.mockReturnValue(chain);

      const result = await service.findByFilters({ brand: 'LG' });

      expect(result).toEqual(fakeProducts);
    });
  });
});