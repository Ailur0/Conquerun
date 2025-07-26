import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // 1. Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 2. Trim inputs
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    // 3. Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 4. Validate Username
    if (trimmedUsername.length < 3 || trimmedUsername.length > 15) {
      return res.status(400).json({ error: 'Username must be between 3 and 15 characters' });
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // 5. Validate Password Strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (!@#$%^&*)' 
      });
    }

    // 6. Case-insensitive check for existing user
    const existingUser = await User.findOne({ 
      $or: [
        { email: { $regex: `^${trimmedEmail}$`, $options: 'i' } }, 
        { username: { $regex: `^${trimmedUsername}$`, $options: 'i' } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with that email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username: trimmedUsername, email: trimmedEmail, passwordHash });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      success: true, 
      user: { 
        id: user._id,
        username: user.username, 
        email: user.email, 
        totalPoints: user.totalPoints, 
        claimedTerritories: user.claimedTerritories, 
        createdAt: user.createdAt 
      }, 
      token 
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed due to a server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email, case-insensitively
    const user = await User.findOne({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      user: { 
        id: user._id,
        username: user.username, 
        email: user.email, 
        totalPoints: user.totalPoints, 
        claimedTerritories: user.claimedTerritories, 
        createdAt: user.createdAt 
      }, 
      token 
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed due to a server error' });
  }
};

export const profile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
