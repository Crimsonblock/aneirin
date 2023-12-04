import { Model, DataTypes } from "sequelize"

class Track extends Model{
    modelAttributes = {
        id:{
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
            type: DataTypes.NUMBER,
            allowNull: false
        },
        diskNr: DataTypes.SMALLINT,
        year:{
            type: DataTypes.NUMBER,
            allowNull: false
        },
        duration: {
            type: DataTypes.NUMBER,
            allowNull: false
        }
    }
}