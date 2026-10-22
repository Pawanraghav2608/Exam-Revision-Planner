import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in first.' });
  }

  const accessToken = authorization.slice('Bearer '.length);

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Session is invalid or expired.' });
    }

    res.locals.userId = data.user.id;
    res.locals.accessToken = accessToken;
    next();
  } catch {
    return res.status(401).json({ error: 'Could not verify your session.' });
  }
}