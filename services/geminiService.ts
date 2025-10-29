
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// This is a MOCK service. In a real application, you would implement the Gemini API call here.
// The API key would be handled by environment variables and not be exposed client-side.
// For this prototype, we simulate a delayed response.

export const getAssistantResponse = async (userMessage: string, history: ChatMessage[]): Promise<string> => {
  console.log("Simulating Gemini API call with message:", userMessage);
  console.log("Conversation history:", history);

  // In a real implementation:
  // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
  // const prompt = `... construct prompt from history and userMessage ...`;
  // const result = await model.generateContent(prompt);
  // const response = await result.response;
  // return response.text();

  return new Promise(resolve => {
    setTimeout(() => {
      let response = "No estoy seguro de cómo responder a eso. ¿Podrías intentar preguntar de otra manera?";
      if (userMessage.toLowerCase().includes("ciudad")) {
        response = "Entendido. El manejo en ciudad con frenados y arranques constantes puede causar ese tipo de desgaste si la presión no es la óptima. Te recomiendo revisar la presión y considerar una rotación. El modelo AVANTE ProGrip tiene excelente durabilidad para uso urbano. ¿Quieres que te muestre una comparación?";
      } else if (userMessage.toLowerCase().includes("carretera")) {
        response = "Gracias por la información. En carretera, el desgaste central a menudo indica sobreinflado. Te sugiero ajustar la presión según las especificaciones de tu vehículo. Esto mejorará la seguridad y el rendimiento. ¿Te gustaría agendar una revisión gratuita de presión y alineación?";
      } else if (userMessage.toLowerCase().includes("comparación")) {
        response = "Claro, aquí tienes una comparación. He destacado el costo por kilómetro para que veas el ahorro a largo plazo.";
      }
      resolve(response);
    }, 1500);
  });
};
