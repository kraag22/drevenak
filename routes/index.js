const express = require('express');
const router = express.Router();
const { Event } = require('../models'); // Import Event model
const registrationController = require('../controllers/registrationController');

// GET / - Homepage
router.get('/', async (req, res, next) => {
    try {
        // Fetch minimal event data for the homepage links
        const events = await Event.findAll({
            attributes: ['id', 'name', 'slug', 'month', 'imageUrl'], // Select only needed fields
            order: [['id', 'ASC']] // Or order by month/date if needed
        });
        res.render('index', {
            pageTitle: 'Upcoming Sports Events',
            events: events
        });
    } catch (error) {
        console.error("Error fetching events for homepage:", error);
        next(error);
    }
});

// POST /register/:eventId - Handle registration form submission
router.post(
    '/register/:eventId',
    registrationController.validateRegistration, // Use validation middleware first
    registrationController.createRegistration // Then the controller action
);


module.exports = router;
