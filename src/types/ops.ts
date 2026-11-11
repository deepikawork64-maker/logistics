export type Severity = 'urgent' | 'warning' | 'operational' | 'disconnected';

export interface AuditEntry {
  id: string;
  timestamp: string;
  author: string;
  callsign: string;
  action: string;
  note: string;
}

export interface Incident {
  id: string;
  title: string;
  venueId: string;
  venueName: string;
  locationDetail: string;
  category: 'Acoustics & AV' | 'Power & Grid' | 'Protocol & VIP' | 'Crowd & Egress' | 'Comms & Relay' | 'Medical';
  severity: Severity;
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved';
  timeReported: string;
  elapsedMinutes: number;
  assignedUnit: string;
  assignedRadioChannel: string;
  leadOfficer: string;
  summary: string;
  payload: Record<string, any>;
  auditTrail: AuditEntry[];
}

export interface Venue {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  currentOccupancy: number;
  status: 'Nominal' | 'High Density' | 'Capacity Alert' | 'Standby';
  stageSession: string;
  speaker: string;
  audioVisualStatus: 'Operational' | 'Degraded' | 'Offline';
  powerSource: 'Dual Grid MPEB + 500kVA Gen' | 'Solar Auxiliary + Battery' | 'Single Feed Active' | 'Standby Gen 250kVA';
  generatorFuel: number; // percentage
  egressCorridors: 'All Clear' | 'Corridor B Monitored' | 'Corridor 4 Restricted';
  leadContact: string;
  radioFrequency: string;
  temperature: string;
  noiseDb: number;
}

export interface RunOfShowItem {
  id: string;
  timeSlot: string;
  venueId: string;
  venueName: string;
  sessionTitle: string;
  speakerOrDelegation: string;
  stageLead: string;
  status: 'Completed' | 'Live Now' | 'Imminent' | 'Scheduled' | 'Delayed';
  audioFeed: string;
  protocolTier: 'Tier 1 Head of State' | 'Tier 2 Ministerial' | 'Tier 3 Cultural' | 'General Plenary';
  cuedTime: string;
  delayOffsetMinutes: number;
  notes: string;
}

export interface CommsRelay {
  id: string;
  name: string;
  type: 'VHF Radio' | 'Microwave IP' | 'TETRA Mesh' | 'Webhook Gateway' | 'Satellite Uplink' | 'Sensor LoRaWAN';
  frequencyOrTarget: string;
  status: 'Operational' | 'Degraded' | 'Unconfigured' | 'Offline';
  latencyMs?: number;
  signalDbm?: number;
  dutyCycle?: string;
  lastSync: string;
  description: string;
  configInstructions?: string;
}

export interface MedicalUnit {
  id: string;
  callsign: string;
  type: 'ALS Ambulance' | 'Paramedic Rapid Response' | 'Triage Pavilion Base' | 'Air Evac Liaison';
  stationedAt: string;
  status: 'On Standby' | 'Dispatched' | 'Patient Transit' | 'Clearing Hospital';
  crew: string;
  primaryHospital: string;
  transitTimeMin: number;
}
