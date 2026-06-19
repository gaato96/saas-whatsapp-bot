import { GoogleGenAI } from '@google/genai'

// Se inicializa el SDK de Google Gen AI. 
// Espera que la variable de entorno GEMINI_API_KEY esté configurada.
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})
