const express = require('express');
const router = express.Router();
const passport = require('passport');
const adminController = require('../controllers/adminController');
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require('../middleware/authMiddleware');
const imageController = require('../controllers/imageController');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const TMP_UPLOAD_DIR = path.join(__dirname, '..', 'tmp_uploads');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Keep original file temporarily, rename occurs in controller after validation/DB save
    // Use a temporary name or handle naming in the controller
    // For simplicity here, let's use original name temporarily, but controller logic assumes renaming
    cb(null, file.originalname); // Or use a temporary name
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    req.fileValidationError =
      'Only image files (jpg, jpeg, png, gif) are allowed!';
    return cb(null, false); // Reject file
  }
  cb(null, true); // Accept file
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}); // 5MB limit

// GET /admin/login - Show login page
// Use forwardAuthenticated to redirect if already logged in
router.get('/login', forwardAuthenticated, adminController.showLogin);

// POST /admin/login - Handle login attempt
router.post(
  '/login',
  forwardAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/admin/dashboard', // Redirect on successful login
    failureRedirect: '/admin/login', // Redirect back to login on failure
    failureFlash: true, // Enable flash messages for login failures (requires connect-flash setup)
  })
);

// GET /admin/logout - Handle logout
router.get('/logout', ensureAuthenticated, (req, res, next) => {
  req.logout(function (err) {
    // req.logout requires a callback
    if (err) {
      return next(err);
    }
    // req.flash('success_msg', 'You are logged out'); // Optional flash message
    res.redirect('/'); // Redirect to homepage after logout
  });
});

// GET /admin/dashboard - Example protected route
router.get('/dashboard', ensureAuthenticated, adminController.showDashboard);

// GET /admin/events - Show list of events to manage
router.get('/events', ensureAuthenticated, adminController.listEvents);

// GET /admin/events/new - Show form to create a new event (Optional)
router.get(
  '/events/new',
  ensureAuthenticated,
  adminController.showNewEventForm
);

// POST /admin/events/new - Handle creation of a new event (Optional)
router.post('/events/new', ensureAuthenticated, adminController.createEvent);

// GET /admin/events/edit/:eventId - Show form to edit an event description
router.get(
  '/events/edit/:eventId',
  ensureAuthenticated,
  adminController.showEditEventForm
);

// POST /admin/events/edit/:eventId - Handle submission of edited event description
router.post(
  '/events/edit/:eventId',
  ensureAuthenticated,
  adminController.updateEventDescription
);

// Route to list registrations for a specific event
router.get(
  '/events/:eventId/registrations',
  ensureAuthenticated,
  adminController.listEventRegistrations
);

// Route to toggle paid status of a registration
router.post(
  '/registrations/:registrationId/toggle-paid',
  ensureAuthenticated,
  adminController.toggleRegistrationPaidStatus
);

// Image Management Routes
router.get('/images', ensureAuthenticated, imageController.listImages);
router.get('/images/new', ensureAuthenticated, imageController.showUploadForm);
router.post(
  '/images',
  ensureAuthenticated,
  upload.single('imageFile'),
  imageController.uploadImage
);
router.post(
  '/images/delete/:id',
  ensureAuthenticated,
  imageController.deleteImage
);

// --- Simple Admin User Creation (REMOVE or SECURE for Production) ---
// This is just for initial setup during development.
// You might want a proper user management interface or a command-line script.
// router.get('/setup-admin', adminController.showAdminSetup); // Show form
// router.post('/setup-admin', adminController.createAdminUser); // Process form
// --- End Simple Admin User Creation ---

module.exports = router;
