
import { GoogleGenAI, Type } from "@google/genai";
import { QAResult } from "../types";

export const performQAComparison = async (
  masterBase64: string,
  productionBase64: string
): Promise<QAResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `
    You are a professional Apparel Label Quality Assurance Auditor.
    Compare the 'Master Specification' image and the 'Production Sample' image.
    Analyze for:
    1. OCR Text accuracy (wrong characters, missing text).
    2. Layout shifts (X/Y alignment of elements).
    3. Typography (font weight, style, size differences).

    CRITICAL SCORING LOGIC:
    - Start with 100 points.
    - DEDUCT 40 points for each 'Data' error (incorrect text, missing symbols).
    - DEDUCT 15 points for each 'Layout' or 'Typography' shift.
    - Ensure the 'accuracyScore' is between 0 and 100.

    Return the analysis as JSON with coordinates relative to a 1000x1000 grid of the image.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: "Compare these two apparel label clips. First is Master, second is Production." },
        { inlineData: { mimeType: 'image/jpeg', data: masterBase64.split(',')[1] } },
        { inlineData: { mimeType: 'image/jpeg', data: productionBase64.split(',')[1] } }
      ]
    },
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          accuracyScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          differences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  description: "Must be 'Data', 'Layout', or 'Typography'"
                },
                description: { type: Type.STRING },
                coords: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  },
                  required: ["x", "y", "width", "height"]
                }
              },
              required: ["id", "category", "description", "coords"]
            }
          }
        },
        required: ["accuracyScore", "summary", "differences"]
      }
    }
  });

  const result = JSON.parse(response.text.trim()) as QAResult;
  return result;
};
