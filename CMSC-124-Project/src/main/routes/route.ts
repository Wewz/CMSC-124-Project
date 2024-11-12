import { Router } from 'express';
import { analyzeFile } from '../controllers/lolCodeController';

const router = Router();

router.post('/analyze', analyzeFile);

export default router;