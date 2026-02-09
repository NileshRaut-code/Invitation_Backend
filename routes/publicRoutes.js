import express from 'express';
import {
    getPublicCategories,
    getAllPublicTemplates,
    getPublicTemplates,
    getPublicTemplateById,
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/categories', getPublicCategories);
router.get('/templates', getAllPublicTemplates);
router.get('/categories/:slug/templates', getPublicTemplates);
router.get('/templates/:id', getPublicTemplateById);

export default router;
