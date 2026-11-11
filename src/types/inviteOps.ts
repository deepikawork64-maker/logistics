export type RsvpStatus =
  | 'Not Invited'
  | 'Invitation Sent'
  | 'Delivered'
  | 'Opened'
  | 'Replied (Email)'
  | 'Confirmed (Attending)'
  | 'Declined'
  | 'Form Submitted'
  | 'Needs Follow-up';

export type DelegateTier = 'VVIP / Minister' | 'Head of Delegation' | 'Speaker' | 'Corporate CEO' | 'General Delegate' | 'Media';

export interface FormSubmissionData {
  submittedAt: string;
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
  rawAnswers?: Record<string, string>;
}

export interface EmailInteraction {
  id: string;
  type: 'invitation_sent' | 'reminder_sent' | 'inbound_reply' | 'direct_reply';
  timestamp: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  detectedIntent?: 'attending' | 'declined' | 'inquiry' | 'general';
}

export interface Delegate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  tier: DelegateTier;
  sourceDocId?: string;
  sourceDocName?: string;
  status: RsvpStatus;
  invitationSentAt?: string;
  lastReplyAt?: string;
  formSubmittedAt?: string;
  formData?: FormSubmissionData;
  interactions: EmailInteraction[];
  notes?: string;
  tags: string[];
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls' | 'pdf';
  fileSize: string;
  uploadedAt: string;
  recordCount: number;
  status: 'Parsed & Imported' | 'Review Needed';
  previewRows?: Record<string, string>[];
}

export interface ImapConfig {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  emailUser: string;
  appPassword: string;
  useSsl: boolean;
  connected: boolean;
  lastSyncAt: string | null;
  autoSyncIntervalSec: number;
}

export interface GoogleFormConfig {
  formTitle: string;
  formUrl: string;
  responseSheetUrl: string;
  webhookUrl: string;
  connected: boolean;
  lastSyncAt: string | null;
  totalSubmissions: number;
  fieldMappings: {
    emailField: string;
    nameField: string;
    attendanceField: string;
    dietaryField: string;
    hotelField: string;
    flightField: string;
  };
}

export interface Campaign {
  id: string;
  title: string;
  subject: string;
  bodyTemplate: string;
  googleFormUrl: string;
  sentAt: string | null;
  recipientCount: number;
  confirmedCount: number;
  declinedCount: number;
  status: 'Draft' | 'Sending' | 'Completed';
}

export interface MailboxProfile {
  id: string;
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  emailUser: string;
  appPassword: string;
  useSsl: boolean;
  isClientAccount: boolean;
  connected: boolean;
  lastSyncAt: string | null;
}

export interface GoogleFormParsedResponse {
  email: string;
  name: string;
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
  submittedAt: string;
  rawRecord: Record<string, string>;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'email_sent' | 'imap_reply_received' | 'form_submission' | 'document_uploaded' | 'status_changed';
  title: string;
  description: string;
  delegateEmail?: string;
}

