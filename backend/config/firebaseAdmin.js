const admin = require('firebase-admin');
const serviceAccount = require('./mindmap-ad6dd-firebase-adminsdk-fbsvc-f3d89de854.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;