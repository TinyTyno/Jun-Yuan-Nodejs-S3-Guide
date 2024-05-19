import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize =  new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PWD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
    }
)

sequelize.sync().then(() => {
}).catch((err) => {
    console.log('Error connecting to the Database: ', err);
})

export default sequelize;