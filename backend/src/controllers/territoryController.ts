import Territory from '../models/Territory';
import { Request, Response } from 'express';

export const createTerritory = async (req: Request, res: Response) => {
  try {
    const { polygon, points } = req.body;
    // @ts-ignore
    const owner = req.user.id;
    if (!polygon) return res.status(400).json({ error: 'Polygon is required' });
    const territory = new Territory({ owner, polygon, points });
    await territory.save();
    res.json({ success: true, territory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create territory' });
  }
};

export const getTerritories = async (_req: Request, res: Response) => {
  try {
    const territories = await Territory.find().populate('owner', 'username');
    res.json({ territories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
};

export const getTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const territory = await Territory.findById(id).populate('owner', 'username');
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    res.json({ territory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch territory' });
  }
};

export const deleteTerritory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;
    const territory = await Territory.findById(id);
    if (!territory) return res.status(404).json({ error: 'Territory not found' });
    if (territory.owner.toString() !== userId) return res.status(403).json({ error: 'Not authorized' });
    await territory.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete territory' });
  }
};
