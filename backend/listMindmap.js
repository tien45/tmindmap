const express = require('express');
const router = express.Router();
const admin = require('./config/firebaseAdmin');
const ListMindmap = require('./models/listMindmap');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

router.use(bodyParser.json({ limit: '500mb' }));
router.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

async function verifyAnyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        return res.status(401).json({ error: 'Invalid Authorization header format' });
    }

    let fbError;
    // 1. Attempt Firebase authentication
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email
        };
        return next();
    } catch (err) {
        fbError = err;
        console.warn('Firebase auth failed:', err.code);
        // If token is missing 'kid' claim or not a Firebase token, fall through to custom JWT
        if (err.code !== 'auth/argument-error') {
            // For other Firebase errors like expired token, reject
            return res.status(401).json({ error: 'Invalid or expired Firebase token' });
        }
    }

    // 2. Attempt custom JWT verification
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
        const user = await User.findById(payload.id || payload.uid);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = {
            uid: user._id.toString(),
            email: user.email,
            name: user.name
        };
        return next();
    } catch (jwtErr) {
        console.error('Auth failed (Firebase):', fbError);
        console.error('Auth failed (JWT):', jwtErr);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
// POST /api/listMindmap — lưu mới
router.post('/', verifyAnyToken, async (req, res) => {
    const {
        title,
        imageUrl,    // thumbnail PNG hoặc URL
        svgMarkup,   // chuỗi SVG gốc
        type,        // 'ai' hoặc 'manual'
        mapType,     // chỉ cần với AI
        mindmapData, // chỉ cần với AI
        manualData   // chỉ cần với Manual
    } = req.body;
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Thiếu hoặc không hợp lệ trường title (phải là chuỗi)' });
    }
    // --- Validation chung ---
    if (!title || !imageUrl || !type) {
        return res.status(400).json({ error: 'Thiếu title, imageUrl hoặc type' });
    }
    if (!['ai', 'manual'].includes(type)) {
        return res.status(400).json({ error: 'Type phải là "ai" hoặc "manual"' });
    }

    // Với AI-generated
    if (type === 'ai') {
        if (!mapType || !mindmapData) {
            return res.status(400).json({ error: 'Thiếu mapType hoặc mindmapData cho AI map' });
        }
        if (!['bubble', 'tree', 'flow', 'multiFlow', 'brace', 'free'].includes(mapType)) {
            return res.status(400).json({ error: 'mapType không hợp lệ' });
        }
    }

    // Với Manual
    if (type === 'manual') {
        if (!manualData || !Array.isArray(manualData.nodes) || !Array.isArray(manualData.links)) {
            return res.status(400).json({ error: 'Thiếu manualData.nodes hoặc manualData.links cho manual map' });
        }
        if (!svgMarkup) {
            return res.status(400).json({ error: 'Thiếu svgMarkup để edit lại sơ đồ manual' });
        }
    }

    try {
        const data = {
            name: req.user.name,
            title: title.trim(),
            imageUrl: imageUrl.trim(),
            svgMarkup: svgMarkup || undefined,
            type,
            uid: req.user.uid
        };

        if (type === 'ai') {
            data.mapType = mapType;
            data.mindmapData = mindmapData;
        } else if (type === 'manual') {
            data.manualData = manualData;
        }

        const item = new ListMindmap(data);
        await item.save();

        return res.status(201).json({
            success: true,
            message: 'Lưu sơ đồ thành công',
            item
        });
    } catch (err) {
        console.error('Error saving mindmap:', err);
        return res.status(500).json({ error: 'Lỗi server, vui lòng thử lại' });
    }
});

module.exports = router;



// GET /api/listMindmap — lấy danh sách mindmap
router.get('/Listmm', verifyAnyToken, async (req, res) => {
    try {
        // Lấy đúng uid của user đã auth
        const uid = req.user.uid;
        // Chỉ trả về mindmap có ownerUid trùng với uid này
        const items = await ListMindmap
            .find({ uid: uid })
            .sort({ createdAt: -1 });
        res.json({ list: items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
//hien thi mm
router.get('/:id', verifyAnyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const item = await ListMindmap
            .findOne({ _id: id, name: req.user.name })
            .select('title type mapType mindmapData manualData');

        if (!item) {
            return res.status(404).json({ error: 'Mindmap not found' });
        }

        // Trả về đúng payload để front-end draw lại
        const payload = {
            title: item.title,
            mapType: item.type === 'ai' ? item.mapType : 'manual'
        };
        if (item.type === 'manual') {
            payload.manualData = item.manualData;
        } else {
            payload.mindmapData = item.mindmapData;
        }
        console.log('payload', payload);
        return res.json(payload);
    } catch (err) {
        console.error('Error fetching mindmap:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

const ADMIN_NAME = 'ĐINH HOÀNG TIÊN';
router.get('/', async (req, res) => {
    try {
        const suggestions = await ListMindmap.find(
            { name: ADMIN_NAME },
            { title: 1, imageUrl: 1, mindmapData: 1, mapType: 1 }
        ).sort({ createdAt: -1 });
        res.json(suggestions);
    } catch (err) {
        console.error('Error fetching suggestions:', err.stack);
        console.log(err);
        res.status(500).json({ error: 'Lỗi server khi lấy gợi ý sơ đồ tư duy.' });
    }

});
// DELETE /api/listMindmap/:id — xóa mindmap
router.delete('/:id', verifyAnyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ListMindmap.deleteOne({ _id: id, name: req.user.name });
        if (!result.deletedCount) {
            return res.status(404).json({ error: 'Not found or no permission' });
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/:id', verifyAnyToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; // middleware phải gán req.user

    // Chỉ update những trường frontend cho phép
    const update = {};
    if (req.body.type) update.type = req.body.type;
    if (req.body.mapType) update.mapType = req.body.mapType;
    if (req.body.manualData) update.manualData = req.body.manualData;
    if (req.body.mindmapData) update.mindmapData = req.body.mindmapData;
    if (req.body.title) update.title = req.body.title;
    if (req.body.svgMarkup) update.svgMarkup = req.body.svgMarkup;
    if (req.body.imageUrl) update.imageUrl = req.body.imageUrl;

    try {
        const updated = await ListMindmap.findOneAndUpdate(
            { _id: id, name: req.user.name },
            { $set: update },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Không tìm thấy mindmap hoặc không có quyền' });
        }

        res.json(updated);
    } catch (err) {
        console.error('Update mindmap error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật' });
    }
});

module.exports = router;
