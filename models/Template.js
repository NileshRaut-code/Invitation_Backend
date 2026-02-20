import mongoose from 'mongoose';

// Block schema for individual sections
const blockSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['hero', 'eventDetails', 'venue', 'gallery', 'rsvp', 'message', 'footer', 'divider', 'countdown', 'custom', 'youtube', 'fullImage', 'pdf', 'socialShare', 'qrCode'],
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
    settings: {
        // Layout
        height: { type: String, default: 'auto' }, // auto, 100vh, 50vh, etc.
        padding: { type: String, default: '4rem' },
        margin: { type: String, default: '0' },

        // Background
        backgroundType: { type: String, enum: ['solid', 'gradient', 'image', 'pattern'], default: 'solid' },
        backgroundColor: { type: String, default: '#ffffff' },
        backgroundGradient: { type: String, default: '' },
        backgroundImage: { type: String, default: '' },
        backgroundPattern: { type: String, default: '' },
        backgroundSize: { type: String, default: 'cover' },
        backgroundPosition: { type: String, default: 'center' },

        // Overlay
        overlayEnabled: { type: Boolean, default: false },
        overlayColor: { type: String, default: '#000000' },
        overlayOpacity: { type: Number, default: 0.3 },

        // Text alignment
        textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },

        // Animation
        animation: { type: String, default: 'fade-up' }, // none, fade-up, fade-in, slide-left, slide-right, zoom
        animationDelay: { type: Number, default: 0 },
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // Content varies by block type, examples:
        // hero: { title, subtitle, showDate, showButton, buttonText }
        // eventDetails: { showDate, showTime, showVenue, layout }
        // venue: { showMap, mapHeight }
        // gallery: { images[], layout: 'grid'|'carousel' }
        // rsvp: { buttonText, buttonStyle }
        // message: { text, richText }
        // footer: { showContact, showSocial, text }
    },
    styles: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // Custom CSS styles for this specific block
        // { titleColor, titleSize, borderRadius, etc. }
    },
}, { _id: false });

// Theme schema for overall template styling
const themeSchema = new mongoose.Schema({
    colors: {
        primary: { type: String, default: '#6366f1' },
        secondary: { type: String, default: '#8b5cf6' },
        accent: { type: String, default: '#f59e0b' },
        background: { type: String, default: '#ffffff' },
        surface: { type: String, default: '#f9fafb' },
        text: { type: String, default: '#1f2937' },
        textLight: { type: String, default: '#6b7280' },
        border: { type: String, default: '#e5e7eb' },
    },
    fonts: {
        heading: { type: String, default: 'Playfair Display' },
        body: { type: String, default: 'Inter' },
        accent: { type: String, default: 'Dancing Script' },
    },
    borderRadius: { type: String, default: '0.75rem' },
    shadow: { type: String, default: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
}, { _id: false });

// Main template schema
const templateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        previewImage: {
            type: String,
            required: true, // Cloudinary URL
        },
        previewImages: [{
            type: String, // Multiple preview images for carousel
        }],
        isPremium: {
            type: Boolean,
            default: false,
        },
        price: {
            type: Number,
            default: 0,
            validate: {
                validator: function (v) {
                    return !this.isPremium || v > 0;
                },
                message: 'Premium templates must have a price greater than 0.',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // New design system
        design: {
            blocks: [blockSchema],
            theme: { type: themeSchema, default: () => ({}) },
            globalSettings: {
                maxWidth: { type: String, default: '800px' },
                fontScale: { type: Number, default: 1 },
                animationsEnabled: { type: Boolean, default: true },
            },
        },

        // Define which fields customers can customize
        customizableFields: [{
            type: String,
            // e.g., "theme.colors.primary", "theme.colors.accent", "theme.fonts.heading"
        }],

        // Default content for preview/demo
        defaultContent: {
            eventName: { type: String, default: 'Beautiful Celebration' },
            hostName: { type: String, default: 'John & Jane' },
            eventDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            eventTime: { type: String, default: '6:00 PM' },
            venue: { type: String, default: 'Grand Ballroom' },
            venueAddress: { type: String, default: '123 Celebration Street, City' },
            message: { type: String, default: 'We would be honored to have you celebrate with us!' },
        },

        // Legacy support (can be removed later)
        componentName: {
            type: String,
            default: 'BlockBasedTemplate',
        },
        config: {
            type: Object,
            default: {},
        },

        // Stats
        usageCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ isPremium: 1, isActive: 1 });

const Template = mongoose.model('Template', templateSchema);

export default Template;
