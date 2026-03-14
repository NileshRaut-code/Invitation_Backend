import express from 'express';
import {
    getPublicCategories,
    getAllPublicTemplates,
    getPublicTemplates,
    getPublicTemplateById,
    submitContactForm,
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/categories', getPublicCategories);
router.get('/templates', getAllPublicTemplates);
router.get('/categories/:slug/templates', getPublicTemplates);
router.get('/templates/:id', getPublicTemplateById);
router.post('/contact', submitContactForm);

export default router;
