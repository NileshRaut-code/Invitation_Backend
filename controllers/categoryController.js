import Category from '../models/Category.js';
import Template from '../models/Template.js';

// @desc    Create a new category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, description, thumbnail } = req.body;

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists');
    }

    const category = await Category.create({
        name,
        description,
        thumbnail,
    });

    res.status(201).json(category);
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
const getCategories = async (req, res) => {
    const categories = await Category.find({}).populate('templates');
    res.json(categories);
};

// @desc    Get single category by ID
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
const getCategoryById = async (req, res) => {
    const category = await Category.findById(req.params.id).populate('templates');

    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Update a category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    const { name, description, thumbnail } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        category.description = description || category.description;
        category.thumbnail = thumbnail || category.thumbnail;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Delete a category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        // Check if there are templates associated with this category
        const templatesCount = await Template.countDocuments({ category: category._id });
        if (templatesCount > 0) {
            res.status(400);
            throw new Error('Cannot delete category with associated templates. Delete templates first.');
        }
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Publish a category
// @route   PUT /api/admin/categories/:id/publish
// @access  Private/Admin
const publishCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    // Check if at least 3 templates exist
    const templatesCount = await Template.countDocuments({ category: category._id, isActive: true });

    if (templatesCount < 3) {
        res.status(400);
        throw new Error(`Cannot publish category. Requires at least 3 active templates. Currently has ${templatesCount}.`);
    }

    category.isPublished = true;
    await category.save();

    res.json({ message: 'Category published successfully', category });
};

// @desc    Unpublish a category
// @route   PUT /api/admin/categories/:id/unpublish
// @access  Private/Admin
const unpublishCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    category.isPublished = false;
    await category.save();

    res.json({ message: 'Category unpublished successfully', category });
};

export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    publishCategory,
    unpublishCategory,
};
