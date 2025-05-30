const { Event, Admin, Image, Registration } = require('../models');
const bcrypt = require('bcrypt');

// IMPORTANT: Add input sanitization library for WYSIWYG content
// const sanitizeHtml = require('sanitize-html'); // Example library (needs installation: npm install sanitize-html)

// Function to sanitize description (replace with your chosen library/config)
function sanitizeDescription(dirtyHtml) {
  // Configure your sanitizer carefully to allow necessary tags/attributes
  // This is a VERY basic example, refer to library docs for secure configuration
  // const cleanHtml = sanitizeHtml(dirtyHtml, {
  //   allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
  //     'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
  //     'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img' ],
  //   allowedAttributes: {
  //     a: [ 'href', 'name', 'target' ],
  //     img: [ 'src', 'alt' ]
  //     // Add other allowed attributes
  //   },
  //   // other options...
  // });
  // return cleanHtml;

  // **Placeholder:** Return original HTML until sanitizer is implemented
  console.warn(
    'HTML Sanitization for description is NOT IMPLEMENTED. This is a security risk.'
  );
  return dirtyHtml;
}

// GET /admin/login
exports.showLogin = async (req, res) => {
  const events = await Event.findAll({ order: [['name', 'ASC']] });
  res.render('admin/login', {
    events: events,
    pageTitle: 'Admin Login',
  });
};

// GET /admin/dashboard
exports.showDashboard = async (req, res, next) => {
  try {
    const events = await Event.findAll({ order: [['name', 'ASC']] });
    const eventCount = await Event.count();
    // Add more dashboard data as needed
    res.render('admin/dashboard', {
      // Create views/admin/dashboard.ejs
      pageTitle: 'Admin Dashboard',
      events: events,
      eventCount: eventCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/events
exports.listEvents = async (req, res, next) => {
  try {
    const events = await Event.findAll({ order: [['name', 'ASC']] });
    res.render('admin/list-events', {
      // Create views/admin/list-events.ejs
      pageTitle: 'Spravovat události',
      events: events,
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/events/new
exports.showNewEventForm = async (req, res, next) => {
  try {
    const events = await Event.findAll({ order: [['name', 'ASC']] });
    const images = await Image.findAll({ order: [['label', 'ASC']] });

    res.render('admin/new-event', {
      pageTitle: 'Vytvoř novou událost',
      event: {},
      events: events,
      images: images,
      tinymce_key: process.env.TINYMCE_KEY,
      errors: [],
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/events/new
exports.createEvent = async (req, res, next) => {
  try {
    const {
      name,
      eventDate,
      locationName,
      latitude,
      longitude,
      imageUrl,
      description,
    } = req.body;
    // Basic validation can be added here or using express-validator
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, ''); // Generate slug

    // Sanitize description before saving
    const cleanDescription = sanitizeDescription(description || '');

    await Event.create({
      name,
      slug, // Save the generated slug
      eventDate,
      locationName,
      latitude: latitude || null,
      longitude: longitude || null,
      imageUrl: imageUrl || null,
      description: cleanDescription, // Save sanitized description
    });
    // Optional: Add success flash message
    res.redirect('/admin/events');
  } catch (error) {
    console.error('Error creating event:', error);
    // Handle validation errors (e.g., unique constraint) gracefully
    res.status(422).render('admin/new-event', {
      pageTitle: 'Create New Event',
      event: req.body, // Repopulate form
      // Map Sequelize validation errors to a user-friendly format if needed
      errors: error.errors
        ? error.errors.map((e) => ({ msg: e.message }))
        : [{ msg: 'Could not create event.' }],
    });
    // next(error); // Or pass to generic handler
  }
};

// GET /admin/events/edit/:eventId
exports.showEditEventForm = async (req, res, next) => {
  try {
    const events = await Event.findAll({ order: [['name', 'ASC']] });
    const eventId = req.params.eventId;
    const event = await Event.findByPk(eventId);
    if (!event) {
      // Handle event not found
      const error = new Error('Event not found');
      error.statusCode = 404;
      return next(error);
    }
    const images = await Image.findAll({ order: [['label', 'ASC']] });

    res.render('admin/edit-event', {
      pageTitle: `Edit: ${event.name}`,
      event: event,
      events: events,
      images: images,
      tinymce_key: process.env.TINYMCE_KEY,
      errors: [],
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/events/edit/:eventId
exports.updateEventDescription = async (req, res, next) => {
  const eventId = req.params.eventId;
  const {
    description,
    name,
    eventDate,
    locationName,
    latitude,
    longitude,
    imageUrl,
  } = req.body; // Get updated description and potentially other fields

  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      return next(error);
    }

    // **IMPORTANT: Sanitize the HTML input from the WYSIWYG editor**
    const cleanDescription = sanitizeDescription(description || '');

    // Update other fields as needed
    event.name = name;
    event.eventDate = eventDate;
    event.locationName = locationName;
    event.latitude = latitude || null;
    event.longitude = longitude || null;
    event.imageUrl = imageUrl || null;
    event.description = cleanDescription; // Save the sanitized description

    // Update slug if name changed (optional, consider implications of changing URLs)
    // event.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    await event.save();

    // Optional: Add success flash message
    res.redirect('/admin/events'); // Redirect back to the list or the edited event page
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(422).render('admin/edit-event', {
      pageTitle: `Edit Event`, // Might not have event name if findByPk failed earlier
      event: { ...req.body, id: eventId }, // Repopulate form with submitted data
      tinymce_key: process.env.TINYMCE_KEY,
      errors: error.errors
        ? error.errors.map((e) => ({ msg: e.message }))
        : [{ msg: 'Could not update event.' }],
    });
    // next(error);
  }
};

// GET /admin/events/:eventId/registrations
exports.listEventRegistrations = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findByPk(eventId, {
      include: {
        model: Registration,
        as: 'registrations',
        order: [['createdAt', 'DESC']],
      },
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      return next(error);
    }
    const events = await Event.findAll({ order: [['name', 'ASC']] });

    res.render('admin/event-registrations', {
      pageTitle: `Registrations for ${event.name}`,
      event: event,
      registrations: event.registrations,
      events: events, // for header
    });
  } catch (error) {
    next(error);
  }
};

// POST /admin/registrations/:registrationId/toggle-paid
exports.toggleRegistrationPaidStatus = async (req, res, next) => {
  try {
    const registrationId = req.params.registrationId;
    const registration = await Registration.findByPk(registrationId);

    if (!registration) {
      req.flash('error_msg', 'Registration not found.');
      // Redirect back to the last known page or a default admin page
      return res.redirect(req.headers.referer || '/admin/events');
    }

    registration.paid = !registration.paid; // Toggle the paid status
    await registration.save();

    req.flash(
      'success_msg',
      `Registration marked as ${registration.paid ? 'paid' : 'unpaid'}.`
    );
    res.redirect(
      req.headers.referer ||
        `/admin/events/${registration.eventId}/registrations`
    );
  } catch (error) {
    console.error('Error toggling registration paid status:', error);
    req.flash('error_msg', 'Error updating registration status.');
    next(error); // Or redirect back with error
  }
};

// POST /admin/registrations/:registrationId/delete
exports.deleteRegistration = async (req, res, next) => {
  try {
    const registrationId = req.params.registrationId;
    const registration = await Registration.findByPk(registrationId);

    if (!registration) {
      req.flash('error_msg', 'Registration not found.');
      return res.redirect(req.headers.referer || '/admin/events');
    }

    const eventId = registration.eventId; // Store eventId for redirect before destroying
    await registration.destroy();

    req.flash('success_msg', 'Registration deleted successfully.');
    // Redirect back to the registrations list for the specific event
    res.redirect(
      req.headers.referer || `/admin/events/${eventId}/registrations`
    );
  } catch (error) {
    console.error('Error deleting registration:', error);
    req.flash('error_msg', 'Error deleting registration.');
    // Redirect back to the last page or a default error page/admin page
    res.redirect(req.headers.referer || '/admin/events');
    // next(error); // Or pass to a more generic error handler
  }
};

// --- Simple Admin User Creation Controllers (REMOVE or SECURE for Production) ---
exports.showAdminSetup = (req, res) => {
  // Only show if NO admins exist? Add logic check here if desired.
  res.render('admin/setup-admin', {
    pageTitle: 'Setup Admin User',
    errors: [],
  }); // Create this view
};

exports.createAdminUser = async (req, res, next) => {
  // Add validation (password confirmation, strength etc.)
  const { username, password } = req.body;
  try {
    // Check if an admin already exists (optional, maybe allow multiple admins)
    const existingAdmin = await Admin.findOne();
    if (existingAdmin && process.env.NODE_ENV !== 'development') {
      // Restrict in prod
      return res.status(403).send('Admin user already exists.');
    }

    await Admin.create({ username, password }); // Password will be hashed by the model hook
    res.redirect('/admin/login');
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(422).render('admin/setup-admin', {
      pageTitle: 'Setup Admin User',
      errors: error.errors
        ? error.errors.map((e) => ({ msg: e.message }))
        : [{ msg: 'Could not create admin user.' }],
    });
    // next(error);
  }
};
// --- End Simple Admin User Creation ---
