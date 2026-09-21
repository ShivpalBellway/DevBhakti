import { Router } from 'express';
import {
  getMyAartiTimings,
  createAartiTiming,
  updateAartiTiming,
  toggleAartiStatus,
  deleteAartiTiming,
  saveBulkAartiSchedule
} from '../../controllers/mandal_admin/aartiController';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';

const router = Router();

// All routes require Mandal authentication
router.use(authenticate, injectMandalContext);

// 1. GET all Aarti timings
router.get('/', getMyAartiTimings);

// 2. POST add a new Aarti timing
router.post('/', createAartiTiming);

// 3. PUT bulk save all Aarti timings schedule
router.put('/', saveBulkAartiSchedule);

// 4. PUT edit single Aarti timing by ID
router.put('/:id', updateAartiTiming);

// 5. PATCH toggle active/inactive status of single Aarti timing
router.patch('/:id/toggle', toggleAartiStatus);

// 6. DELETE remove single Aarti timing by ID
router.delete('/:id', deleteAartiTiming);

export default router;
