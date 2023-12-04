'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    var transaction = await queryInterface.sequelize.transaction();
    try{

      // Creates a table to store the genres of a track
      await queryInterface.createTable("TrackGenres", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Tracks",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "trackGenre"
        },
        genreId:{
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Genres", 
            key: "id"
          },
          onUpdate: "CASCADE", 
          onDelete: "CASCADE",
          unique: "trackGenre"
        }
      });

      // Creates a table to store the artists that worked on a track
      await queryInterface.createTable("TrackArtists", {
        id:{
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId:{
          type: Sequelize.INTEGER,
          references:{
            model:"Tracks", 
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          unique: "trackArtist"
        },
        artistId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Artists",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          unique: "trackArtist"
        }
      });

      // Creates the albumId column in the tracks
      await queryInterface.addColumn("Tracks", "albumId", {
        type: Sequelize.INTEGER,
        references: {
          model: "Albums",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        unique: "track"
      });


      transaction.commit();
    }
    catch(e){
      console.log("An error occurred while migrating \"Create Associations\": ", e);
      transaction.rollback();
    }


  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    var transaction = await queryInterface.sequelize.transaction();

    try{
      await queryInterface.dropTable("TrackGenres");
      await queryInterface.dropTable("TrackArtists");
      await queryInterface.removeColumn("Tracks", "albumId");
      transaction.commit();
    }
    catch(e){
      console.log("An error occurred while undoing migration \"Create Associations\": ", e);
      transaction.rollback();
    }


  }
};
