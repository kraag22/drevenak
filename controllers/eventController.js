const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ============================================================
// RACE DATE/TIME — single backend source of truth.
// Change this one line to move the whole event; the template and the
// countdown JS both derive everything from it.
// ============================================================
const RACE_DATE = new Date(2026, 7, 2, 10, 0); // 2 Aug 2026, 10:00 (local; month is 0-indexed)

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
    res.render('events/drevenymuz', { gallery, sponsors, raceDate: RACE_DATE });
  } catch (error) {
    next(error);
  }
};
