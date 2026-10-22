import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '../middleware/requireAuth.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post('/check', async (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Reply exactly: Gemini API connected.',
    });

    return res.json({
      status: 'ok',
      message: response.text ?? 'Gemini replied without text.',
    });
  } catch (error) {
    console.error('Gemini API request failed:', error);
    return res.status(502).json({
      error: 'Gemini request failed. Check the API key and model access.',
    });
  }
});