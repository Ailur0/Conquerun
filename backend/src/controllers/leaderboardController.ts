import User from '../models/User';
import { Request, Response } from 'express';

export const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .sort({ totalPoints: -1 })
      .limit(20)
      .select('username totalPoints claimedTerritories');
    res.json({ leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
