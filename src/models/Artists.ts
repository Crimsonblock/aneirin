import { Model, DataTypes } from "sequelize";


class Artist extends Model{
    modelAttributes = {
        id:{
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey:true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        picturePath: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}