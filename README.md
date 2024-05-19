# Guide on using AWS S3 Bucket with NodeJS & MySQL

This is a guide to help you on how you can implement AWS S3 bucket to store images and strong images record on MySQL on NodeJS


##Initial Setup after clone
Install all the dependencies needed at the start
```
npm i
```


## Setting Up MySQL Connection in NodeJS
** This step assumes that you know how to set up a MySQL database on your local machine **

Install both `mysql12` and `sequelize`
```
npm i mysql12 sequelize
```

`mysql12` is a MySQL client for Node.js with focus on performance \
`sequelize` is an easy-to-use and promise-based Object-Relational Mapping (ORM) tool for MySQL and other databases.


Create folder `models` in `Server` folder \
Create file `db.js` in  `models` folder

In `db.js`, add these codes inside
``` javascript
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
```
This creates a Sequelize instance which will be able to connect to you MySQL Server. 

