import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sentAt: Date,
}, { _id: false });

const guestListSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        invitation: { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation', required: true },
        guests: [guestSchema],
    },
    { timestamps: true }
);

const GuestList = mongoose.model('GuestList', guestListSchema);
export default GuestList;
