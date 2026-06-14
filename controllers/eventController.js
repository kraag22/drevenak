const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Event, Registration } = require('../models'); // Use index import

// Grid classes cycled over the gallery images to keep the mosaic layout.
const GALLERY_TILE_PATTERN = ['g-w8', 'g-w4', 'g-tall', 'g-sq', 'g-sq', 'g-w4', 'g-w4', 'g-w4'];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const THUMB_PREFIX = 'thumb_';
const THUMB_WIDTH = 600; // px — downscaled width for grid thumbnails

// Returns the thumbnail filename for an image, generating thumb_<name>.jpg
// (small JPEG, ~50–100 KB) if it doesn't exist yet. Transparency is flattened
// onto white. Falls back to the original on failure.
async function ensureThumb(dir, file) {
  const thumbName = THUMB_PREFIX + path.basename(file, path.extname(file)) + '.jpg';
  const thumbPath = path.join(dir, thumbName);
  if (fs.existsSync(thumbPath)) return thumbName;
  try {
    await sharp(path.join(dir, file))
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(thumbPath);
    return thumbName;
  } catch (error) {
    console.error('Thumbnail generation failed for', file, '-', error.message);
    return file; // fall back to the full-size image
  }
}

// Reads JPEGs from public/images/<subdir>, returning { full, thumb, cap } for
// each (thumbnails created on demand). By default ordered by file date (newest
// first); pass { shuffle: true } for random order and { limit: N } to cap count.
async function loadImages(subdir, { shuffle = false, limit = null } = {}) {
  const dir = path.join(__dirname, '..', 'public', 'images', subdir);
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  let entries = files
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .filter((f) => !f.startsWith(THUMB_PREFIX)) // skip thumbnails themselves
    .map((f) => ({ file: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (shuffle) {
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
  }
  if (limit != null) entries = entries.slice(0, limit);

  return Promise.all(
    entries.map(async ({ file }) => {
      const thumb = await ensureThumb(dir, file);
      return {
        full: '/images/' + subdir + '/' + file,
        thumb: '/images/' + subdir + '/' + thumb,
        cap: path.basename(file, path.extname(file)).replace(/[-_]+/g, ' '),
      };
    })
  );
}

// Gallery shows up to 9 images in random order, with a tile class per item.
async function loadGallery() {
  const imgs = await loadImages('gallery', { shuffle: true, limit: 9 });
  return imgs.map((img, i) => ({
    ...img,
    cls: GALLERY_TILE_PATTERN[i % GALLERY_TILE_PATTERN.length],
  }));
}

const loadSponsors = () => loadImages('sponzori');

// Homepage: the "Dřevěný muž" single-page landing (see views/events/drevenymuz.ejs).
exports.renderHome = async (req, res, next) => {
  try {
    const [gallery, sponsors] = await Promise.all([loadGallery(), loadSponsors()]);
    res.render('events/drevenymuz', { gallery, sponsors });
  } catch (error) {
    next(error);
  }
};

exports.showEvent = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });

    const eventSlug = req.params.eventSlug;
    const event = await Event.findOne({
      where: { slug: eventSlug },
      include: {
        // Eager load registrations
        model: Registration,
        as: 'registrations', // Use the alias defined in the association
        order: [['createdAt', 'DESC']], // Order registrations by newest first
      },
    });

    if (!event) {
      // If event not found, pass to the 404 handler
      const error = new Error('Event not found');
      error.statusCode = 404;
      return next(error);
    }

    // Map data needs latitude and longitude
    const mapData =
      event.latitude && event.longitude
        ? {
            lat: event.latitude,
            lng: event.longitude,
            locationName: event.locationName || event.name,
          }
        : null;

    res.render('events/show', {
      pageTitle: event.name,
      event: event,
      events: events,
      registrations: event.registrations, // Access eager-loaded registrations
      mapData: mapData, // Pass coordinates to the view,
      currentPage: 'details',
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error); // Pass error to the error handling middleware
  }
};

exports.showRegistrationForm = async (req, res, next) => {
  try {
    const allEvents = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });

    const eventSlug = req.params.eventSlug;
    const event = await Event.findOne({
      where: { slug: eventSlug },
      include: {
        // Eager load registrations
        model: Registration,
        as: 'registrations', // Use the alias defined in the association
        order: [['createdAt', 'DESC']], // Order registrations by newest first
      },
    });
    res.render('events/register', {
      pageTitle: event.name,
      event: event,
      events: allEvents,
      currentPage: 'register',
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error); // Pass error to the error handling middleware
  }
};

exports.showParticipants = async (req, res, next) => {
  try {
    const allEvents = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });

    const eventSlug = req.params.eventSlug;
    const event = await Event.findOne({
      where: { slug: eventSlug },
      include: {
        model: Registration,
        as: 'registrations',
        order: [['createdAt', 'DESC']],
      },
    });

    res.render('events/participants', {
      pageTitle: event.name,
      event: event,
      events: allEvents,
      registrations: event.registrations,
      currentPage: 'participants',
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error); // Pass error to the error handling middleware
  }
};

exports.showTrack = async (req, res, next) => {
  try {
    const allEvents = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });

    const eventSlug = req.params.eventSlug;
    const event = await Event.findOne({
      where: { slug: eventSlug },
      include: {
        model: Registration,
        as: 'registrations',
        order: [['createdAt', 'DESC']],
      },
    });

    res.render('events/track', {
      pageTitle: event.name,
      event: event,
      events: allEvents,
      currentPage: 'track',
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error); // Pass error to the error handling middleware
  }
};

exports.showPhoto = async (req, res, next) => {
  try {
    const allEvents = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'eventDate', 'imageUrl'],
      order: [['name', 'ASC']],
    });

    const eventSlug = req.params.eventSlug;
    const event = await Event.findOne({
      where: { slug: eventSlug },
      include: {
        model: Registration,
        as: 'registrations',
        order: [['createdAt', 'DESC']],
      },
    });

    res.render('events/photo', {
      pageTitle: event.name,
      event: event,
      events: allEvents,
      currentPage: 'photo',
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    next(error); // Pass error to the error handling middleware
  }
};
