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
    // Create an S3 client service object
    const imageUUID = req.query.uuid;

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


