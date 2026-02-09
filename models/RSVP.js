import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
    {
        invitation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invitation',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        response: {
            type: String,
            enum: ['attending', 'not_attending', 'maybe', 'declined', 'pending'],
            default: 'attending',
        },
        numberOfGuests: {
            type: Number,
            default: 1,
            min: 1,
        },
        message: String,
    },
    {
        timestamps: true,
    }
);

// Compound index for unique email per invitation
rsvpSchema.index({ invitation: 1, email: 1 }, { unique: true });

const RSVP = mongoose.model('RSVP', rsvpSchema);

export default RSVP;
