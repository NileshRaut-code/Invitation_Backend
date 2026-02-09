import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const invitationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        template: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Template',
            required: false, // Optional for custom designs
        },
        design: {
            type: mongoose.Schema.Types.Mixed, // Stores blocks, theme, globalSettings for custom invites
            default: null,
        },
        slug: {
            type: String,
            unique: true,
            default: () => uuidv4().slice(0, 8), // Short unique slug
        },
        content: {
            eventName: { type: String, required: true },
            hostName: { type: String, default: '' },
            eventDate: { type: Date, required: true },
            eventTime: { type: String, default: '' },
            venue: { type: String, required: true },
            venueAddress: { type: String, default: '' },
            hostContact: { type: String, default: '' },
            message: { type: String, default: '' },
            rsvpDeadline: { type: Date },
            googleMapsLink: { type: String, default: '' },
            images: [String],
        },
        customData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
        // For scratch designs, we store the price snapshot here
        price: {
            type: Number,
            default: 0,
        },
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'expired'],
            default: 'draft',
        },
        views: {
            type: Number,
            default: 0,
        },
        rsvpCount: {
            type: Number,
            default: 0,
        },
        // Expiry settings
        expiresAt: {
            type: Date,
            default: null, // null means no expiry
        },
        autoDelete: {
            type: Boolean,
            default: true, // Auto-delete after expiry by default
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// TTL Index - MongoDB will automatically delete documents when expiresAt passes
// Only deletes if autoDelete is true (handled by the cleanup job for more control)
invitationSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0, // Delete immediately when expiresAt time passes
        partialFilterExpression: { autoDelete: true, expiresAt: { $exists: true, $ne: null } }
    }
);

// Virtual for RSVPs
invitationSchema.virtual('rsvps', {
    ref: 'RSVP',
    localField: '_id',
    foreignField: 'invitation',
});

// Virtual to check if invitation is expired
invitationSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
});

// Pre-save middleware to auto-set expiry based on event date
invitationSchema.pre('save', async function () {
    // If no expiry set and event date exists, set expiry to 30 days after event
    if (!this.expiresAt && this.content?.eventDate) {
        const eventDate = new Date(this.content.eventDate);
        this.expiresAt = new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after event
    }
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
