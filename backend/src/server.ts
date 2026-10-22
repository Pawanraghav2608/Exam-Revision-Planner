import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './lib/supabase.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const { error } = await supabase
    .from('subjects')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Database connection check failed:', error.message);
    return res.status(503).json({
      status: 'error',
      database: 'unavailable',
    });
  }

  return res.json({
    status: 'ok',
    database: 'connected',
  });
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
import { authRouter } from './routes/auth.js';
import { subjectsRouter } from './routes/subjects.js';
import { weakTopicsRouter } from './routes/weakTopics.js';
import { studySessionsRouter } from './routes/studySessions.js';
import { profileRouter } from './routes/profile.js';
import { plansRouter } from './routes/plans.js';
import { aiRouter } from './routes/ai.js';
app.use('/api/auth', authRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/weak-topics', weakTopicsRouter);
app.use('/api/study-sessions', studySessionsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/plans', plansRouter);
app.use('/api/ai', aiRouter);