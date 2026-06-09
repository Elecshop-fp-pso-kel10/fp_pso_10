import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from '../services/cart.service';

const mockCartService = {
  getCart: jest.fn(),
  addCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  updateCartItemQty: jest.fn(),
  clearCart: jest.fn(),
  validateShippingDetails: jest.fn(),
  validatePaymentMethod: jest.fn(),
};

describe('CartController', () => {
  let controller: CartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: mockCartService },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});