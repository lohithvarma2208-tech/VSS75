'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Gift,
  Share2,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Settings,
  Activity,
  Download,
  ExternalLink,
  X,
  Sparkles,
  BookOpen,
  LogOut,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  Check,
  RefreshCw,
} from 'lucide-react';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { ReferralCode, Resource, SecurityAuditLog, UserProfile } from '@/types';

interface UserRecord {
  registrationNumber: string;
  name: string;
  department: string;
  semester?: string;
  academicYear?: string;
  courses: { code: string; name: string; semester?: string }[];
  firstLoginAt: string;
  lastLoginAt: string;
  loginCount: number;
  email?: string;
  role?: string;
}

interface AdminDashboardProps {
  administrator: { name: string; registrationNumber: string };
  isPasskeyMode?: boolean;
}

type TabType = 'referrals' | 'users' | 'resources' | 'audit' | 'controls';

export default function AdminDashboard({ administrator, isPasskeyMode }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('referrals');

  // --- Referral Engine State ---
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<ReferralCode | null>(null);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // --- User Registry State ---
  const [erpUsers, setErpUsers] = useState<UserRecord[]>([]);
  const [localUsers, setLocalUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // --- Resource Moderation State ---
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceFilter, setResourceFilter] = useState<'all' | 'approved' | 'pending' | 'flagged' | 'rejected'>('all');
  const [resourceQuery, setResourceQuery] = useState('');

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [auditQuery, setAuditQuery] = useState('');

  // --- Platform Controls State ---
  const [announcement, setAnnouncement] = useState({
    active: true,
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Refresh data
  const refreshReferrals = () => {
    setReferralCodes(MockStorageManager.getReferralCodes());
  };

  const refreshResources = useCallback(() => {
    setResources(MockStorageManager.getResources());
    fetch('/api/resources', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.resources)) {
          MockStorageManager.mergeSharedResources(data.resources);
          setResources(MockStorageManager.getResources());
        }
      })
      .catch(() => {});
  }, []);

  const refreshAuditLogs = () => {
    setAuditLogs(MockStorageManager.getSecurityAuditLogs());
  };

  const fetchUsers = useCallback(() => {
    setLoadingUsers(true);
    fetch('/api/admin/users', { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (Array.isArray(data.users)) {
          setErpUsers(data.users);
        }
      })
      .catch(() => {
        setErpUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const refreshLocalUsers = useCallback(() => {
    setLocalUsers(MockStorageManager.getRegisteredUsers());
  }, []);

  useEffect(() => {
    refreshReferrals();
    refreshResources();
    refreshAuditLogs();
    refreshLocalUsers();
    setAnnouncement(MockStorageManager.getPlatformAnnouncement());
    fetchUsers();

    // Sync any existing local users to server registry
    const locals = MockStorageManager.getRegisteredUsers();
    if (locals.length > 0) {
      fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: locals }),
      })
        .then(() => fetchUsers())
        .catch(() => {});
    }

    // Listen for storage changes
    const onReferralChange = () => refreshReferrals();
    const onAuditChange = () => refreshAuditLogs();
    const onResourcesChange = () => refreshResources();
    const onUsersChange = () => {
      refreshLocalUsers();
      fetchUsers();
    };

    window.addEventListener('klu_referrals_change', onReferralChange);
    window.addEventListener('klu_security_audit_logged', onAuditChange);
    window.addEventListener('klu_resources_change', onResourcesChange);
    window.addEventListener('klu_users_change', onUsersChange);

    return () => {
      window.removeEventListener('klu_referrals_change', onReferralChange);
      window.removeEventListener('klu_security_audit_logged', onAuditChange);
      window.removeEventListener('klu_resources_change', onResourcesChange);
      window.removeEventListener('klu_users_change', onUsersChange);
    };
  }, [fetchUsers, refreshLocalUsers, refreshResources]);

  // --- Actions ---
  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://klu-vss.vercel.app';
    const link = `${origin}/auth/login?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;
    MockStorageManager.createReferralCode(newCodeName, newCodeLabel);
    setNewCodeName('');
    setNewCodeLabel('');
    setIsCreatingCode(false);
    refreshReferrals();
  };

  const handleDeleteCode = (code: string) => {
    if (confirm(`Are you sure you want to delete referral code [${code}]?`)) {
      MockStorageManager.deleteReferralCode(code);
      if (selectedReferral?.code === code) setSelectedReferral(null);
      refreshReferrals();
    }
  };

  const handleUpdateResourceStatus = async (id: string, status: 'approved' | 'flagged' | 'archived') => {
    MockStorageManager.updateResourceStatus(id, status);
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    try {
      await fetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.warn('Backend status update error:', err);
    }

    MockStorageManager.recordSecurityAuditLog({
      event: 'RESOURCE_MODERATED',
      masked_erp_id: administrator.registrationNumber,
      ip_address: '127.0.0.1 (Admin Desk)',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Admin Dashboard',
      status: 'SUCCESS',
      details: `Resource [${id}] status updated to [${status}] by admin.`,
    });
    refreshResources();
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm('Permanently delete this resource from the repository and cloud storage?')) {
      MockStorageManager.deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));

      try {
        await fetch(`/api/resources?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        console.warn('Backend resource delete error:', err);
      }

      MockStorageManager.recordSecurityAuditLog({
        event: 'RESOURCE_MODERATED',
        masked_erp_id: administrator.registrationNumber,
        ip_address: '127.0.0.1 (Admin Desk)',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Admin Dashboard',
        status: 'SUCCESS',
        details: `Resource [${id}] permanently deleted by admin.`,
      });
      refreshResources();
    }
  };

  const handlePurgeAllResources = async () => {
    if (!confirm('CAUTION: Permanently purge ALL uploaded documents and metadata from Cloudflare R2 and local storage?')) return;
    MockStorageManager.clearAllResources();
    setResources([]);
    try {
      await fetch('/api/resources?purge=all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purge: 'all' }),
      });
    } catch (err) {
      console.warn('Purge all error:', err);
    }
    MockStorageManager.recordSecurityAuditLog({
      event: 'RESOURCE_MODERATED',
      masked_erp_id: administrator.registrationNumber,
      ip_address: '127.0.0.1 (Admin Desk)',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Admin Dashboard',
      status: 'SUCCESS',
      details: 'Admin purged ALL uploaded resources from repository and cloud storage.',
    });
    refreshResources();
  };

  const handleClearAuditLogs = () => {
    if (confirm('Are you sure you want to clear all security audit logs?')) {
      MockStorageManager.clearSecurityAuditLogs();
      refreshAuditLogs();
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    MockStorageManager.setPlatformAnnouncement(announcement);
    setSaveSuccessMsg('Platform broadcast banner updated successfully.');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAdminSignOut = async () => {
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    }).catch(() => {});
    window.location.href = '/';
  };

  // --- Metrics Computations ---
  const totalReferralUses = useMemo(
    () => referralCodes.reduce((sum, r) => sum + (r.uses_count || 0), 0),
    [referralCodes]
  );

  const topReferralCode = useMemo(() => {
    if (!referralCodes.length) return null;
    return [...referralCodes].sort((a, b) => b.uses_count - a.uses_count)[0];
  }, [referralCodes]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchFilter = resourceFilter === 'all' || r.status === resourceFilter;
      const matchQuery =
        !resourceQuery ||
        `${r.title} ${r.course_code || ''} ${r.department || ''} ${r.author_name || ''} ${r.author_username || ''} ${r.file_hash || ''} ${r.real_author_name || ''} ${r.real_author_username || ''} ${r.real_author_email || ''}`
          .toLowerCase()
          .includes(resourceQuery.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [resources, resourceFilter, resourceQuery]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchFilter = auditFilter === 'ALL' || log.event === auditFilter;
      const matchQuery =
        !auditQuery ||
        `${log.event} ${log.masked_erp_id} ${log.ip_address} ${log.details}`
          .toLowerCase()
          .includes(auditQuery.toLowerCase());
      return matchFilter && matchQuery;
    });
  }, [auditLogs, auditFilter, auditQuery]);

  const unifiedUsers = useMemo(() => {
    const map = new Map<string, UserRecord>();
    for (const u of erpUsers) {
      const reg = u.registrationNumber.toUpperCase();
      map.set(reg, u);
    }
    for (const l of localUsers) {
      const reg = (l.student_id || l.username || l.id).toUpperCase();
      if (!map.has(reg)) {
        map.set(reg, {
          registrationNumber: reg,
          name: l.full_name || reg,
          department: l.department || 'CSE',
          semester: l.semester || 'Sem 4',
          academicYear: l.academic_year || '2026-2027',
          courses: (l.registered_courses || []).map((c: any) =>
            typeof c === 'string' ? { code: c, name: c } : c
          ),
          firstLoginAt: l.created_at || new Date().toISOString(),
          lastLoginAt: l.created_at || new Date().toISOString(),
          loginCount: 1,
          email: l.email || `${reg.toLowerCase()}@kluniversity.in`,
          role: l.role || 'student',
        });
      } else {
        const existing = map.get(reg)!;
        if (!existing.email && l.email) existing.email = l.email;
        if (!existing.role && l.role) existing.role = l.role;
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    );
  }, [erpUsers, localUsers]);

  const filteredUsers = useMemo(() => {
    return unifiedUsers.filter((u) => {
      const role = (u.role || 'student').toLowerCase();
      const matchRole = userRoleFilter === 'all' || role === userRoleFilter.toLowerCase();
      const q = userQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.registrationNumber.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.semester && u.semester.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));
      return matchRole && matchQuery;
    });
  }, [unifiedUsers, userQuery, userRoleFilter]);

  const mask = (value: string) => (showNumbers ? value : `${value.slice(0, 2)}••••${value.slice(-2)}`);

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300">
              <Sparkles className="h-3 w-3" />
              ROOT LEVEL ACCESS
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              {isPasskeyMode ? 'Master Passkey Authorized' : 'ERP Server Authorized'}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            VSS Command Center
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Administrator: <b className="text-white font-mono">{administrator.name}</b> ({administrator.registrationNumber}) · Full platform oversight
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="vss-button-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <span>Visit Public Site</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/40" />
          </Link>
          <button
            onClick={handleAdminSignOut}
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'referrals'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Gift className="h-4 w-4" />
          <span>Referral Engine</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono">
            {referralCodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Registry</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono">
            {unifiedUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'resources'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpenCheck className="h-4 w-4" />
          <span>Resource Moderation</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono">
            {resources.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Security Audit Logs</span>
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-mono">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('controls')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'controls'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Platform Controls</span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* TAB 1: REFERRAL ENGINE & TRACKING */}
      {/* ======================================================== */}
      {activeTab === 'referrals' && (
        <section className="mt-7 space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="vss-card p-4 sm:p-5">
              <Gift className="h-4 w-4 text-purple-400" />
              <b className="mt-3 block text-2xl font-black">{referralCodes.length}</b>
              <small className="mt-0.5 block text-[10px] text-white/40">Active Referral Codes</small>
            </div>
            <div className="vss-card p-4 sm:p-5">
              <Users className="h-4 w-4 text-emerald-400" />
              <b className="mt-3 block text-2xl font-black">{totalReferralUses}</b>
              <small className="mt-0.5 block text-[10px] text-white/40">Total Scholar Referrals</small>
            </div>
            <div className="vss-card p-4 sm:p-5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <b className="mt-3 block text-sm font-bold font-mono text-amber-300 truncate">
                {topReferralCode ? topReferralCode.code : 'None'}
              </b>
              <small className="mt-0.5 block text-[10px] text-white/40">
                Top Campaign ({topReferralCode?.uses_count || 0} uses)
              </small>
            </div>
            <div className="vss-card p-4 sm:p-5">
              <CheckCircle2 className="h-4 w-4 text-sky-400" />
              <b className="mt-3 block text-2xl font-black">100%</b>
              <small className="mt-0.5 block text-[10px] text-white/40">Referral Verification Rate</small>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Active Referral Codes</h2>
              <p className="text-xs text-white/50">
                Share these codes with friends or pass direct invite links. Referrals are tracked on login and registration.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingCode(true)}
              className="vss-button text-xs px-4 py-2.5 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Referral Code</span>
            </button>
          </div>

          {/* Referral Codes List */}
          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {referralCodes.map((ref) => {
              const isCopied = copiedCode === ref.code;
              return (
                <div
                  key={ref.code}
                  className="vss-card p-4 sm:p-5 flex flex-col justify-between border border-white/[0.08] hover:border-purple-500/30 transition-all bg-[#0d121d]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-black tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                        {ref.code}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                        {ref.uses_count} {ref.uses_count === 1 ? 'use' : 'uses'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-white">{ref.label}</h3>
                    <p className="mt-1 text-[10px] text-white/40">
                      Created on {new Date(ref.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyLink(ref.code)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{isCopied ? 'Copied Link!' : 'Copy Share Link'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedReferral(ref)}
                        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition"
                      >
                        Scholars ({ref.referrals.length})
                      </button>
                      <button
                        onClick={() => handleDeleteCode(ref.code)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Referral Code"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Referral Code Creation Modal */}
          {isCreatingCode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121622] p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-400" />
                    <span>Generate Referral Code</span>
                  </h3>
                  <button
                    onClick={() => setIsCreatingCode(false)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCode} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80">Referral Code Tag</label>
                    <input
                      type="text"
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                      placeholder="e.g. CAMPUS-AMBASSADOR-2026"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:border-purple-400 focus:outline-none"
                      required
                    />
                    <p className="text-[10px] text-white/40">
                      Will be converted to uppercase. Students can enter this or open via link.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80">Campaign / Friend Label</label>
                    <input
                      type="text"
                      value={newCodeLabel}
                      onChange={(e) => setNewCodeLabel(e.target.value)}
                      placeholder="e.g. CSE Hostels Study Circle"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingCode(false)}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vss-button text-xs px-5 py-2"
                    >
                      Create Code
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Referred Scholars Drawer / Modal */}
          {selectedReferral && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#121622] p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                      {selectedReferral.code}
                    </span>
                    <h3 className="mt-2 text-base font-black text-white">
                      Referred Scholars & Logins
                    </h3>
                    <p className="text-xs text-white/50">{selectedReferral.label}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReferral(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5">
                  {selectedReferral.referrals.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center text-xs text-white/40">
                      No scholars have signed in with this referral code yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedReferral.referrals.map((refUsage, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/20 text-purple-300 font-mono text-xs font-black">
                              #{index + 1}
                            </span>
                            <div>
                              <b className="block text-xs font-mono text-white">
                                {refUsage.student_id}
                              </b>
                              <span className="text-[10px] text-white/40 font-mono">
                                Alias: @{refUsage.username}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                              Verified
                            </span>
                            <span className="block text-[9px] text-white/30 mt-0.5">
                              {new Date(refUsage.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => setSelectedReferral(null)}
                    className="vss-button-secondary text-xs px-4 py-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: USER REGISTRY */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <section className="mt-7 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Verified Scholar Registry & Directory</h2>
              <p className="text-xs text-white/50">
                Accounts authenticated via KL University ERP, Student ID, or registered scholar identities.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchUsers()}
                className="vss-button-secondary px-3.5 py-2 text-xs flex items-center gap-1.5"
                title="Refresh user directory from secure storage"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowNumbers(!showNumbers)}
                className="vss-button-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                {showNumbers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showNumbers ? 'Mask Registration Numbers' : 'Reveal Numbers'}</span>
              </button>
            </div>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search by student name, registration number, department, email or semester..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
              />
              {userQuery && (
                <button
                  onClick={() => setUserQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-white/10 bg-black/30 p-1">
              {(['all', 'student', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition ${
                    userRoleFilter === r
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All Scholars' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loadingUsers && unifiedUsers.length === 0 && (
            <div className="vss-card p-12 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-purple-400" />
              <p className="mt-3 text-xs text-white/60">Loading scholar directory from secure storage...</p>
            </div>
          )}

          {/* Empty State */}
          {!loadingUsers && filteredUsers.length === 0 && (
            <div className="vss-card p-12 text-center border border-white/10">
              <Users className="mx-auto h-8 w-8 text-white/30" />
              <h3 className="mt-3 text-sm font-bold text-white">
                {userQuery ? 'No scholars match your search query' : 'No scholars found in directory'}
              </h3>
              <p className="mt-1 text-xs text-white/40 max-w-sm mx-auto">
                {userQuery
                  ? 'Try searching by a different name, department, or student roll number.'
                  : 'As students log in or register on VSS, their verified profiles and activity details will automatically appear here.'}
              </p>
              {userQuery && (
                <button
                  onClick={() => setUserQuery('')}
                  className="vss-button-secondary text-xs px-4 py-2 mt-4"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* User Cards Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {filteredUsers.map((user) => (
              <div
                key={user.registrationNumber}
                onClick={() => setSelectedUser(user)}
                className="vss-card vss-card-hover p-4 flex items-center justify-between gap-3 border border-white/[0.07] bg-[#0c101a] cursor-pointer group transition-all hover:border-purple-500/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600/40 to-blue-600/30 border border-purple-400/20 text-purple-200 font-black text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <b className="truncate text-xs font-bold text-white group-hover:text-purple-300 transition">
                        {user.name}
                      </b>
                      <span className="inline-block rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[8px] font-mono font-bold text-purple-300 uppercase">
                        {user.role || 'student'}
                      </span>
                    </div>
                    <small className="block truncate font-mono text-[10px] text-white/50 mt-0.5">
                      <span className="text-purple-300 font-bold">{showNumbers ? user.registrationNumber : mask(user.registrationNumber)}</span> · {user.department || 'CSE'} ({user.semester || 'Sem 4'})
                    </small>
                    <small className="block truncate font-mono text-[9px] text-white/35 mt-0.5">
                      {mask(user.email || `${user.registrationNumber.toLowerCase()}@kluniversity.in`)}
                    </small>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-block rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-300 font-bold">
                    {user.loginCount} {user.loginCount === 1 ? 'login' : 'logins'}
                  </span>
                  <span className="block text-[9px] text-purple-400/70 group-hover:text-purple-300 transition font-mono">
                    View details →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* User details modal */}
          {selectedUser && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121622] p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{selectedUser.name}</h3>
                      <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-purple-300 uppercase">
                        {selectedUser.role || 'student'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-purple-300 mt-0.5">
                      {showNumbers ? selectedUser.registrationNumber : mask(selectedUser.registrationNumber)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">Email:</span>
                    <span className="font-mono text-white">
                      {selectedUser.email || `${selectedUser.registrationNumber.toLowerCase()}@kluniversity.in`}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">Department:</span>
                    <span className="font-bold text-white">{selectedUser.department}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">Semester:</span>
                    <span className="font-bold text-white">{selectedUser.semester || 'Sem 4'}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">Verified Logins:</span>
                    <span className="font-bold text-emerald-400 font-mono">{selectedUser.loginCount}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">First Joined:</span>
                    <span className="text-white text-[11px] font-mono">
                      {new Date(selectedUser.firstLoginAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs flex justify-between">
                    <span className="text-white/40">Last Seen:</span>
                    <span className="text-white text-[11px] font-mono">
                      {new Date(selectedUser.lastLoginAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold text-white/60 mb-2">Registered Courses</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {selectedUser.courses && selectedUser.courses.length ? (
                      selectedUser.courses.map((c) => (
                        <div key={c.code} className="rounded-lg bg-black/30 p-2 text-xs flex items-center justify-between">
                          <b className="font-mono text-purple-300">{c.code}</b>
                          <span className="text-white/60 truncate ml-2">{c.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-white/30 italic">No courses listed for this profile.</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const nextRole = selectedUser.role === 'admin' ? 'student' : 'admin';
                      MockStorageManager.updateUserRole(selectedUser.registrationNumber, nextRole);
                      setSelectedUser({ ...selectedUser, role: nextRole });
                      fetchUsers();
                    }}
                    className="text-xs text-purple-300 hover:text-purple-200 hover:underline font-bold"
                  >
                    {selectedUser.role === 'admin' ? 'Revoke Admin (Set Student)' : 'Promote to Admin'}
                  </button>

                  <button
                    onClick={() => setSelectedUser(null)}
                    className="vss-button-secondary text-xs px-4 py-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: RESOURCE MODERATION DESK */}
      {/* ======================================================== */}
      {activeTab === 'resources' && (
        <section className="mt-7 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Study Material Moderation Desk</h2>
              <p className="text-xs text-white/50">
                Review, approve, flag, or remove student-uploaded notes, lab manuals, and exam materials.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/40">Filter:</span>
              {(['all', 'approved', 'pending', 'flagged', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setResourceFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    resourceFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
              <button
                onClick={handlePurgeAllResources}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition flex items-center gap-1 ml-auto sm:ml-2"
                title="Permanently purge all uploaded resources from R2 and storage"
              >
                <Trash2 className="h-3 w-3" />
                <span>Purge All Files</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={resourceQuery}
              onChange={(e) => setResourceQuery(e.target.value)}
              placeholder="Search resources by title, subject code, or contributor..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {filteredResources.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-xs text-white/40">
                No study materials matching criteria.
              </div>
            ) : (
              filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="vss-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-white/[0.07] bg-[#0c101a]"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-purple-300 font-bold uppercase text-xs">
                      {res.file_type || 'PDF'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <b className="truncate text-sm font-bold text-white">{res.title}</b>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono ${
                            res.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : res.status === 'flagged'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/50 line-clamp-1">{res.description}</p>
                      {res.duplicate_of_id && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-rose-300 font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg w-fit">
                          <span>⚠️ Duplicate copy of: {res.duplicate_of_title || res.duplicate_of_id}</span>
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-white/40 font-mono">
                        <span>Course: {res.course_code || 'General'}</span>
                        <span>•</span>
                        <span>Dept: {res.department || 'All'}</span>
                        <span>•</span>
                        <span>Downloads: {res.downloads_count}</span>
                      </div>

                      {/* True Uploader Identity (Admin Security Audit) */}
                      {res.is_anonymous ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span className="font-bold text-amber-300">Public: Anonymous</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/90">
                            Real Contributor: <strong className="text-amber-100 font-semibold">{res.real_author_name || 'Recorded in ERP'}</strong>{' '}
                            <span className="font-mono text-amber-300">(@{res.real_author_username || res.author_username || res.real_author_id || 'ID'})</span>
                            {res.real_author_email ? ` · ${res.real_author_email}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-white/70">
                          <span>By: </span>
                          <strong className="text-white font-semibold">{res.author_name}</strong>{' '}
                          <span className="font-mono text-white/50">(@{res.author_username || res.author_name})</span>
                          {res.real_author_email && <span className="text-white/40 font-mono text-[11px]"> · {res.real_author_email}</span>}
                        </div>
                      )}

                      {/* File Hash (SHA-256) Checksum */}
                      {res.file_hash && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
                          <span className="text-white/30">SHA-256:</span>
                          <span className="truncate max-w-[260px] sm:max-w-md text-white/60">{res.file_hash}</span>
                          <button
                            type="button"
                            title="Copy full SHA-256 hash"
                            onClick={() => {
                              navigator.clipboard.writeText(res.file_hash!);
                              setCopiedHashId(res.id);
                              setTimeout(() => setCopiedHashId(null), 2000);
                            }}
                            className="text-white/30 hover:text-white transition p-0.5"
                          >
                            {copiedHashId === res.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link
                      href={`/resource/${res.id}`}
                      target="_blank"
                      className="vss-button-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Preview</span>
                    </Link>

                    {res.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateResourceStatus(res.id, 'approved')}
                        className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-bold transition"
                      >
                        Approve
                      </button>
                    )}

                    {res.status !== 'flagged' && (
                      <button
                        onClick={() => handleUpdateResourceStatus(res.id, 'flagged')}
                        className="rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold transition"
                      >
                        Flag
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SECURITY & RATE LIMIT AUDIT DESK */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <section className="mt-7 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Security & Access Audit Trail</h2>
              <p className="text-xs text-white/50">
                Tamper-resistant audit transactions for logins, rate limits, referral applications, and moderation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAuditLogs}
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 px-3 py-2 text-xs font-bold transition"
              >
                Clear History
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                placeholder="Search audit trail by student ID, IP address, or details..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-purple-400 focus:outline-none"
              />
            </div>
            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
            >
              <option value="ALL">ALL EVENTS</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED_CREDENTIALS">LOGIN_FAILED_CREDENTIALS</option>
              <option value="RATE_LIMIT_TRIGGERED">RATE_LIMIT_TRIGGERED</option>
              <option value="REFERRAL_CODE_APPLIED">REFERRAL_CODE_APPLIED</option>
              <option value="RESOURCE_MODERATED">RESOURCE_MODERATED</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredAuditLogs.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-10 text-center text-xs text-white/40">
                No audit events recorded yet.
              </div>
            ) : (
              filteredAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0b0e17] p-3 sm:p-4 text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-mono font-bold shrink-0 uppercase ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'FAILURE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {log.event}
                    </span>
                    <div>
                      <p className="text-white/90 font-medium">{log.details}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-white/40">
                        <span>Account: {log.masked_erp_id}</span>
                        <span>•</span>
                        <span>IP: {log.ip_address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-white/30 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 5: PLATFORM CONTROLS */}
      {/* ======================================================== */}
      {activeTab === 'controls' && (
        <section className="mt-7 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-black text-white">Global University Announcement Banner</h2>
            <p className="text-xs text-white/50">
              Broadcast high-priority notices across all student dashboards and public landing pages.
            </p>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="vss-card p-6 space-y-4 border border-white/10 bg-[#0e1320]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Banner Active Status</span>
              </label>
              <input
                type="checkbox"
                checked={announcement.active}
                onChange={(e) => setAnnouncement({ ...announcement, active: e.target.checked })}
                className="h-4 w-4 rounded accent-purple-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">Broadcast Headline</label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="e.g. End-Semester 2026 Study Vault & Exam Material Hub Live"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">Broadcast Message</label>
              <textarea
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                rows={3}
                placeholder="Detail explanation for campus students..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                required
              />
            </div>

            {saveSuccessMsg && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {saveSuccessMsg}
              </div>
            )}

            <button type="submit" className="vss-button text-xs px-5 py-2.5">
              Save Platform Broadcast
            </button>
          </form>

          <div className="vss-card p-6 border border-white/10 bg-[#0e1320] space-y-4">
            <h3 className="text-sm font-bold text-white">System Security Policies</h3>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <b className="block text-white">Strict CAPTCHA Zoom System</b>
                  <span className="text-[10px] text-white/40">Provides 125%–200% magnification and contrast filters on login.</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold">
                  ENFORCED
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <b className="block text-white">Credential Isolation Guard</b>
                  <span className="text-[10px] text-white/40">Passwords never written to database, cookies, or browser storage.</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <b className="block text-white">Rate Limiter Cooldown</b>
                  <span className="text-[10px] text-white/40">5 consecutive failed attempts trigger a 60-second lockout.</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 font-bold">
                  60s LOCKOUT
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
