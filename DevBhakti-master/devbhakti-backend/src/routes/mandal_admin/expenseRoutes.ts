import { Router } from 'express';
import { authenticate, checkPermission, injectMandalContext } from '../../middleware/authMiddleware';
import * as expenseController from '../../controllers/mandal_admin/expenseController';
import * as categoryController from '../../controllers/mandal_admin/expenseCategoryController';
import { uploadExpenseReceipt } from '../../middleware/uploadMiddleware';

const router = Router();

router.use(authenticate, injectMandalContext);

// Upload Bill/Receipt File Endpoint
router.post('/upload-receipt', checkPermission('expenses.create'), uploadExpenseReceipt.single('file'), expenseController.uploadReceipt);

// Expense Entries CRUD & Stats
router.post('/', checkPermission('expenses.create'), uploadExpenseReceipt.single('receipt'), expenseController.createMandalExpense);
router.get('/', checkPermission('expenses.view'), expenseController.getMandalExpenses);
router.get('/stats', checkPermission('expenses.view'), expenseController.getMandalExpenseStats);
router.put('/:id', checkPermission('expenses.edit'), expenseController.updateMandalExpense);
router.delete('/:id', checkPermission('expenses.delete'), expenseController.deleteMandalExpense);

// Expense Categories CRUD
router.get('/categories', checkPermission('expenses.categories.view'), categoryController.getMandalExpenseCategories);
router.post('/categories', checkPermission('expenses.categories.manage'), categoryController.createMandalExpenseCategory);
router.put('/categories/:id', checkPermission('expenses.categories.manage'), categoryController.updateMandalExpenseCategory);
router.delete('/categories/:id', checkPermission('expenses.categories.manage'), categoryController.deleteMandalExpenseCategory);

export default router;
