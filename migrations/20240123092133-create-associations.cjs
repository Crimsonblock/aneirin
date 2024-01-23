'use strict';

const { default: sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
    * Add altering commands here.
    *
    * Example:
    * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    
    var transaction = await queryInterface.sequelize.transaction();
    try {
      
      // Creates a table to store the genres of a track
      await queryInterface.createTable("TrackGenres", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "Tracks",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "trackGenre"
        },
        genreId: {
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
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId: {
          type: Sequelize.UUID,
          references: {
            model: "Tracks",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          unique: "trackArtist",
          allowNull: false
        },
        artistId: {
          type: Sequelize.UUID,
          references: {
            model: "Artists",
            key: "id"
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
          unique: "trackArtist",
          allowNull: false
        }
      });
      
      // Creates the artistId in the album table
      await queryInterface.addColumn("Albums", "artistId", {
        type: Sequelize.UUID,
        references: {
          model: "Artists",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false,
        unique: "albumArtist"
      });
      
      
      // await queryInterface.addColumn("Tracks", "artistId", {
      //   type: sequelize.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: "Artists",
      //     key: "id"
      //   },
      //   onDelete: "CASCADE",
      //   onUpdate: "CASCADE"
      // });
      
      // Creates the albumId column in the tracks
      await queryInterface.addColumn("Tracks", "albumId", {
        type: Sequelize.UUID,
        references: {
          model: "Albums",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        unique: "track",
        allowNull: false
      });
      
      // Links the authentication token to the user
      await queryInterface.addColumn("AuthenticationTokens", "userId", {
        type: Sequelize.UUID,
        references:{
          model: "Users",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false
      });
      
      // Links the playlist to the user
      await queryInterface.addColumn("Playlists", "userId", {
        type: Sequelize.UUID,
        references:{
          model: "Users",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false
      })
      
      // Creates the playlist association table
      await queryInterface.createTable("PlaylistTracks", {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "Tracks",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "playlistTrack"
        },
        playlistId:{
          type: Sequelize.UUID,
          allowNull: false,
          references:{
            model: "Playlists",
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "playlistTrack"
        },
        order:{
          type: Sequelize.INTEGER,
          allowNull: false
        }
      })
      
      
      await transaction.commit();
    }
    
    catch (e) {
      console.log("An error occurred while migrating \"Create Associations\": ", e);
      await transaction.rollback();
      throw new Error(e);
    }
    
    
  },
  
  async down(queryInterface, Sequelize) {
    /**
    * Add reverting commands here.
    *
    * Example:
    * await queryInterface.dropTable('users');
    */
    
    var transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable("TrackGenres");
      await queryInterface.dropTable("TrackArtists");
      // await queryInterface.removeColumn("Tracks", "artistId");
      await queryInterface.removeColumn("Tracks", "albumId");
      await queryInterface.removeColumn("AuthenticationTokens", "userId");
      await queryInterface.removeColumn("Playlists", "userId");
      await queryInterface.removeColumn("Albums", "artistId");
      await queryInterface.dropTable("PlaylistTracks");
      await transaction.commit();
    }
    catch (e) {
      console.log("An error occurred while undoing migration \"Create Associations\": ", e);
      await transaction.rollback();
      throw new Error(e);
    }
    
    
  }
};
