const sequelize = require('../config/database');
const Event = require('./Event');
const Registration = require('./Registration');
const Admin = require('./Admin');
const Image = require('./Image');

// Define Associations
// One Event has Many Registrations
Event.hasMany(Registration, {
  foreignKey: 'eventId',
  as: 'registrations', // Alias for the association
  onDelete: 'CASCADE', // If an event is deleted, delete associated registrations
});
// One Registration belongs to One Event
Registration.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'event', // Alias for the association
});

// Note: Admin model is currently standalone, but you could link it
// if admins were associated with specific events they manage, for example.

// Export models and sequelize instance
module.exports = {
  sequelize,
  Event,
  Registration,
  Admin,
  Image,
};
