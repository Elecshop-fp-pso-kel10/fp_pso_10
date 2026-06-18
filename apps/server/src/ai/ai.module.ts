import { Module, forwardRef } from '@nestjs/common';
import { ImageGenerationService } from './services/image-generation.service';
import { AiConfigService } from './services/ai-config.service';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { ProductGenerationTool } from './tools/product-generation.tool';
import { ProductSearchTool } from './tools/product-search.tool';
import { ProductFinderAgent } from './agents/product-finder.agent';
import { ProductsModule } from '@/products/products.module';

@Module({
  imports: [CloudinaryModule, forwardRef(() => ProductsModule)],
  providers: [ImageGenerationService, AiConfigService, ProductGenerationTool, ProductSearchTool, ProductFinderAgent],
  exports: [ImageGenerationService, AiConfigService, ProductGenerationTool, ProductSearchTool, ProductFinderAgent],
})
export class AiModule {}
