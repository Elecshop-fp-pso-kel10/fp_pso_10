import { Injectable } from '@nestjs/common';
import { ProductsService } from '@/products/services/products.service';

@Injectable()
export class ProductSearchTool {
    constructor(private productsService: ProductsService) {}

    async search(filters: {
        brand?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        keywords?: string;
    }) {
        const products = await this.productsService.findByFilters({
            ...filters,
            limit: 8,
        });

        return {
            count: products.length,
            products: products.map(p => ({
                id: p._id.toString(),
                name: p.name,
                brand: p.brand,
                price: p.price,
                image: p.images[0],
                description: p.description,
            })),
        };
    }
}