import express from 'express';
import dotenv from 'dotenv';


dotenv.config();

//App Config
const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL
}));
const port = process.env.SERVER_PORT || 3001;

app.get('/', (req, res) => {
    res.status(200).send('Hello World');
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

