const mongoose = require('mongoose');
const { Schema } = mongoose;

const ListMindmapSchema = new Schema({
    name: { type: String, required: true },   // tên user
    title: { type: String, required: true },   // tiêu đề sơ đồ
    imageUrl: { type: String, required: true },
    svgMarkup: { type: String },
    type: {
        type: String,
        enum: ['ai', 'manual'],
        required: true
    },
    uid: {        // ← thêm field này
        type: String,
        required: true
    },
    // --- AI-generated map ---
    // mapType chính là key mà bạn switch trong drawMindMap()
    mapType: {
        type: String,
        enum: ['bubble', 'tree', 'flow', 'multiFlow', 'brace', 'free'],
        required: function () { return this.type === 'ai'; }
    },
    // Lưu y nguyên JSON do AI trả về: root/branches/subBranches…
    mindmapData: {
        type: Schema.Types.Mixed,
        required: function () { return this.type === 'ai'; }
    },

    // --- Manual map (user tự vẽ) ---
    manualData: {
        nodes: [{
            id: { type: String, required: true },  // giữ nguyên id
            type: { type: String, default: 'rectangle' }, // hình dạng: rectangle|circle|image|label…
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            width: { type: Number, default: 100 },     // kích thước node
            height: { type: Number, default: 50 },
            rotation: { type: Number, default: 0 },
            text: { type: String, default: '' },

            // Thay vì nested, dùng flat:
            fontFamily: { type: String, default: 'Arial' },
            fontSize: { type: Number, default: 14 },
            isBold: { type: Boolean, default: false },
            isItalic: { type: Boolean, default: false },
            textColor: { type: String, default: '#000000' },
            align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },

            borderColor: { type: String, default: '#000000' },
            backgroundColor: { type: String, default: '#ffffff' },
            borderWidth: { type: Number, default: 1 },
            borderStyle: { type: String, enum: ['solid', 'dashed', 'dotted'], default: 'solid' },

            imageUrl: String
        }],

        links: [{
            id: { type: String, required: true },
            from: { type: String, required: true },
            to: { type: String, required: false },
            toPos: {                         // nếu link end point được kéo thả tự do
                x: { type: Number },
                y: { type: Number }
            },
            color: { type: String, default: '#000000' },
            thickness: { type: Number, default: 2 },
            dash: { type: String, enum: ['solid', 'dashed', 'dotted'], default: 'solid' },
            curvature: { type: Number, default: 0 },    // từ -1 đến 1
            marker: { type: String, enum: ['none', 'arrow', 'tree'], default: 'none' },
            custom: { type: Schema.Types.Mixed }      // cho các thuộc tính khác
        }]
    }


}, { timestamps: true });

module.exports = mongoose.model('ListMindmap', ListMindmapSchema);
