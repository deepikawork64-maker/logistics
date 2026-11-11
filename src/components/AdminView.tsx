import React, { useState } from 'react';
import {
  Users,
  Settings,
  Shield,
  Key,
  UserPlus,
  Play,
  Download,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Table,
  Cpu,
} from 'lucide-react';
import { User, Role, TeamName, ALL_ROLES, ALL_TEAMS, TEAM_MAP, SLA_HOURS } from '../types/system';

interface AdminViewProps {
  users: User[];
  currentUser: User;
  onCreateUser: (user: Omit<User, 'id'>) => void;
  onToggleUserActive: (username: string) => void;
  onRunSlaCheck: () => void;
  onOpenIngestModal: () => void;
  onOpenPowerBiModal: () => void;
  onReseedData: (count: number) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  users,
  currentUser,
  onCreateUser,
  onToggleUserActive,
  onRunSlaCheck,
  onOpenIngestModal,
  onOpenPowerBiModal,
  onReseedData,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'operations' | 'configuration'>('users');

  // Create User Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('agent');
  const [team, setTeam] = useState<TeamName | ''>('General Support');
  const [userCreatedMessage, setUserCreatedMessage] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      alert('Username is required and password must be at least 6 characters.');
      return;
    }

    onCreateUser({
      username: username.trim().toLowerCase(),
      name: name.trim() || username.trim(),
      role,
      team: role === 'agent' ? (team as TeamName) || null : null,
      active: true,
    });

    setUserCreatedMessage(`User @${username} (${role}) successfully created.`);
    setUsername('');
    setName('');
    setPassword('');
    setTimeout(() => setUserCreatedMessage(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-[#EBE8E1]">
        <div>
          <h1 className="font-serif font-semibold text-2xl md:text-3xl text-[#1D1C16] tracking-tight">
            System Administration & Control
          </h1>
          <p className="text-xs md:text-sm text-[#424844] mt-1">
            Access governance, staff assignments, SLA engine configuration, and Power BI data feeds.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EBE8E1] gap-6 text-xs font-semibold uppercase tracking-[0.06em]">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-[#1E3A2F] text-[#1E3A2F]'
              : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'operations'
              ? 'border-[#1E3A2F] text-[#1E3A2F]'
              : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Operations & Ingestion</span>
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'configuration'
              ? 'border-[#1E3A2F] text-[#1E3A2F]'
              : 'border-transparent text-[#8F8C84] hover:text-[#1D1C16]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Routing & SLA Rules</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User List */}
          <div className="bg-[#FBFBFA] rounded border border-[#EBE8E1] overflow-hidden">
            <div className="p-3.5 bg-[#F5F4F0] border-b border-[#E2DFD7] text-xs font-semibold uppercase tracking-wider text-[#1D1C16]">
              Authorized Staff & Operatives
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F5F4F0] border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844]">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Assigned Team</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE8E1]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F5F4F0] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#1E3A2F]">
                        @{u.username}
                      </td>
                      <td className="py-2.5 px-3 text-[#1D1C16] font-medium">{u.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#EFECE5] text-[#1E3A2F] border">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#424844]">{u.team || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            u.active
                              ? 'bg-[#D8EEDF] text-[#2E7D52]'
                              : 'bg-[#FBE3DE] text-[#B83A2C]'
                          }`}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {u.username !== currentUser.username && (
                          <button
                            onClick={() => onToggleUserActive(u.username)}
                            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                              u.active
                                ? 'border-[#E2DFD7] text-[#B83A2C] hover:bg-[#FBE3DE]'
                                : 'border-[#2E7D52]/40 text-[#2E7D52] hover:bg-[#D8EEDF]'
                            }`}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create User Form */}
          <div className="bg-[#FBFBFA] p-5 rounded border border-[#EBE8E1] space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#1E3A2F]" />
              <h3 className="font-serif font-semibold text-base text-[#1D1C16]">
                Provision New Operative Account
              </h3>
            </div>

            {userCreatedMessage && (
              <div className="p-2.5 rounded bg-[#D8EEDF] text-[#2E7D52] text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{userCreatedMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. joshi_ops"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none focus:border-[#1E3A2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#8F8C84] mb-1">
                    Team (for Agents)
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value as TeamName)}
                    disabled={role !== 'agent'}
                    className="w-full p-2 bg-white border border-[#E2DFD7] rounded text-xs focus:outline-none disabled:bg-[#EFECE5] disabled:opacity-60"
                  >
                    <option value="">(None)</option>
                    {ALL_TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors"
                >
                  Create Operative Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-4">
          <div className="bg-[#F5F4F0] p-4 rounded border border-[#E2DFD7] text-xs text-[#424844] leading-relaxed">
            In standard production, <code className="font-mono text-[#1E3A2F]">worker.py</code> runs
            in the background every 60 seconds to ingest incoming IMAP emails, evaluate first-response
            SLAs, and refresh the Power BI datasets. You can trigger each routine manually below:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Op 1: Fetch/Simulate Emails */}
            <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
              <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                📥 Ingest / Simulate Emails
              </h4>
              <p className="text-xs text-[#8F8C84] leading-relaxed">
                Parse attendee messages through Gemini or keyword fallback, assign category and
                generate auto-acknowledgement.
              </p>
              <button
                onClick={onOpenIngestModal}
                className="w-full py-2 text-xs font-semibold bg-[#1E3A2F] text-[#FBFBFA] rounded hover:bg-[#2E7D52] transition-colors"
              >
                Launch Ingestion Modal
              </button>
            </div>

            {/* Op 2: Run SLA Escalation */}
            <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
              <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                🚨 Run SLA Escalation Now
              </h4>
              <p className="text-xs text-[#8F8C84] leading-relaxed">
                Scan all open tickets where age exceeds SLA threshold and auto-escalate to Level 2
                supervisor queue.
              </p>
              <button
                onClick={onRunSlaCheck}
                className="w-full py-2 text-xs font-semibold bg-[#B83A2C] text-white rounded hover:bg-[#93000a] transition-colors"
              >
                Scan & Escalate Overdue
              </button>
            </div>

            {/* Op 3: Power BI Export */}
            <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
              <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
                📤 Export Power BI Data
              </h4>
              <p className="text-xs text-[#8F8C84] leading-relaxed">
                Generate the 5 clean CSV tables for Power BI Desktop ingestion (PII messages
                sanitized).
              </p>
              <button
                onClick={onOpenPowerBiModal}
                className="w-full py-2 text-xs font-semibold border border-[#E2DFD7] text-[#1E3A2F] bg-white hover:bg-[#F5F4F0] rounded transition-colors"
              >
                View & Download CSVs
              </button>
            </div>
          </div>

          {/* Re-seed dummy tickets */}
          <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-2">
            <h4 className="font-serif font-semibold text-sm text-[#1D1C16]">
              🌱 Test Data Generator (seed_demo.py simulation)
            </h4>
            <p className="text-xs text-[#8F8C84]">
              Quickly repopulate the operational database with realistic simulated tickets across all
              categories.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onReseedData(25)}
                className="px-3 py-1.5 text-xs font-medium border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0]"
              >
                Seed 25 Tickets
              </button>
              <button
                onClick={() => onReseedData(50)}
                className="px-3 py-1.5 text-xs font-medium border border-[#E2DFD7] rounded bg-white hover:bg-[#F5F4F0]"
              >
                Seed 50 Tickets
              </button>
              <button
                onClick={() => onReseedData(80)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A2F] text-white rounded hover:bg-[#2E7D52]"
              >
                Seed 80 Tickets (Full Summit)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'configuration' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category -> Team Routing Table */}
          <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              Category → Team Routing (TEAM_MAP)
            </h3>
            <p className="text-xs text-[#8F8C84]">
              Automatic department assignment rule based on AI ingestion output.
            </p>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844]">
                  <th className="py-2">Category Key</th>
                  <th className="py-2">Assigned Operational Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1]">
                {Object.entries(TEAM_MAP).map(([cat, teamName]) => (
                  <tr key={cat}>
                    <td className="py-2 font-mono text-[11px] text-[#1E3A2F]">{cat}</td>
                    <td className="py-2 text-[#1D1C16] font-medium">{teamName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SLA Thresholds Table */}
          <div className="bg-[#FBFBFA] p-4 rounded border border-[#EBE8E1] space-y-3">
            <h3 className="font-serif font-semibold text-sm text-[#1D1C16]">
              First-Response SLA Target Hours (SLA_HOURS)
            </h3>
            <p className="text-xs text-[#8F8C84]">
              Tickets without team reply past this threshold are marked Overdue and escalated.
            </p>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DFD7] text-[10px] uppercase font-semibold text-[#424844]">
                  <th className="py-2">Priority Tier</th>
                  <th className="py-2">Max First-Response Hours</th>
                  <th className="py-2">Target Audience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E1]">
                <tr>
                  <td className="py-2 font-semibold text-[#B83A2C]">High Priority</td>
                  <td className="py-2 font-mono tabular-nums font-bold">2.0 Hours</td>
                  <td className="py-2 text-[#424844]">VIPs, emergency travel, security</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-[#976508]">Medium Priority</td>
                  <td className="py-2 font-mono tabular-nums font-bold">8.0 Hours</td>
                  <td className="py-2 text-[#424844]">Hotel, transport, venue entry queries</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-[#424844]">Low Priority</td>
                  <td className="py-2 font-mono tabular-nums font-bold">24.0 Hours</td>
                  <td className="py-2 text-[#424844]">General info, feedback, post-summit</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
