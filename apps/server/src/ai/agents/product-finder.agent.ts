import { Injectable } from '@nestjs/common';
import { convertToCoreMessages, Message, streamText, tool } from 'ai';
import { z } from 'zod';
import { AiConfigService } from '../services/ai-config.service';
import { ProductSearchTool } from '../tools/product-search.tool';

@Injectable()
export class ProductFinderAgent {
    constructor(
        private aiConfig: AiConfigService,
        private productSearchTool: ProductSearchTool,
    ) {}

    async chat(messages: Message[]) {
        const coreMessages = convertToCoreMessages(messages).filter(
            message => message.content.length > 0,
        );

        const systemPrompt = `
            You are a friendly shopping assistant helping customers find products in our electronics store.

            Guidelines:
            - Ask clarifying questions before searching if the request is vague (e.g. ask about brand, budget, or key specs like screen size or refresh rate for monitors).
            - Once you have at least one useful filter (brand, category, price range, or keywords), call searchProducts.
            - When the user adds more constraints (budget, size, refresh rate, etc.), call searchProducts again with the refined filters — don't ask them to repeat earlier answers.
            - Extract specs like "16 inches" or "120Hz" into the keywords field so they can match against product descriptions.
            - Keep responses concise and friendly. Use markdown sparingly.
            - If no products match, suggest loosening a constraint (e.g. budget or brand) rather than just saying "no results."
        `;

        const result = streamText({
            model: this.aiConfig.getModel(),
            system: systemPrompt,
            messages: coreMessages,
            tools: {
                searchProducts: tool({
                    description:
                        'Search for products by brand, category, price range, and/or keywords (e.g. specs like screen size, refresh rate)',
                    parameters: z.object({
                        brand: z.string().optional().describe('Brand name, e.g. LG, Samsung'),
                        category: z.string().optional().describe('Product category, e.g. Electronics, Computers'),
                        minPrice: z.number().optional().describe('Minimum price in USD'),
                        maxPrice: z.number().optional().describe('Maximum price in USD'),
                        keywords: z
                            .string()
                            .optional()
                            .describe('Space-separated spec keywords, e.g. "16 inch 120Hz"'),
                    }),
                    execute: async (filters) => {
                        return this.productSearchTool.search(filters);
                    },
                }),
            },
        maxSteps: 5,
        });

        return result;
    }
}