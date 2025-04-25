const { Image } = require('../models');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto'); // For generating unique names

// Configure storage paths (adjust as needed)
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'images');
const TMP_UPLOAD_DIR = path.join(__dirname, '..', 'tmp_uploads');
const THUMBNAIL_DIR = path.join(
  __dirname,
  '..',
  'public',
  'uploads',
  'thumbnails'
);
const PUBLIC_IMAGE_PATH = '/uploads/images/';
const PUBLIC_THUMBNAIL_PATH = '/uploads/thumbnails/';

// Ensure directories exist
const ensureDirs = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
    await fs.mkdir(TMP_UPLOAD_DIR, { recursive: true });
    console.log('Upload directories ensured.');
  } catch (err) {
    console.error('Error creating upload directories:', err);
  }
};
ensureDirs();

// GET /admin/images - Display manage images page
exports.listImages = async (req, res, next) => {
  try {
    // Placeholder: Fetch images from DB later
    const images = await Image.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/manage-images', {
      pageTitle: 'Manage Images',
      images: images,
      layout: 'layouts/admin', // Assuming an admin layout
    });
  } catch (error) {
    console.error('Error listing images:', error);
    next(error);
  }
};

// GET /admin/images/new - Display upload form
exports.showUploadForm = (req, res) => {
  res.render('admin/upload-image', {
    pageTitle: 'Upload New Image',
    errors: [], // Pass empty errors array initially
    layout: 'layouts/admin',
  });
};

// POST /admin/images - Handle image upload
exports.uploadImage = async (req, res, next) => {
  // --- Implementation pending: Multer config, Sharp processing, DB save ---
  console.log('File received:', req.file); // Log received file info from multer
  if (!req.file) {
    return res.status(400).render('admin/upload-image', {
      pageTitle: 'Upload New Image',
      errors: [{ msg: 'Please select an image file to upload.' }],
      layout: 'layouts/admin',
    });
  }

  try {
    const originalName = req.file.originalname;
    const fileExtension = path.extname(originalName);
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const uniqueFilename = `${uniqueSuffix}${fileExtension}`;
    const uniqueThumbnailFilename = `${uniqueSuffix}_thumb${fileExtension}`;

    const imagePath = path.join(UPLOAD_DIR, uniqueFilename);
    const thumbnailPath = path.join(THUMBNAIL_DIR, uniqueThumbnailFilename);

    // 1. Save original file (Multer should have done this if using diskStorage)
    // If using memoryStorage, save buffer:
    // await fs.writeFile(imagePath, req.file.buffer);

    // 2. Create Thumbnail using Sharp
    await sharp(req.file.path) // Use req.file.path if using multer.diskStorage
      .resize(150, 150) // Adjust thumbnail size as needed
      .toFile(thumbnailPath);

    // 2.5 Rename the original uploaded file to the unique filename
    await fs.rename(req.file.path, imagePath);
    console.log(`Renamed uploaded file to: ${imagePath}`);

    // 3. Save info to Database
    const newImage = await Image.create({
      filename: uniqueFilename,
      originalName: originalName,
      thumbnailFilename: uniqueThumbnailFilename,
      path: PUBLIC_IMAGE_PATH + uniqueFilename,
      thumbnailPath: PUBLIC_THUMBNAIL_PATH + uniqueThumbnailFilename,
    });

    console.log('Image saved to DB:', newImage);
    req.flash('success_msg', 'Image uploaded successfully!');
    res.redirect('/admin/images');
  } catch (error) {
    console.error('Error processing upload:', error);
    // Clean up uploaded file if error occurs after upload but before DB save?
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error cleaning up uploaded file:', unlinkErr);
      }
    }
    // Clean up thumbnail if it was created before error
    // ... (add thumbnail cleanup if necessary)

    res.status(500).render('admin/upload-image', {
      pageTitle: 'Upload New Image',
      errors: [{ msg: 'Error uploading image. Please try again.' }],
      layout: 'layouts/admin',
    });
  }
};

// DELETE /admin/images/:id - Delete an image
exports.deleteImage = async (req, res, next) => {
  const imageId = req.params.id;
  try {
    const image = await Image.findByPk(imageId);
    if (!image) {
      req.flash('error_msg', 'Image not found.');
      return res.redirect('/admin/images');
    }

    // Construct full paths
    const fullImagePath = path.join(__dirname, '..', 'public', image.path);
    const fullThumbnailPath = path.join(
      __dirname,
      '..',
      'public',
      image.thumbnailPath
    );

    // Delete files from server
    await fs.unlink(fullImagePath);
    await fs.unlink(fullThumbnailPath);

    // Delete record from DB
    await image.destroy();

    req.flash('success_msg', 'Image deleted successfully.');
    res.redirect('/admin/images');
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    if (error.code === 'ENOENT') {
      // File not found error
      console.warn(
        `File not found during deletion for image ${imageId}, proceeding to delete DB record.`
      );
      // If file doesn't exist, maybe still delete the DB record?
      try {
        const image = await Image.findByPk(imageId);
        if (image) await image.destroy();
        req.flash('success_msg', 'Image record deleted (file was missing).');
        return res.redirect('/admin/images');
      } catch (dbErr) {
        console.error(
          `Error deleting DB record for image ${imageId} after file not found:`,
          dbErr
        );
        next(dbErr); // Pass DB error to error handler
      }
    } else {
      req.flash('error_msg', 'Error deleting image.');
      res.redirect('/admin/images');
    }
  }
};
