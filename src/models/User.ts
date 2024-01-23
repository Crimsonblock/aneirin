import { Model, 
    DataTypes, 
    CreationOptional, 
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
    NonAttribute,
    Association,
 } from "sequelize";


import AuthenticationToken from "./AuthenticationToken.js";
import Playlist from "./Playlist.js";

export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

    declare id: CreationOptional<typeof DataTypes.UUID>;
    declare username: string;
    declare password: string;
    declare email?: string;
    declare salt: string;
    declare isAdmin: boolean;

    // Tokens associations
    declare getAuthenticationTokens: HasManyGetAssociationsMixin<AuthenticationToken>;
    declare addAuthenticationToken: HasManyAddAssociationMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare addAuthenticationTokens: HasManyAddAssociationsMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare setAuthenticationTokens: HasManySetAssociationsMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare removeAuthenticationToken: HasManyRemoveAssociationMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare removeAuthenticationTokens: HasManyRemoveAssociationsMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare hasAuthenticationToken: HasManyHasAssociationMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare hasAuthenticationTokens: HasManyHasAssociationsMixin<AuthenticationToken, typeof DataTypes.UUID>;
    declare countAuthenticationTokens: HasManyCountAssociationsMixin;
    // @ts-ignore
    declare createAuthenticationToken: HasManyCreateAssociationMixin<AuthenticationToken, "userId">
    declare authenticationTokens?: NonAttribute<AuthenticationToken>;

    // Playlists associations
    declare getPlaylists: HasManyGetAssociationsMixin<Playlist>;
    declare addPlaylist: HasManyAddAssociationMixin<Playlist, typeof DataTypes.UUID>;
    declare addPlaylists: HasManyAddAssociationsMixin<Playlist, typeof DataTypes.UUID>;
    declare setPlaylists: HasManySetAssociationsMixin<Playlist, typeof DataTypes.UUID>;
    declare removePlaylist: HasManyRemoveAssociationMixin<Playlist, typeof DataTypes.UUID>;
    declare removePlaylists: HasManyRemoveAssociationsMixin<Playlist, typeof DataTypes.UUID>;
    declare hasPlaylist: HasManyHasAssociationMixin<Playlist, typeof DataTypes.UUID>;
    declare hasPlaylists: HasManyHasAssociationsMixin<Playlist, typeof DataTypes.UUID>;
    declare countPlaylists: HasManyCountAssociationsMixin;
    // @ts-ignore
    declare createPlaylist: HasManyCreateAssociationMixin<Playlist, "userId">
    declare playlists: NonAttribute<Playlist>

    declare static associations: {
        authenticationTokens: Association<User, AuthenticationToken>,
        playlists: Association<User, Playlist>
    }

    static modelAttributes = {
        id:{
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email:{
            type: DataTypes.STRING,
            allowNull: true
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }
}

export interface IUser{
    username: string,
    password: string,
    email?: string,
    salt: string,
    isAdmin: boolean
}