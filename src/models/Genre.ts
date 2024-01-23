import { Model, 
    DataTypes,
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
    InferAttributes, 
    InferCreationAttributes, 
    CreationOptional, 
    Association,
    NonAttribute} from "sequelize";

import Track from "./Track.js";

export default class Genre extends Model<InferAttributes<Genre>, InferCreationAttributes<Genre>> {
    declare id: CreationOptional<number>;
    declare name: string;

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
    declare tracks?: NonAttribute<Track>;

    declare static associations: {
        tracks: Association<Genre, Track>
    }

    static modelAttributes = {
        id:{
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}