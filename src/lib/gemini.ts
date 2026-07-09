import { GoogleGenAI } from '@google/genai'

// Se inicializa el SDK de Google Gen AI.
// Requiere que GEMINI_API_KEY esté configurada — falla rápido si no lo está.
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey && typeof window === 'undefined') {
  console.error('[gemini] GEMINI_API_KEY no está configurada. Las llamadas a IA fallarán.')
}
export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
})
