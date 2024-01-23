'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Albums', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "albumArtist"
      },
      type:{
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      cover: Sequelize.STRING,
      path: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Albums');
  }
};