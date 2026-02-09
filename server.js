import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js'; // Added
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter as limiter } from './middleware/rateLimiter.js'; // Renamed apiLimiter to limiter

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Kept original PORT variable name

// Trust proxy for rate limiter to work correctly behind reverse proxies
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '50mb' })); // Modified
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Modified
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);
app.use(helmet());

// Apply general rate limiter to all API routes
app.use('/api', limiter); // Changed from apiLimiter to limiter

// Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return; // Use existing connection
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        // Do not exit process in serverless
    }
};

// Connect to DB immediately
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        // connectDB(); // Already called above
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
