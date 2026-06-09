import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';
import { OrdersService } from '../services/orders.service';
import { UserDocument } from '@/users/schemas/user.schema';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

// Minimal shape for order creation body
interface CreateOrderBody {
  orderItems: {
    productId: string;
    name: string;
    qty: number;
    image: string;
    price: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
}

// Payment result from Stripe/PayPal webhook
interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Body() body: CreateOrderBody,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ordersService.create(body, user._id.toString());
  }

  @UseGuards(AdminGuard)
  @Get()
  async getOrders() {
    return this.ordersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('myorders')
  async getUserOrders(@CurrentUser() user: UserDocument) {
    return this.ordersService.findUserOrders(user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/pay')
  async updateOrderPayment(
    @Param('id') id: string,
    @Body() { paymentResult }: { paymentResult: PaymentResult },
  ) {
    return this.ordersService.updatePaid(id, paymentResult);
  }

  @UseGuards(AdminGuard)
  @Put(':id/deliver')
  async updateOrderDelivery(@Param('id') id: string) {
    return this.ordersService.updateDelivered(id);
  }
}