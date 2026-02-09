import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '15m', // Access token expires in 15 minutes
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d', // Refresh token expires in 7 days
    });

    // Set Access Token as an HTTP-Only cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Must be true for SameSite=None
        sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none', // None for cross-site (Vercel)
        maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Set Refresh Token as an HTTP-Only cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Must be true for SameSite=None
        sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none', // None for cross-site (Vercel)
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return { accessToken, refreshToken };
};

export default generateToken;
