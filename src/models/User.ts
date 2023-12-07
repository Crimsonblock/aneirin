import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";

export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

    declare id: CreationOptional<typeof DataTypes.UUID>;
    declare username: string;
    declare password: string;
    declare salt: string;
    declare isAdmin: boolean;



    static modelAttributes = {
        id:{
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        }
    }
}
