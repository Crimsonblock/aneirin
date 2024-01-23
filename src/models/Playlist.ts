import { Association, BelongsToGetAssociationMixin, 
    BelongsToManyAddAssociationMixin, 
    BelongsToManyAddAssociationsMixin, 
    BelongsToManyCountAssociationsMixin, 
    BelongsToManyGetAssociationsMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyHasAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyRemoveAssociationsMixin,
    BelongsToManySetAssociationsMixin, 
    BelongsToSetAssociationMixin, 
    CreationOptional, 
    DataTypes, 
    ForeignKey, 
    InferAttributes, 
    InferCreationAttributes, 
    Model, 
    NonAttribute} from "sequelize";
import User from "./User.js";
import { BelongsToCreateAssociationMixin } from "sequelize";
import Track from "./Track.js";

export default class Playlist extends Model<InferAttributes<Playlist>, InferCreationAttributes<Playlist>>{

    declare id: CreationOptional<typeof DataTypes.UUID>
    declare name: string;
    declare isPublic: boolean;
    declare userId: ForeignKey<User["id"]>;

    // User assotiations
    declare getUser: BelongsToGetAssociationMixin<User>;
    declare setUser: BelongsToSetAssociationMixin<User, typeof DataTypes.UUID>;
    declare createUser: BelongsToCreateAssociationMixin<User>;
    declare user?: NonAttribute<User>;
    
    // Tracks associations
    declare getTracks: BelongsToManyGetAssociationsMixin<Track>
    declare addTrack: BelongsToManyAddAssociationMixin<Track, typeof DataTypes.UUID>
    declare addTracks: BelongsToManyAddAssociationsMixin<Track, typeof DataTypes.UUID>
    declare setTracks: BelongsToManySetAssociationsMixin<Track, typeof DataTypes.UUID>
    declare removeTrack: BelongsToManyRemoveAssociationMixin<Track, typeof DataTypes.UUID>
    declare removeTracks: BelongsToManyRemoveAssociationsMixin<Track, typeof DataTypes.UUID>
    declare hasTrack: BelongsToManyHasAssociationMixin<Track, typeof DataTypes.UUID>
    declare hasTracks: BelongsToManyHasAssociationsMixin<Track, typeof DataTypes.UUID>
    declare countTracks: BelongsToManyCountAssociationsMixin;
    declare tracks?: NonAttribute<Track[]>;

    declare static associations: {
        user: Association<Playlist, User>,
        tracks: Association<Playlist, Track>
    }


    static modelAttributes = {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isPublic:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
}