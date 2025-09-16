// Express route for validating JWT token
// Place this in your backend (simple-server.js or routes/auth.js)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'xeno_secret';

router.post('/validate-token', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Malformed token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Optionally, check user/tenant still exists in DB
    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: { email: user.email, id: user.id } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
