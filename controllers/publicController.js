import Category from '../models/Category.js';
import Template from '../models/Template.js';
import sendEmail from '../utils/sendEmail.js';

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

// @desc    Submit contact form
// @route   POST /api/public/contact
// @access  Public
const submitContactForm = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Please fill in all fields');
    }

    try {
        await sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@inviteme.app',
            subject: `[Contact Form] New message from ${name}`,
            message: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form email error:', error);
        // Still return success to user even if email fails
        res.json({ success: true, message: 'Message received' });
    }
};

export {
    getPublicCategories,
    getAllPublicTemplates,
    getPublicTemplates,
    getPublicTemplateById,
    submitContactForm,
};
