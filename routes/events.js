const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET /events/:eventSlug - Show specific event details page
router.get('/:eventSlug', eventController.showEvent);

module.exports = router;
