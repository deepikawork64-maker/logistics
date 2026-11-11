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
  InboxEmail,
  EmailClassification,
} from '../types/inviteOps';
import { MailAnalyzer, AnalyzedEmailResult } from './mailAnalyzer';

const KEYS = {
  DELEGATES: 'fieldnote_delegates_v3',
  DOCUMENTS: 'fieldnote_documents_v3',
  IMAP: 'fieldnote_imap_v3',
  GFORM: 'fieldnote_gform_v3',
  CAMPAIGNS: 'fieldnote_campaigns_v3',
  ACTIVITIES: 'fieldnote_activities_v3',
  INBOX: 'fieldnote_inbox_v3',
};

const DEFAULT_IMAP: ImapConfig = {
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 465,
  emailUser: 'deepikawork64@gmail.com',
  appPassword: '',
  useSsl: true,
  connected: false,
  lastSyncAt: null,
  autoSyncIntervalSec: 30,
};

const DEFAULT_GFORM: GoogleFormConfig = {
  formTitle: 'Bhopal Summit 2027 Official RSVP & Protocol Confirmation',
  formUrl: '',
  responseSheetUrl: '',
  webhookUrl: '',
  connected: false,
  lastSyncAt: null,
  totalSubmissions: 0,
  fieldMappings: {
    emailField: 'Email Address',
    nameField: 'Full Name & Title',
    attendanceField: 'Will you be attending the Summit in Bhopal?',
    dietaryField: 'Dietary Preference (Jain, Veg, Halal, etc.)',
    hotelField: 'Do you require Summit Hotel Accommodations?',
    flightField: 'Arrival Flight Number & Landing Time',
  },
};

const DEFAULT_CAMPAIGNS: Campaign[] = [];

const INITIAL_DOCS: UploadedDocument[] = [];

const INITIAL_DELEGATES: Delegate[] = [];

const INITIAL_ACTIVITIES: ActivityEvent[] = [];

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
    // Purge any older sample data keys from previous versions
    const legacyKeys = [
      'fieldnote_delegates_v2',
      'fieldnote_documents_v2',
      'fieldnote_campaigns_v2',
      'fieldnote_activities_v2',
      'fieldnote_delegates_v1',
      'fieldnote_documents_v1',
      'fieldnote_campaigns_v1',
      'fieldnote_activities_v1',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));

    if (!localStorage.getItem(KEYS.DELEGATES)) {
      this.write(KEYS.DELEGATES, []);
    }
    if (!localStorage.getItem(KEYS.DOCUMENTS)) {
      this.write(KEYS.DOCUMENTS, []);
    }
    if (!localStorage.getItem(KEYS.IMAP)) {
      this.write(KEYS.IMAP, DEFAULT_IMAP);
    }
    if (!localStorage.getItem(KEYS.GFORM)) {
      this.write(KEYS.GFORM, DEFAULT_GFORM);
    }
    if (!localStorage.getItem(KEYS.CAMPAIGNS)) {
      this.write(KEYS.CAMPAIGNS, []);
    }
    if (!localStorage.getItem(KEYS.ACTIVITIES)) {
      this.write(KEYS.ACTIVITIES, []);
    }
  }

  static clearAllData(): void {
    this.write(KEYS.DELEGATES, []);
    this.write(KEYS.DOCUMENTS, []);
    this.write(KEYS.CAMPAIGNS, []);
    this.write(KEYS.ACTIVITIES, []);
    this.write(KEYS.INBOX, []);
    const gform = this.getGoogleFormConfig();
    gform.totalSubmissions = 0;
    gform.lastSyncAt = null;
    this.write(KEYS.GFORM, gform);

    const legacy = [
      'fieldnote_delegates_v2',
      'fieldnote_documents_v2',
      'fieldnote_campaigns_v2',
      'fieldnote_activities_v2',
      'fieldnote_delegates_v1',
      'fieldnote_documents_v1',
    ];
    legacy.forEach((k) => localStorage.removeItem(k));
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

  // Auto-Update on IMAP Inbound Reply with Deep NLP Reading
  static ingestImapReply(
    fromEmail: string,
    subject: string,
    body: string,
    senderName?: string
  ): { matched: boolean; delegate: Delegate; intent: string; analysis: AnalyzedEmailResult } {
    const analysis = MailAnalyzer.analyzeEmail(fromEmail, subject, body, senderName);
    const delegates = this.getDelegates();
    const cleanFrom = analysis.senderEmail;
    const idx = delegates.findIndex((d) => d.email.toLowerCase() === cleanFrom);
    const nowIso = new Date().toISOString();

    let targetDelegate: Delegate;

    if (idx !== -1) {
      const d = delegates[idx];
      d.lastReplyAt = nowIso;
      d.status = analysis.status;

      // Merge or initialize structured form/response data from email reading
      const existingForm = d.formData || {
        submittedAt: nowIso,
        attending: analysis.detectedIntent === 'attending',
      };

      d.formData = {
        ...existingForm,
        submittedAt: existingForm.submittedAt || nowIso,
        attending: analysis.detectedIntent === 'attending',
        dietary: analysis.extractedAttributes.dietary || existingForm.dietary,
        hotelRequired:
          analysis.extractedAttributes.hotelRequired !== undefined
            ? analysis.extractedAttributes.hotelRequired
            : existingForm.hotelRequired,
        arrivalFlight: analysis.extractedAttributes.arrivalFlight || existingForm.arrivalFlight,
        arrivalTime: analysis.extractedAttributes.arrivalTime || existingForm.arrivalTime,
        accompanyingGuests:
          analysis.extractedAttributes.accompanyingGuests || existingForm.accompanyingGuests || 0,
        notes: d.formData?.notes
          ? `${d.formData.notes}\n[Email Analysis]: ${analysis.executiveSummary}`
          : `[Email Analysis]: ${analysis.executiveSummary}`,
      };

      if (analysis.extractedAttributes.phone && !d.phone) {
        d.phone = analysis.extractedAttributes.phone;
      }

      if (!d.tags.includes('AI Email Analyzed')) {
        d.tags.push('AI Email Analyzed');
      }

      d.interactions.push({
        id: `reply-${Date.now()}`,
        type: 'inbound_reply',
        timestamp: nowIso,
        subject,
        body,
        from: fromEmail,
        to: this.getImapConfig().emailUser,
        detectedIntent: analysis.detectedIntent,
      });

      delegates[idx] = d;
      this.write(KEYS.DELEGATES, delegates);
      targetDelegate = d;

      this.logActivity(
        'imap_reply_received',
        `IMAP Inbound Mail Analyzed: ${d.name}`,
        `${analysis.executiveSummary} | Status: ${d.status} (${Math.round(analysis.confidence * 100)}% confidence)`,
        d.email
      );

      return { matched: true, delegate: d, intent: analysis.detectedIntent, analysis };
    } else {
      // Unrecognized delegate replying -> Auto-enroll guest record with extracted properties
      const capitalizedName =
        analysis.senderName.charAt(0).toUpperCase() + analysis.senderName.slice(1);

      const newD: Delegate = {
        id: `del-${Date.now()}`,
        name: capitalizedName,
        email: cleanFrom,
        phone: analysis.extractedAttributes.phone,
        tier: 'General Delegate',
        status: analysis.status,
        lastReplyAt: nowIso,
        formData: {
          submittedAt: nowIso,
          attending: analysis.detectedIntent === 'attending',
          dietary: analysis.extractedAttributes.dietary,
          hotelRequired: analysis.extractedAttributes.hotelRequired,
          arrivalFlight: analysis.extractedAttributes.arrivalFlight,
          arrivalTime: analysis.extractedAttributes.arrivalTime,
          accompanyingGuests: analysis.extractedAttributes.accompanyingGuests || 0,
          notes: `[Email Analysis]: ${analysis.executiveSummary}`,
        },
        interactions: [
          {
            id: `reply-${Date.now()}`,
            type: 'inbound_reply',
            timestamp: nowIso,
            subject,
            body,
            from: fromEmail,
            to: this.getImapConfig().emailUser,
            detectedIntent: analysis.detectedIntent,
          },
        ],
        tags: ['Inbound Email Discovered', 'AI Email Analyzed'],
      };

      delegates.push(newD);
      this.write(KEYS.DELEGATES, delegates);
      targetDelegate = newD;

      this.logActivity(
        'imap_reply_received',
        `New Attendee Enrolled via Email: ${cleanFrom}`,
        `${analysis.executiveSummary} | Auto-created guest dossier. Status: ${newD.status}`,
        cleanFrom
      );

      return { matched: false, delegate: newD, intent: analysis.detectedIntent, analysis };
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

  // --- INBOX METHODS ---
  static getInboxEmails(): InboxEmail[] {
    return this.read<InboxEmail[]>(KEYS.INBOX, []);
  }

  static saveInboxEmails(emails: InboxEmail[]): void {
    this.write(KEYS.INBOX, emails);
  }

  static markInboxEmailAsRead(id: string): void {
    const list = this.getInboxEmails();
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      this.saveInboxEmails(list);
    }
  }

  static deleteInboxEmail(id: string): void {
    const list = this.getInboxEmails().filter((e) => e.id !== id);
    this.saveInboxEmails(list);
  }

  static ingestRawEmailToInbox(raw: {
    uid: number;
    seq?: number;
    fromEmail: string;
    fromName?: string;
    toEmail?: string;
    subject: string;
    textBody: string;
    date?: string;
    snippet?: string;
    isRead?: boolean;
  }): InboxEmail {
    const analysis = MailAnalyzer.analyzeEmail(raw.fromEmail, raw.subject, raw.textBody, raw.fromName);
    const delegates = this.getDelegates();
    const matched = delegates.find(
      (d) => d.email.toLowerCase() === raw.fromEmail.toLowerCase().trim()
    );

    let category: EmailClassification['category'] = 'General';
    if (analysis.detectedIntent === 'attending') category = 'RSVP Confirmed';
    else if (analysis.detectedIntent === 'declined') category = 'RSVP Declined';
    else if (analysis.detectedIntent === 'tentative') category = 'Tentative';
    else if (
      analysis.detectedIntent === 'inquiry' ||
      analysis.extractedAttributes.hotelRequired !== undefined ||
      analysis.extractedAttributes.arrivalFlight
    ) {
      category = 'Logistics / Inquiry';
    }

    const classification: EmailClassification = {
      category,
      intent: analysis.detectedIntent,
      confidence: analysis.confidence,
      summary: analysis.executiveSummary,
      attributes: {
        dietary: analysis.extractedAttributes.dietary,
        arrivalFlight: analysis.extractedAttributes.arrivalFlight,
        arrivalTime: analysis.extractedAttributes.arrivalTime,
        hotelRequired: analysis.extractedAttributes.hotelRequired,
        accompanyingGuests: analysis.extractedAttributes.accompanyingGuests,
        phone: analysis.extractedAttributes.phone,
      },
    };

    const emailItem: InboxEmail = {
      id: `inbox-msg-${raw.uid || Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uid: raw.uid || Date.now(),
      seq: raw.seq,
      fromEmail: raw.fromEmail,
      fromName: raw.fromName || raw.fromEmail.split('@')[0],
      toEmail: raw.toEmail || this.getImapConfig().emailUser,
      subject: raw.subject || '(No Subject)',
      date: raw.date || new Date().toISOString(),
      textBody: raw.textBody,
      snippet: raw.snippet || raw.textBody.replace(/\s+/g, ' ').slice(0, 160),
      isRead: raw.isRead || false,
      classification,
      matchedDelegateId: matched?.id,
      matchedDelegateName: matched?.name,
      syncedToRoster: true,
    };

    // Auto-update delegate roster as well
    this.ingestImapReply(raw.fromEmail, raw.subject, raw.textBody, raw.fromName);

    // Save into inbox collection
    const current = this.getInboxEmails();
    const existingIdx = current.findIndex(
      (e) =>
        e.uid === raw.uid ||
        (e.fromEmail.toLowerCase() === raw.fromEmail.toLowerCase() && e.subject === raw.subject)
    );
    if (existingIdx !== -1) {
      current[existingIdx] = emailItem;
    } else {
      current.unshift(emailItem);
    }
    this.saveInboxEmails(current);

    return emailItem;
  }

  static loadSampleInboxEmails(): InboxEmail[] {
    const samples = [
      {
        uid: 1001,
        fromEmail: 'ambassador.morel@diplomatie.gouv.fr',
        fromName: 'Ambassador Jean-Luc Morel',
        subject: 'Re: Official Invitation: Bhopal Global Investor Summit 2027',
        textBody:
          'I am delighted to confirm our attendance. Our delegation will arrive on Flight AI-433 on Jan 14 at 10:15 AM. Kindly ensure 2 hotel rooms are reserved, and arrange strict Jain vegetarian meals for our team.',
        date: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        uid: 1002,
        fromEmail: 'campbell.a@parliament.uk',
        fromName: 'Lord Alistair Campbell',
        subject: 'Regrets: Bhopal Investor Summit 2027 Delegation',
        textBody:
          'Lord Campbell sends his sincere regrets as urgent parliamentary recess commitments in Westminster prevent him from undertaking travel to India during that week.',
        date: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
      {
        uid: 1003,
        fromEmail: 'dr.rajesh.tech@tata.com',
        fromName: 'Dr. Rajesh Sharma',
        subject: 'Tentative: Investor Summit RSVP & Board Clearance',
        textBody:
          'Thank you for the warm invitation. Our executive board is reviewing the travel schedule this Friday. We are tentatively planning to attend, pending final ministerial clearance. Please hold 1 hotel room provisionally.',
        date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        uid: 1004,
        fromEmail: 'santos.m@energy-europe.eu',
        fromName: 'Maria Santos',
        subject: 'Confirmed: Renewable Energy Delegation Arrival',
        textBody:
          'We confirm our official participation in the Green Energy roundtable. Arriving on Flight LH-760 on Jan 13 at 18:30. Note strict Halal meals for our 3 accompanying delegates. Hotel bookings are self-arranged.',
        date: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      },
      {
        uid: 1005,
        fromEmail: 'tanaka.h@jetro.go.jp',
        fromName: 'Hiroshi Tanaka',
        subject: 'Protocol & Bilateral Meeting Inquiries: Japan Tech Mission',
        textBody:
          'Greetings from JETRO. We are planning a 5-member technology delegation. Could you kindly clarify protocol guidelines for bilateral meetings with state ministers, and provide airport motorcade details?',
        date: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
      },
    ];

    samples.forEach((s) => this.ingestRawEmailToInbox(s));
    return this.getInboxEmails();
  }
}

