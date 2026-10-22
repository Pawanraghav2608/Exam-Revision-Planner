import { Router } from 'express';
import { z } from 'zod';
import { createUserSupabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const subjectsRouter = Router();

subjectsRouter.use(requireAuth);

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

subjectsRouter.get('/', async (_req, res) => {
  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('subjects')
    .select('id, name, exam_date, created_at')
    .order('exam_date', { ascending: true });

  if (error) {
    console.error('Subjects fetch failed:', error.message);
    return res.status(500).json({ error: 'Could not load subjects.' });
  }

  return res.json({ subjects: data });
});

subjectsRouter.post('/', async (req, res) => {
  const parsed = subjectSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Subject name and exam date (YYYY-MM-DD) are required.',
    });
  }

  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('subjects')
    .insert({
      user_id: res.locals.userId,
      name: parsed.data.name,
      exam_date: parsed.data.exam_date,
    })
    .select('id, name, exam_date, created_at')
    .single();

  if (error) {
    console.error('Subject save failed:', error.message);
    return res.status(500).json({ error: 'Could not save subject.' });
  }

  return res.status(201).json({ subject: data });
});