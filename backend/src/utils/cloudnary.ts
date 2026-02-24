import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Upload image to Cloudinary
export const uploadToCloudinary = (fileBuffer: Buffer, folder = "crop"): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        if (!result) return reject(new Error("No result from Cloudinary"));
        return resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (imageUrl: string): Promise<boolean> => {
  try {
    // Parse URL and extract filename
    const parsed = new URL(imageUrl);
    const parts = parsed.pathname.split("/");
    const filename = parts[parts.length - 1];
    const publicId = `crop/${filename.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
};

export { upload };
