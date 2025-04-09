const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// This route handles the exchange of the authorization code for tokens
router.post('/google', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const code = authHeader.split(' ')[1];
    console.log('Google auth code:', code);

    const tokenRequestData = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenRequestData);
    const { id_token } = tokenResponse.data;

    console.log('Google token response:', tokenResponse.data);

    // Decode id_token 
    const decoded = jwt.decode(id_token, { complete: true });
    const { sub: userId, email: user_email, name: user_name, picture: user_image } = decoded.payload;
    console.log(userId, user_email, user_name, user_image);

    // Check if user exists
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, email: user_email });
      await user.save();
    }

    // Create JWT token to return to the client
    const jwtPayload = {
      user_id: userId,
      user_email,
      exp: Math.floor(Date.now() / 1000) + 60 * 500, // 500 minutes
    };
    const jwt_token = jwt.sign(jwtPayload, process.env.JWT_SECRET);

    return res.status(200).json({
      jwt_token,
      user_name,
      user_email,
      user_image,
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    return res.status(401).json({ error: 'Authorization failed' });
  }
});

// Protected route example
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // User is already attached to req by the middleware
    const user = req.user;
    res.status(200).json({
      user_id: user,
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;