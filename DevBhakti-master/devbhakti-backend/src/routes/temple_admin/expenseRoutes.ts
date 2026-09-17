import { Router } from 'express';
import { authenticate, injectTempleContext } from '../../middleware/authMiddleware';
import * as expenseController from '../../controllers/temple_admin/expenseController';
import * as categoryController from '../../controllers/temple_admin/expenseCategoryController';
import { uploadExpenseReceipt } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

// Upload Bill/Receipt File Endpoint
router.post('/upload-receipt', uploadExpenseReceipt.single('file'), expenseController.uploadReceipt);

// Expense Entries CRUD & Stats
router.post('/', uploadExpenseReceipt.single('receipt'), expenseController.createTempleExpense);
router.get('/', expenseController.getTempleExpenses);
router.get('/stats', expenseController.getTempleExpenseStats);
router.put('/:id', expenseController.updateTempleExpense);
router.delete('/:id', expenseController.deleteTempleExpense);

// Expense Categories CRUD
router.get('/categories', categoryController.getTempleExpenseCategories);
router.post('/categories', categoryController.createTempleExpenseCategory);
router.put('/categories/:id', categoryController.updateTempleExpenseCategory);
router.delete('/categories/:id', categoryController.deleteTempleExpenseCategory);

export default router;
