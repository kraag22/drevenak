const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// fix old slug with correct name
router.get('/papirovy-muz', (req, res) => { res.redirect(301, '/events/dreveny-muz'); });
router.get('/papirovy-muz/register', (req, res) => { res.redirect(301, '/events/dreveny-muz/register'); });
router.get('/papirovy-muz/participants', (req, res) => { res.redirect(301, '/events/dreveny-muz/participants'); });
router.get('/papirovy-muz/track', (req, res) => { res.redirect(301, '/events/dreveny-muz/track'); });

// GET /events/:eventSlug - Show specific event details page (description)
router.get('/:eventSlug', eventController.showEvent);

// GET /events/:eventSlug/register - Show registration form for a specific event
router.get('/:eventSlug/register', eventController.showRegistrationForm);

// GET /events/:eventSlug/participants - Show list of participants for a specific event
router.get('/:eventSlug/participants', eventController.showParticipants);

router.get('/:eventSlug/track', eventController.showTrack);

router.get('/:eventSlug/photo', eventController.showPhoto);

module.exports = router;
