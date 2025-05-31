const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('./models/user');

// Lưu mã xác thực tạm thời (cho demo; trong production nên lưu vào DB hoặc cache như Redis)
const resetTokens = {};

/**
 * Route gửi mã xác thực qua Email
 * POST /api/auth/forgot-password
 * Yêu cầu body: { email }
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email của bạn.' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Không tìm thấy người dùng với email này.' });
        }
        // Tạo mã xác thực 6 chữ số
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Lưu mã cùng thời hạn (10 phút)
        resetTokens[user._id] = { code, expires: Date.now() + 10 * 60 * 1000 };

        // Cấu hình transporter cho nodemailer (điều chỉnh theo cấu hình email của bạn)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'dtc21h4802010284@ictu.edu.vn',
                pass: 'ouqi uvnk pfka jsee' // Sử dụng App Password nếu bật 2FA
            }
        });

        const mailOptions = {
            from: 'dtc21h4802010284@ictu.edu.vn',
            to: email,
            subject: 'Mã xác thực đặt lại mật khẩu',
            text: `Mã xác thực của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`
        };

        await transporter.sendMail(mailOptions);

        // Trả về userId (nếu cần) để frontend dùng cho bước xác thực tiếp theo
        res.json({ message: 'Mã xác thực đã được gửi. Vui lòng kiểm tra email của bạn.', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

/**
 * Route xác thực mã
 * POST /api/auth/verify-code
 * Yêu cầu body: { userId, code }
 */
router.post('/verify-code', async (req, res) => {
    try {
        const { userId, code } = req.body;
        const tokenData = resetTokens[userId];
        if (!tokenData || tokenData.code !== code || tokenData.expires < Date.now()) {
            return res.status(400).json({ message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }
        res.json({ message: 'Xác thực thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

/**
 * Route đặt lại mật khẩu mới
 * POST /api/auth/reset-password
 * Yêu cầu body: { userId, code, newPassword }
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, code, newPassword } = req.body;
        const tokenData = resetTokens[userId];
        if (!tokenData || tokenData.code !== code || tokenData.expires < Date.now()) {
            return res.status(400).json({ message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }
        // Mã hóa mật khẩu mới và cập nhật người dùng
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });
        // Xóa token sau khi đặt lại mật khẩu thành công
        delete resetTokens[userId];
        res.json({ message: 'Mật khẩu đã được đặt lại thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

module.exports = router;


