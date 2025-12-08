import { ErrorResponse } from '@utils/errorResponse';
import { StatusCodes } from 'http-status-codes';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_URL: string = process.env.OLLAMA_URL || '';

export class ChatbotService {
  private chatHistory: Record<string, { user: string; bot: string }[]> = {};
  INTENT_CATEGORIES: string[] = [
    'greeting',
    'chit-chat',
    'navigation',
    //"get_report",
    //"product_info",
    'unknown',
    'essay',
    'writing',
    'homework',
    'paragraph',
    'math',
    'geography',
    'english_literature',
    'political',
    'activities',
  ];

  BAD_CATEGORIES: string[] = [
    'essay',
    'writing',
    'homework',
    'paragraph',
    'math',
    'geography',
    'english_literature',
    'political',
  ];

  MENU_CONTEXT = `The system navigation is structured as follows:
    Left sidebar (always opened) has the following items:
    - Dashboard: Overview of the platform
    - Staff: View staff members
    - Students: View student members
    - Classes: View your enrolled classes and schedules
    - Sessions: View sessions
    - Timetable: View timetable calendar
    - Resources: View books, files, custom activities
    - Assignments: View assignments
    - Progress: View progress
    - Revision center: View revision center
    - Wellness center: View moods and mood videos
    - Board: View pinned posts
    - Calendar: View calendar and events
    - E-library: View elibrary
    - Assets: View assets
    - Analytics: View platform analytics (logins, number of students, etc.)
    
    Top navigation bar (always opened) has the following items:
    - Language change: English (EN) or Greek (EL).
    - Messaging system: Messages, chat, group chat, file share.
    - Name, role and branch
    - User icon submenu: Includes profile settings, role, school settings and logout`;

  //If a user asks where to find their class schedule, tell them:
  //"Go to Classes → Pick class → Overview"
  //If a user asks where to find activities:
  //"Go to Activities on the left menu."
  //If a user is unsure where to click, guide them step-by-step.`;

  private async extractSearchKeyword(query: string) {
    const res = await fetch(OLLAMA_URL + 'generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `Extract only the activity type from the user message. Examples include multiple choice quiz, flashcards, or all. 
			  User message: "${query}"
			  Only return the activity type. Do NOT explain.`,
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response.trim().toLowerCase();
  }

  private async getEmbeddingFromOllama(text: string) {
    const res = await fetch(OLLAMA_URL + 'embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text,
        stream: false,
      }),
    });

    const data: any = await res.json();
    if (!data.embedding) {
      throw new Error('Embedding not returned by Ollama');
    }
    return data.embedding;
  }

  private async getLLMResponse(context: any[], question: string) {
    const fullPrompt = `You are a helpful assistant. Use the following context to answer the question.
      Context:
      ${context.join('\n\n')}
      Question:
      ${question}
      Answer:`;

    const res = await fetch(OLLAMA_URL + 'generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: fullPrompt,
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response;
  }

  private async detectIntent(userMessage: string) {
    const systemPrompt = `You are an intent detection system. Your job is to classify a user's message into one of the following intent categories:
      ${this.INTENT_CATEGORIES.map((i) => `- ${i}`).join('\n')}
      Only return the intent name as a single word. No explanation.`;

    const prompt = `${systemPrompt}\n\nUser: ${userMessage}\nIntent:`;

    const res = await fetch(OLLAMA_URL + 'generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt,
        temperature: 0,
        stream: false,
      }),
    });

    const data: any = await res.json();
    //console.log(data);
    return data.response.trim();
  }

  async getChatbotMessage(message: string) {
    if (!message) {
      throw new ErrorResponse('Wrong message or message missing.', StatusCodes.BAD_REQUEST);
    }

    const intent = await this.detectIntent(message);

    if (intent === 'greeting') {
      return { reply: 'Hello! How can I help you today?' };
    }

    if (intent === 'chit-chat') {
      const resLLM = await fetch(OLLAMA_URL + 'generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `The user is having a casual conversation. Respond helpfully and naturally.\nUser: ${message}\nAssistant:`,
          stream: false,
        }),
      });

      const data: any = await resLLM.json();
      return { reply: data.response.trim() };
    }
    if (intent === 'navigation') {
      return {
        reply: await this.getLLMResponse([this.MENU_CONTEXT], message),
      };
    }

    if (this.BAD_CATEGORIES.includes(intent)) {
      return { reply: "I'm not sure how to help with that." };
    }

    const reply = await this.getLLMResponse([message], message);
    return { reply };
  }
}
