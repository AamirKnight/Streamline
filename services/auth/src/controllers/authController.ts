import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { validateRequest, registerSchema, loginSchema } from '../utils/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import User from '../models/user';
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request
    const validation = validateRequest(registerSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, username, password, firstName, lastName } = validation.value;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: ERROR_MESSAGES.USER_ALREADY_EXISTS });
    }

    // Create user
    const user = await User.create({
      email,
      username,
      passwordHash: password,
      firstName,
      lastName,
    });

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      user: user.toJSON(),
      accessToken,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate request
    const validation = validateRequest(loginSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, password } = validation.value;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: ERROR_MESSAGES.INVALID_PASSWORD });
    }

    // Compare password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: ERROR_MESSAGES.INVALID_PASSWORD });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: user.toJSON(),
      accessToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const decoded = require('../utils/jwt').verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const newAccessToken = generateAccessToken({ id: user.id, email: user.email });
    res.json({
      message: SUCCESS_MESSAGES.TOKEN_REFRESHED,
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
};