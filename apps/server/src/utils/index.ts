// Multer file filter for image uploads
// req typed as Express.Request, file as Express.Multer.File,
// cb as multer's FileFilterCallback
export const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};