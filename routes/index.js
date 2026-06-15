const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// GET / - Homepage renders the "Dřevěný muž" single-page landing directly.
router.get('/', eventController.renderHome);

// Old standalone pages are now sections of the homepage — 301 to / for SEO.
router.get('/kontakt', (req, res) => res.redirect(301, '/'));
router.get('/sponzori', (req, res) => res.redirect(301, '/'));

// Old registration endpoint (registration is now handled externally).
router.post('/register/:eventId', (req, res) => res.redirect(301, '/'));

module.exports = router;
