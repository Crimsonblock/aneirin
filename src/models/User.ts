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
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
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
