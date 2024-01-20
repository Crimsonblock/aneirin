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
    Association
} from "sequelize";

import Track from "./Track.js";


export default class Album extends Model<InferAttributes<Album>, InferCreationAttributes<Album>>{

    // Album fields
    declare id: CreationOptional<number>;
    declare title: string;
    declare cover: string | null;
    declare path: string;

    // Tracks association declarations
    declare getTracks: HasManyGetAssociationsMixin<Track>;
    declare addTrack: HasManyAddAssociationMixin<Track, number>;
    declare addTracks: HasManyAddAssociationsMixin<Track, number>;
    declare setTracks: HasManySetAssociationsMixin<Track, number>;
    declare removeTrack: HasManyRemoveAssociationMixin<Track, number>;
    declare removeTracks: HasManyRemoveAssociationsMixin<Track, number>;
    declare hasTrack: HasManyHasAssociationMixin<Track, number>;
    declare hasTracks: HasManyHasAssociationsMixin<Track, number>;
    declare countTracks: HasManyCountAssociationsMixin;
    declare createTrack: HasManyCreateAssociationMixin<Track, "id">;

    declare tracks?: NonAttribute<Track[]>;

    declare static associations: {
        tracks: Association<Album, Track>
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
        cover: DataTypes.STRING,
        path: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}