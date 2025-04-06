const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

class Admin extends Model {
    // Method to check password validity
    validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
}

Admin.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isAlphanumeric: true // Basic username validation
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Admin',
    hooks: {
        // Hook to hash password before saving
        beforeCreate: async (admin) => {
            const salt = await bcrypt.genSalt(10); // Use async version
            admin.password = await bcrypt.hash(admin.password, salt);
        },
        // Hook to hash password before updating (if password changed)
        beforeUpdate: async (admin) => {
            if (admin.changed('password')) { // Only hash if password field was changed
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(admin.password, salt);
            }
        }
    }
});

module.exports = Admin;
