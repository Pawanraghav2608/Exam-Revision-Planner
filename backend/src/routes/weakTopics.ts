import { Router } from 'express';
import { z } from 'zod';
import { createUserSupabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const weakTopicsRouter = Router();

weakTopicsRouter.use(requireAuth);

const weakTopicSchema = z.object({
  subject_id: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  confidence: z.number().int().min(1).max(5).default(2),
});

weakTopicsRouter.get('/', async (_req, res) => {
  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('weak_topics')
    .select('id, subject_id, title, confidence, created_at')
    .order('confidence', { ascending: true });

  if (error) {
    console.error('Weak topics fetch failed:', error.message);
    return res.status(500).json({ error: 'Could not load weak topics.' });
  }

  return res.json({ weak_topics: data });
});

weakTopicsRouter.post('/', async (req, res) => {
  const parsed = weakTopicSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Provide a valid subject_id, topic title, and confidence from 1 to 5.',
    });
  }

  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('weak_topics')
    .insert({
      user_id: res.locals.userId,
      subject_id: parsed.data.subject_id,
      title: parsed.data.title,
      confidence: parsed.data.confidence,
    })
    .select('id, subject_id, title, confidence, created_at')
    .single();

  if (error) {
    console.error('Weak topic save failed:', error.message);
    return res.status(400).json({
      error: 'Could not save topic. Check that the subject belongs to your account.',
    });
  }

  return res.status(201).json({ weak_topic: data });
});