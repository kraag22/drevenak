const express = require('express');
const router = express.Router();
const { Event } = require('../models'); // Import Event model
const registrationController = require('../controllers/registrationController');

// GET / - Homepage
router.get('/', async (req, res, next) => {
  try {
    // Fetch minimal event data for the homepage links
    const events = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });
    res.render('index', {
      pageTitle: 'Spolek Dřevěného muže',
      events: events,
    });
  } catch (error) {
    console.error('Error fetching events for homepage:', error);
    next(error);
  }
});

router.get('/kontakt', async (req, res, next) => {
  try {
    // Fetch minimal event data for the homepage links
    const events = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });
    res.render('kontakt', {
      pageTitle: 'Kontakt',
      events: events,
    });
  } catch (error) {
    console.error('Error fetching events for contact:', error);
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
