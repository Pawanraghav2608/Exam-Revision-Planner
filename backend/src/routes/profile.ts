import { Router } from 'express';
import { z } from 'zod';
import { createUserSupabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(100),
  weekly_free_hours: z.number().int().min(1).max(80),
});

profileRouter.get('/', async (_req, res) => {
  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('profiles')
    .select('id, display_name, weekly_free_hours')
    .eq('id', res.locals.userId)
    .maybeSingle();

  if (error) {
    console.error('Profile fetch failed:', error.message);
    return res.status(500).json({ error: 'Could not load profile.' });
  }

  return res.json({ profile: data });
});

profileRouter.put('/', async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Provide a name and weekly free hours from 1 to 80.',
    });
  }

  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('profiles')
    .upsert(
      {
        id: res.locals.userId,
        display_name: parsed.data.display_name,
        weekly_free_hours: parsed.data.weekly_free_hours,
      },
      { onConflict: 'id' },
    )
    .select('id, display_name, weekly_free_hours')
    .single();

  if (error) {
    console.error('Profile save failed:', error.message);
    return res.status(400).json({ error: 'Could not save profile.' });
  }

  return res.json({ profile: data });
});