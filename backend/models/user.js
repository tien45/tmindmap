const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const userSchema = new mongoose.Schema(
    {
        uid: { type: String, required: true, unique: true, default: uuidv4 },
        name: { type: String, required: true },
        phone: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String }, // Nếu đăng nhập bằng OAuth, password có thể để trống
        photoURL: { type: String },
        provider: { type: String, default: 'local' }, // 'local', 'google', 'facebook'
        providerId: { type: String }
    },
    { timestamps: true }
);


module.exports = mongoose.model('User', userSchema);