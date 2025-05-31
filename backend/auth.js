const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const authMiddleware = require('./authMiddleware');
const Feedback = require('./models/feedback');

router.post('/api/auth/signup', async (req, res) => {
    console.log("Dữ liệu nhận được:", req.body);
    try {
        const { name, phone, email, pass, confirmPass } = req.body;

        // Kiểm tra dữ liệu rỗng
        if (!name || !phone || !email || !pass || !confirmPass) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Số điện thoại phải có đúng 10 chữ số!' });
        }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).json({ message: 'Email không đúng định dạng!' });
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/.test(pass)) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt!'
            });
        }
        // Kiểm tra mật khẩu có khớp không
        if (pass !== confirmPass) {
            return res.status(400).json({ message: 'Mật khẩu không khớp!' });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được đăng ký!' });
        }

        // Mã hoá mật khẩu
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Tạo user mới
        const newUser = new User({
            name,
            phone,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error("Lỗi ở endpoint signup:", error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});
// Route đăng nhập
router.post('/signin', async (req, res) => {
    try {
        const { email, pass } = req.body;

        // Kiểm tra xem có đầy đủ thông tin hay không
        if (!email || !pass) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }

        // Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại!' });
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng!' });
        }

        // Tạo token (bạn có thể thay JWT_SECRET bằng biến môi trường)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '1h' });

        res.status(200).json({ message: 'Đăng nhập thành công!', token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server!' });
    }
});
// Ví dụ, trong routes/auth.js
router.post('/saveUser', async (req, res) => {
    try {
        const { uid, name, email, photoURL } = req.body;
        // Tìm user theo uid
        let user = await User.findOne({ uid });
        if (!user) {
            user = new User({ uid, name, email, photoURL });
            await user.save();
        }
        res.json({ message: "User saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const { uid } = req.user;           // payload luôn có uid
        if (!uid) {
            return res.status(400).json({ message: 'Invalid UID' });
        }

        // Query duy nhất trên uid
        const user = await User.findOne({ uid })
            .select('-password -__v');
        console.log('user', user)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        console.error('Error /profile:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        // 1) Lấy identifier đã gán trong authMiddleware
        const { provider, id: providerId, uid } = req.user;

        // 2) Chỉ cho phép update 2 field: name, phone
        const { name, phone } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Tên không được để trống' });
        }

        // 3) Xác định query sao cho match đúng document
        let query;
        if (provider === 'local') {
            // nếu bạn dùng uid chung cho tất cả
            query = { uid };
            // hoặc nếu không, dùng: query = { _id: providerId }
        } else if (provider === 'firebase') {
            // nếu bạn đã ghi đè uid = fb.uid
            query = { uid };
            // hoặc: query = { provider: 'firebase', providerId }
        }

        // 4) Cập nhật
        const updated = await User.findOneAndUpdate(
            query,
            { name, phone },
            { new: true, runValidators: true, context: 'query' }
        ).select('-password -__v');

        if (!updated) {
            return res.status(404).json({ message: 'Không tìm thấy user để cập nhật' });
        }

        res.json({ user: updated });
    } catch (err) {
        console.error('Error in PUT /profile:', err);
        res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
    }
});
router.post('/feedback', async (req, res) => {
    try {
        // Lấy dữ liệu phản hồi từ request body
        const { name, email, content } = req.body;

        if (!name || !email || !content) {
            return res.status(400).json({ message: 'Thiếu thông tin: name, email và content là bắt buộc.' });
        }
        const feedback = new Feedback({
            name,
            email,
            content
            // feedback_id được tạo tự động theo default nếu bạn đặt default: uuidv4
        });

        await feedback.save();
        // Hiển thị thông tin phản hồi trên terminal (cho admin biết)
        console.log("-------------------------------------------------");
        console.log("Feedback mới nhận được:");
        console.log("ID:", feedback._id.toString());
        console.log("Feedback ID:", feedback.feedback_id);
        console.log("Name:", feedback.name);
        console.log("Email:", feedback.email);
        console.log("Content:", feedback.content);
        console.log("Created At:", feedback.createdAt);
        console.log("Updated At:", feedback.updatedAt);
        console.log("-------------------------------------------------");

        res.status(200).json({ message: "Phản hồi đã được gửi thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
});
module.exports = router;
