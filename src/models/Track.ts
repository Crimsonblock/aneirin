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
    ForeignKey,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyAddAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyRemoveAssociationsMixin,
    BelongsToManySetAssociationsMixin,
    BelongsToManyHasAssociationMixin,
    BelongsToManyHasAssociationsMixin,
    BelongsToManyCountAssociationsMixin,
} from "sequelize";

// Models import
import Album from "./Album.js";
import Artist from "./Artist.js";
import Genre from "./Genre.js";
import Playlist from "./Playlist.js";

export default class Track extends Model<InferAttributes<Track>, InferCreationAttributes<Track>> {

    // Tracks fields
    declare id: CreationOptional<typeof DataTypes.UUID>;
    declare title: string;
    declare trackNr: number;
    declare diskNr: number | null;
    declare year: number;
    declare duration: number;
    declare albumId: ForeignKey<Album["id"]>;

    // Album association declarations
    declare getAlbum: BelongsToGetAssociationMixin<Album>;
    declare setAlbum: BelongsToSetAssociationMixin<Album, typeof DataTypes.UUID>;
    declare createAlbum: BelongsToCreateAssociationMixin<Album>;
    declare album?: NonAttribute<Album>;

    // Artist associations
    declare getArtists: BelongsToManyGetAssociationsMixin<Artist>;
    declare addArtist: BelongsToManyAddAssociationMixin<Artist, typeof DataTypes.UUID>;
    declare addArtists: BelongsToManyAddAssociationsMixin<Artist, typeof DataTypes.UUID>;
    declare removeArtist: BelongsToManyRemoveAssociationMixin<Artist, typeof DataTypes.UUID>;
    declare removeArtists: BelongsToManyRemoveAssociationsMixin<Artist, typeof DataTypes.UUID>;
    declare setArtists: BelongsToManySetAssociationsMixin<Artist, typeof DataTypes.UUID>;
    declare hasArtist: BelongsToManyHasAssociationMixin<Artist, typeof DataTypes.UUID>;
    declare hasArtists: BelongsToManyHasAssociationsMixin<Artist, typeof DataTypes.UUID>;
    declare countArtists: BelongsToManyCountAssociationsMixin;
    declare artists?: NonAttribute<Artist[]>;

    // Genres associations
    declare getGenres: BelongsToManyGetAssociationsMixin<Genre>;
    declare addGenre: BelongsToManyAddAssociationMixin<Genre, typeof DataTypes.UUID>;
    declare addGenres: BelongsToManyAddAssociationsMixin<Genre, typeof DataTypes.UUID>;
    declare removeGenre: BelongsToManyRemoveAssociationMixin<Genre, typeof DataTypes.UUID>;
    declare removeGenres: BelongsToManyRemoveAssociationsMixin<Genre, typeof DataTypes.UUID>;
    declare setGenres: BelongsToManySetAssociationsMixin<Genre, typeof DataTypes.UUID>;
    declare hasGenre: BelongsToManyHasAssociationMixin<Genre, typeof DataTypes.UUID>;
    declare hasGenres: BelongsToManyHasAssociationsMixin<Genre, typeof DataTypes.UUID>;
    declare countGenres: BelongsToManyCountAssociationsMixin;
    declare genres?: NonAttribute<Genre[]>;

    // Playlists asosciations
    declare getPlaylists: BelongsToManyGetAssociationsMixin<Playlist>
    declare addPlaylist: BelongsToManyAddAssociationMixin<Playlist, typeof DataTypes.UUID>
    declare addPlaylists: BelongsToManyAddAssociationsMixin<Playlist, typeof DataTypes.UUID>
    declare setPlaylists: BelongsToManySetAssociationsMixin<Playlist, typeof DataTypes.UUID>
    declare removePlaylist: BelongsToManyRemoveAssociationMixin<Playlist, typeof DataTypes.UUID>
    declare removePlaylists: BelongsToManyRemoveAssociationsMixin<Playlist, typeof DataTypes.UUID>
    declare hasPlaylist: BelongsToManyHasAssociationMixin<Playlist, typeof DataTypes.UUID>
    declare hasPlaylists: BelongsToManyHasAssociationsMixin<Playlist, typeof DataTypes.UUID>
    declare countPlaylists: BelongsToManyCountAssociationsMixin;
    declare playlists?: NonAttribute<Playlist[]>;

    declare static associations: {
        artists: Association<Track, Artist>,
        album: Association<Track, Album>,
        genres: Association<Track, Genre>,
        playlists: Association<Track, Playlist>
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