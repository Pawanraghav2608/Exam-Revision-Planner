import { Router } from 'express';
import { z } from 'zod';
import { createUserSupabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const studySessionsRouter = Router();

studySessionsRouter.use(requireAuth);

const sessionSchema = z.object({
  subject_id: z.string().uuid(),
  study_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  topic: z.string().trim().min(1).max(200),
  break_minutes: z.number().int().min(0).max(60).default(10),
});

function toMinutes(time: string): number {
  const parts = time.split(':');
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);

  return hours * 60 + minutes;
}

studySessionsRouter.get('/', async (_req, res) => {
  const db = createUserSupabase(res.locals.accessToken);

  const { data, error } = await db
    .from('study_sessions')
    .select(
      'id, subject_id, study_date, start_time, end_time, topic, break_minutes, status, created_at',
    )
    .order('study_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Study sessions fetch failed:', error.message);
    return res.status(500).json({ error: 'Could not load study sessions.' });
  }

  return res.json({ study_sessions: data });
});

studySessionsRouter.post('/', async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Check the subject, date, time, topic, and break minutes.',
    });
  }

  const session = parsed.data;
  const start = toMinutes(session.start_time);
  const end = toMinutes(session.end_time);
  const duration = end - start;

  if (duration <= 0 || duration > 180) {
    return res.status(400).json({
      error: 'Session must be after its start time and no longer than 3 hours.',
    });
  }

  if (session.break_minutes >= duration) {
    return res.status(400).json({
      error: 'Break time must be shorter than the study session.',
    });
  }

  const db = createUserSupabase(res.locals.accessToken);

  const { data: subject, error: subjectError } = await db
    .from('subjects')
    .select('id, exam_date')
    .eq('id', session.subject_id)
    .eq('user_id', res.locals.userId)
    .maybeSingle();

  if (subjectError) {
    console.error('Subject lookup failed:', subjectError.message);
    return res.status(500).json({ error: 'Could not check the subject.' });
  }

  if (!subject) {
    return res.status(404).json({ error: 'Subject not found in your account.' });
  }

  if (session.study_date >= subject.exam_date) {
    return res.status(400).json({
      error: 'Study session must be before the subject exam date.',
    });
  }

  const { data: conflict, error: conflictError } = await db
    .from('study_sessions')
    .select('id')
    .eq('user_id', res.locals.userId)
    .eq('study_date', session.study_date)
    .lt('start_time', session.end_time)
    .gt('end_time', session.start_time)
    .limit(1)
    .maybeSingle();

  if (conflictError) {
    console.error('Session conflict check failed:', conflictError.message);
    return res.status(500).json({ error: 'Could not check the schedule.' });
  }

  if (conflict) {
    return res.status(409).json({
      error: 'This time overlaps with another study session.',
    });
  }

  const { data, error } = await db
    .from('study_sessions')
    .insert({
      user_id: res.locals.userId,
      subject_id: session.subject_id,
      study_date: session.study_date,
      start_time: session.start_time,
      end_time: session.end_time,
      topic: session.topic,
      break_minutes: session.break_minutes,
      status: 'planned',
    })
    .select(
      'id, subject_id, study_date, start_time, end_time, topic, break_minutes, status, created_at',
    )
    .single();

  if (error) {
    console.error('Study session save failed:', error.message);
    return res.status(400).json({ error: 'Could not save the study session.' });
  }

  return res.status(201).json({ study_session: data });
});

studySessionsRouter.patch('/:id/status', async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    return res.status(400).json({ error: 'Study session id is invalid.' });
  }
  const parsed = z.object({ status: z.enum(['planned', 'completed']) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Choose a valid study session status.' });
  }

  const db = createUserSupabase(res.locals.accessToken);
  const { data, error } = await db
    .from('study_sessions')
    .update({ status: parsed.data.status })
    .eq('id', id.data)
    .eq('user_id', res.locals.userId)
    .select('id, subject_id, study_date, start_time, end_time, topic, break_minutes, status, created_at')
    .maybeSingle();

  if (error) {
    console.error('Study session status update failed:', error.message);
    return res.status(400).json({ error: 'Could not update this study session.' });
  }
  if (!data) {
    return res.status(404).json({ error: 'Study session not found.' });
  }

  return res.json({ study_session: data });
});
