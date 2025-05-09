const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensure event names are unique
    },
    slug: {
      // URL-friendly identifier
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // Allow empty description initially
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    imageUrl: {
      // Path to the image in /public/images/
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Event',
    // tableName: 'events' // Optional: Explicitly set table name
    hooks: {
      // Automatically generate slug from name
      beforeValidate: (event, options) => {
        if (event.name && !event.slug) {
          event.slug = event.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
        }
      },
    },
  }
);

module.exports = Event;
