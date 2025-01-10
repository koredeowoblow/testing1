import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendResetPasswordEmail } from '../services/emailService.js';
import { BlacklistedToken } from '../models/BlacklistedToken'; // Adjust the path to your Sequelize model


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, phone_number, pin } = req.body;
    const account_balance = 0;
    const check = await User.findOne({
      where: { email: email },
    });
    // Create user
    if (check) {
      res.status(400).json({
        status: 'failed',
        message: "email has already been used"
      });
    }
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user',// Default to 'user' if no role specified
      phone_number,
      pin,
      account_balance
    });
    // const history = await User.findAll({ email: user.email });
    const users = await User.findOne({
      where: { email: user.email },
    });
    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      status: 'success',
      data: {
        users,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    res.json({
      status: 'success',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    try {
      await sendResetPasswordEmail(user.email, resetToken);

      res.json({
        status: 'success',
        message: 'Reset token sent to email'
      });
    } catch (error) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(500).json({
        status: 'error',
        message: 'Error sending email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Generate new token
    const newToken = generateToken(user.id);

    res.json({
      status: 'success',
      data: {
        user,
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

x1``
export const logout = async (req, res, next) => {
  try {
    // Retrieve token from request headers
    const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
      return res.status(400).json({ message: 'Token not provided' });
    }

    // Decode token (optional, for user details or debugging)
    const decoded = jwt.decode(token);

    // Add token to the blacklist table
    await BlacklistedToken.create({ token });

    // Respond with success
    return res.status(200).json({
      message: 'User successfully logged out',
      userId: decoded?.id, // Optional, if you want to return user details
    });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};


