import Category from '../models/Category.js';
import Template from '../models/Template.js';

// @desc    Get all published categories
// @route   GET /api/public/categories
// @access  Public
const getPublicCategories = async (req, res) => {
    const categories = await Category.find({ isPublished: true });
    res.json(categories);
};

// @desc    Get all active templates
// @route   GET /api/public/templates
// @access  Public
const getAllPublicTemplates = async (req, res) => {
    const templates = await Template.find({ isActive: true })
        .populate('category', 'name slug')
        .select('_id name previewImage isPremium price category componentName');
    res.json(templates);
};

// @desc    Get templates by category (public)
// @route   GET /api/public/categories/:slug/templates
// @access  Public
const getPublicTemplates = async (req, res) => {
    const category = await Category.findOne({ slug: req.params.slug, isPublished: true });

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    const templates = await Template.find({ category: category._id, isActive: true })
        .select('_id name previewImage isPremium price componentName');

    res.json({ category, templates });
};

// @desc    Get single template (public)
// @route   GET /api/public/templates/:id
// @access  Public
const getPublicTemplateById = async (req, res) => {
    const template = await Template.findById(req.params.id)
        .populate('category', 'name slug');

    if (!template || !template.isActive) {
        res.status(404);
        throw new Error('Template not found');
    }

    res.json(template);
};

export {
    getPublicCategories,
    getAllPublicTemplates,
    getPublicTemplates,
    getPublicTemplateById,
};
