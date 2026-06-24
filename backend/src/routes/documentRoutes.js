const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadDocument,
  getAllDocuments,
  getMyDocuments,
  viewDocument,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');

// Multer config
const UPLOAD_DIR = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, JPG, PNG files with matching extensions are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Employee routes
router.post('/upload',        protect, upload.single('document'), uploadDocument);
router.get('/my-documents',   protect, getMyDocuments);
router.get('/view/:id',       protect, viewDocument);
router.get('/download/:id',   protect, downloadDocument);
router.delete('/:id',         protect, deleteDocument);

// Admin routes
router.get('/all',            protect, authorize('admin'), getAllDocuments);

module.exports = router;