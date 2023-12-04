'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Track extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Track.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    trackNr: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    diskNr: DataTypes.SMALLINT,
    year: {
      type: DataTypes.NUMBER,
      allowNull: false
    },
    duration: {
      type: DataTypes.NUMBER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Track',
  });
  return Track;
};