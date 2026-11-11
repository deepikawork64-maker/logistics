import { GoogleGenAI } from '@google/genai';
import { TicketCategory, TicketPriority } from '../types/system';

export interface ClassificationResult {
  category: TicketCategory;
  summary: string;
  priority: TicketPriority;
  confidence: number;
}

const KEYWORDS: Record<TicketCategory, string[]> = {
  registration: ['register', 'registration', 'badge', 'pass', 'invite', 'credential', 'ticket number'],
  travel: ['flight', 'train', 'ticket', 'travel', 'arrival', 'departure', 'boarding', 'airline'],
  accommodation: ['hotel', 'room', 'stay', 'check-in', 'accommodation', 'suite', 'checkout', 'booking'],
  transportation: ['cab', 'pickup', 'drop', 'shuttle', 'transport', 'airport', 'driver', 'car', 'transfer'],
  venue: ['venue', 'hall', 'seating', 'parking', 'location', 'entry', 'stage', 'gate', 'pavilion'],
  food: ['food', 'meal', 'lunch', 'dinner', 'veg', 'diet', 'allergy', 'jain', 'breakfast', 'beverage'],
  vip_protocol: ['vip', 'minister', 'protocol', 'secretary', 'ceo', 'chairman', 'ambassador', 'dignitary', 'escort', 'consul'],
  general: ['inquiry', 'agenda', 'schedule', 'contact', 'dress code', 'help', 'question'],
};

export function fallbackClassify(subject: string, body: string): ClassificationResult {
  const text = `${subject} ${body}`.toLowerCase();
  let bestCategory: TicketCategory = 'general';
  let bestScore = 0;

  for (const [cat, words] of Object.entries(KEYWORDS) as [TicketCategory, string[]][]) {
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  const isVip = bestCategory === 'vip_protocol' || text.includes('vip') || text.includes('urgent') || text.includes('emergency');
  const isLow = text.includes('feedback') || text.includes('later') || text.includes('general info');
  const priority: TicketPriority = isVip ? 'High' : isLow ? 'Low' : 'Medium';

  const cleanBody = body.trim().replace(/\n+/g, ' ');
  const summary = cleanBody.length > 0 ? (cleanBody.length > 150 ? cleanBody.slice(0, 150) + '...' : cleanBody) : subject;

  const confidence = bestScore > 2 ? 0.92 : bestScore > 0 ? 0.78 : 0.52;

  return {
    category: bestCategory,
    summary,
    priority,
    confidence,
  };
}

export async function classifyEmail(subject: string, body: string): Promise<ClassificationResult> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return fallbackClassify(subject, body);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an event-support assistant for an international summit. Classify the attendee email below.

Categories: registration, travel, accommodation, transportation, venue, food, vip_protocol, general
Priority: High (VIP, urgent, same-day/next-day travel, medical/accessibility), Medium, Low

Return ONLY valid JSON with keys:
  "category": one of the categories,
  "summary": 1-2 sentence concise summary of what the attendee needs,
  "priority": "High" | "Medium" | "Low",
  "confidence": number between 0 and 1

Subject: ${subject}
Body:
${body.slice(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const validCategories: TicketCategory[] = [
      'registration',
      'travel',
      'accommodation',
      'transportation',
      'venue',
      'food',
      'vip_protocol',
      'general',
    ];

    const category: TicketCategory = validCategories.includes(parsed.category)
      ? parsed.category
      : 'general';

    const priority: TicketPriority = ['High', 'Medium', 'Low'].includes(parsed.priority)
      ? parsed.priority
      : 'Medium';

    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;

    return {
      category,
      summary: parsed.summary || subject,
      priority,
      confidence,
    };
  } catch (err) {
    console.warn('[AI classification fallback engaged]:', err);
    return fallbackClassify(subject, body);
  }
}
