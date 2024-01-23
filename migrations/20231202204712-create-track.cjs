'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tracks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "track"
      },
      trackNr: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      diskNr: Sequelize.SMALLINT,
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tracks');
  }
};