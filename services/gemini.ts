
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const localAssistantFallback = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (/rights|articles|constitution|324|325|326|327|328|329/.test(normalized)) {
    return `Indian citizens have the right to vote under Articles 324-329 of the Constitution. The Election Commission of India administers inclusive, free and fair elections. If you are a registered voter, you can participate using your assigned EPIC and Aadhaar verification to cast one secure ballot in your constituency.`;
  }

  if (/how.*vote|how to vote|vote process|voting process/.test(normalized)) {
    return `To vote in BharatVote, log in as a citizen, verify your identity, and access the ballot for your constituency. Select your preferred candidate, review your choice carefully, then confirm and submit. The system records your vote securely and updates the count in real time.`;
  }

  if (/aadhaar|otp|one time passcode|one-time passcode|one time password/.test(normalized)) {
    return `Aadhaar OTP verification is used to confirm your identity. Enter your 12-digit Aadhaar number, request an OTP, then enter the 6-digit code sent to your registered mobile number. Once verified, you can proceed to vote or register securely.`;
  }

  if (/candidate|candidates|party|constituency/.test(normalized)) {
    return `Candidate details are available on the ballot screen for your constituency. You can review each candidate's name, party, symbol, and manifesto summary before choosing your preferred representative.`;
  }

  if (/register|registration|sign up|sign-up/.test(normalized)) {
    return `To register as a voter, go to the registration page and provide your details, EPIC number, Aadhaar number, constituency, and a PIN. Complete Aadhaar verification with OTP if prompted, and then you will be eligible to log in and cast your vote.`;
  }

  if (/results|live tally|vote count|result/.test(normalized)) {
    return `Live results are shown on the results dashboard. After voting ends, the official tally is published. Until then, you can view the current vote count snapshot, turnout stats, and candidate rankings.`;
  }

  if (/admin|official|election officer/.test(normalized)) {
    return `The admin portal allows election officials to manage candidates, view voter turnout, and monitor audit logs. Administrative access is restricted and requires official credentials.`;
  }

  if (/hello|hi|namaste|hey/.test(normalized)) {
    return `Namaste! I am BharatVote Buddy. Ask me about voter registration, Aadhaar OTP verification, the voting process, or how to view election results.`;
  }

  return `I am BharatVote Buddy. You can ask me about voting rights, Aadhaar OTP login, candidate information, voter registration, and how the ballot works. If you need help, try asking something like "How do I vote?" or "What are my voting rights?"`;
};

export const getElectionGuidance = async (userMessage: string, history: ChatMessage[]) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!apiKey) {
    return localAssistantFallback(userMessage);
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      // Map history to the format expected by the Gemini API
      history: history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        parts: [{ text: msg.text }]
      })),
      config: {
        systemInstruction: `You are BharatVote Buddy, an official AI assistant for the Indian Online Voting System. 
        Your goal is to help Indian citizens understand the voting process, provide information about their rights (Articles 324-329 of the Constitution), 
        explain how electronic voting works, and offer general information about democratic processes. 
        Keep responses professional, patriotic, neutral, and helpful. 
        Do not endorse any specific political party or candidate. 
        If asked about current events, use search to provide accurate data.`,
        tools: [{ googleSearch: {} }]
      }
    });

    const response = await chat.sendMessage({ message: userMessage });
    
    // Extract grounding information if Google Search was utilized
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let finalOutput = response.text || "";
    
    if (groundingChunks && groundingChunks.length > 0) {
      const sources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => chunk.web);
      
      if (sources.length > 0) {
        finalOutput += "\n\nSources for further reading:\n";
        sources.forEach((source: any) => {
          finalOutput += `- [${source.title}](${source.uri})\n`;
        });
      }
    }

    return finalOutput;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the election assistant right now. Please try again or visit the Election Commission of India website directly.";
  }
};
