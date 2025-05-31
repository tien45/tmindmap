const mongoose = require('mongoose');
console.log('MONGO_URI:', process.env.MONGO_URI);
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB kết nối thành công!');
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
