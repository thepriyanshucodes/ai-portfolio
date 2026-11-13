import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { PORTFOLIO_CONTEXT } from '@/lib/portfolioContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Active Gemini 3.x models
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

interface ApiErrorObject {
  status?: number;
  code?: number;
  message?: string;
}

function isApiError(err: unknown): err is ApiErrorObject {
  return typeof err === 'object' && err !== null;
}

export async function POST(req: Request) {
  try {
    const { history, message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    const validHistory = Array.isArray(history) ? history : [];

    const trimmedHistory = validHistory.slice(-6);

    const contents = [
      ...trimmedHistory,
      { role: 'user', parts: [{ text: message }] },
    ];

    let lastError: unknown = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        const startTime = Date.now();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: PORTFOLIO_CONTEXT,
          },
        });

        console.log(`[Gemini API] Success with ${modelName} in ${Date.now() - startTime}ms`);
        return NextResponse.json({ text: response.text });
      } catch (err: unknown) {
        lastError = err;
        if (isApiError(err)) {
          const statusCode = err.status || err.code;
          if (statusCode === 503 || statusCode === 404 || statusCode === 429) {
            console.warn(`[Gemini API] ${modelName} returned ${statusCode}, trying next...`);
            continue;
          }
        }
        throw err;
      }
    }

    throw lastError;

  } catch (error: unknown) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json(
      { error: 'AI service is currently experiencing high demand. Please try again in a moment.' },
      { status: 503 }
    );
  }
}