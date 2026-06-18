import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

export class ProductDto {
  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsString()
  brand!: string;

  @IsString()
  @IsOptional()
  brandLogo?: string;

  @IsString()
  category!: string;

  @IsNumber()
  countInStock!: number;
}
