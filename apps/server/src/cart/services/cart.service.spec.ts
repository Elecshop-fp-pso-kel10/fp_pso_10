import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { Cart } from '../schemas/cart.schema';
import { ProductsService } from '../../products/services/products.service';

const mockCartModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
};

const mockProductsService = {
  findById: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: mockCartModel,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});