const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { encode, decode } = require('gpt-3-encoder');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();

const upload = multer(); // in-memory storage
const router = express.Router();
router.use(cors());
router.use(express.json({ limit: '20mb' }));
router.use(express.urlencoded({ limit: '20mb', extended: true }));

// ==== Gemini Text API ====
const GEMINI_KEY = process.env.GEMINI_KEY;
if (!GEMINI_KEY) {
    console.error('Thiếu GEMINI_API_KEY');
    process.exit(1);
}
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

async function callGeminiText(prompt) {
    const resp = await axios.post(
        GEMINI_URL,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return resp.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ==== Chunk & Summarization for long text ====
function splitIntoChunks(text, maxTokens = 8000) {
    const words = text.split(/\s+/);
    const chunks = [];
    let current = [];
    for (let word of words) {
        const next = current.concat(word);
        if (encode(next.join(' ')).length > maxTokens) {
            chunks.push(current.join(' '));
            current = [word];
        } else {
            current = next;
        }
    }
    if (current.length) chunks.push(current.join(' '));
    return chunks;
}

async function summarizeLongText(longText) {
    const chunks = splitIntoChunks(longText, 8000);
    const summaries = [];
    for (let chunk of chunks) {
        const prompt = `Hãy tóm tắt ngắn gọn phần sau:`;
        const s = await callGeminiText(`${prompt}\n"""${chunk}"""`);
        summaries.push(s.trim());
    }
    let combined = summaries.join('\n');
    if (encode(combined).length > 8000) {
        combined = await callGeminiText(`Tóm tắt tiếp để còn dưới 2000 token:\n"""${combined}"""`);
    }
    return combined.trim();
}

// ==== Generate mindmap JSON ====
async function generateMindmapJSON(root, content) {
    const schema = `{
  "type":"object",
  "properties":{
    "root":{"type":"string"},
    "branches":{"type":"array","items":{
      "type":"object",
      "properties":{
        "title":{"type":"string"},
        "subBranches":{"type":"array","items":{"type":"string"}}
      },
      "required":["title","subBranches"]
    }}
  },
  "required":["root","branches"]
}`;
    const prompt = `
### SCHEMA:
${schema}
### END SCHEMA

**QUAN TRỌNG**: Đảm bảo output **UTF-8**, giữ nguyên dấu tiếng Việt, tuyệt đối không escape hay bỏ dấu.

Hãy output DUY NHẤT một JSON hợp lệ (bắt đầu '{' và kết thúc '}'):
root = "${root}"
nội dung = """${content}"""

YÊU CẦU:
- Ít nhất 5 branches.
- Mỗi branch ít nhất 2 subBranches.
`;
    let raw = (await callGeminiText(prompt)).trim();
    if (raw.startsWith('```')) {
        raw = raw.replace(/^```(?:json)?\s*/, '').replace(/```$/, '').trim();
    }
    const match = raw.match(/\{[\s\S]*\}$/);
    const jsonText = match?.[0] ?? raw;
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.warn('[generateMindmapJSON] parse failed, raw=', raw);
        return { root, branches: [] };
    }
}

// ==== Extract embedded images ====
async function extractEmbeddedImages(file) {
    const result = {};
    const { mimetype, buffer } = file;
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value: html } = await mammoth.convertToHtml({ buffer });
        const imgRegex = /<img[^>]+src=["'](data:[^"']+)["'][^>]*>/g;
        let m, i = 0;
        while ((m = imgRegex.exec(html))) {
            result[`docImage${i++}`] = m[1];
        }
    } else if (mimetype === 'application/pdf') {
        const pdfDoc = await PDFDocument.load(buffer);
        const imgs = pdfDoc.getEmbeddedImages();
        imgs.forEach((img, idx) => {
            const b64 = img.imageData.toString('base64');
            result[`pdfImage${idx}`] = `data:image/${img.extension};base64,${b64}`;
        });
    }
    return result;
}

// ==== Craiyon AI icons ====
async function generateLeafImage(label) {
    try {
        const resp = await axios.post(
            'https://www.craiyon.com/fastapi/call/text2img',
            { prompt: `Icon-style illustration of: ${label}` },
            { headers: { 'Content-Type': 'application/json' } }
        );
        const b64 = resp.data.images?.[0];
        return b64 ? `data:image/jpeg;base64,${b64}` : null;
    } catch {
        return null;
    }
}

async function generateLeafImages(mindmap, includeImage) {
    if (!includeImage) return {};
    const images = {};
    for (const branch of mindmap.branches) {
        for (const label of branch.subBranches) {
            images[label] = await generateLeafImage(label);
        }
    }
    return images;
}

// ==== Main Route ==== 
router.post('/generateMindmap', upload.single('file'), async (req, res) => {
    try {
        let { topic, withImage } = req.body;
        const includeImage = withImage === 'true' || withImage === true;
        let text = req.body.text || '';

        // parse file if provided
        if (req.file) {
            const { mimetype, buffer, originalname } = req.file;
            if (mimetype === 'application/pdf') {
                text = (await pdfParse(buffer)).text;
            } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = (await mammoth.extractRawText({ buffer })).value;
            } else if (mimetype === 'text/plain') {
                text = buffer.toString('utf-8');
            }
            if (!topic) topic = originalname.replace(/\.[^/.]+$/, '');
        }

        if (!topic && !text) {
            return res.status(400).json({ error: 'Thiếu topic hoặc text' });
        }

        const root = (topic || text.split('\n')[0]).trim();

        // 4-step: clean & chunk & summarize
        let content;
        const cleaned = text.length > 50 ? text : root;
        if (cleaned.length > 2000) {
            content = await summarizeLongText(cleaned);
        } else {
            content = cleaned;
        }

        const mindmap = await generateMindmapJSON(root, content);

        // extract embedded images from file + AI icons
        let embedded = {};
        if (includeImage && req.file) {
            embedded = await extractEmbeddedImages(req.file);
        }
        const leafImages = await generateLeafImages(mindmap, includeImage);

        return res.json({ summary: content, mindmap, leafImages: { ...embedded, ...leafImages } });
    } catch (e) {
        console.error('[Router ERROR]', e);
        return res.status(500).json({ error: 'Xử lý thất bại' });
    }
});

module.exports = router;
