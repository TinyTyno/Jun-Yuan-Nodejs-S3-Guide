# Guide on using AWS S3 Bucket with NodeJS & MySQL

This is a guide to help you on how you can implement AWS S3 bucket to store images and strong images record on MySQL on NodeJS


##Initial Setup after clone
Install all the dependencies needed at the start
```
npm i
```


## Setting Up MySQL Connection in NodeJS
_This step assumes that you know how to set up a MySQL database on your local machine_

Install both `mysql12` and `sequelize`
```
npm i mysql12 sequelize
```

`mysql12` is a MySQL client for Node.js with focus on performance \
`sequelize` is an easy-to-use and promise-based Object-Relational Mapping (ORM) tool for MySQL and other databases.
\
\
### Setting Up a Sequelize Instance
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
This creates a Sequelize instance which will be able to connect to your MySQL Server. 

In `.env` file, add these
```
#MYSQL
DB_HOST = #DB Host
DB_PORT = #DB Port
DB_USER = #DB User
DB_PWD = #DB Password
DB_NAME = #DB Name
```

Add in all the connection details of your db to allow Sequelize to connect to your DB \

In `index.js`, edit these lines of code \
<strike>
``` javascript
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
```
</strike>
\
``` javascript
sequelize.authenticate().then(() => {
    console.log('Connected to the database');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.log('Error connecting to the database', error);
})
```
\
\
### Creating an Entity in MySQL

In `models` folder, create a new file call `Images.js` \ 
\ 
Add these into `Images.js`
``` javascript
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
```
This file now will create an entity call `Images` where you will use it later to create an instance of this entity in your MySQL server







