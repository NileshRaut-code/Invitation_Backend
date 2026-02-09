import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - Verify JWT Access Token from cookie
const protect = async (req, res, next) => {
    // Get token from cookie (primary) or header (fallback)
    let token = req.cookies.accessToken;

    // Fallback to Authorization header for API testing
    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Admin Middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

export { protect, admin };
