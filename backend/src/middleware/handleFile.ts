import sharp from 'sharp';
import fs from 'fs-extra';
import { asyncHandler } from './async';

const handleHelper = async (filename: string, path: string): Promise<string> => {
  const newFileUploadPath: string = path.split('.').fill('.webp', -1).join('');
  const newFilename: string = filename.split('.').fill('.webp', -1).join('');

  await sharp(path).webp({ quality: 80 }).toFile(newFileUploadPath);

  fs.unlinkSync(path);

  return newFilename;
};

const handleFile = asyncHandler(async (req, res, next) => {
  const files = req.files || [req.file];

  // @ts-expect-error File type from multer doesn't match exact type definition but contains required properties
  for (const file of files) {
    const { filename, path } = file;
    file.filename = await handleHelper(filename, path);
  }

  next();
});

export default handleFile;
