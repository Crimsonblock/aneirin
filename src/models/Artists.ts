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
    CreationOptional} from "sequelize";

import Track from "./Track.js";

export default class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>>{

    declare id: CreationOptional<number>;
    declare name: string;
    declare picturePath: null | string;


    // Declare track associations
    declare getTracks: HasManyGetAssociationsMixin<Track>;
    declare addTrack: HasManyAddAssociationMixin<Track, number>;
    declare addTracks: HasManyAddAssociationsMixin<Track, number>;
    declare setTracks: HasManySetAssociationsMixin<Track, number>;
    declare removeTrack: HasManyRemoveAssociationMixin<Track, number>;
    declare removeTracks: HasManyRemoveAssociationsMixin<Track, number>;
    declare hasTrack: HasManyHasAssociationMixin<Track, number>;
    declare hasTracks: HasManyHasAssociationsMixin<Track, number>;
    declare countTracks: HasManyCountAssociationsMixin;
    declare createTrack: HasManyCreateAssociationMixin<Track>;
    

    static modelAttributes = {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        picturePath: DataTypes.STRING
    }
}