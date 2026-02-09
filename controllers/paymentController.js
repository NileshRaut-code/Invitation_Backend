import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Invitation from '../models/Invitation.js';
import Template from '../models/Template.js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res) => {
    const { invitationId } = req.body;

    const invitation = await Invitation.findById(invitationId).populate('template');

    if (!invitation) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    // Check ownership
    if (invitation.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }

    // Check if already paid
    if (invitation.isPaid) {
        res.status(400);
        throw new Error('This invitation is already paid');
    }

    let amount = 0;

    if (invitation.template) {
        const template = await Template.findById(invitation.template);
        if (!template.isPremium) {
            res.status(400);
            throw new Error('This template is free, no payment required');
        }
        amount = template.price * 100;
    } else {
        // Scratch design - use stored price
        if (!invitation.price || invitation.price <= 0) {
            res.status(400);
            throw new Error('Invalid price for this invitation');
        }
        amount = invitation.price * 100;
    }

    const options = {
        amount,
        currency: 'INR',
        receipt: `receipt_${invitationId}`,
    };

    try {
        const order = await razorpay.orders.create(options);

        // Create payment record
        await Payment.create({
            user: req.user._id,
            invitation: invitationId,
            razorpay_order_id: order.id,
            amount: amount / 100, // Store in Rupees
            status: 'created',
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error('Failed to create payment order');
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await Payment.findOne({ razorpay_order_id });

    if (!payment) {
        res.status(404);
        throw new Error('Payment not found');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        payment.status = 'failed';
        await payment.save();
        res.status(400);
        throw new Error('Payment verification failed');
    }

    // Update payment record
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.status = 'captured';
    await payment.save();

    // Update invitation as paid
    const invitation = await Invitation.findById(payment.invitation);
    invitation.isPaid = true;
    invitation.payment = payment._id;
    await invitation.save();

    res.json({
        success: true,
        message: 'Payment verified successfully',
        invitation,
    });
};

// @desc    Get user's payment history
// @route   GET /api/payments/my-payments
// @access  Private
const getMyPayments = async (req, res) => {
    const payments = await Payment.find({ user: req.user._id, status: 'captured' })
        .populate('invitation', 'slug content.eventName')
        .sort({ createdAt: -1 });

    res.json(payments);
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments/all
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    const payments = await Payment.find({ status: 'captured' })
        .populate('user', 'name email')
        .populate('invitation', 'slug content.eventName')
        .sort({ createdAt: -1 });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
        payments,
        totalRevenue,
        totalTransactions: payments.length,
    });
};

export {
    createOrder,
    verifyPayment,
    getMyPayments,
    getAllPayments,
};
