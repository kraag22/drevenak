const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Image extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here if needed, e.g., linking images to events
    // Image.belongsTo(models.Event);
  }
}
Image.init(
  {
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailFilename: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailPath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Add other fields if needed, e.g., alt text, caption
  },
  {
    sequelize,
    modelName: 'Image',
    // Optional: If your table name is different, specify it here
    // tableName: 'images'
  }
);

module.exports = Image;
