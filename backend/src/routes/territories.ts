import express from 'express';
import { createTerritory, getTerritories, getTerritory, deleteTerritory } from '../controllers/territoryController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.get('/', getTerritories);
router.get('/:id', getTerritory);
router.post('/', authenticateJWT, createTerritory);
router.delete('/:id', authenticateJWT, deleteTerritory);

export default router;
