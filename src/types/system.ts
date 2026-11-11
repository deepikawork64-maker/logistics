export type Role = 'admin' | 'lead' | 'agent' | 'viewer';

export type TicketStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Responded'
  | 'Resolved'
  | 'Escalated'
  | 'Closed';

export type TicketPriority = 'High' | 'Medium' | 'Low';

export type TicketCategory =
  | 'registration'
  | 'travel'
  | 'accommodation'
  | 'transportation'
  | 'venue'
  | 'food'
  | 'vip_protocol'
  | 'general';

export type TeamName =
  | 'Registration Desk'
  | 'Travel Team'
  | 'Hospitality Team'
  | 'Transport Team'
  | 'Venue Operations'
  | 'Catering Team'
  | 'VIP & Protocol Team'
  | 'General Support'
  | 'Manual Review';

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  team: TeamName | null;
  active: boolean;
}

export interface TicketMessage {
  id: number;
  request_id: string;
  msg_id: string;
  direction: 'in' | 'out' | 'note';
  sender: string;
  body: string;
  created_at: string;
}

export interface StatusHistoryEntry {
  id: number;
  request_id: string;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  changed_by: string;
  changed_at: string;
}

export interface AuditLogEntry {
  id: number;
  ts: string;
  user: string;
  action: string;
  request_id: string | null;
  details: string;
}

export interface Attendee {
  email: string;
  name: string;
  first_seen: string;
  total_requests?: number;
  open_requests?: number;
  last_request?: string;
}

export interface TicketRequest {
  id: number;
  request_id: string;
  attendee_email: string;
  attendee_name: string;
  subject: string;
  category: TicketCategory;
  summary: string;
  priority: TicketPriority;
  confidence: number;
  status: TicketStatus;
  team: TeamName;
  owner: string | null;
  created_at: string;
  assigned_at: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  escalated_at: string | null;
  closed_at: string | null;
  escalation_reason: string | null;

  // Enriched SLA metrics (computed)
  sla_hours: number;
  age_hours: number;
  is_open: boolean;
  is_unassigned: boolean;
  is_overdue: boolean;
  first_response_hrs: number | null;
  resolution_hrs: number | null;
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  registration: 'Registration',
  travel: 'Travel',
  accommodation: 'Accommodation',
  transportation: 'Transportation',
  venue: 'Venue Operations',
  food: 'Catering & Food',
  vip_protocol: 'VIP & Protocol',
  general: 'General Query',
};

export const TEAM_MAP: Record<TicketCategory, TeamName> = {
  registration: 'Registration Desk',
  travel: 'Travel Team',
  accommodation: 'Hospitality Team',
  transportation: 'Transport Team',
  venue: 'Venue Operations',
  food: 'Catering Team',
  vip_protocol: 'VIP & Protocol Team',
  general: 'General Support',
};

export const ALL_TEAMS: TeamName[] = [
  'Registration Desk',
  'Travel Team',
  'Hospitality Team',
  'Transport Team',
  'Venue Operations',
  'Catering Team',
  'VIP & Protocol Team',
  'General Support',
  'Manual Review',
];

export const ALL_STATUSES: TicketStatus[] = [
  'New',
  'Assigned',
  'In Progress',
  'Responded',
  'Resolved',
  'Escalated',
  'Closed',
];

export const OPEN_STATUSES: TicketStatus[] = ['New', 'Assigned', 'In Progress', 'Escalated'];

export const SLA_HOURS: Record<TicketPriority, number> = {
  High: 2,
  Medium: 8,
  Low: 24,
};

export const ALL_ROLES: Role[] = ['admin', 'lead', 'agent', 'viewer'];
