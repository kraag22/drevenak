const express = require('express');
const router = express.Router();

// All old event pages (event detail, register, participants, track, photo,
// and the legacy "papirovy-muz" slug) are now part of the homepage.
// 301-redirect every old /events/* URL to the homepage for SEO consolidation.
router.all('/*', (req, res) => res.redirect(301, '/'));

module.exports = router;
