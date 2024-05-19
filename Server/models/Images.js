import { DataTypes } from "sequelize";
import sequelize from "./db.js";

const Image = sequelize.define("Image", {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true        
    },
    originalName: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'images'
});

export default Image;