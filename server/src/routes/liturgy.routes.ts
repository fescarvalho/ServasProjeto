import { Router, Request, Response } from 'express';
import { getLiturgy } from '../services/liturgyService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const date = req.query.date as string;

        // Basic validation for YYYY-MM-DD
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
            return;
        }

        const targetDate = date || new Date().toISOString().split('T')[0];
        const data = await getLiturgy(targetDate);

        res.json(data);
        return;
    } catch (error: any) {
        console.error('[LiturgyRoute] Error:', error);
        res.status(500).json({
            error: 'Erro ao buscar liturgia diária.',
            message: 'Não foi possível carregar os dados da Canção Nova no momento. Tente novamente mais tarde.',
            details: error.message
        });
        return;
    }
});

export default router;
