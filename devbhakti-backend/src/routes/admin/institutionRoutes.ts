import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getAllInstitutions,
    createInstitution,
    updateInstitution,
    deleteInstitution
} from '../../controllers/admin/institutionController';

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temples/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Routes with multiple file fields
const institutionUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'heroImages', maxCount: 10 }
]);

router.get('/', getAllInstitutions);
router.post('/', institutionUpload, createInstitution);
router.put('/:id', institutionUpload, updateInstitution);
router.delete('/:id', deleteInstitution);

export default router;
