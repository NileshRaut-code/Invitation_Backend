import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        description: String,
        isPublished: {
            type: Boolean,
            default: false,
        },
        thumbnail: String, // Cloudinary URL
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for templates
categorySchema.virtual('templates', {
    ref: 'Template',
    localField: '_id',
    foreignField: 'category',
    count: true, // Only get the count
});

// Pre-save hook to generate slug
categorySchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().split(' ').join('-');
    }
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
