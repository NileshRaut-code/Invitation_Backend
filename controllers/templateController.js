import Template from '../models/Template.js';
import Invitation from '../models/Invitation.js';
import cloudinary from '../utils/cloudinary.js';

// @desc    Create a new template
// @route   POST /api/admin/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
    const { name, category, previewImage, isPremium, price, config, componentName } = req.body;

    const template = await Template.create({
        name,
        category,
        previewImage,
        isPremium,
        price: isPremium ? price : 0,
        config,
        componentName,
    });

    res.status(201).json(template);
};

// @desc    Get all templates
// @route   GET /api/admin/templates
// @access  Private/Admin
const getTemplates = async (req, res) => {
    const templates = await Template.find({}).populate('category', 'name slug');
    res.json(templates);
};

// @desc    Get templates by category
// @route   GET /api/admin/templates/category/:categoryId
// @access  Private/Admin
const getTemplatesByCategory = async (req, res) => {
    const templates = await Template.find({ category: req.params.categoryId }).populate('category', 'name slug');
    res.json(templates);
};

// @desc    Get single template by ID
// @route   GET /api/admin/templates/:id
// @access  Private/Admin
const getTemplateById = async (req, res) => {
    const template = await Template.findById(req.params.id).populate('category', 'name slug');

    if (template) {
        res.json(template);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
};

// @desc    Update a template
// @route   PUT /api/admin/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
    const { name, category, previewImage, isPremium, price, config, componentName, isActive } = req.body;

    const template = await Template.findById(req.params.id);

    if (template) {
        template.name = name || template.name;
        template.category = category || template.category;
        template.previewImage = previewImage || template.previewImage;
        template.isPremium = isPremium !== undefined ? isPremium : template.isPremium;
        template.price = isPremium ? price : 0;
        template.config = config || template.config;
        template.componentName = componentName || template.componentName;
        template.isActive = isActive !== undefined ? isActive : template.isActive;

        const updatedTemplate = await template.save();
        res.json(updatedTemplate);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
};

// @desc    Delete a template
// @route   DELETE /api/admin/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    // Check if template is used in any paid invitations
    const paidInvitationsCount = await Invitation.countDocuments({ template: template._id, isPaid: true });

    if (paidInvitationsCount > 0) {
        res.status(400);
        throw new Error('Cannot delete template. It has been used in paid invitations.');
    }

    await template.deleteOne();
    res.json({ message: 'Template removed' });
};

// @desc    Upload template image to Cloudinary
// @route   POST /api/admin/templates/upload
// @access  Private/Admin
const uploadTemplateImage = async (req, res) => {
    try {
        const { image } = req.body; // Base64 encoded image string

        if (!image) {
            res.status(400);
            throw new Error('No image provided');
        }

        const result = await cloudinary.uploader.upload(image, {
            folder: 'invite-me/templates',
            resource_type: 'image',
        });

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error('Image upload failed');
    }
};

// @desc    Activate a template
// @route   PUT /api/admin/templates/:id/activate
// @access  Private/Admin
const activateTemplate = async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    template.isActive = true;
    await template.save();

    res.json({ message: 'Template activated', template });
};

// @desc    Deactivate a template
// @route   PUT /api/admin/templates/:id/deactivate
// @access  Private/Admin
const deactivateTemplate = async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
        res.status(404);
        throw new Error('Template not found');
    }

    template.isActive = false;
    await template.save();

    res.json({ message: 'Template deactivated', template });
};

export {
    createTemplate,
    getTemplates,
    getTemplatesByCategory,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    uploadTemplateImage,
    activateTemplate,
    deactivateTemplate,
};
