import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (
  _: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Accept image files only
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed"));
  }
};

// Configure upload with file size limits
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
