import { Model, DataTypes } from "sequelize";


class Genre extends Model {
    modelAttributes = {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
}