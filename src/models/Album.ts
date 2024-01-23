import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    HasManyGetAssociationsMixin,
    HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin,
    HasManySetAssociationsMixin,
    HasManyRemoveAssociationMixin,
    HasManyRemoveAssociationsMixin,
    HasManyHasAssociationMixin,
    HasManyHasAssociationsMixin,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
    CreationOptional,
    NonAttribute,
    Association,
    BelongsToGetAssociationMixin,
    BelongsToSetAssociationMixin,
    BelongsToCreateAssociationMixin
} from "sequelize";

import Track from "./Track.js";
import Artist from "./Artist.js";


export default class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>>{

    // Album fields
    declare id: CreationOptional<typeof DataTypes.UUID>;
    declare title: string;
    declare cover: string | null;
    declare path: string;

    // Tracks association declarations
    declare getTracks: HasManyGetAssociationsMixin<Track>;
    declare addTrack: HasManyAddAssociationMixin<Track, typeof DataTypes.UUID>;
    declare addTracks: HasManyAddAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare setTracks: HasManySetAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare removeTrack: HasManyRemoveAssociationMixin<Track, typeof DataTypes.UUID>;
    declare removeTracks: HasManyRemoveAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare hasTrack: HasManyHasAssociationMixin<Track, typeof DataTypes.UUID>;
    declare hasTracks: HasManyHasAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare countTracks: HasManyCountAssociationsMixin;
    // @ts-ignore
    declare createTrack: HasManyCreateAssociationMixin<Track, "albumId">
    declare tracks?: NonAttribute<Track[]>;

    // Artist Associations
    declare getArtist: BelongsToGetAssociationMixin<Artist>;
    declare setArtist: BelongsToSetAssociationMixin<Artist, typeof DataTypes.UUID>;
    declare createArtist: BelongsToCreateAssociationMixin<Artist>;
    declare artist?: NonAttribute<Artist>;

    declare static associations: {
        tracks: Association<Album, Track>,
        artist: Association<Album, Artist>
    }

    static modelAttributes = {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cover: DataTypes.STRING,
        path: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}