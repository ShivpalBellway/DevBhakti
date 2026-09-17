import { Router } from 'express';
import { authenticate, checkPermission, injectTempleContext } from '../../middleware/authMiddleware';
import * as expenseController from '../../controllers/temple_admin/expenseController';
import * as categoryController from '../../controllers/temple_admin/expenseCategoryController';
import { uploadExpenseReceipt } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectTempleContext);

// Upload Bill/Receipt File Endpoint
router.post('/upload-receipt', checkPermission('expenses.create'), uploadExpenseReceipt.single('file'), expenseController.uploadReceipt);

// Expense Entries CRUD & Stats
router.post('/', checkPermission('expenses.create'), uploadExpenseReceipt.single('receipt'), expenseController.createTempleExpense);
router.get('/', checkPermission('expenses.view'), expenseController.getTempleExpenses);
router.get('/stats', checkPermission('expenses.view'), expenseController.getTempleExpenseStats);
router.put('/:id', checkPermission('expenses.edit'), expenseController.updateTempleExpense);
router.delete('/:id', checkPermission('expenses.delete'), expenseController.deleteTempleExpense);

// Expense Categories CRUD
router.get('/categories', checkPermission('expenses.categories.view'), categoryController.getTempleExpenseCategories);
router.post('/categories', checkPermission('expenses.categories.manage'), categoryController.createTempleExpenseCategory);
router.put('/categories/:id', checkPermission('expenses.categories.manage'), categoryController.updateTempleExpenseCategory);
router.delete('/categories/:id', checkPermission('expenses.categories.manage'), categoryController.deleteTempleExpenseCategory);

export default router;
