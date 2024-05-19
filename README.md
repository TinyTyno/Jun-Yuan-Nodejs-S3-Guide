# Guide on using AWS S3 Bucket with NodeJS & MySQL

This is a guide to help you on how you can implement AWS S3 bucket to store images and store images record on MySQL on NodeJS. We are using ESM version, `"type" : "module"` for our NodeJS.
</br>
</br>
</br>
_This guide assumes that you understand how to create S3 Bucket & IAM in AWS & know how to set up MySQL database._

Table of content:
* [Initial Setup after clone](#initial-setup-after-clone)
* [Setting Up MySQL Connection in NodeJS](setting-up-mysql-connection-in-nodejs)
* [Add Upload Feature](add-upload-feature)
* [Retrieving our image from S3](#retrieving-our-image-from-s3)
* [Delete Obejct in S3](#delete-obejct-in-s3)
* [Summary](#summary)


## Initial Setup after clone
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
`sequelize` is an easy-to-use and promise-based Object-Relational Mapping (ORM) tool for MySQL and other databases. \
</br>
</br>

### Setting Up a Sequelize Instance
Create folder `models` in `Server` folder
</br>
</br>
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
</br>
</br>
In `.env` file, add these
```
#MYSQL
DB_HOST = #DB Host
DB_PORT = #DB Port
DB_USER = #DB User
DB_PWD = #DB Password
DB_NAME = #DB Name
```

Add in all the connection details of your db to allow Sequelize to connect to your DB
</br>
</br>
In `index.js`, edit these lines of code
</br>
</br>
Remove:
</br>
<strike>
``` javascript
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
```
</strike>

Add:
``` javascript
import sequelize from './models/db.js';
```
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

### Create an Entity
In `models` folder, create a new file call `Images.js` 
</br>
</br>
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
</br>
</br>
Add `Images` in `index.js` to use it
``` javascript
import Image from './models/Images.js';
```


## Add Upload Feature

### Adding New Dependcies
Install these dependencies: `multer` & `sharp` & `uuid`
```
npm i multer sharp uuid
```
`mutler` is a middleware where you can accept images from the frontend
</br>
`sharp` allows you to resize your images
</br>
`uuid` allows you to be able to generate a Unique ID to be used as the primary key for your image
</br>
</br>
Add these lines of code:
``` javascript
//Multer Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
```
This will have the image received to be stored in the memory temporarily

### Creating Post Request to receive images
Edit these few lines of code
</br>
</br>
Remove:
<strike>
``` javascript
app.get('/', (req, res) => {
    res.status(200).send('Hello World');
});
```
</strike>

Add:
``` javascript
app.post('/upload', upload.single('image'), async (req, res) => {
    //To be Added
})
```
`upload.single('image')` indicates that only 1 image can be received
</br>
</br>
</br>
We will next take the image received and resize our image with `sharp` and generate a UUID for our image
``` javascript
app.post('/upload', upload.single('image'), async (req, res) => {
    //Getting the Image from the request
        const file = req.file;
        const uuid = uuidv4();
    
    //Resizing the Image
    const fileBuffer = await sharp(file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();

    //Continue...
})
```
### Initalising AWS S3 & Creating AWS S3 Action
We will first have to install `@aws-sdk/client-s3` dependency and import into `index.js`
```
npm i @aws-sdk/client-s3
```
``` javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
```
Next we will create a S3 client to allow us to connect to AWS S3 and create the action that we want to do, which in this case is to `PutObjectCommand`
``` javascript
//Uploading the Image to S3
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    // Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uuid,
        Body: fileBuffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    //Continue...
```
You will have to specify the region where the S3 Bucket is located and the IAM credentials in order to connect to AWS. S3 is a object-based storage, therefore items are stored in Key/Value pair. The `params` specifies our S3 bucket name, the Key to access our image, the Value is specified as Body and lastly the content type.
</br>
</br>
</br>
Next we will add our AWS credentials in `.env` file
```
#AWS
BUCKET_REGION = #Bucket Region
BUCKET_NAME = #Bucket Name
ACCESS_KEY_ID = #Access Key
SECRET_ACCESS_KEY = #Secret Access Key
```
Fill in your credentails here
### Uploading Image to S3 and Adding a record in MySQL
We will want to first upload our image to S3 and next store the data into our MySQL server
``` javascript
try {
        //Upload to S3
        await s3Client.send(command);
        console.log('Uploaded image to S3');

        //Saving the Image to the Database
        await Image.create({
            uuid: uuid,
            originalName: file.originalname
        });

        //Syncing the Database
        sequelize.sync().then(() => {
            console.log('Image saved to the database');
        }).catch((error) => {
            console.log('Error saving image to the database', error);
        });

        res.status(200).send(uuid);
    } catch (error) {
        console.log('Error uploading image to S3', error);
        res.status(500).send('Error uploading image to S3');
    }
```
`s3Client.send(command)` will send our image to S3
</br>
</br>
`Image.create()` will use our `Image` model defined earlier to create an instance of `Image` with our primary key in S3 and the original name of the image. We will next use `sequelize.sync()` to help us update our table in our MySQL with our new `Image` instance.
### Final Code for Uploading Image onto S3 in `index.js`
``` javascript
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import sequelize from './models/db.js';
import { v4 as uuidv4 } from 'uuid';
import Image from './models/Images.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

//App Config
const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL
}));
const port = process.env.SERVER_PORT || 3001;

//Multer Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Uploading S3 Image
app.post('/upload', upload.single('image'), async (req, res) => {
    //Getting the Image from the request
    const file = req.file;
    const uuid = uuidv4();

    //Resizing the Image
    const fileBuffer = await sharp(file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();

    //Uploading the Image to S3
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    // Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uuid,
        Body: fileBuffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
        //Upload to S3
        await s3Client.send(command);
        console.log('Uploaded image to S3');

        //Saving the Image to the Database
        await Image.create({
            uuid: uuid,
            originalName: file.originalname
        });

        //Syncing the Database
        sequelize.sync().then(() => {
            console.log('Image saved to the database');
        }).catch((error) => {
            console.log('Error saving image to the database', error);
        });

        res.status(200).send(uuid);
    } catch (error) {
        console.log('Error uploading image to S3', error);
        res.status(500).send('Error uploading image to S3');
    }
});


sequelize.authenticate().then(() => {
    console.log('Connected to the database');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.log('Error connecting to the database', error);
})
```

## Retrieving our image from S3
Nextly we will want to retrieve our image from our S3 Bucket to display for the user
</br>
</br>
</br>
We will first add `GetObjectCommand` in our import
``` javascript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
```

### Creating Get Request to get image from S3
We will create a get request and retrieve the UUID that will be used to retrieve our image
``` javascript
app.get('/retrieveOne', async (req, res) => {
    // Create an S3 client service object
    const imageUUID = req.query.uuid;
//Continue...
})
```
Next would want to create a function to turn our string received later by S3 into a string. S3 will send us our image in the form of `Readable | ReadableStream | Blob`, therefore we need a function to turn these stream into a buffer object then into a string in base64
``` javascript
const streamToString = (stream) =>
        new Promise((resolve, reject) => {    
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
        });
```

### Intialising S3 credentials and S3 GetObjectCommand
Next we would add in the S3 credentails like before and use our `GetObjectCommand`
``` javascript
const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

//Set the parameters
const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: imageUUID
};

//Command to get the object
const command = new GetObjectCommand(params);
var data;
var bodyContents;
```
Different from `PutObjectCommand`, we would only need the `Key` and `Bucket` to retrieve our image. `Key` would be the key we used to store our image and `Bucket` is the name of the bucket we stored our image in.
</br>
</br>
</br>
Next we will retrieve our image from S3 and retrieve the original name of our image from MySQL server
``` javascript
//Retrieve from S3
    try {
        data = await s3Client.send(command);    
        bodyContents = await streamToString(data.Body);
        console.log('Retrieved image from S3');    
    } catch (error) {
        console.log('Error retrieving image from S3', error);
        res.status(500).send('Error retrieving image from S3');
    }

    //Getting Original Name from the Database
    const image = await Image.findOne({
        where: {
            uuid: imageUUID
        }
    });
```
Our image object will be stored as `data` before we use `streamToString()` to convert our stream into a string of base64. We find our image original name using our `Image` model and `sequelize` method `findOne()` to look for our image using the image UUID provided in the reqeust. 

### Crafting our response
Lastly we will prepare our data before sending out our response
``` javascript
//Creating the response body
    var resBody = { 'img': bodyContents, 'name': image.originalName, 'ContentType': data.ContentType}
    res.setHeader('Content-Type', data.ContentType);
    res.status(200).send(resBody);
```
We will store all our data in `resBody` and setting our response header `Content-Type` to the content type of our image to allow the client to know what is the image type. Lastly we sent the response body to the client.
### Final Code for Retrieveing image from S3 in `index.js`
``` javascript
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import sequelize from './models/db.js';
import { v4 as uuidv4 } from 'uuid';
import Image from './models/Images.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

//App Config
const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL
}));
const port = process.env.SERVER_PORT || 3001;

//Multer Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Uploading S3 Image
app.post('/upload', upload.single('image'), async (req, res) => {
    //Getting the Image from the request
    const file = req.file;
    const uuid = uuidv4();

    //Resizing the Image
    const fileBuffer = await sharp(file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();

    //Uploading the Image to S3
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    // Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uuid,
        Body: fileBuffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
        //Upload to S3
        await s3Client.send(command);
        console.log('Uploaded image to S3');

        //Saving the Image to the Database
        await Image.create({
            uuid: uuid,
            originalName: file.originalname
        });

        //Syncing the Database
        sequelize.sync().then(() => {
            console.log('Image saved to the database');
        }).catch((error) => {
            console.log('Error saving image to the database', error);
        });

        res.status(200).send(uuid);
    } catch (error) {
        console.log('Error uploading image to S3', error);
        res.status(500).send('Error uploading image to S3');
    }
});


// Getting S3 Image
app.get('/retrieveOne', async (req, res) => {
    // Create an S3 client service object
    const imageUUID = req.query.uuid;

    const streamToString = (stream) =>
        new Promise((resolve, reject) => {
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
        });

    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    //Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageUUID
    };

    //Command to get the object
    const command = new GetObjectCommand(params);
    var data;
    var bodyContents;

    //Retrieve from S3
    try {
        data = await s3Client.send(command);    
        bodyContents = await streamToString(data.Body);
        console.log('Retrieved image from S3');    
    } catch (error) {
        console.log('Error retrieving image from S3', error);
        res.status(500).send('Error retrieving image from S3');
    }

    //Getting Original Name from the Database
    const image = await Image.findOne({
        where: {
            uuid: imageUUID
        }
    });

    //Creating the response body
    var resBody = { 'img': bodyContents, 'name': image.originalName, 'ContentType': data.ContentType}
    res.setHeader('Content-Type', data.ContentType);
    res.status(200).send(resBody);
})

sequelize.authenticate().then(() => {
    console.log('Connected to the database');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.log('Error connecting to the database', error);
})
```


## Delete Obejct in S3
We will be deleting our image from our S3 bucket and our record in MySQL. The codes are largely the same as `GetObjectCommand`, where the only difference is that we uses `DeleteObjectCommand` to delete our image from S3 and `Image.destroy()` to delete our record from MySQL.
``` javascript
app.post('/delete', async (req, res) => {
    const imageUUID = req.query.uuid;
    
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    //Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageUUID
    };

    //Command to delete the object
    const command = new DeleteObjectCommand(params);

    try {
        //Delete from S3
        await s3Client.send(command);
        console.log('Deleted image from S3');

        //Deleting the Image from the Database
        await Image.destroy({
            where: {
                uuid: imageUUID
            }
        });

        res.status(200).send('Image deleted successfully');
    } catch (error) {
        console.log('Error deleting image from S3', error);
        res.status(500).send('Error deleting image from S3');
    }
});
```

### Final Code for Deleting Image in `index.js`
``` javascript
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import sequelize from './models/db.js';
import { v4 as uuidv4 } from 'uuid';
import Image from './models/Images.js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

//App Config
const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL
}));
const port = process.env.SERVER_PORT || 3001;

//Multer Config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Uploading S3 Image
app.post('/upload', upload.single('image'), async (req, res) => {
    //Getting the Image from the request
    const file = req.file;
    const uuid = uuidv4();

    //Resizing the Image
    const fileBuffer = await sharp(file.buffer)
        .resize({ width: 500, height: 500 })
        .toBuffer();

    //Uploading the Image to S3
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    // Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uuid,
        Body: fileBuffer,
        ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);

    try {
        //Upload to S3
        await s3Client.send(command);
        console.log('Uploaded image to S3');

        //Saving the Image to the Database
        await Image.create({
            uuid: uuid,
            originalName: file.originalname
        });

        //Syncing the Database
        sequelize.sync().then(() => {
            console.log('Image saved to the database');
        }).catch((error) => {
            console.log('Error saving image to the database', error);
        });

        res.status(200).send(uuid);
    } catch (error) {
        console.log('Error uploading image to S3', error);
        res.status(500).send('Error uploading image to S3');
    }
});


// Getting S3 Image
app.get('/retrieveOne', async (req, res) => {
    // Create an S3 client service object
    const imageUUID = req.query.uuid;

    const streamToString = (stream) =>
        new Promise((resolve, reject) => {
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
        });

    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    //Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageUUID
    };

    //Command to get the object
    const command = new GetObjectCommand(params);
    var data;
    var bodyContents;

    //Retrieve from S3
    try {
        data = await s3Client.send(command);    
        bodyContents = await streamToString(data.Body);
        console.log('Retrieved image from S3');    
    } catch (error) {
        console.log('Error retrieving image from S3', error);
        res.status(500).send('Error retrieving image from S3');
    }

    //Getting Original Name from the Database
    const image = await Image.findOne({
        where: {
            uuid: imageUUID
        }
    });

    //Creating the response body
    var resBody = { 'img': bodyContents, 'name': image.originalName, 'ContentType': data.ContentType}
    res.setHeader('Content-Type', data.ContentType);
    res.status(200).send(resBody);
})


// Deleting S3 Image
app.post('/delete', async (req, res) => {
    const imageUUID = req.query.uuid;
    
    // Create an S3 client service object
    const s3Client = new S3Client({
        region: process.env.BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        }
    });

    //Set the parameters
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: imageUUID
    };

    //Command to delete the object
    const command = new DeleteObjectCommand(params);

    try {
        //Delete from S3
        await s3Client.send(command);
        console.log('Deleted image from S3');

        //Deleting the Image from the Database
        await Image.destroy({
            where: {
                uuid: imageUUID
            }
        });

        res.status(200).send('Image deleted successfully');
    } catch (error) {
        console.log('Error deleting image from S3', error);
        res.status(500).send('Error deleting image from S3');
    }
});


sequelize.authenticate().then(() => {
    console.log('Connected to the database');
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.log('Error connecting to the database', error);
})
```

## Summary
We have learnt how to use `sequelize` to create a connection to our MySQL server and create an entity from it. We have also learnt that using `multer` allows us to accept images from the client abd `sharp` to resize our image. Lastly we learnt how to use AWS S3 SDK `PutObjectCommand`, `GetObjectCommand`, `DeleteObjectCommand` to create, get and delete objects from our S3 bucket.



