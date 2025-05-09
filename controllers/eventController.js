const { Event, Registration } = require('../models'); // Use index import

exports.showEvent = async (req, res, next) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'name', 'slug', 'month', 'imageUrl'], // Select only needed fields
      order: [['id', 'ASC']], // Or order by month/date if needed
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
      attributes: ['id', 'name', 'slug', 'month', 'imageUrl'], // Select only needed fields
      order: [['id', 'ASC']], // Or order by month/date if needed
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
      attributes: ['id', 'name', 'slug', 'month', 'imageUrl'],
      order: [['id', 'ASC']],
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
