const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb){
        const uniqueName = `audi_${Date.now()}_${req.user.userId}${path.extname(file.originalname)}`;
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
        cb(null,true);
    } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'), false);

    }
};

const upload = multer({
    storage,fileFilter,limits:{fileSize: 50 * 1024 * 1024}
});

module.exports = upload;