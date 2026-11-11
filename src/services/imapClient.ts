import { ImapConfig } from '../types/inviteOps';

export interface FetchedEmailItem {
  uid: number;
  seq: number;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  date: string;
  textBody: string;
  snippet: string;
  isRead: boolean;
}

export interface ImapTestResult {
  ok: boolean;
  message?: string;
  error?: string;
  rawError?: string;
  totalMessages?: number;
  unseenCount?: number;
}

export interface ImapFetchResult {
  ok: boolean;
  emails?: FetchedEmailItem[];
  totalFetched?: number;
  lastSyncAt?: string;
  error?: string;
  rawError?: string;
}

export class ImapClient {
  /**
   * Test IMAP connection credentials against the live mail server
   */
  static async testConnection(config: ImapConfig): Promise<ImapTestResult> {
    try {
      const res = await fetch('/api/imap/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.imapHost,
          port: config.imapPort,
          user: config.emailUser,
          pass: config.appPassword,
          secure: config.useSsl,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Network error while contacting IMAP proxy server.',
      };
    }
  }

  /**
   * Fetch recent inbound emails from the live mail server
   */
  static async fetchEmails(
    config: ImapConfig,
    options: { limit?: number; onlyUnread?: boolean } = {}
  ): Promise<ImapFetchResult> {
    try {
      const res = await fetch('/api/imap/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.imapHost,
          port: config.imapPort,
          user: config.emailUser,
          pass: config.appPassword,
          secure: config.useSsl,
          limit: options.limit ?? 25,
          onlyUnread: options.onlyUnread ?? false,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Network error while fetching emails.',
      };
    }
  }

  /**
   * Verify SMTP credentials
   */
  static async testSmtp(config: ImapConfig): Promise<{ ok: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.smtpHost,
          port: config.smtpPort,
          user: config.emailUser,
          pass: config.appPassword,
          secure: config.smtpPort === 465,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Network error while contacting SMTP server.',
      };
    }
  }

  /**
   * Send a real email via SMTP
   */
  static async sendEmail(
    config: ImapConfig,
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ ok: boolean; messageId?: string; error?: string }> {
    try {
      const res = await fetch('/api/smtp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.smtpHost,
          port: config.smtpPort,
          user: config.emailUser,
          pass: config.appPassword,
          secure: config.smtpPort === 465,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ' '),
          fromName: 'Event Protocol Desk',
        }),
      });

      return await res.json();
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Failed to dispatch email.',
      };
    }
  }
}
