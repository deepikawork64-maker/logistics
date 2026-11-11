import * as XLSX from 'xlsx';
import {
  Delegate,
  UploadedDocument,
  ImapConfig,
  GoogleFormConfig,
  Campaign,
  ActivityEvent,
  FormSubmissionData,
  RsvpStatus,
} from '../types/inviteOps';

const KEYS = {
  DELEGATES: 'fieldnote_delegates_v2',
  DOCUMENTS: 'fieldnote_documents_v2',
  IMAP: 'fieldnote_imap_v2',
  GFORM: 'fieldnote_gform_v2',
  CAMPAIGNS: 'fieldnote_campaigns_v2',
  ACTIVITIES: 'fieldnote_activities_v2',
};

const DEFAULT_IMAP: ImapConfig = {
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  emailUser: 'Deepikawork64@gmail.com',
  appPassword: '••••••••••••',
  useSsl: true,
  connected: true,
  lastSyncAt: new Date(Date.now() - 45000).toISOString(),
  autoSyncIntervalSec: 30,
};

const DEFAULT_GFORM: GoogleFormConfig = {
  formTitle: 'Bhopal Summit 2027 Official RSVP & Protocol Confirmation',
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScX9.../viewform',
  responseSheetUrl: 'https://docs.google.com/spreadsheets/d/1BhopalSummit.../pub?output=csv',
  webhookUrl: 'https://ais-dev.bhopalsummit.org/api/webhooks/gform',
  connected: true,
  lastSyncAt: new Date(Date.now() - 120000).toISOString(),
  totalSubmissions: 28,
  fieldMappings: {
    emailField: 'Email Address',
    nameField: 'Full Name & Title',
    attendanceField: 'Will you be attending the Summit in Bhopal?',
    dietaryField: 'Dietary Preference (Jain, Veg, Halal, etc.)',
    hotelField: 'Do you require Summit Hotel Accommodations?',
    flightField: 'Arrival Flight Number & Landing Time',
  },
};

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Round 1: VVIP & Ministerial Delegations Formal Summons',
    subject: 'Official Invitation: Bhopal Global Investor Summit (January 2027) [INV-{{ID}}]',
    bodyTemplate:
      'Dear {{Name}},\n\nOn behalf of the Government of Madhya Pradesh and the Summit Secretariat, we have the high honor to invite you to the Bhopal Global Investor Summit.\n\nPlease confirm your attendance by replying to this transmission or completing the official protocol Google Form below:\n{{GoogleFormLink}}\n\nWarm regards,\nDr. A. Sen\nChief Protocol Officer',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScX9.../viewform',
    sentAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    recipientCount: 35,
    confirmedCount: 22,
    declinedCount: 3,
    status: 'Completed',
  },
  {
    id: 'camp-2',
    title: 'Round 2: Corporate Leaders & Technical Speakers Invite',
    subject: 'Invitation to Lead Plenary Session: Bhopal Summit 2027 [INV-{{ID}}]',
    bodyTemplate:
      'Dear {{Name}},\n\nWe cordially invite you to represent {{Organization}} at the Bhopal Summit. Kindly register your travel details and confirmation on the link below:\n{{GoogleFormLink}}\n\nSummit Operations Desk',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScX9.../viewform',
    sentAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    recipientCount: 42,
    confirmedCount: 16,
    declinedCount: 2,
    status: 'Completed',
  },
];

const INITIAL_DOCS: UploadedDocument[] = [
  {
    id: 'doc-01',
    fileName: 'VIP_Diplomatic_Delegates_Manifest_2027.xlsx',
    fileType: 'xlsx',
    fileSize: '48.2 KB',
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    recordCount: 24,
    status: 'Parsed & Imported',
  },
  {
    id: 'doc-02',
    fileName: 'Registered_Keynote_Speakers_List.csv',
    fileType: 'csv',
    fileSize: '18.6 KB',
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    recordCount: 18,
    status: 'Parsed & Imported',
  },
  {
    id: 'doc-03',
    fileName: 'Chamber_Of_Commerce_CEOs_Roster.pdf',
    fileType: 'pdf',
    fileSize: '124.5 KB',
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    recordCount: 16,
    status: 'Parsed & Imported',
  },
];

const INITIAL_DELEGATES: Delegate[] = [
  {
    id: 'del-1',
    name: 'Ambassador Jean-Luc Morel',
    email: 'ambassador.morel@diplomatie.gouv.fr',
    phone: '+33 1 43 17 53 53',
    organization: 'Embassy of France to India',
    designation: 'Ambassador Extraordinary and Plenipotentiary',
    tier: 'VVIP / Minister',
    status: 'Confirmed (Attending)',
    sourceDocName: 'VIP_Diplomatic_Delegates_Manifest_2027.xlsx',
    invitationSentAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    formSubmittedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
    formData: {
      submittedAt: new Date(Date.now() - 3600000 * 16).toISOString(),
      attending: true,
      phone: '+33 1 43 17 53 53',
      organization: 'Embassy of France',
      designation: 'Ambassador',
      dietary: 'No red meat / European vegetarian acceptable',
      hotelRequired: true,
      arrivalFlight: 'AF-226 / AI-433 Connection',
      arrivalTime: 'Jan 14, 10:15 IST at Raja Bhoj',
      accompanyingGuests: 3,
      notes: 'Requires VIP Ramp Gate 2 clearance at Jehan Numa Palace.',
    },
    interactions: [
      {
        id: 'msg-1',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 40).toISOString(),
        subject: 'Official Invitation: Bhopal Global Investor Summit [INV-del-1]',
        body: 'Your Excellency, on behalf of the Governor of Madhya Pradesh...',
        from: 'Deepikawork64@gmail.com',
        to: 'ambassador.morel@diplomatie.gouv.fr',
      },
      {
        id: 'msg-2',
        type: 'inbound_reply',
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
        subject: 'Re: Official Invitation: Bhopal Global Investor Summit [INV-del-1]',
        body: 'I am delighted to accept. We have also completed the attached Google Form with our motorcade specifications.',
        from: 'ambassador.morel@diplomatie.gouv.fr',
        to: 'Deepikawork64@gmail.com',
        detectedIntent: 'attending',
      },
    ],
    tags: ['VIP Protocol', 'Foreign Delegation', 'French Republic'],
  },
  {
    id: 'del-2',
    name: 'Prof. Ananya Roy',
    email: 'ananya.roy@csir.res.in',
    phone: '+91 98260 11442',
    organization: 'CSIR & IIT Indore',
    designation: 'Chair of Clean Energy Microgrids',
    tier: 'Speaker',
    status: 'Confirmed (Attending)',
    sourceDocName: 'Registered_Keynote_Speakers_List.csv',
    invitationSentAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    formSubmittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    formData: {
      submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      attending: true,
      phone: '+91 98260 11442',
      organization: 'CSIR & IIT Indore',
      designation: 'Chair Professor',
      dietary: 'Standard Vegetarian',
      hotelRequired: true,
      arrivalFlight: 'Train: Shatabdi Express from Delhi',
      arrivalTime: 'Jan 13, 21:40 IST Bhopal Junction',
      accompanyingGuests: 0,
      notes: 'Requires HDMI display connection for Stage B slides.',
    },
    interactions: [
      {
        id: 'msg-3',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        subject: 'Invitation to Lead Plenary Session: Bhopal Summit 2027 [INV-del-2]',
        body: 'Dear Prof. Roy, we cordially invite you to speak...',
        from: 'Deepikawork64@gmail.com',
        to: 'ananya.roy@csir.res.in',
      },
    ],
    tags: ['Keynote Speaker', 'Clean Tech'],
  },
  {
    id: 'del-3',
    name: 'Vikramaditya K. Singhania',
    email: 'v.singhania@apexindustrial.com',
    phone: '+91 98110 99882',
    organization: 'Apex Industrial Holdings',
    designation: 'Managing Director & CEO',
    tier: 'Corporate CEO',
    status: 'Replied (Email)',
    sourceDocName: 'Chamber_Of_Commerce_CEOs_Roster.pdf',
    invitationSentAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    lastReplyAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    interactions: [
      {
        id: 'msg-4',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        subject: 'Invitation to Lead Plenary Session: Bhopal Summit 2027 [INV-del-3]',
        body: 'Dear Mr. Singhania, we cordially invite you...',
        from: 'Deepikawork64@gmail.com',
        to: 'v.singhania@apexindustrial.com',
      },
      {
        id: 'msg-5',
        type: 'inbound_reply',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        subject: 'Re: Invitation to Lead Plenary Session: Bhopal Summit 2027 [INV-del-3]',
        body: 'Thank you for the invitation. Could you please share the bilateral roundtable schedule before we finalize our charter flight timings?',
        from: 'v.singhania@apexindustrial.com',
        to: 'Deepikawork64@gmail.com',
        detectedIntent: 'inquiry',
      },
    ],
    tags: ['Investor', 'Bilateral Session'],
  },
  {
    id: 'del-4',
    name: 'Dr. Tariq Al-Hashimi',
    email: 'tariq.hashimi@araburban.org',
    phone: '+971 4 282 9900',
    organization: 'Council of Historic Islamic Cities',
    designation: 'Secretary General',
    tier: 'Head of Delegation',
    status: 'Form Submitted',
    sourceDocName: 'VIP_Diplomatic_Delegates_Manifest_2027.xlsx',
    invitationSentAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    formSubmittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    formData: {
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      attending: true,
      phone: '+971 4 282 9900',
      organization: 'Council of Historic Cities',
      designation: 'Secretary General',
      dietary: 'Strict Halal Meals',
      hotelRequired: true,
      arrivalFlight: 'EK-512 via Mumbai to Bhopal AI-634',
      arrivalTime: 'Jan 14, 13:45 IST',
      accompanyingGuests: 2,
    },
    interactions: [
      {
        id: 'msg-6',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
        subject: 'Official Invitation: Bhopal Global Investor Summit [INV-del-4]',
        body: 'Your Excellency Dr. Tariq...',
        from: 'Deepikawork64@gmail.com',
        to: 'tariq.hashimi@araburban.org',
      },
    ],
    tags: ['Taj-ul-Masajid Concourse', 'Heritage Plenary'],
  },
  {
    id: 'del-5',
    name: 'Kavita Jain',
    email: 'kavita.jain@vcpartners.in',
    phone: '+91 99200 33411',
    organization: 'Apex Ventures India',
    designation: 'General Partner',
    tier: 'Corporate CEO',
    status: 'Confirmed (Attending)',
    sourceDocName: 'Registered_Keynote_Speakers_List.csv',
    invitationSentAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    formSubmittedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    formData: {
      submittedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      attending: true,
      dietary: 'Strict Jain Vegetarian (no onion/garlic/root crops)',
      hotelRequired: false,
      arrivalFlight: 'Self-drive from Indore',
      arrivalTime: 'Jan 14, 08:30 IST',
      accompanyingGuests: 0,
    },
    interactions: [
      {
        id: 'msg-7',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        subject: 'Invitation: Bhopal Summit 2027 [INV-del-5]',
        body: 'Dear Ms. Jain...',
        from: 'Deepikawork64@gmail.com',
        to: 'kavita.jain@vcpartners.in',
      },
    ],
    tags: ['Startup Funding Panel'],
  },
  {
    id: 'del-6',
    name: 'Sir Robert Sterling',
    email: 'r.sterling@commonwealthtrust.uk',
    phone: '+44 20 7946 0192',
    organization: 'Commonwealth Heritage Fund',
    designation: 'Senior Trustee',
    tier: 'Head of Delegation',
    status: 'Declined',
    sourceDocName: 'VIP_Diplomatic_Delegates_Manifest_2027.xlsx',
    invitationSentAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    lastReplyAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    interactions: [
      {
        id: 'msg-8',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        subject: 'Official Invitation: Bhopal Global Investor Summit [INV-del-6]',
        body: 'Dear Sir Robert...',
        from: 'Deepikawork64@gmail.com',
        to: 'r.sterling@commonwealthtrust.uk',
      },
      {
        id: 'msg-9',
        type: 'inbound_reply',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        subject: 'Re: Official Invitation: Bhopal Global Investor Summit [INV-del-6]',
        body: 'Regrettably, due to pre-existing parliamentary commitments in London, I will be unable to travel to Bhopal. My deputy Mr. Colin Vance will attend in my stead.',
        from: 'r.sterling@commonwealthtrust.uk',
        to: 'Deepikawork64@gmail.com',
        detectedIntent: 'declined',
      },
    ],
    tags: ['Regrets Received', 'UK Delegation'],
  },
  {
    id: 'del-7',
    name: 'Dr. Priya Saxena',
    email: 'dr.priya.saxena@aiimsbhopal.edu.in',
    phone: '+91 94250 88211',
    organization: 'AIIMS Bhopal Medical Command',
    designation: 'Head of Emergency & Disaster Medicine',
    tier: 'Speaker',
    status: 'Invitation Sent',
    sourceDocName: 'Registered_Keynote_Speakers_List.csv',
    invitationSentAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    interactions: [
      {
        id: 'msg-10',
        type: 'invitation_sent',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        subject: 'Invitation to Lead Plenary Session: Bhopal Summit 2027 [INV-del-7]',
        body: 'Dear Dr. Saxena...',
        from: 'Deepikawork64@gmail.com',
        to: 'dr.priya.saxena@aiimsbhopal.edu.in',
      },
    ],
    tags: ['Medical Protocol', 'Emergency Response'],
  },
  {
    id: 'del-8',
    name: 'Suresh K. Narang',
    email: 'suresh.narang@mpdiscom.gov.in',
    phone: '+91 94251 00293',
    organization: 'Madhya Pradesh Central Discom',
    designation: 'Chief Engineer (Substations)',
    tier: 'General Delegate',
    status: 'Not Invited',
    sourceDocName: 'VIP_Diplomatic_Delegates_Manifest_2027.xlsx',
    interactions: [],
    tags: ['Power & Grid Liaison'],
  },
];

const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act-1',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    type: 'form_submission',
    title: 'Google Form Response Synced',
    description: 'Kavita Jain submitted RSVP form. Dietary: Strict Jain Vegetarian, Status: Confirmed.',
    delegateEmail: 'kavita.jain@vcpartners.in',
  },
  {
    id: 'act-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'form_submission',
    title: 'Google Form Response Synced',
    description: 'Dr. Tariq Al-Hashimi submitted RSVP form. Flight EK-512 / AI-634, Hotel Required.',
    delegateEmail: 'tariq.hashimi@araburban.org',
  },
  {
    id: 'act-3',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'imap_reply_received',
    title: 'Inbound Email Reply Received',
    description: 'Vikramaditya K. Singhania inquired about bilateral schedule. Status changed to Replied (Email).',
    delegateEmail: 'v.singhania@apexindustrial.com',
  },
  {
    id: 'act-4',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    type: 'email_sent',
    title: 'Campaign 2 Dispatched',
    description: 'Dispatched 42 personalized email invitations with Google Form link attached.',
  },
  {
    id: 'act-5',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    type: 'document_uploaded',
    title: 'Document Parsed & Ingested',
    description: 'Chamber_Of_Commerce_CEOs_Roster.pdf uploaded. 16 corporate delegates extracted.',
  },
];

export class InviteStorage {
  private static read<T>(key: string, def: T): T {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  }

  private static write<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  static init(): void {
    if (!localStorage.getItem(KEYS.DELEGATES)) {
      this.write(KEYS.DELEGATES, INITIAL_DELEGATES);
    }
    if (!localStorage.getItem(KEYS.DOCUMENTS)) {
      this.write(KEYS.DOCUMENTS, INITIAL_DOCS);
    }
    if (!localStorage.getItem(KEYS.IMAP)) {
      this.write(KEYS.IMAP, DEFAULT_IMAP);
    }
    if (!localStorage.getItem(KEYS.GFORM)) {
      this.write(KEYS.GFORM, DEFAULT_GFORM);
    }
    if (!localStorage.getItem(KEYS.CAMPAIGNS)) {
      this.write(KEYS.CAMPAIGNS, DEFAULT_CAMPAIGNS);
    }
    if (!localStorage.getItem(KEYS.ACTIVITIES)) {
      this.write(KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
  }

  static getDelegates(): Delegate[] {
    return this.read<Delegate[]>(KEYS.DELEGATES, INITIAL_DELEGATES);
  }

  static getDocuments(): UploadedDocument[] {
    return this.read<UploadedDocument[]>(KEYS.DOCUMENTS, INITIAL_DOCS);
  }

  static getImapConfig(): ImapConfig {
    return this.read<ImapConfig>(KEYS.IMAP, DEFAULT_IMAP);
  }

  static setImapConfig(cfg: ImapConfig): void {
    this.write(KEYS.IMAP, cfg);
    this.logActivity('status_changed', 'IMAP Configuration Updated', `Mailbox: ${cfg.emailUser} on ${cfg.imapHost}:${cfg.imapPort}`);
  }

  static getGoogleFormConfig(): GoogleFormConfig {
    return this.read<GoogleFormConfig>(KEYS.GFORM, DEFAULT_GFORM);
  }

  static setGoogleFormConfig(cfg: GoogleFormConfig): void {
    this.write(KEYS.GFORM, cfg);
    this.logActivity('status_changed', 'Google Form Webhook & Link Updated', `Form: ${cfg.formTitle}`);
  }

  static getCampaigns(): Campaign[] {
    return this.read<Campaign[]>(KEYS.CAMPAIGNS, DEFAULT_CAMPAIGNS);
  }

  static getActivities(): ActivityEvent[] {
    return this.read<ActivityEvent[]>(KEYS.ACTIVITIES, INITIAL_ACTIVITIES).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  static logActivity(
    type: ActivityEvent['type'],
    title: string,
    description: string,
    delegateEmail?: string
  ): void {
    const list = this.read<ActivityEvent[]>(KEYS.ACTIVITIES, []);
    list.unshift({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      description,
      delegateEmail,
    });
    this.write(KEYS.ACTIVITIES, list.slice(0, 100));
  }

  // Continuous Document Ingestion (CSV, XLSX, PDF)
  static addUploadedDocument(
    doc: Omit<UploadedDocument, 'id' | 'uploadedAt'>,
    delegates: Omit<Delegate, 'id' | 'interactions'>[]
  ): { docId: string; importedCount: number } {
    const docs = this.getDocuments();
    const docId = `doc-${Date.now()}`;
    const newDoc: UploadedDocument = {
      ...doc,
      id: docId,
      uploadedAt: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    this.write(KEYS.DOCUMENTS, docs);

    // Merge or append delegates
    const master = this.getDelegates();
    let importedCount = 0;

    for (const d of delegates) {
      const existingIdx = master.findIndex((m) => m.email.toLowerCase() === d.email.toLowerCase());
      if (existingIdx !== -1) {
        // Enrich existing contact with newly discovered data
        master[existingIdx] = {
          ...master[existingIdx],
          organization: master[existingIdx].organization || d.organization,
          phone: master[existingIdx].phone || d.phone,
          designation: master[existingIdx].designation || d.designation,
          sourceDocId: docId,
          sourceDocName: doc.fileName,
          tags: Array.from(new Set([...master[existingIdx].tags, ...d.tags])),
        };
      } else {
        const newDel: Delegate = {
          ...d,
          id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sourceDocId: docId,
          sourceDocName: doc.fileName,
          interactions: [],
        };
        master.push(newDel);
        importedCount++;
      }
    }

    this.write(KEYS.DELEGATES, master);
    this.logActivity(
      'document_uploaded',
      `Document Uploaded: ${doc.fileName}`,
      `Ingested ${doc.recordCount} rows (${doc.fileType.toUpperCase()}). Merged ${importedCount} new contacts.`
    );

    return { docId, importedCount };
  }

  // Send Bulk Invitation Campaign
  static sendCampaign(
    title: string,
    subject: string,
    bodyTemplate: string,
    googleFormUrl: string,
    delegateIds: string[]
  ): Campaign {
    const delegates = this.getDelegates();
    const nowIso = new Date().toISOString();
    let count = 0;

    delegates.forEach((d) => {
      if (delegateIds.includes(d.id)) {
        d.status = 'Invitation Sent';
        d.invitationSentAt = nowIso;
        d.interactions.push({
          id: `inv-${Date.now()}-${d.id}`,
          type: 'invitation_sent',
          timestamp: nowIso,
          subject: subject.replace(/\{\{ID\}\}/g, d.id),
          body: bodyTemplate
            .replace(/\{\{Name\}\}/g, d.name)
            .replace(/\{\{Organization\}\}/g, d.organization || 'your organization')
            .replace(/\{\{GoogleFormLink\}\}/g, googleFormUrl),
          from: this.getImapConfig().emailUser,
          to: d.email,
        });
        count++;
      }
    });

    this.write(KEYS.DELEGATES, delegates);

    const campaigns = this.getCampaigns();
    const campId = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      id: campId,
      title,
      subject,
      bodyTemplate,
      googleFormUrl,
      sentAt: nowIso,
      recipientCount: count,
      confirmedCount: 0,
      declinedCount: 0,
      status: 'Completed',
    };
    campaigns.unshift(newCamp);
    this.write(KEYS.CAMPAIGNS, campaigns);

    this.logActivity(
      'email_sent',
      `Invitation Campaign Dispatched: ${title}`,
      `Sent ${count} personalized emails with Google Form tracking link attached.`
    );

    return newCamp;
  }

  // Auto-Update on IMAP Inbound Reply
  static ingestImapReply(
    fromEmail: string,
    subject: string,
    body: string
  ): { matched: boolean; delegate?: Delegate; intent: string } {
    const delegates = this.getDelegates();
    const cleanFrom = fromEmail.toLowerCase().trim();
    const idx = delegates.findIndex((d) => d.email.toLowerCase() === cleanFrom);

    const text = `${subject} ${body}`.toLowerCase();
    let intent: 'attending' | 'declined' | 'inquiry' | 'general' = 'general';

    if (
      text.includes('pleased to attend') ||
      text.includes('delighted to accept') ||
      text.includes('will attend') ||
      text.includes('confirming my attendance') ||
      text.includes('see you in bhopal')
    ) {
      intent = 'attending';
    } else if (
      text.includes('unable to attend') ||
      text.includes('regret') ||
      text.includes('cannot make it') ||
      text.includes('decline') ||
      text.includes('prior engagement')
    ) {
      intent = 'declined';
    } else if (text.includes('?') || text.includes('schedule') || text.includes('hotel') || text.includes('timing')) {
      intent = 'inquiry';
    }

    const nowIso = new Date().toISOString();

    if (idx !== -1) {
      const d = delegates[idx];
      d.lastReplyAt = nowIso;
      if (intent === 'attending') {
        d.status = 'Confirmed (Attending)';
      } else if (intent === 'declined') {
        d.status = 'Declined';
      } else {
        d.status = 'Replied (Email)';
      }

      d.interactions.push({
        id: `reply-${Date.now()}`,
        type: 'inbound_reply',
        timestamp: nowIso,
        subject,
        body,
        from: fromEmail,
        to: this.getImapConfig().emailUser,
        detectedIntent: intent,
      });

      delegates[idx] = d;
      this.write(KEYS.DELEGATES, delegates);

      this.logActivity(
        'imap_reply_received',
        `IMAP Inbound Reply from ${d.name}`,
        `Detected Intent: [${intent.toUpperCase()}]. Status updated automatically to ${d.status}.`,
        d.email
      );

      return { matched: true, delegate: d, intent };
    } else {
      // Unrecognized delegate reply -> create record
      const name = fromEmail.split('@')[0].replace(/[._-]/g, ' ');
      const newD: Delegate = {
        id: `del-${Date.now()}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: fromEmail,
        tier: 'General Delegate',
        status: intent === 'attending' ? 'Confirmed (Attending)' : 'Replied (Email)',
        lastReplyAt: nowIso,
        interactions: [
          {
            id: `reply-${Date.now()}`,
            type: 'inbound_reply',
            timestamp: nowIso,
            subject,
            body,
            from: fromEmail,
            to: this.getImapConfig().emailUser,
            detectedIntent: intent,
          },
        ],
        tags: ['Inbound Email Discovered'],
      };
      delegates.push(newD);
      this.write(KEYS.DELEGATES, delegates);

      this.logActivity(
        'imap_reply_received',
        `New Attendee Email Ingested: ${fromEmail}`,
        `Auto-created guest record. Intent: ${intent}.`,
        fromEmail
      );

      return { matched: false, delegate: newD, intent };
    }
  }

  // Auto-Update on Google Form Response
  static ingestGoogleFormSubmission(data: {
    email: string;
    name?: string;
    attending: boolean;
    phone?: string;
    organization?: string;
    designation?: string;
    dietary?: string;
    hotelRequired?: boolean;
    arrivalFlight?: string;
    arrivalTime?: string;
    accompanyingGuests?: number;
    notes?: string;
  }): Delegate {
    const delegates = this.getDelegates();
    const cleanEmail = data.email.toLowerCase().trim();
    const idx = delegates.findIndex((d) => d.email.toLowerCase() === cleanEmail);
    const nowIso = new Date().toISOString();

    const submission: FormSubmissionData = {
      submittedAt: nowIso,
      attending: data.attending,
      phone: data.phone,
      organization: data.organization,
      designation: data.designation,
      dietary: data.dietary,
      hotelRequired: data.hotelRequired,
      arrivalFlight: data.arrivalFlight,
      arrivalTime: data.arrivalTime,
      accompanyingGuests: data.accompanyingGuests || 0,
      notes: data.notes,
    };

    let targetDelegate: Delegate;

    if (idx !== -1) {
      const d = delegates[idx];
      d.status = data.attending ? 'Confirmed (Attending)' : 'Declined';
      d.formSubmittedAt = nowIso;
      d.formData = submission;
      if (data.name) d.name = data.name;
      if (data.phone) d.phone = data.phone;
      if (data.organization) d.organization = data.organization;
      if (data.designation) d.designation = data.designation;

      delegates[idx] = d;
      targetDelegate = d;
    } else {
      const name = data.name || cleanEmail.split('@')[0];
      targetDelegate = {
        id: `del-${Date.now()}`,
        name,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        designation: data.designation,
        tier: 'General Delegate',
        status: data.attending ? 'Confirmed (Attending)' : 'Declined',
        formSubmittedAt: nowIso,
        formData: submission,
        interactions: [],
        tags: ['Google Form Direct Registrant'],
      };
      delegates.push(targetDelegate);
    }

    this.write(KEYS.DELEGATES, delegates);

    // Increment Form Submissions
    const gform = this.getGoogleFormConfig();
    gform.totalSubmissions += 1;
    gform.lastSyncAt = nowIso;
    this.write(KEYS.GFORM, gform);

    this.logActivity(
      'form_submission',
      `Google Form Sync: ${targetDelegate.name}`,
      `Response: ${data.attending ? 'Attending (Confirmed)' : 'Declined'}. Dietary: ${
        data.dietary || 'None specified'
      }. Hotel: ${data.hotelRequired ? 'Requested' : 'No'}.`,
      data.email
    );

    return targetDelegate;
  }

  // Batch Google Form Responses Sheet (Excel / CSV) Ingestion
  static ingestBatchGoogleFormResponses(
    responses: import('../types/inviteOps').GoogleFormParsedResponse[],
    fileName: string
  ): { updatedCount: number; newCount: number } {
    const delegates = this.getDelegates();
    let updatedCount = 0;
    let newCount = 0;
    const nowIso = new Date().toISOString();

    for (const resp of responses) {
      const cleanEmail = resp.email.toLowerCase().trim();
      const idx = delegates.findIndex((d) => d.email.toLowerCase() === cleanEmail);

      const submission: FormSubmissionData = {
        submittedAt: resp.submittedAt || nowIso,
        attending: resp.attending,
        phone: resp.phone,
        organization: resp.organization,
        designation: resp.designation,
        dietary: resp.dietary,
        hotelRequired: resp.hotelRequired,
        arrivalFlight: resp.arrivalFlight,
        arrivalTime: resp.arrivalTime,
        accompanyingGuests: resp.accompanyingGuests || 0,
        notes: resp.notes,
        rawAnswers: resp.rawRecord,
      };

      if (idx !== -1) {
        delegates[idx].status = resp.attending ? 'Confirmed (Attending)' : 'Declined';
        delegates[idx].formSubmittedAt = resp.submittedAt || nowIso;
        delegates[idx].formData = submission;
        if (resp.name && (!delegates[idx].name || delegates[idx].name.includes('@'))) delegates[idx].name = resp.name;
        if (resp.phone) delegates[idx].phone = resp.phone;
        if (resp.organization) delegates[idx].organization = resp.organization;
        if (!delegates[idx].tags.includes('Google Form Upload')) {
          delegates[idx].tags.push('Google Form Upload');
        }
        updatedCount++;
      } else {
        const newD: Delegate = {
          id: `del-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: resp.name,
          email: resp.email,
          phone: resp.phone,
          organization: resp.organization,
          tier: 'General Delegate',
          status: resp.attending ? 'Confirmed (Attending)' : 'Declined',
          formSubmittedAt: resp.submittedAt || nowIso,
          formData: submission,
          interactions: [],
          sourceDocName: fileName,
          tags: ['Google Form Direct Upload'],
        };
        delegates.push(newD);
        newCount++;
      }
    }

    this.write(KEYS.DELEGATES, delegates);

    // Update GForm Config
    const gform = this.getGoogleFormConfig();
    gform.totalSubmissions += responses.length;
    gform.lastSyncAt = nowIso;
    this.write(KEYS.GFORM, gform);

    // Add to Documents Registry
    const docs = this.getDocuments();
    const ext = fileName.endsWith('.csv') ? 'csv' : 'xlsx';
    docs.unshift({
      id: `doc-gform-${Date.now()}`,
      fileName,
      fileType: ext,
      fileSize: `${(responses.length * 0.4).toFixed(1)} KB`,
      uploadedAt: nowIso,
      recordCount: responses.length,
      status: 'Parsed & Imported',
    });
    this.write(KEYS.DOCUMENTS, docs);

    this.logActivity(
      'form_submission',
      `Google Form Sheet Uploaded: ${fileName}`,
      `Parsed ${responses.length} responses. Updated ${updatedCount} existing invitees, added ${newCount} new registrants.`
    );

    return { updatedCount, newCount };
  }

  // Multi-Mailbox Profiles (My Account vs Client Account)
  static getMailboxProfiles(): import('../types/inviteOps').MailboxProfile[] {
    const raw = localStorage.getItem('fieldnote_mailbox_profiles_v1');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    const defaultProfiles: import('../types/inviteOps').MailboxProfile[] = [
      {
        id: 'mbx-my-account',
        name: 'My Account (Personal / Test Mailbox)',
        emailUser: 'Deepikawork64@gmail.com',
        appPassword: '••••••••••••',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        useSsl: true,
        isClientAccount: false,
        connected: true,
        lastSyncAt: new Date(Date.now() - 35000).toISOString(),
      },
      {
        id: 'mbx-client-account',
        name: 'Client Account (Summit Secretariat)',
        emailUser: 'client.summit@bhopalevents.org',
        appPassword: '••••••••••••',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        useSsl: true,
        isClientAccount: true,
        connected: false,
        lastSyncAt: null,
      },
    ];

    this.write('fieldnote_mailbox_profiles_v1', defaultProfiles);
    return defaultProfiles;
  }

  static saveMailboxProfile(profile: import('../types/inviteOps').MailboxProfile): void {
    const profiles = this.getMailboxProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx !== -1) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    this.write('fieldnote_mailbox_profiles_v1', profiles);
  }

  static switchActiveMailbox(profileId: string): import('../types/inviteOps').MailboxProfile | null {
    const profiles = this.getMailboxProfiles();
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      this.setImapConfig({
        imapHost: profile.imapHost,
        imapPort: profile.imapPort,
        smtpHost: profile.smtpHost,
        smtpPort: profile.smtpPort,
        emailUser: profile.emailUser,
        appPassword: profile.appPassword,
        useSsl: profile.useSsl,
        connected: true,
        lastSyncAt: new Date().toISOString(),
        autoSyncIntervalSec: 30,
      });
      profile.connected = true;
      profile.lastSyncAt = new Date().toISOString();
      this.saveMailboxProfile(profile);
      this.logActivity(
        'status_changed',
        `Active Mailbox Switched to: ${profile.name}`,
        `Now monitoring ${profile.emailUser} on ${profile.imapHost}`
      );
      return profile;
    }
    return null;
  }

  static updateDelegateStatus(id: string, newStatus: RsvpStatus, note?: string): void {
    const delegates = this.getDelegates();
    const idx = delegates.findIndex((d) => d.id === id);
    if (idx !== -1) {
      delegates[idx].status = newStatus;
      if (note) delegates[idx].notes = (delegates[idx].notes ? delegates[idx].notes + '\n' : '') + note;
      this.write(KEYS.DELEGATES, delegates);
      this.logActivity(
        'status_changed',
        `Status Updated: ${delegates[idx].name}`,
        `Manual state transition to ${newStatus}`,
        delegates[idx].email
      );
    }
  }

  // Export Master Roster to Excel (.xlsx)
  static exportMasterExcel(): void {
    const delegates = this.getDelegates();
    const rows = delegates.map((d) => ({
      'Delegate ID': d.id,
      'Full Name': d.name,
      'Email Address': d.email,
      'Phone Number': d.phone || '',
      Organization: d.organization || '',
      Designation: d.designation || '',
      'VIP Tier': d.tier,
      'RSVP Status': d.status,
      'Invitation Sent Date': d.invitationSentAt ? new Date(d.invitationSentAt).toLocaleString() : '',
      'Latest Email Reply': d.lastReplyAt ? new Date(d.lastReplyAt).toLocaleString() : '',
      'Google Form Submitted': d.formSubmittedAt ? new Date(d.formSubmittedAt).toLocaleString() : '',
      'Dietary Preference': d.formData?.dietary || '',
      'Hotel Accommodation Required': d.formData?.hotelRequired ? 'YES' : 'NO',
      'Flight & Arrival Time': `${d.formData?.arrivalFlight || ''} ${d.formData?.arrivalTime || ''}`.trim(),
      'Accompanying Guests': d.formData?.accompanyingGuests || 0,
      'Source Document': d.sourceDocName || 'Direct Entry',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summit_Delegates_RSVP');
    XLSX.writeFile(workbook, `Bhopal_Summit_RSVP_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}

