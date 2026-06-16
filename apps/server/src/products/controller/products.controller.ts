import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
// removed: UploadedFile (unused), FileInterceptor (unused)
import { AdminGuard } from 'src/guards/admin.guard';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { ProductDto } from '../dtos/product.dto';
import { ReviewDto } from '../dtos/review.dto';
import { ProductsService } from '../services/products.service';
import { UserDocument } from '@/users/schemas/user.schema';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AppService } from '@/app/services/app.service';
import { ProductExpertAgent } from '@/ai/agents/product-expert.agent';
import { ChatRequest } from '@apps/shared/types/agents';
import { Response } from 'express';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private appService: AppService,
    private productExpertAgent: ProductExpertAgent,
  ) {}

  @Get()
  getProducts(
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.productsService.findMany(keyword, page, limit);
  }

  @Get('topRated')
  getTopRatedProducts() {
    return this.productsService.findTopRated();
  }

  @Get(':id')
  getProduct(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.productsService.deleteOne(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'brandLogo', maxCount: 1 },
      ],
      {
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
            cb(new Error('Only image files are allowed!'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async createProduct(
    @Body() productData: Omit<ProductDto, 'images'>,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      brandLogo?: Express.Multer.File[];
    },
  ) {
    const imageFiles = files?.images || [];
    const brandLogoFiles = files?.brandLogo || [];

    if (imageFiles.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (brandLogoFiles.length === 0) {
      throw new BadRequestException('Brand logo is required');
    }

    try {
      const [imageUrls, brandLogoUrl] = await Promise.all([
        Promise.all(imageFiles.map(file => this.appService.uploadImageToCloudinary(file))),
        this.appService.uploadImageToCloudinary(brandLogoFiles[0]),
      ]);

      return this.productsService.create({
        ...productData,
        images: imageUrls,
        brandLogo: brandLogoUrl,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to process images or create product',
      );
    }
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  updateProduct(@Param('id') id: string, @Body() product: ProductDto) {
    return this.productsService.update(id, product);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/review')
  createReview(
    @Param('id') id: string,
    @Body() { rating, comment }: ReviewDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.productsService.createReview(id, user, rating, comment);
  }

  @Post('agent/chat')
  async chat(@Body() body: ChatRequest, @Res() res: Response) {
    const { messages } = body;
    const result = await this.productExpertAgent.chat(messages);
    return result.pipeDataStreamToResponse(res);
  }
}