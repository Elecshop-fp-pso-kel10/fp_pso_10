'use server';

import { productSchema } from '../validation/product';
import { revalidatePath } from 'next/cache';
import { fetchWithAuth } from '@/lib/fetch-with-auth';

export interface ProductResponseState {
  data?: {
    title: string;
    description: string;
  };
  error?: {
    title: string;
    description: string;
  };
}

export async function createProduct(
  formState: ProductResponseState,
  formData: FormData,
): Promise<ProductResponseState> {
  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: Number(formData.get('price')),
    brand: formData.get('brand') as string,
    category: formData.get('category') as string,
    countInStock: Number(formData.get('countInStock')),
  };

  const validationSchema = productSchema.omit({ images: true, brandLogo: true });
  const result = validationSchema.safeParse(data);

  if (!result.success) {
    return {
      error: {
        title: 'Validation Error',
        description: result.error.message,
      },
    };
  }

  if (!formData.getAll('images').length) {
    return {
      error: {
        title: 'Validation Error',
        description: 'At least one image is required',
      },
    };
  }

  if (!formData.get('brandLogo')) {
    return {
      error: {
        title: 'Validation Error',
        description: 'Brand logo is required',
      },
    };
  }

  try {
    const response = await fetchWithAuth('/products', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json() as { message?: string };
      return {
        error: {
          title: 'Error',
          description: errorBody.message || 'Failed to create product',
        },
      };
    }

    revalidatePath('/admin/products');

    return {
      data: {
        title: 'Success',
        description: 'Product created successfully',
      },
    };
  } catch (err: unknown) {  // was: error: any
    const message =
      err instanceof Error ? err.message : 'Failed to create product';
    return {
      error: {
        title: 'Error',
        description: message,
      },
    };
  }
}