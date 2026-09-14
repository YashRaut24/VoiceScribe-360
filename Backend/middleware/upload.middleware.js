const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const uploadDirectory = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, uploadDirectory);
    },
    filename: function(req, file, cb){
        const uniqueName = `${crypto.randomUUID()}${file.safeExtension || '.audio'}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav',
        'audio/mpeg'
    ];

    if(allowedMimeTypes.includes(file.mimetype)){
        const extensions = {
            'audio/webm': '.webm',
            'audio/mp4': '.m4a',
            'audio/ogg': '.ogg',
            'audio/wav': '.wav',
            'audio/mpeg': '.mp3'
        };

        file.safeExtension = extensions[file.mimetype];
        cb(null,true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);

    }
};

const upload = multer({
    storage,fileFilter,limits:{fileSize: 50 * 1024 * 1024}
});

module.exports = upload;