import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Valid email, password (at least 8 characters), and name are required.',
    });
  }

  const { email, password, displayName } = parsed.data;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: data.session
        ? 'Account created.'
        : 'Account created. Check your email to confirm it.',
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
      session: data.session,
    });
  } catch {
    return res.status(500).json({ error: 'Authentication service unavailable.' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Enter a valid email and password.',
    });
  }

  const { email, password } = parsed.data;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    return res.json({
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    });
  } catch {
    return res.status(500).json({ error: 'Authentication service unavailable.' });
  }
});