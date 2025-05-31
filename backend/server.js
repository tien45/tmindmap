const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config({ path: './process.env' });
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const authRoute = require('./auth');
const forgotPasswordRoutes = require('./forgotPassword');
const mindmapAI = require('./mindmapAI');
const listmm = require('./listMindmap');


const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/', authRoute);
app.use('/api/auth', forgotPasswordRoutes);
app.use('/api', mindmapAI);
app.use(express.urlencoded({ extended: true }));
app.use('/api/listMindmap', listmm)
app.get('/', (req, res) => {
    res.send("API đang chạy ...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));
connectDB();
const jwtSecret = process.env.JWT_SECRET;
console.log(`Chuỗi bí mật JWT: ${jwtSecret}`);
console.log('MONGO_URL:', process.env.MONGO_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
