import Invitation from '../models/Invitation.js';
import Template from '../models/Template.js';
import Payment from '../models/Payment.js';
import SystemSettings from '../models/SystemSettings.js';
import cloudinary from '../utils/cloudinary.js';

// @desc    Create a new invitation
// @route   POST /api/invitations
// @access  Private
const createInvitation = async (req, res, next) => {
    try {
        const { template: templateId, content, customData, design } = req.body;

        let invitationData = {
            user: req.user._id,
            content,
            customData: customData || {},
        };

        if (templateId) {
            const template = await Template.findById(templateId);
            if (!template) {
                res.status(404);
                throw new Error('Template not found');
            }
            if (!template.isActive) {
                res.status(400);
                throw new Error('This template is not available');
            }
            invitationData.template = templateId;
            invitationData.isPaid = !template.isPremium;
            invitationData.price = template.isPremium ? template.price : 0;
            invitationData.status = template.isPremium ? 'draft' : 'published';
            if (design) {
                invitationData.design = design;
            }
        } else if (design) {
            // Custom design from scratch
            // Fetch global price for scratch designs
            const settings = await SystemSettings.getSettings();

            invitationData.design = design;
            invitationData.isPaid = false; // Always paid for scratch
            invitationData.price = settings.scratchDesignPrice;
            invitationData.status = 'draft';
        } else {
            res.status(400);
            throw new Error('Template or design data is required');
        }

        const invitation = await Invitation.create(invitationData);

        const populatedInvitation = await Invitation.findById(invitation._id)
            .populate('template', 'name previewImage isPremium price');

        res.status(201).json(populatedInvitation);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's invitations
// @route   GET /api/invitations
// @access  Private
const getMyInvitations = async (req, res) => {
    const invitations = await Invitation.find({ user: req.user._id })
        .populate('template', 'name previewImage isPremium price')
        .sort({ createdAt: -1 });

    res.json(invitations);
};

// @desc    Get single invitation by ID
// @route   GET /api/invitations/:id
// @access  Private
const getInvitationById = async (req, res) => {
    const invitation = await Invitation.findById(req.params.id)
        .populate('template', 'name previewImage isPremium price componentName config')
        .populate('rsvps');

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this invitation');
    }

    res.json(invitation);
};

// @desc    Update an invitation
// @route   PUT /api/invitations/:id
// @access  Private
const updateInvitation = async (req, res) => {
    const { content, status, customData, design, slug, expiresAt, autoDelete } = req.body;

    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this invitation');
    }

    if (content) invitation.content = content;
    if (status) invitation.status = status;
    if (customData) invitation.customData = customData;
    if (design) invitation.design = design;

    // Handle custom slug (branded link)
    if (slug !== undefined && slug !== invitation.slug) {
        // Sanitize: lowercase, only alphanumeric and hyphens, 3-50 chars
        const sanitized = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50);
        if (sanitized.length < 3) {
            res.status(400);
            throw new Error('Slug must be at least 3 characters (letters, numbers, hyphens only)');
        }
        // Check uniqueness
        const existing = await Invitation.findOne({ slug: sanitized, _id: { $ne: invitation._id } });
        if (existing) {
            res.status(400);
            throw new Error('This custom link is already taken. Please choose another.');
        }
        invitation.slug = sanitized;
    }

    // Handle expiry settings
    if (expiresAt !== undefined) {
        invitation.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (autoDelete !== undefined) {
        invitation.autoDelete = autoDelete;
    }

    const updatedInvitation = await invitation.save();
    res.json(updatedInvitation);
};

// @desc    Delete an invitation
// @route   DELETE /api/invitations/:id
// @access  Private
const deleteInvitation = async (req, res) => {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this invitation');
    }

    // Prevent deletion of paid invitations (optional business logic)
    if (invitation.isPaid && invitation.status === 'published') {
        res.status(400);
        throw new Error('Cannot delete a published paid invitation');
    }

    await invitation.deleteOne();
    res.json({ message: 'Invitation removed' });
};

// @desc    Upload invitation image to Cloudinary
// @route   POST /api/invitations/upload
// @access  Private
const uploadInvitationImage = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            res.status(400);
            throw new Error('No image provided');
        }

        const result = await cloudinary.uploader.upload(image, {
            folder: 'invite-me/invitations',
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

// @desc    Get public invitation by slug (for sharing)
// @route   GET /api/invitations/public/:slug
// @access  Public
const getPublicInvitation = async (req, res) => {
    const invitation = await Invitation.findOne({
        slug: req.params.slug,
        $or: [
            { status: 'published', isPaid: true },
            { isPaid: true } // Allow viewing any paid invitation
        ]
    })
        .populate('template', 'name previewImage componentName config design');

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found or not yet published');
    }

    // Increment view count
    invitation.views += 1;
    await invitation.save();

    res.json(invitation);
};

export {
    createInvitation,
    getMyInvitations,
    getInvitationById,
    updateInvitation,
    deleteInvitation,
    uploadInvitationImage,
    getPublicInvitation,
};
