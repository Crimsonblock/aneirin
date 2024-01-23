import { 
    Model, 
    DataTypes, 
    InferAttributes, 
    InferCreationAttributes, 
    BelongsToManyGetAssociationsMixin, 
    BelongsToManyAddAssociationMixin, 
    BelongsToManyAddAssociationsMixin, 
    BelongsToManySetAssociationsMixin, 
    BelongsToManyRemoveAssociationMixin, 
    BelongsToManyRemoveAssociationsMixin, 
    BelongsToManyHasAssociationMixin, 
    BelongsToManyHasAssociationsMixin, 
    BelongsToManyCountAssociationsMixin, 
    BelongsToManyCreateAssociationMixin, 
    NonAttribute,
    CreationOptional,
    Association,
    HasManyGetAssociationsMixin,
    HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin,
    HasManyRemoveAssociationMixin,
    HasManyRemoveAssociationsMixin,
    HasManySetAssociationsMixin,
    HasManyHasAssociationMixin,
    HasManyHasAssociationsMixin,
    HasManyCreateAssociationMixin,
    HasManyCountAssociationsMixin} from "sequelize";

import Track from "./Track.js";
import Album from "./Album.js";

export default class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>>{

    declare id: CreationOptional<typeof DataTypes.UUID>;
    declare name: string;
    declare picturePath: null | string;

    // Tracks associations
    declare getTracks: BelongsToManyGetAssociationsMixin<Track>;
    declare addTrack: BelongsToManyAddAssociationMixin<Track, typeof DataTypes.UUID>;
    declare addTracks: BelongsToManyAddAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare removeTrack: BelongsToManyRemoveAssociationMixin<Track, typeof DataTypes.UUID>;
    declare removeTracks: BelongsToManyRemoveAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare setTracks: BelongsToManySetAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare hasTrack: BelongsToManyHasAssociationMixin<Track, typeof DataTypes.UUID>;
    declare hasTracks: BelongsToManyHasAssociationsMixin<Track, typeof DataTypes.UUID>;
    declare createTrack: BelongsToManyCreateAssociationMixin<Track>;
    declare countTracks: BelongsToManyCountAssociationsMixin;
    declare tracks?: NonAttribute<Track[]>;

    // Albums Assotiations
    declare getAlbums: HasManyGetAssociationsMixin<Album>;
    declare addAlbum: HasManyAddAssociationMixin<Album, typeof DataTypes.UUID>;
    declare addAlbums: HasManyAddAssociationsMixin<Album, typeof DataTypes.UUID>;
    declare removeAlbum: HasManyRemoveAssociationMixin<Album, typeof DataTypes.UUID>;
    declare removeAlbums: HasManyRemoveAssociationsMixin<Album, typeof DataTypes.UUID>;
    declare setAlbums: HasManySetAssociationsMixin<Album, typeof DataTypes.UUID>;
    declare hasAlbum: HasManyHasAssociationMixin<Album, typeof DataTypes.UUID>;
    declare hasAlbums: HasManyHasAssociationsMixin<Album, typeof DataTypes.UUID>;
    declare createAlbum: HasManyCreateAssociationMixin<Album>;
    declare countAlbums: HasManyCountAssociationsMixin;
    declare albums?: NonAttribute<Album[]>

    declare static associations: {
        tracks: Association<Artist, Track>,
        albums: Association<Artist, Album>
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
            allowNull: false,
            unique: true
        },
        picturePath: DataTypes.STRING
    }
}