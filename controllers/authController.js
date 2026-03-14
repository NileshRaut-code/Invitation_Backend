import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide name, email and password');
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400);
        throw new Error('Invalid input');
    }
    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const userExists = await User.findOne({ email: String(email).toLowerCase() });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
        name,
        email,
        password,
        emailVerificationToken: hashedToken,
        emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    if (user) {
        // Send verification email
        const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify Your Email — Invite Me',
                message: `Hi ${user.name},\n\nPlease verify your email by clicking: ${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
            });
        } catch (err) {
            console.error('Verification email error:', err);
        }

        generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        res.status(400);
        throw new Error('Google credential is required');
    }

    try {
        // Verify the Google ID token cryptographically
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { sub: googleId, email, name, picture } = payload;

        // Find or create user
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Update Google ID and avatar if not set
            if (!user.googleId) user.googleId = googleId;
            if (!user.avatar && picture) user.avatar = picture;
            if (!user.isEmailVerified) user.isEmailVerified = true;
            await user.save();
        } else {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture || '',
                isEmailVerified: true,
                password: crypto.randomBytes(32).toString('hex'), // random password for Google users
            });
        }

        generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401);
        throw new Error('Google authentication failed');
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired verification link');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        res.status(400);
        throw new Error('Email is already verified');
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendEmail({
        email: user.email,
        subject: 'Verify Your Email — Invite Me',
        message: `Hi ${user.name},\n\nPlease verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });

    res.json({ success: true, message: 'Verification email sent' });
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
        avatar: req.user.avatar,
    };
    res.status(200).json(user);
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

        // Password changes must go through /api/auth/password (requires current password)

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isEmailVerified: updatedUser.isEmailVerified,
            avatar: updatedUser.avatar,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Get users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password -resetPasswordToken -emailVerificationToken');
    res.json(users);
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
        res.status(400);
        throw new Error('Please provide a valid email address');
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
        return res.status(200).json({ success: true, data: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below:\n\n${resetUrl}\n\nThis link expires in 10 minutes.`;

    try {
        await sendEmail({ email: user.email, subject: 'Password Reset — Invite Me', message });
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.error(error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(500);
        throw new Error('Email could not be sent');
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid token');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const { accessToken } = generateToken(res, user._id);
    res.status(200).json({ success: true, accessToken });
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401);
            throw new Error('User not found');
        }
        generateToken(res, user._id);
        res.json({ message: 'Token refreshed' });
    } catch (error) {
        console.error(error);
        res.status(401);
        throw new Error('Not authorized, token failed');
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        res.status(400);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
};

export {
    registerUser,
    authUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    changePassword,
    googleAuth,
    verifyEmail,
    resendVerification,
};
