import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    publishCategory,
    unpublishCategory,
} from '../controllers/categoryController.js';
import {
    createTemplate,
    getTemplates,
    getTemplatesByCategory,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    uploadTemplateImage,
    activateTemplate,
    deactivateTemplate,
} from '../controllers/templateController.js';
import {
    getAllUsers,
    getUserById,
    updateUserRole,
} from '../controllers/adminUserController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, admin);

// Category Routes
router.route('/categories')
    .get(getCategories)
    .post(createCategory);

router.route('/categories/:id')
    .get(getCategoryById)
    .put(updateCategory)
    .delete(deleteCategory);

router.put('/categories/:id/publish', publishCategory);
router.put('/categories/:id/unpublish', unpublishCategory);

// Template Routes
router.route('/templates')
    .get(getTemplates)
    .post(createTemplate);

router.post('/templates/upload', uploadTemplateImage);
router.get('/templates/category/:categoryId', getTemplatesByCategory);

router.route('/templates/:id')
    .get(getTemplateById)
    .put(updateTemplate)
    .delete(deleteTemplate);

router.put('/templates/:id/activate', activateTemplate);
router.put('/templates/:id/deactivate', deactivateTemplate);

// User Routes
router.route('/users')
    .get(getAllUsers);

router.route('/users/:id')
    .get(getUserById);

router.put('/users/:id/role', updateUserRole);

export default router;
