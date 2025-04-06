// This script is for DEVELOPMENT ONLY to quickly sync your models with the database.
// For production, use migrations (e.g., with sequelize-cli).

require('dotenv').config();
const { sequelize } = require('../models'); // Import models to ensure they are defined

async function syncDatabase() {
    console.log('Attempting to sync database models...');
    try {
        // Use { force: true } ONLY during initial development to drop and recreate tables.
        // Use { alter: true } to attempt to alter existing tables (use with caution).
        // Omitting the option syncs without forcing/altering if tables don't exist.
        await sequelize.sync({ alter: true }); // Use alter: true or force: true CAREFULLY
        console.log('Database synchronized successfully (using alter:true).');
        // Note: 'force: true' would drop all tables and recreate them.
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1); // Exit with error code
    } finally {
        await sequelize.close(); // Close the connection
        console.log('Database connection closed.');
    }
}

syncDatabase();
