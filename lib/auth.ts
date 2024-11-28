import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fuckfuckfuckfuckfuck';

export interface AuthenticatedRequest extends NextApiRequest {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: NextApiResponse,
    next: () => void
) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user as any;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}