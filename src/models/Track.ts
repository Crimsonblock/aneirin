import {
    Model,
    DataTypes,
    InferAttributes,
    BelongsToGetAssociationMixin,
    BelongsToSetAssociationMixin,
    BelongsToCreateAssociationMixin,
    InferCreationAttributes,
    CreationOptional,
    NonAttribute,
    Association,
} from "sequelize";

import Album from "./Album.js";
import Artist from "./Artists.js";


export default class Track extends Model<InferAttributes<Track>, InferCreationAttributes<Track>> {

    // Tracks fields
    declare id: CreationOptional<number>;
    declare title: string;
    declare trackNr: number;
    declare diskNr: number | null;
    declare year: number;
    declare duration: number;

    // Album association declarations
    declare getAlbum: BelongsToGetAssociationMixin<Album>;
    declare setAlbum: BelongsToSetAssociationMixin<Album, number>;
    declare createAlbum: BelongsToCreateAssociationMixin<Album>;

    declare album?: NonAttribute<Album>;

    // Artist association declarations
    declare getArtist: BelongsToGetAssociationMixin<Artist>;
    declare setArtist: BelongsToSetAssociationMixin<Artist, number>;
    declare createArtist: BelongsToCreateAssociationMixin<Artist>;

    declare artist?: NonAttribute<Artist>;

    declare static associations: {
        artist: Association<Track, Artist>,
        album: Association<Track, Album>
    }


    static modelAttributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        trackNr: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        diskNr: DataTypes.SMALLINT,
        year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }
}