import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/services/cloudinary.service';

@Injectable()
export class AppService {
  constructor(private cloudinary: CloudinaryService) {}

  async uploadImageToCloudinary(file: Express.Multer.File) {
    const result = await this.cloudinary.uploadImage(file).catch((err) => {
      console.error('Cloudinary upload failure:', err);
      throw new BadRequestException(err instanceof Error ? err.message : 'Cloudinary upload failed.');
    });

    return result.secure_url;
  }
}