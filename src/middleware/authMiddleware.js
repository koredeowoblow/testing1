import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BlacklistedToken from '../models/BlacklistedToken.js';

// Middleware to protect user routes
export const protectUser = async (req, res, next) => {
  try {
    let token;
    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode token and get user ID
      const user = await User.findByPk(decoded.id); // Fetch user by ID from DB

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      req.user = user; // Attach user data to request
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid or expired',
        data: error
      });
    }
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

// Middleware to protect admin routes
export const protectAdmin = async (req, res, next) => {
  try {
    let token;
    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode token and get user ID
      const user = await User.findByPk(decoded.id); // Fetch user by ID from DB

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'admin no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'admin account is deactivated'
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'admin does not have permission to access admin routes'
        });
      }

      req.user = user; // Attach user data to request
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid or expired',
        data: error
      });
    }
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

// Middleware to authorize user roles for specific routes (e.g., user, admin)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
// Middleware to validate tokens
export const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token is missing' });
    }

    console.log("Token received for validation:", token);

    // Normalize the token for consistency
    const normalizedToken = token.trim();

    // Check if the token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token: normalizedToken });
    console.log("Is token blacklisted:", !!isBlacklisted);

    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been blacklisted or logged out' });
    }

    // Verify the token
    const decoded = jwt.verify(normalizedToken, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Token validation error:', error.message);

    return res.status(401).json({
      message:
        error.name === 'JsonWebTokenError'
          ? 'Invalid token'
          : error.name === 'TokenExpiredError'
          ? 'Token has expired'
          : 'Unauthorized',
    });
  }
};