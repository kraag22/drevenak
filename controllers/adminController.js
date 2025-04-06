const { Event, Admin } = require('../models');
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
    console.warn("HTML Sanitization for description is NOT IMPLEMENTED. This is a security risk.");
    return dirtyHtml;
}


// GET /admin/login
exports.showLogin = (req, res) => {
    res.render('admin/login', {
        pageTitle: 'Admin Login',
        error: req.flash ? req.flash('error') : null // Pass flash errors if using connect-flash
    });
};

// GET /admin/dashboard
exports.showDashboard = async (req, res, next) => {
    try {
        const eventCount = await Event.count();
        // Add more dashboard data as needed
        res.render('admin/dashboard', { // Create views/admin/dashboard.ejs
            pageTitle: 'Admin Dashboard',
            eventCount: eventCount
        });
    } catch (error) {
        next(error);
    }
};

// GET /admin/events
exports.listEvents = async (req, res, next) => {
    try {
        const events = await Event.findAll({ order: [['name', 'ASC']] });
        res.render('admin/list-events', { // Create views/admin/list-events.ejs
            pageTitle: 'Manage Events',
            events: events
        });
    } catch (error) {
        next(error);
    }
};

// GET /admin/events/new
exports.showNewEventForm = (req, res) => {
    res.render('admin/new-event', { // Create views/admin/new-event.ejs
        pageTitle: 'Create New Event',
        event: {}, // Pass empty object for form consistency
        errors: []
    });
};

// POST /admin/events/new
exports.createEvent = async (req, res, next) => {
    try {
        const { name, month, locationName, latitude, longitude, imageUrl, description } = req.body;
        // Basic validation can be added here or using express-validator
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''); // Generate slug

        // Sanitize description before saving
        const cleanDescription = sanitizeDescription(description || '');

        await Event.create({
            name,
            slug, // Save the generated slug
            month,
            locationName,
            latitude: latitude || null,
            longitude: longitude || null,
            imageUrl: imageUrl || null,
            description: cleanDescription // Save sanitized description
        });
        // Optional: Add success flash message
        res.redirect('/admin/events');
    } catch (error) {
        console.error("Error creating event:", error);
        // Handle validation errors (e.g., unique constraint) gracefully
        res.status(422).render('admin/new-event', {
             pageTitle: 'Create New Event',
             event: req.body, // Repopulate form
             // Map Sequelize validation errors to a user-friendly format if needed
             errors: error.errors ? error.errors.map(e => ({ msg: e.message })) : [{ msg: 'Could not create event.' }]
        });
        // next(error); // Or pass to generic handler
    }
};

// GET /admin/events/edit/:eventId
exports.showEditEventForm = async (req, res, next) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findByPk(eventId);
        if (!event) {
            // Handle event not found
            const error = new Error('Event not found');
            error.statusCode = 404;
            return next(error);
        }
        res.render('admin/edit-event', {
            pageTitle: `Edit: ${event.name}`,
            event: event,
            errors: []
        });
    } catch (error) {
        next(error);
    }
};

// POST /admin/events/edit/:eventId
exports.updateEventDescription = async (req, res, next) => {
    const eventId = req.params.eventId;
    const { description, name, month, locationName, latitude, longitude, imageUrl } = req.body; // Get updated description and potentially other fields

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
        event.month = month;
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
        console.error("Error updating event:", error);
         res.status(422).render('admin/edit-event', {
             pageTitle: `Edit Event`, // Might not have event name if findByPk failed earlier
             event: { ...req.body, id: eventId }, // Repopulate form with submitted data
             errors: error.errors ? error.errors.map(e => ({ msg: e.message })) : [{ msg: 'Could not update event.' }]
        });
        // next(error);
    }
};

// --- Simple Admin User Creation Controllers (REMOVE or SECURE for Production) ---
exports.showAdminSetup = (req, res) => {
    // Only show if NO admins exist? Add logic check here if desired.
    res.render('admin/setup-admin', { pageTitle: 'Setup Admin User', errors: [] }); // Create this view
};

exports.createAdminUser = async (req, res, next) => {
    // Add validation (password confirmation, strength etc.)
    const { username, password } = req.body;
    try {
        // Check if an admin already exists (optional, maybe allow multiple admins)
        const existingAdmin = await Admin.findOne();
        if (existingAdmin && process.env.NODE_ENV !== 'development') { // Restrict in prod
             return res.status(403).send('Admin user already exists.');
        }

        await Admin.create({ username, password }); // Password will be hashed by the model hook
        res.redirect('/admin/login');
    } catch (error) {
         console.error("Error creating admin user:", error);
         res.status(422).render('admin/setup-admin', {
             pageTitle: 'Setup Admin User',
             errors: error.errors ? error.errors.map(e => ({ msg: e.message })) : [{ msg: 'Could not create admin user.' }]
        });
        // next(error);
    }
};
// --- End Simple Admin User Creation ---
