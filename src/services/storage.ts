import {
  TicketRequest,
  TicketMessage,
  StatusHistoryEntry,
  AuditLogEntry,
  Attendee,
  User,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TeamName,
  TEAM_MAP,
  ALL_TEAMS,
  SLA_HOURS,
  OPEN_STATUSES,
} from '../types/system';
import { classifyEmail } from './classifier';

const STORAGE_KEYS = {
  REQUESTS: 'fieldnote_requests_v1',
  MESSAGES: 'fieldnote_messages_v1',
  STATUS_HISTORY: 'fieldnote_status_history_v1',
  ATTENDEES: 'fieldnote_attendees_v1',
  USERS: 'fieldnote_users_v1',
  AUDIT_LOG: 'fieldnote_audit_log_v1',
  ACTIVE_USER: 'fieldnote_active_user_v1',
};

const DEFAULT_USERS: User[] = [
  { id: 1, username: 'admin', name: 'Dr. A. Sen (Chief Administrator)', role: 'admin', team: null, active: true },
  { id: 2, username: 'lead', name: 'Archana Singh (Operations Lead)', role: 'lead', team: null, active: true },
  { id: 3, username: 'vip_agent', name: 'Insp. Alok Trivedi', role: 'agent', team: 'VIP & Protocol Team', active: true },
  { id: 4, username: 'transport_agent', name: 'Vikram Joshi', role: 'agent', team: 'Transport Team', active: true },
  { id: 5, username: 'venue_agent', name: 'Farhan Qureshi', role: 'agent', team: 'Venue Operations', active: true },
  { id: 6, username: 'viewer', name: 'Management Observer', role: 'viewer', team: null, active: true },
];

function nowIso(): string {
  return new Date().toISOString();
}

function hoursDiff(dt1: string, dt2: string): number {
  const d1 = new Date(dt1).getTime();
  const d2 = new Date(dt2).getTime();
  return Math.max(0, parseFloat(((d1 - d2) / (1000 * 60 * 60)).toFixed(1)));
}

export function enrichRequest(req: TicketRequest): TicketRequest {
  const now = new Date().toISOString();
  const sla_hours = SLA_HOURS[req.priority] || 8;
  const age_hours = hoursDiff(now, req.created_at);
  const is_open = OPEN_STATUSES.includes(req.status);
  const is_unassigned = is_open && (req.status === 'New' || req.team === 'Manual Review' || !req.owner);
  const is_overdue = is_open && !req.responded_at && age_hours > sla_hours;
  const first_response_hrs = req.responded_at ? hoursDiff(req.responded_at, req.created_at) : null;
  const resolution_hrs = req.resolved_at ? hoursDiff(req.resolved_at, req.created_at) : null;

  return {
    ...req,
    sla_hours,
    age_hours,
    is_open,
    is_unassigned,
    is_overdue,
    first_response_hrs,
    resolution_hrs,
  };
}

export class OpsStorage {
  private static read<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private static write<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write failed', e);
    }
  }

  static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.write(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
      this.write(STORAGE_KEYS.ACTIVE_USER, DEFAULT_USERS[0]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      this.seedInitialData();
    }
  }

  static getActiveUser(): User {
    return this.read(STORAGE_KEYS.ACTIVE_USER, DEFAULT_USERS[0]);
  }

  static setActiveUser(user: User): void {
    this.write(STORAGE_KEYS.ACTIVE_USER, user);
  }

  static getUsers(): User[] {
    return this.read<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  static createUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const newUser: User = { ...user, id: Date.now() };
    users.push(newUser);
    this.write(STORAGE_KEYS.USERS, users);
    this.audit(this.getActiveUser().username, 'user_created', null, `${newUser.username} (${newUser.role})`);
    return newUser;
  }

  static toggleUserActive(username: string): void {
    const users = this.getUsers().map((u) => (u.username === username ? { ...u, active: !u.active } : u));
    this.write(STORAGE_KEYS.USERS, users);
    this.audit(this.getActiveUser().username, 'user_status_changed', null, `Toggle active: ${username}`);
  }

  static getRequests(): TicketRequest[] {
    const raw = this.read<TicketRequest[]>(STORAGE_KEYS.REQUESTS, []);
    return raw.map(enrichRequest);
  }

  static getRequest(requestId: string): TicketRequest | undefined {
    return this.getRequests().find((r) => r.request_id === requestId);
  }

  static getMessages(requestId?: string): TicketMessage[] {
    const msgs = this.read<TicketMessage[]>(STORAGE_KEYS.MESSAGES, []);
    if (requestId) {
      return msgs.filter((m) => m.request_id === requestId).sort((a, b) => a.id - b.id);
    }
    return msgs;
  }

  static getStatusHistory(requestId?: string): StatusHistoryEntry[] {
    const history = this.read<StatusHistoryEntry[]>(STORAGE_KEYS.STATUS_HISTORY, []);
    if (requestId) {
      return history.filter((h) => h.request_id === requestId).sort((a, b) => a.id - b.id);
    }
    return history;
  }

  static getAttendees(): Attendee[] {
    const attendees = this.read<Attendee[]>(STORAGE_KEYS.ATTENDEES, []);
    const requests = this.getRequests();

    return attendees.map((att) => {
      const attendeeReqs = requests.filter((r) => r.attendee_email.toLowerCase() === att.email.toLowerCase());
      const openCount = attendeeReqs.filter((r) => r.is_open).length;
      const sorted = [...attendeeReqs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        ...att,
        total_requests: attendeeReqs.length,
        open_requests: openCount,
        last_request: sorted[0]?.created_at || att.first_seen,
      };
    });
  }

  static getAuditLog(): AuditLogEntry[] {
    return this.read<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, []).sort((a, b) => b.id - a.id);
  }

  static audit(user: string, action: string, requestId: string | null = null, details = ''): void {
    const logs = this.read<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, []);
    const entry: AuditLogEntry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ts: nowIso(),
      user,
      action,
      request_id: requestId,
      details,
    };
    logs.push(entry);
    this.write(STORAGE_KEYS.AUDIT_LOG, logs);
  }

  static logStatus(requestId: string, oldStatus: TicketStatus | null, newStatus: TicketStatus, changedBy: string): void {
    const history = this.read<StatusHistoryEntry[]>(STORAGE_KEYS.STATUS_HISTORY, []);
    history.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      request_id: requestId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      changed_at: nowIso(),
    });
    this.write(STORAGE_KEYS.STATUS_HISTORY, history);
  }

  static async processEmail(
    senderEmail: string,
    senderName: string,
    subject: string,
    body: string
  ): Promise<{ requestId: string; isFollowUp: boolean; category: TicketCategory; team: TeamName }> {
    const attendees = this.read<Attendee[]>(STORAGE_KEYS.ATTENDEES, []);
    if (!attendees.some((a) => a.email.toLowerCase() === senderEmail.toLowerCase())) {
      attendees.push({
        email: senderEmail,
        name: senderName || senderEmail.split('@')[0],
        first_seen: nowIso(),
      });
      this.write(STORAGE_KEYS.ATTENDEES, attendees);
    }

    // Check if subject has [REQ-XXXXX] tag for reply threading
    const match = subject.match(/\[REQ-(\d{5})\]/i);
    if (match) {
      const existingId = `REQ-${match[1]}`;
      const existingReq = this.getRequest(existingId);
      if (existingReq) {
        const msgs = this.read<TicketMessage[]>(STORAGE_KEYS.MESSAGES, []);
        msgs.push({
          id: Date.now(),
          request_id: existingId,
          msg_id: `<msg-${Date.now()}@bhopal.summit>`,
          direction: 'in',
          sender: senderEmail,
          body,
          created_at: nowIso(),
        });
        this.write(STORAGE_KEYS.MESSAGES, msgs);

        if (['Responded', 'Resolved', 'Closed'].includes(existingReq.status)) {
          this.setStatus(existingId, 'In Progress', 'attendee reply');
        }

        this.audit(senderEmail, 'follow_up_received', existingId, `Subject: ${subject}`);
        return {
          requestId: existingId,
          isFollowUp: true,
          category: existingReq.category,
          team: existingReq.team,
        };
      }
    }

    // New Request Classification
    const ai = await classifyEmail(subject, body);
    let team: TeamName = TEAM_MAP[ai.category] || 'General Support';
    let status: TicketStatus = 'Assigned';

    if (ai.confidence < 0.6) {
      team = 'Manual Review';
      status = 'New';
    }

    const requests = this.read<TicketRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const nextNum = requests.length + 1;
    const requestId = `REQ-${String(nextNum).padStart(5, '0')}`;
    const timestamp = nowIso();

    const newReq: TicketRequest = {
      id: nextNum,
      request_id: requestId,
      attendee_email: senderEmail,
      attendee_name: senderName || senderEmail.split('@')[0],
      subject,
      category: ai.category,
      summary: ai.summary,
      priority: ai.priority,
      confidence: ai.confidence,
      status,
      team,
      owner: status === 'Assigned' ? `${team.split(' ')[0].toLowerCase()}_agent` : null,
      created_at: timestamp,
      assigned_at: status === 'Assigned' ? timestamp : null,
      responded_at: null,
      resolved_at: null,
      escalated_at: null,
      closed_at: null,
      escalation_reason: null,
      sla_hours: SLA_HOURS[ai.priority],
      age_hours: 0,
      is_open: true,
      is_unassigned: status === 'New',
      is_overdue: false,
      first_response_hrs: null,
      resolution_hrs: null,
    };

    requests.unshift(newReq);
    this.write(STORAGE_KEYS.REQUESTS, requests);

    // Ingest incoming message
    const msgs = this.read<TicketMessage[]>(STORAGE_KEYS.MESSAGES, []);
    msgs.push({
      id: Date.now(),
      request_id: requestId,
      msg_id: `<msg-${Date.now()}-in@bhopal.summit>`,
      direction: 'in',
      sender: senderEmail,
      body,
      created_at: timestamp,
    });

    // Generate automated acknowledgement
    const ackBody = `Dear ${senderName || 'Attendee'},\n\nThank you for contacting the Bhopal Investor Summit 2027 Operations & Support Team. We have received your request.\n\nYour Request ID: ${requestId}\n\nPlease quote this ID (keep [${requestId}] in the subject) in any further communication. Our ${team} will review and respond shortly.\n\nWarm regards,\nBhopal Summit 2027 Operations Command`;

    msgs.push({
      id: Date.now() + 10,
      request_id: requestId,
      msg_id: `<msg-${Date.now()}-ack@bhopal.summit>`,
      direction: 'out',
      sender: 'event-desk@bhopalsummit.gov.in',
      body: ackBody,
      created_at: new Date(Date.now() + 15000).toISOString(),
    });

    this.write(STORAGE_KEYS.MESSAGES, msgs);

    this.logStatus(requestId, null, 'New', 'system');
    if (status === 'Assigned') {
      this.logStatus(requestId, 'New', 'Assigned', 'auto-assign');
    }

    this.audit('system', 'ticket_created', requestId, `${ai.category} | ${ai.priority} | ${team}`);

    return {
      requestId,
      isFollowUp: false,
      category: ai.category,
      team,
    };
  }

  static sendReply(requestId: string, replyText: string, user: string): void {
    const requests = this.read<TicketRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex((r) => r.request_id === requestId);
    if (reqIndex === -1) return;

    const req = requests[reqIndex];
    const msgs = this.read<TicketMessage[]>(STORAGE_KEYS.MESSAGES, []);
    const now = nowIso();

    const formattedBody = `${replyText}\n\nRegards,\nBhopal Summit 2027 Support Team\n(Request ID: ${requestId})`;

    msgs.push({
      id: Date.now(),
      request_id: requestId,
      msg_id: `<out-${Date.now()}@bhopal.summit>`,
      direction: 'out',
      sender: user,
      body: formattedBody,
      created_at: now,
    });
    this.write(STORAGE_KEYS.MESSAGES, msgs);

    if (!req.responded_at) {
      req.responded_at = now;
    }
    if (OPEN_STATUSES.includes(req.status)) {
      this.logStatus(requestId, req.status, 'Responded', user);
      req.status = 'Responded';
    }

    requests[reqIndex] = req;
    this.write(STORAGE_KEYS.REQUESTS, requests);
    this.audit(user, 'reply_sent', requestId, `to=${req.attendee_email}`);
  }

  static addNote(requestId: string, noteText: string, user: string): void {
    const msgs = this.read<TicketMessage[]>(STORAGE_KEYS.MESSAGES, []);
    msgs.push({
      id: Date.now(),
      request_id: requestId,
      msg_id: `<note-${Date.now()}@bhopal.summit>`,
      direction: 'note',
      sender: user,
      body: noteText,
      created_at: nowIso(),
    });
    this.write(STORAGE_KEYS.MESSAGES, msgs);
    this.audit(user, 'internal_note', requestId, noteText.slice(0, 80));
  }

  static assign(requestId: string, team: TeamName, owner: string | null, user: string): void {
    const requests = this.read<TicketRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex((r) => r.request_id === requestId);
    if (reqIndex === -1) return;

    const req = requests[reqIndex];
    const oldTeam = req.team;
    req.team = team;
    req.owner = owner;
    req.assigned_at = nowIso();

    if (req.status === 'New' && team !== 'Manual Review') {
      this.logStatus(requestId, 'New', 'Assigned', user);
      req.status = 'Assigned';
    }

    requests[reqIndex] = req;
    this.write(STORAGE_KEYS.REQUESTS, requests);
    this.audit(user, 'assign', requestId, `team=${team}, owner=${owner || '-'}`);
  }

  static setStatus(requestId: string, newStatus: TicketStatus, user: string, reason = ''): void {
    const requests = this.read<TicketRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex((r) => r.request_id === requestId);
    if (reqIndex === -1) return;

    const req = requests[reqIndex];
    if (req.status === newStatus) return;

    const oldStatus = req.status;
    const now = nowIso();
    req.status = newStatus;

    if (newStatus === 'Resolved') {
      req.resolved_at = now;
      if (!req.responded_at) req.responded_at = now;
    } else if (newStatus === 'Closed') {
      req.closed_at = now;
      if (!req.resolved_at) req.resolved_at = now;
    } else if (newStatus === 'Escalated') {
      req.escalated_at = now;
      req.escalation_reason = reason || 'Manual operational escalation';
    } else if (['New', 'Assigned', 'In Progress'].includes(newStatus) && ['Resolved', 'Closed'].includes(oldStatus)) {
      req.resolved_at = null;
      req.closed_at = null;
    }

    requests[reqIndex] = req;
    this.write(STORAGE_KEYS.REQUESTS, requests);
    this.logStatus(requestId, oldStatus, newStatus, user);
    this.audit(user, 'status_change', requestId, `${oldStatus} -> ${newStatus} ${reason}`.trim());
  }

  static escalate(requestId: string, reason: string, user: string): void {
    this.setStatus(requestId, 'Escalated', user, reason || 'Escalated by supervisor');
  }

  static autoEscalate(user = 'system (SLA worker)'): string[] {
    const requests = this.getRequests();
    const overdueNotEscalated = requests.filter((r) => r.is_overdue && r.status !== 'Escalated');
    const escalatedIds: string[] = [];

    for (const req of overdueNotEscalated) {
      this.setStatus(req.request_id, 'Escalated', user, 'SLA breached (no response in time)');
      escalatedIds.push(req.request_id);
    }

    return escalatedIds;
  }

  static generatePowerBiCsvs(): Record<string, string> {
    const requests = this.getRequests();
    const messages = this.getMessages();
    const history = this.getStatusHistory();
    const attendees = this.getAttendees();
    const auditLogs = this.getAuditLog();

    const toCsv = (rows: any[], headers: string[]) => {
      const headerLine = headers.join(',');
      const lines = rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      return [headerLine, ...lines].join('\n');
    };

    return {
      'requests.csv': toCsv(requests, [
        'request_id',
        'attendee_email',
        'attendee_name',
        'subject',
        'category',
        'priority',
        'confidence',
        'status',
        'team',
        'owner',
        'created_at',
        'assigned_at',
        'responded_at',
        'resolved_at',
        'escalated_at',
        'closed_at',
        'escalation_reason',
        'sla_hours',
        'age_hours',
        'is_open',
        'is_unassigned',
        'is_overdue',
        'first_response_hrs',
        'resolution_hrs',
      ]),
      // message bodies excluded for PII protection matching export_powerbi.py
      'messages.csv': toCsv(messages, ['id', 'request_id', 'direction', 'sender', 'created_at']),
      'status_history.csv': toCsv(history, ['id', 'request_id', 'old_status', 'new_status', 'changed_by', 'changed_at']),
      'attendees.csv': toCsv(attendees, ['email', 'name', 'first_seen', 'total_requests', 'open_requests', 'last_request']),
      'audit_log.csv': toCsv(auditLogs, ['id', 'ts', 'user', 'action', 'request_id', 'details']),
    };
  }

  static seedInitialData(targetCount = 45): void {
    const SAMPLES: Record<TicketCategory, string[]> = {
      registration: [
        'Registration confirmation email not received for delegation pass',
        'Need to update name on speaker badge before plenary',
        'Unable to access investor portal with registered credentials',
      ],
      travel: [
        'Flight Air India AI-433 rescheduled, arrival delayed by 2h',
        'Train Shatabdi Express ticket assistance from New Delhi to Bhopal',
        'Aviation liaison required for private charter arrival at Raja Bhoj',
      ],
      accommodation: [
        'Hotel Jehan Numa Palace room allotment confirmation needed',
        'Requesting early check-in at Lake View Hotel for foreign delegates',
        'Extra twin room required for security escort detail',
      ],
      transportation: [
        'Airport pickup required on arrival for German business delegation',
        'Shuttle schedule between Noor-Us-Sabah Palace and Bharat Bhavan?',
        'Dedicated VIP vehicle required for evening state banquet',
      ],
      venue: [
        'Reserved seating arrangement for 8 delegates at Antarang Hall',
        'Power connection and HDMI matrix setup for exhibition booth B-12',
        'VIP access pass for Gate 2 restricted security perimeter',
      ],
      food: [
        'Strict Jain vegetarian meal arrangement for 4 delegates',
        'Severe peanut allergy alert for Ambassador of Singapore',
        'State dinner dietary preferences sheet submission',
      ],
      vip_protocol: [
        'Union Minister delegation arriving at 11:30 IST, protocol escort needed',
        'State Secretary bilateral room reservation request',
        'Ambassadorial security detail coordination with MP Police',
      ],
      general: [
        'Inquiry regarding post-summit excursion to Sanchi & Bhimbetka',
        'Media accreditation press pass collection timings',
        'Dress code protocol for the Governor inaugural reception',
      ],
    };

    const FIRST = ['Aarav', 'Priya', 'Rohan', 'Neha', 'Vikram', 'Ananya', 'Karan', 'Sneha', 'Rahul', 'Pooja', 'Amit', 'Divya'];
    const LAST = ['Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Joshi', 'Mehta', 'Iyer', 'Nair', 'Reddy'];

    const requests: TicketRequest[] = [];
    const messages: TicketMessage[] = [];
    const history: StatusHistoryEntry[] = [];
    const attendees: Attendee[] = [];
    const auditLogs: AuditLogEntry[] = [];

    const categories = Object.keys(SAMPLES) as TicketCategory[];
    const now = new Date();

    for (let i = 1; i <= targetCount; i++) {
      const cat = categories[i % categories.length];
      const samples = SAMPLES[cat];
      const subject = samples[(i * 3) % samples.length];
      const fn = FIRST[i % FIRST.length];
      const ln = LAST[(i * 2) % LAST.length];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@summitdelegates.org`;
      const name = `${fn} ${ln}`;

      const hoursAgo = (targetCount - i) * 1.5 + (i % 5);
      const createdDate = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      const createdIso = createdDate.toISOString();

      const prio: TicketPriority = cat === 'vip_protocol' ? 'High' : i % 7 === 0 ? 'High' : i % 3 === 0 ? 'Low' : 'Medium';
      let team: TeamName = TEAM_MAP[cat];
      const conf = parseFloat((0.72 + (i % 25) * 0.01).toFixed(2));

      // Realistic mix of statuses
      let status: TicketStatus = 'Resolved';
      if (i > targetCount - 5) status = 'New';
      else if (i > targetCount - 12) status = 'Assigned';
      else if (i > targetCount - 18) status = 'In Progress';
      else if (i > targetCount - 25) status = 'Responded';
      else if (i % 9 === 0) status = 'Escalated';

      if (status === 'New') {
        team = 'Manual Review';
      }

      const reqId = `REQ-${String(i).padStart(5, '0')}`;
      const assignedAt = status !== 'New' ? new Date(createdDate.getTime() + 15 * 60000).toISOString() : null;
      const respondedAt = ['Responded', 'Resolved', 'Closed'].includes(status)
        ? new Date(createdDate.getTime() + 45 * 60000).toISOString()
        : null;
      const resolvedAt = ['Resolved', 'Closed'].includes(status)
        ? new Date(createdDate.getTime() + 120 * 60000).toISOString()
        : null;
      const escalatedAt = status === 'Escalated' ? new Date(createdDate.getTime() + 180 * 60000).toISOString() : null;

      const req: TicketRequest = {
        id: i,
        request_id: reqId,
        attendee_email: email,
        attendee_name: name,
        subject,
        category: cat,
        summary: `Attendee ${name} requests: ${subject.toLowerCase()}.`,
        priority: prio,
        confidence: conf,
        status,
        team,
        owner: status !== 'New' ? `${team.split(' ')[0].toLowerCase()}_agent` : null,
        created_at: createdIso,
        assigned_at: assignedAt,
        responded_at: respondedAt,
        resolved_at: resolvedAt,
        escalated_at: escalatedAt,
        closed_at: null,
        escalation_reason: status === 'Escalated' ? 'SLA breached (no response in time)' : null,
        sla_hours: SLA_HOURS[prio],
        age_hours: parseFloat(hoursAgo.toFixed(1)),
        is_open: OPEN_STATUSES.includes(status),
        is_unassigned: status === 'New',
        is_overdue: OPEN_STATUSES.includes(status) && !respondedAt && hoursAgo > SLA_HOURS[prio],
        first_response_hrs: respondedAt ? 0.75 : null,
        resolution_hrs: resolvedAt ? 2.0 : null,
      };

      requests.unshift(req);

      if (!attendees.some((a) => a.email === email)) {
        attendees.push({
          email,
          name,
          first_seen: createdIso,
        });
      }

      // Add messages
      messages.push({
        id: i * 10 + 1,
        request_id: reqId,
        msg_id: `<msg-${reqId}-in@bhopal.summit>`,
        direction: 'in',
        sender: email,
        body: `Dear Summit Secretariat,\n\n${subject}. Please advise the protocol and logistics team at earliest convenience.\n\nThank you,\n${name}`,
        created_at: createdIso,
      });

      messages.push({
        id: i * 10 + 2,
        request_id: reqId,
        msg_id: `<msg-${reqId}-ack@bhopal.summit>`,
        direction: 'out',
        sender: 'event-desk@bhopalsummit.gov.in',
        body: `Dear ${name},\n\nThank you for contacting the Bhopal Investor Summit 2027 Operations Desk. Your Request ID is [${reqId}].\n\nOur team is reviewing this ticket.`,
        created_at: new Date(createdDate.getTime() + 10000).toISOString(),
      });

      if (respondedAt) {
        messages.push({
          id: i * 10 + 3,
          request_id: reqId,
          msg_id: `<msg-${reqId}-resp@bhopal.summit>`,
          direction: 'out',
          sender: `${team.split(' ')[0].toLowerCase()}_agent`,
          body: `Dear ${name},\n\nWe have arranged the requested protocol/logistics accommodation according to state summit guidelines.\n\nWarm regards,\n${team}`,
          created_at: respondedAt,
        });
      }

      history.push({
        id: i * 10 + 1,
        request_id: reqId,
        old_status: null,
        new_status: 'New',
        changed_by: 'system',
        changed_at: createdIso,
      });

      if (status !== 'New') {
        history.push({
          id: i * 10 + 2,
          request_id: reqId,
          old_status: 'New',
          new_status: 'Assigned',
          changed_by: 'auto-assign',
          changed_at: assignedAt || createdIso,
        });
      }

      if (status === 'Escalated') {
        history.push({
          id: i * 10 + 3,
          request_id: reqId,
          old_status: 'Assigned',
          new_status: 'Escalated',
          changed_by: 'system',
          changed_at: escalatedAt || createdIso,
        });
      }

      auditLogs.push({
        id: i * 10 + 1,
        ts: createdIso,
        user: 'system',
        action: 'seed_demo',
        request_id: reqId,
        details: `${cat} | ${prio} | ${team}`,
      });
    }

    this.write(STORAGE_KEYS.REQUESTS, requests);
    this.write(STORAGE_KEYS.MESSAGES, messages);
    this.write(STORAGE_KEYS.STATUS_HISTORY, history);
    this.write(STORAGE_KEYS.ATTENDEES, attendees);
    this.write(STORAGE_KEYS.AUDIT_LOG, auditLogs);
  }
}
