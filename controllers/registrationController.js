const { body, validationResult } = require('express-validator');
const { Registration, Event } = require('../models'); // Use index import

// Validation rules middleware
exports.validateRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required.').escape(),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('dob').isDate().withMessage('Please enter a valid date of birth.'),
    body('gender').isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Please select a valid gender option.'),
    // Add validation for any other fields
];

// Controller action to create registration
exports.createRegistration = async (req, res, next) => {
    const errors = validationResult(req);
    const eventId = req.params.eventId;

    // Fetch the event data again in case of validation errors to re-render the page correctly
    let event, registrations, mapData = null;
    try {
        const eventData = await Event.findByPk(eventId, {
            include: { model: Registration, as: 'registrations', order: [['createdAt', 'DESC']] }
        });
        if (eventData) {
            event = eventData;
            registrations = eventData.registrations;
            mapData = (event.latitude && event.longitude) ? { lat: event.latitude, lng: event.longitude, locationName: event.locationName || event.name } : null;
        } else {
             // Should not happen if linking from valid event page, but handle defensively
             const error = new Error('Event not found for registration.');
             error.statusCode = 404;
             return next(error);
        }
    } catch(error) {
        console.error("Error fetching event data for registration form:", error);
        return next(error); // Pass error to error handling middleware
    }


    if (!errors.isEmpty()) {
        // There are validation errors. Render the form again with error messages and previous input.
        return res.status(422).render('events/show', {
            pageTitle: `Register for ${event.name}`,
            event: event,
            registrations: registrations,
            mapData: mapData,
            errors: errors.array(), // Pass errors to the view
            formData: req.body // Pass submitted data back to repopulate form
        });
    }

    // Data is valid, proceed to create registration
    try {
        const { name, email, dob, gender } = req.body;

        // Optional: Check if email is already registered for this specific event
        // const existingRegistration = await Registration.findOne({ where: { email: email, eventId: eventId } });
        // if (existingRegistration) {
        //     // Handle duplicate registration attempt (e.g., show error message)
        //     return res.status(409).render('events/show', { /* ... pass data ... */ errors: [{ msg: 'This email is already registered for this event.'}] });
        // }

        await Registration.create({
            name,
            email,
            dob,
            gender,
            eventId: eventId // Associate with the correct event
        });

        // Optional: Add a success flash message
        // req.flash('success_msg', 'Registration successful!');

        // Redirect back to the event page after successful registration
        res.redirect(`/events/${event.slug}`); // Use slug for redirection

    } catch (error) {
        console.error("Error saving registration:", error);
        // Render the form again with a generic error message
         res.status(500).render('events/show', {
            pageTitle: `Register for ${event.name}`,
            event: event,
            registrations: registrations,
            mapData: mapData,
            errors: [{ msg: 'Could not save registration due to a server error. Please try again.' }],
            formData: req.body
        });
        // Or use next(error) to pass to the generic error handler
    }
};
