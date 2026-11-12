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
   * Safe fetch helper that guarantees no SyntaxError: Unexpected token '<' in JSON
   */
  private static async safeFetchJson<T>(url: string, body: any): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = res.headers.get('content-type') || '';
      const text = (await res.text()).trim();

      // Check if response is valid JSON format
      if (
        contentType.includes('application/json') ||
        (text.startsWith('{') && text.endsWith('}')) ||
        (text.startsWith('[') && text.endsWith(']'))
      ) {
        try {
          return JSON.parse(text) as T;
        } catch {
          return {
            ok: false,
            error: `Malformed JSON received: ${text.slice(0, 140)}`,
          } as unknown as T;
        }
      }

      // If server or proxy returned HTML (e.g., Cloud Run gateway error or 404)
      if (text.includes('<html') || text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
        if (res.status === 504 || text.includes('Gateway Timeout') || text.includes('timed out')) {
          return {
            ok: false,
            error:
              'Connection timed out while contacting mail server. Please verify your host and port.',
          } as unknown as T;
        }
        if (res.status === 502 || text.includes('Bad Gateway')) {
          return {
            ok: false,
            error:
              'Mail proxy gateway error. Please verify your IMAP host (e.g., imap.gmail.com) and port 993.',
          } as unknown as T;
        }
        return {
          ok: false,
          error: `Server returned an HTML status page (${res.status} ${res.statusText}).`,
        } as unknown as T;
      }

      return {
        ok: false,
        error: text || `Server error (${res.status} ${res.statusText})`,
      } as unknown as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          ok: false,
          error:
            'Connection timed out after 20 seconds. The mail server took too long to respond.',
        } as unknown as T;
      }
      return {
        ok: false,
        error: err?.message || 'Network error while contacting IMAP proxy server.',
      } as unknown as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Test IMAP connection credentials against the live mail server
   */
  static async testConnection(config: ImapConfig): Promise<ImapTestResult> {
    return this.safeFetchJson<ImapTestResult>('/api/imap/test', {
      host: config.imapHost,
      port: config.imapPort,
      user: config.emailUser,
      pass: config.appPassword,
      secure: config.useSsl,
    });
  }

  /**
   * Fetch recent inbound emails from the live mail server
   */
  static async fetchEmails(
    config: ImapConfig,
    options: { limit?: number; onlyUnread?: boolean } = {}
  ): Promise<ImapFetchResult> {
    return this.safeFetchJson<ImapFetchResult>('/api/imap/fetch', {
      host: config.imapHost,
      port: config.imapPort,
      user: config.emailUser,
      pass: config.appPassword,
      secure: config.useSsl,
      limit: options.limit ?? 50,
      onlyUnread: options.onlyUnread ?? false,
    });
  }

  /**
   * Verify SMTP credentials
   */
  static async testSmtp(
    config: ImapConfig
  ): Promise<{ ok: boolean; message?: string; error?: string }> {
    return this.safeFetchJson<{ ok: boolean; message?: string; error?: string }>(
      '/api/smtp/test',
      {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.emailUser,
        pass: config.appPassword,
        secure: config.smtpPort === 465,
      }
    );
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
    return this.safeFetchJson<{ ok: boolean; messageId?: string; error?: string }>(
      '/api/smtp/send',
      {
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
      }
    );
  }
}
