import { Sequelize, DataTypes } from "sequelize";

export default function initPlaylistTracksTable(sequelize:Sequelize){
    sequelize.define("PlaylistTracks", {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        trackId: {
          type: DataTypes.UUID,
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
          type: DataTypes.UUID,
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
          type: DataTypes.INTEGER,
          allowNull: false
        }
      }, {timestamps: false});
}