const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // If no token, continue as guest
  if (!token) {
    console.log('No token, continuing as guest');
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    console.log('Auth successful, user:', req.user);
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    // Invalid token, but continue as guest
    next();
  }
}; 