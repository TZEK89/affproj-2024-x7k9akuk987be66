/**
 * Mock User Middleware
 * 
 * For personal use without authentication.
 * Sets a default user on all requests so the app works without login.
 */

const mockUser = (req, res, next) => {
  // Set a default user for personal use
  req.user = {
    userId: 1, // Default user ID
    email: 'user@example.com',
    name: 'User'
  };
  next();
};

module.exports = mockUser;
