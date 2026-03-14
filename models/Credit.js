import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['purchase', 'usage'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
}, { _id: false });

const creditSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        balance: { type: Number, default: 0 },
        transactions: [transactionSchema],
    },
    { timestamps: true }
);

const Credit = mongoose.model('Credit', creditSchema);
export default Credit;
