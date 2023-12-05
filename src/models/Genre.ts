import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";


export default class Genre extends Model<InferAttributes<Genre>, InferCreationAttributes<Genre>> {
    declare id: CreationOptional<number>;
    declare name: string;

    static modelAttributes = {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}