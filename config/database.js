// config/database.js
const { Sequelize } = require('sequelize');
const path = require('path'); // Require path module
require('dotenv').config();

if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET environment variable is not set. Using a default (unsafe) value.');
}

const dbPath = path.join(__dirname, '..', 'database.sqlite'); // Place DB file in project root

console.log(`Using SQLite database file at: ${dbPath}`); // Log the path

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath, // Specify the file path for storage
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL in dev
    // Options below might help with concurrency issues sometimes seen in SQLite under load
    // retry: {
    //     max: 3, // Max retries on lock errors
    // },
    // pool: { // Not typically needed for SQLite but can be configured
    //     max: 5,
    //     min: 0,
    //     acquire: 30000,
    //     idle: 10000
    // }
});

module.exports = sequelize;
