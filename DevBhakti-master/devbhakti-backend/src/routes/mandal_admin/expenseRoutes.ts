import { Router } from 'express';
import { authenticate, injectMandalContext } from '../../middleware/authMiddleware';
import * as expenseController from '../../controllers/mandal_admin/expenseController';
import * as categoryController from '../../controllers/mandal_admin/expenseCategoryController';
import { uploadExpenseReceipt } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectMandalContext);

// Upload Bill/Receipt File Endpoint
router.post('/upload-receipt', uploadExpenseReceipt.single('file'), expenseController.uploadReceipt);

// Expense Entries CRUD & Stats
router.post('/', expenseController.createMandalExpense);
router.get('/', expenseController.getMandalExpenses);
router.get('/stats', expenseController.getMandalExpenseStats);
router.put('/:id', expenseController.updateMandalExpense);
router.delete('/:id', expenseController.deleteMandalExpense);

// Expense Categories CRUD
router.get('/categories', categoryController.getMandalExpenseCategories);
router.post('/categories', categoryController.createMandalExpenseCategory);
router.put('/categories/:id', categoryController.updateMandalExpenseCategory);
router.delete('/categories/:id', categoryController.deleteMandalExpenseCategory);

export default router;
