import express from 'express';
import { createTerritory, getTerritories, getTerritory, deleteTerritory, contestTerritory } from '../controllers/territoryController';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

router.get('/', getTerritories);
router.get('/:id', getTerritory);
router.post('/', authenticateJWT, createTerritory);
router.delete('/:id', authenticateJWT, deleteTerritory);
router.post('/:id/contest', authenticateJWT, contestTerritory);

export default router;
