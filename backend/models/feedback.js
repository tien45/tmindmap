const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const feedbackSchema = new mongoose.Schema(
    {
        // Mongoose tự tạo _id (ObjectId) làm khóa chính
        // Thêm trường feedback_id để lưu một mã định danh độc nhất (ở đây sử dụng uuid)
        feedback_id: {
            type: String,
            required: true,
            unique: true,
            default: uuidv4 // hoặc bạn có thể tự sinh trong route
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        // Nội dung phản hồi
        content: {
            type: String,
            required: true
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
