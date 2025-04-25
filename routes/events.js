const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /events/:eventSlug - Show specific event details page (description)
router.get('/:eventSlug', eventController.showEvent);

// GET /events/:eventSlug/register - Show registration form for a specific event
router.get('/:eventSlug/register', eventController.showRegistrationForm);

// GET /events/:eventSlug/participants - Show list of participants for a specific event
router.get('/:eventSlug/participants', eventController.showParticipants);

module.exports = router;
