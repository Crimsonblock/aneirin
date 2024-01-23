import { Association, BelongsToGetAssociationMixin, CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";
import User from "./User.js";

export default class AuthenticationToken extends Model<InferAttributes<AuthenticationToken>, InferCreationAttributes<AuthenticationToken>>{

    declare id: CreationOptional<typeof DataTypes.UUID>
    declare lastUsed: Date;
    declare userId: ForeignKey<User["id"]>

    declare getUser: BelongsToGetAssociationMixin<User>;
    declare user?: NonAttribute<User>;

    declare static associations: {
        user: Association<AuthenticationToken, User>
    }

    static modelAttributes = {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        lastUsed: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }
}