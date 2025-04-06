const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Registration extends Model {}

Registration.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // eventId is automatically added by the association in models/index.js
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true // Basic email validation
    }
    // Consider adding a unique constraint per event if needed:
    // unique: 'compositeIndex' // Use along with eventId
  },
  dob: { // Date of Birth
    type: DataTypes.DATEONLY, // Store only the date part
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other', 'Prefer not to say'),
    allowNull: false
  }
  // Add other fields as needed (e.g., address, emergency contact)
}, {
  sequelize,
  modelName: 'Registration',
  // indexes: [ // Example composite unique index (if needed)
  //   {
  //     unique: true,
  //     fields: ['email', 'eventId']
  //   }
  // ]
});

module.exports = Registration;
