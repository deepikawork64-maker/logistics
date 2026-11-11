/**
 * Deep Reader & NLP Entity Extractor for Inbound Attendee Emails
 * Analyzes free-form incoming email text to extract RSVP intent,
 * dietary preferences, flight / arrival details, hotel needs, and guest counts.
 */

import { RsvpStatus } from '../types/inviteOps';

export interface AnalyzedEmailResult {
  senderEmail: string;
  senderName: string;
  subject: string;
  rawBody: string;
  detectedIntent: 'attending' | 'declined' | 'inquiry' | 'tentative';
  status: RsvpStatus;
  confidence: number;
  extractedAttributes: {
    dietary?: string;
    hotelRequired?: boolean;
    arrivalFlight?: string;
    arrivalTime?: string;
    accompanyingGuests?: number;
    phone?: string;
    organization?: string;
    urgencyLevel: 'Low' | 'Medium' | 'High';
  };
  executiveSummary: string;
}

export class MailAnalyzer {
  /**
   * Deeply analyzes an inbound email message
   */
  static analyzeEmail(
    fromEmail: string,
    subject: string,
    body: string,
    senderName?: string
  ): AnalyzedEmailResult {
    const cleanFrom = fromEmail.trim().replace(/^.*<([^>]+)>.*$/, '$1').toLowerCase();
    const cleanName = senderName || cleanFrom.split('@')[0];
    const fullText = `${subject}\n${body}`.toLowerCase();

    // 1. INTENT DETECTION
    let detectedIntent: 'attending' | 'declined' | 'inquiry' | 'tentative' = 'inquiry';
    let status: RsvpStatus = 'Replied (Email)';
    let confidence = 0.75;

    // Attending Keywords & Patterns
    const attendingPatterns = [
      /\b(delighted|pleased|honored|happy|glad) to (attend|join|participate|accept)\b/,
      /\b(confirm|confirming|confirmed) (my|our) (attendance|presence|participation)\b/,
      /\bwill (definitely|certainly|surely)?\s*(be attending|attend|be there|join)\b/,
      /\bpleased to confirm\b/,
      /\baccept(ing|ed)? (your|the) (kind )?invitation\b/,
      /\bcount (me|us) in\b/,
      /\bsee you in bhopal\b/,
      /\blooking forward to the (summit|sessions|plenary|event)\b/,
      /\bour delegation will arrive\b/,
      /\bbooking (my|our) flights to bhopal\b/,
    ];

    // Declined Keywords & Patterns
    const declinedPatterns = [
      /\b(regret|regrets|regrettably)\b/,
      /\bunable to (attend|join|travel|participate|come)\b/,
      /\bcannot (attend|make it|join|travel|come)\b/,
      /\bwon't be able to (attend|come|travel|make it)\b/,
      /\b(prior|pre-existing|previous) (commitments|engagements|schedule|parliamentary)\b/,
      /\bsend (my|our) (sincere )?apologies\b/,
      /\bwill have to (pass|decline|miss)\b/,
      /\bhave to decline\b/,
      /\bnot able to attend\b/,
    ];

    // Tentative Patterns
    const tentativePatterns = [
      /\b(tentative|tentatively|subject to|depending on)\b/,
      /\bchecking (my|our) (schedule|availability)\b/,
      /\bawaiting (approval|clearance|confirmation)\b/,
      /\bhope to attend if\b/,
    ];

    let attendScore = 0;
    for (const p of attendingPatterns) {
      if (p.test(fullText)) attendScore += 2;
    }
    if (fullText.includes('confirm') || fullText.includes('attending') || fullText.includes('accepted')) {
      attendScore += 1;
    }

    let declineScore = 0;
    for (const p of declinedPatterns) {
      if (p.test(fullText)) declineScore += 2.5;
    }
    if (fullText.includes('decline') || fullText.includes('cannot') || fullText.includes('apologies')) {
      declineScore += 1;
    }

    let tentativeScore = 0;
    for (const p of tentativePatterns) {
      if (p.test(fullText)) tentativeScore += 2;
    }

    if (declineScore > attendScore && declineScore >= 2) {
      detectedIntent = 'declined';
      status = 'Declined';
      confidence = Math.min(0.96, 0.7 + declineScore * 0.08);
    } else if (attendScore > declineScore && attendScore >= 2) {
      detectedIntent = 'attending';
      status = 'Confirmed (Attending)';
      confidence = Math.min(0.98, 0.72 + attendScore * 0.07);
    } else if (tentativeScore >= 2) {
      detectedIntent = 'tentative';
      status = 'Replied (Email)';
      confidence = 0.8;
    } else {
      detectedIntent = 'inquiry';
      status = 'Replied (Email)';
      confidence = 0.65;
    }

    // 2. DIETARY PREFERENCE EXTRACTION
    let dietary: string | undefined;
    if (/\bjain\b/i.test(fullText)) {
      dietary = 'Strict Jain Vegetarian (no onion/garlic/root vegetables)';
    } else if (/\bvegan\b/i.test(fullText)) {
      dietary = 'Vegan (Plant-based, Dairy-free)';
    } else if (/\bhalal\b/i.test(fullText)) {
      dietary = 'Strict Halal Certified';
    } else if (/\bgluten[- ]free\b/i.test(fullText)) {
      dietary = 'Gluten-Free';
    } else if (/\bkosher\b/i.test(fullText)) {
      dietary = 'Kosher Certified';
    } else if (/\b(vegetarian|pure veg|veg meal)\b/i.test(fullText)) {
      dietary = 'Standard Vegetarian';
    } else if (/\b(nut allergy|peanut)\b/i.test(fullText)) {
      dietary = 'Severe Nut Allergy - Cross-contamination safe';
    } else if (/\b(non[- ]veg|chicken|fish|meat)\b/i.test(fullText)) {
      dietary = 'Non-Vegetarian / Continental';
    }

    // 3. HOTEL / ACCOMMODATION EXTRACTION
    let hotelRequired: boolean | undefined;
    if (
      /\b(hotel required|need (a )?room|require accommodation|hotel reservation|book (a )?hotel|room required|need hotel)\b/i.test(
        fullText
      )
    ) {
      hotelRequired = true;
    } else if (
      /\b(no hotel|self[- ]arranged|staying with|own accommodation|do not require hotel|don't need hotel)\b/i.test(
        fullText
      )
    ) {
      hotelRequired = false;
    } else if (detectedIntent === 'attending' && /\b(stay|hotel|room|suite)\b/i.test(fullText)) {
      hotelRequired = true;
    }

    // 4. FLIGHT / TRAIN & TRANSIT EXTRACTION
    let arrivalFlight: string | undefined;
    let arrivalTime: string | undefined;

    // Check Flight code patterns like AI-433, 6E 204, UK-955, EK512, AF-226, BA142
    const flightMatch = body.match(
      /\b([A-Z0-9]{2,3}[ -]?[0-9]{3,4})\b/i
    );
    // Check Train mentions like Shatabdi, Rajdhani, Vande Bharat
    const trainMatch = body.match(
      /\b(Vande Bharat|Shatabdi|Rajdhani|Express train)\b/i
    );

    if (flightMatch && !/\b(2027|2026)\b/.test(flightMatch[0])) {
      arrivalFlight = `Flight ${flightMatch[0].toUpperCase()}`;
    } else if (trainMatch) {
      arrivalFlight = `Train: ${trainMatch[0]}`;
    }

    // Check Arrival Time / Date patterns like "landing Jan 14 at 10:15", "14th January 16:30", "arrive at 9:00 AM"
    const timeMatch = body.match(
      /\b((?:Jan(?:uary)?|Feb(?:ruary)?)\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?))(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|ist)?))?/i
    );
    if (timeMatch) {
      arrivalTime = timeMatch[0];
      if (arrivalFlight) {
        arrivalFlight += ` (${arrivalTime})`;
      } else {
        arrivalFlight = `Arriving ${timeMatch[0]}`;
      }
    }

    // 5. ACCOMPANYING GUESTS
    let accompanyingGuests: number | undefined;
    const guestMatch = body.match(
      /\b(?:with|\+)\s*(\d{1,2})\s*(?:guests?|colleagues?|delegates?|staff|assistants?|members?)/i
    );
    const plusMatch = body.match(/\b\+(\d{1})\b/);

    if (guestMatch) {
      accompanyingGuests = parseInt(guestMatch[1], 10);
    } else if (plusMatch) {
      accompanyingGuests = parseInt(plusMatch[1], 10);
    }

    // 6. PHONE NUMBER EXTRACTION
    let phone: string | undefined;
    const phoneMatch = body.match(/(?:\+?\d{1,3}[- ]?)?\(?\d{3,5}\)?[- ]?\d{3,5}[- ]?\d{3,5}/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
      phone = phoneMatch[0].trim();
    }

    // 7. EXECUTIVE SUMMARY
    let summaryParts: string[] = [];
    if (detectedIntent === 'attending') {
      summaryParts.push('Confirmed attendance');
      if (accompanyingGuests) summaryParts.push(`with ${accompanyingGuests} guest(s)`);
      if (dietary) summaryParts.push(`[Dietary: ${dietary}]`);
      if (hotelRequired) summaryParts.push('[Hotel Requested]');
      if (arrivalFlight) summaryParts.push(`[Arrival: ${arrivalFlight}]`);
    } else if (detectedIntent === 'declined') {
      summaryParts.push('Sent regrets / Declined attendance');
      const reason = body.includes('parliament') ? ' (parliamentary commitments)' : body.includes('schedule') ? ' (schedule conflict)' : '';
      summaryParts.push(reason);
    } else {
      summaryParts.push('Inquired about summit details / logistics');
    }

    const executiveSummary = summaryParts.join(' ').trim();
    const isUrgent = fullText.includes('urgent') || fullText.includes('emergency') || fullText.includes('asap') || fullText.includes('vip');

    return {
      senderEmail: cleanFrom,
      senderName: cleanName,
      subject,
      rawBody: body,
      detectedIntent,
      status,
      confidence,
      extractedAttributes: {
        dietary,
        hotelRequired,
        arrivalFlight,
        arrivalTime,
        accompanyingGuests: accompanyingGuests || 0,
        phone,
        urgencyLevel: isUrgent ? 'High' : detectedIntent === 'attending' ? 'Medium' : 'Low',
      },
      executiveSummary,
    };
  }
}
