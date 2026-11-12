import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Helper to sanitize credentials (e.g., strip spaces from Google 16-character App Passwords)
  const sanitizePass = (p?: string): string => {
    if (!p) return '';
    return p.replace(/\s+/g, '');
  };

  // Diagnostic helper for helpful error messages
  const diagnoseError = (err: any, host: string, user: string): string => {
    const rawDetails = [
      err?.message,
      err?.response,
      err?.responseText,
      err?.serverResponseCode,
      String(err || ''),
    ].filter(Boolean).join(' ');

    const isAuthFailed =
      Boolean(err?.authenticationFailed) ||
      rawDetails.includes('AUTHENTICATIONFAILED') ||
      rawDetails.includes('Invalid credentials') ||
      rawDetails.includes('Username and Password not accepted') ||
      rawDetails.includes('credentials');

    const isGmail = host.toLowerCase().includes('gmail.com') || user.toLowerCase().includes('@gmail.com');

    if (isAuthFailed) {
      if (isGmail) {
        return (
          'Gmail Authentication Failed: Standard Google passwords are not accepted. ' +
          'Please ensure 2-Step Verification is enabled in your Google Account and generate a dedicated ' +
          '16-character "App Password" (at myaccount.google.com/apppasswords). ' +
          'Also verify that IMAP is enabled in Gmail Settings > Forwarding and POP/IMAP.'
        );
      }
      return `Authentication failed for ${user}: Please check your email and application password.`;
    }

    if (rawDetails.includes('ETIMEDOUT') || rawDetails.includes('ECONNREFUSED') || rawDetails.includes('ENOTFOUND')) {
      return `Connection timed out or failed to reach ${host}. Please check your host and port settings.`;
    }

    if (rawDetails.includes('certificate') || rawDetails.includes('TLS') || rawDetails.includes('SSL')) {
      return `SSL/TLS handshake error with ${host}. Ensure Port 993 with SSL is configured correctly.`;
    }

    return rawDetails || 'Unknown IMAP connection error';
  };

  // 1. Health Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 2. Real IMAP Connection Test Endpoint
  app.post('/api/imap/test', async (req, res) => {
    const { host, port, user, pass, secure } = req.body;

    if (!host || !user || !pass) {
      return res.json({
        ok: false,
        error: 'Missing required IMAP connection parameters (host, user, pass)',
      });
    }

    const cleanPass = sanitizePass(pass);
    const client = new ImapFlow({
      host: String(host).trim(),
      port: parseInt(port, 10) || 993,
      secure: secure !== undefined ? Boolean(secure) : true,
      auth: {
        user: String(user).trim(),
        pass: cleanPass,
      },
      logger: false,
      clientInfo: {
        name: 'Fieldnote-Ops-Client',
        version: '1.0.0',
      },
      tls: {
        rejectUnauthorized: false, // allow flexible SSL setups
      },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
    });

    try {
      await client.connect();

      // Open INBOX in read-only mode to check status
      const lock = await client.getMailboxLock('INBOX');
      let exists = 0;
      let unseen = 0;
      try {
        const status = await client.status('INBOX', { messages: true, unseen: true });
        if (status) {
          exists = status.messages || 0;
          unseen = status.unseen || 0;
        }
      } finally {
        lock.release();
      }

      await client.logout();

      return res.json({
        ok: true,
        message: `Successfully connected to ${host}!`,
        mailbox: 'INBOX',
        totalMessages: exists,
        unseenCount: unseen,
      });
    } catch (err: any) {
      try {
        await client.logout();
      } catch {
        // ignore logout errors on failure
      }
      const diagnosis = diagnoseError(err, String(host), String(user));
      console.error('[IMAP Test Error]', err);
      return res.json({
        ok: false,
        error: diagnosis,
        rawError: err?.message || String(err),
      });
    }
  });

  // 3. Real IMAP Fetch Emails Endpoint
  app.post('/api/imap/fetch', async (req, res) => {
    const { host, port, user, pass, secure, limit = 25, onlyUnread = false } = req.body;

    if (!host || !user || !pass) {
      return res.json({
        ok: false,
        error: 'Missing required IMAP connection parameters',
      });
    }

    const cleanPass = sanitizePass(pass);
    const maxFetch = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 30);

    const client = new ImapFlow({
      host: String(host).trim(),
      port: parseInt(port, 10) || 993,
      secure: secure !== undefined ? Boolean(secure) : true,
      auth: {
        user: String(user).trim(),
        pass: cleanPass,
      },
      logger: false,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      const emails: Array<{
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
      }> = [];

      try {
        let range: string | number[] = '';
        let isUid = true;

        if (onlyUnread) {
          const uids = await client.search({ seen: false }, { uid: true });
          if (Array.isArray(uids) && uids.length > 0) {
            range = uids.slice(-maxFetch).reverse();
            isUid = true;
          }
        } else {
          // Check mailbox message count for super-fast sequence fetching
          const status = await client.status('INBOX', { messages: true });
          const total = status ? status.messages || 0 : 0;
          if (total > 0) {
            const startSeq = Math.max(1, total - maxFetch + 1);
            range = `${startSeq}:${total}`;
            isUid = false;
          } else {
            const uids = await client.search({ all: true }, { uid: true });
            if (Array.isArray(uids) && uids.length > 0) {
              range = uids.slice(-maxFetch).reverse();
              isUid = true;
            }
          }
        }

        if (range) {
          for await (const message of client.fetch(
            range,
            { envelope: true, source: { maxLength: 16384 }, flags: true },
            { uid: isUid }
          )) {
            try {
              let parsed: ParsedMail | null = null;
              if (message.source) {
                parsed = await simpleParser(message.source);
              }

              const fromVal = parsed?.from?.value?.[0];
              const fromEmail = fromVal?.address || message.envelope?.from?.[0]?.address || '';
              const fromName = fromVal?.name || message.envelope?.from?.[0]?.name || '';

              const toVal = parsed?.to;
              let toEmail = '';
              if (Array.isArray(toVal)) {
                toEmail = toVal.map((t) => t.text).join(', ');
              } else if (toVal) {
                toEmail = toVal.text || '';
              } else if (message.envelope?.to?.[0]?.address) {
                toEmail = message.envelope.to[0].address;
              }

              const subject = parsed?.subject || message.envelope?.subject || '(No Subject)';
              const date = parsed?.date
                ? parsed.date.toISOString()
                : message.envelope?.date
                ? new Date(message.envelope.date).toISOString()
                : new Date().toISOString();

              const textBody =
                parsed?.text ||
                (typeof parsed?.html === 'string' ? parsed.html.replace(/<[^>]*>/g, ' ') : '');
              const snippet = textBody.replace(/\s+/g, ' ').trim().slice(0, 160);
              const isRead = message.flags ? message.flags.has('\\Seen') : false;

              emails.push({
                uid: message.uid,
                seq: message.seq,
                fromEmail,
                fromName,
                toEmail,
                subject,
                date,
                textBody,
                snippet,
                isRead,
              });
            } catch (parseErr) {
              console.warn('[Mail Parser Warning]', parseErr);
            }
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();

      return res.json({
        ok: true,
        emails,
        totalFetched: emails.length,
        lastSyncAt: new Date().toISOString(),
      });
    } catch (err: any) {
      try {
        await client.logout();
      } catch {
        // ignore logout errors on failure
      }
      const diagnosis = diagnoseError(err, String(host), String(user));
      console.error('[IMAP Fetch Error]', err);
      return res.json({
        ok: false,
        error: diagnosis,
        rawError: err?.message || String(err),
      });
    }
  });

  // 4. Real SMTP Test Endpoint
  app.post('/api/smtp/test', async (req, res) => {
    const { host, port, user, pass, secure } = req.body;

    if (!host || !user || !pass) {
      return res.json({
        ok: false,
        error: 'Missing required SMTP parameters',
      });
    }

    const cleanPass = sanitizePass(pass);
    const transporter = nodemailer.createTransport({
      host: String(host).trim(),
      port: parseInt(port, 10) || 465,
      secure: secure !== undefined ? Boolean(secure) : true,
      auth: {
        user: String(user).trim(),
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      await transporter.verify();
      return res.json({
        ok: true,
        message: `SMTP connection to ${host} verified successfully!`,
      });
    } catch (err: any) {
      const diagnosis = diagnoseError(err, String(host), String(user));
      return res.json({
        ok: false,
        error: diagnosis,
        rawError: err?.message || String(err),
      });
    }
  });

  // 5. Real SMTP Send Endpoint
  app.post('/api/smtp/send', async (req, res) => {
    const { host, port, user, pass, secure, to, subject, html, text, fromName } = req.body;

    if (!host || !user || !pass || !to || !subject) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required parameters for sending email',
      });
    }

    const cleanPass = sanitizePass(pass);
    const transporter = nodemailer.createTransport({
      host: String(host).trim(),
      port: parseInt(port, 10) || 465,
      secure: secure !== undefined ? Boolean(secure) : true,
      auth: {
        user: String(user).trim(),
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      const fromSender = fromName ? `"${fromName}" <${user}>` : user;
      const info = await transporter.sendMail({
        from: fromSender,
        to,
        subject,
        text,
        html,
      });

      return res.json({
        ok: true,
        messageId: info.messageId,
        accepted: info.accepted,
      });
    } catch (err: any) {
      const diagnosis = diagnoseError(err, String(host), String(user));
      return res.status(500).json({
        ok: false,
        error: diagnosis,
        rawError: err?.message || String(err),
      });
    }
  });

  // 6. Vite / Static Handler
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML5 client-side navigation (Never serve index.html for /api requests)
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.json({
          ok: false,
          error: `API route not found: ${req.method} ${req.originalUrl}`,
        });
      }
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.json({
          ok: false,
          error: `API route not found: ${req.method} ${req.originalUrl}`,
        });
      }
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  // Global Error Handler guaranteeing JSON output
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Global Express Error Handler]', err);
    res.json({
      ok: false,
      error: err?.message || 'Internal server error occurred',
    });
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fieldnote Ops Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fieldnote Ops Server] Failed to start:', err);
  process.exit(1);
});
