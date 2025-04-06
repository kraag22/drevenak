// Middleware to check if the user is authenticated (logged in as Admin)
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { // This method is added by Passport
    return next(); // User is logged in, proceed to the next middleware/route handler
  }

  // User is not logged in, redirect to the login page
  req.flash('error_msg', 'Please log in to view this resource.'); // Optional: Flash message
  res.redirect('/admin/login');
}

// Optional: Middleware to prevent logged-in users from accessing login/register pages
function forwardAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return next(); // Not logged in, proceed
  }
  // User is logged in, redirect them away from login page (e.g., to admin dashboard)
  res.redirect('/admin/dashboard'); // Adjust redirect URL as needed
}


module.exports = {
    ensureAuthenticated,
    forwardAuthenticated
};
