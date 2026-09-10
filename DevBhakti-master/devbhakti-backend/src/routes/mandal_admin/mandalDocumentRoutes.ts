import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  getMandalDocuments,
  addMandalDocument,
  updateMandalDocument,
  deleteMandalDocument
} from '../../controllers/mandal_admin/mandalDocumentController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads/mandals/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/mandals/documents/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.use(authenticate);
router.use(injectMandalContext);

// CRUD Routes
router.get('/', getMandalDocuments);
router.post('/', upload.single('file'), addMandalDocument);
router.put('/:id', upload.single('file'), updateMandalDocument);
router.delete('/:id', deleteMandalDocument);

export default router;
