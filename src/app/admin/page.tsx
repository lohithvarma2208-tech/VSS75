'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  Trash2,
  Eye,
  Lock,
} from 'lucide-react';
import { Resource, ResourceReport } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';
import { useApp } from '@/lib/context/AppContext';
import { formatDate } from '@/lib/utils';

export default function AdminModerationPage() {
  const { currentUser, switchDemoUser, showToast } = useApp();
  const [reports, setReports] = useState<ResourceReport[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'resources'>('reports');

  const refreshData = () => {
    setReports(MockStorageManager.getReports());
    setResources(MockStorageManager.getResources());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('klu_reports_change', refreshData);
    window.addEventListener('klu_resources_change', refreshData);
    return () => {
      window.removeEventListener('klu_reports_change', refreshData);
      window.removeEventListener('klu_resources_change', refreshData);
    };
  }, []);

  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const handleResolveReport = (reportId: string, status: 'resolved' | 'dismissed', notes?: string) => {
    MockStorageManager.resolveReport(reportId, status, notes || 'Audited by campus moderator');
    showToast(`Report marked as ${status}`, 'success');
  };

  const handleRemoveResource = (resourceId: string, reportId?: string) => {
    if (confirm('Are you sure you want to permanently remove this academic resource?')) {
      MockStorageManager.deleteResource(resourceId);
      if (reportId) {
        MockStorageManager.resolveReport(reportId, 'resolved', 'Resource deleted due to policy violation');
      }
      showToast('Resource removed from campus platform', 'info');
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status !== 'pending');

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4 text-white">
        <div className="h-16 w-16 rounded-3xl bg-amber-500/20 text-[#f59e0b] mx-auto flex items-center justify-center border border-amber-500/30">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Protected Moderation Area</h1>
        <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
          Access to student report auditing, content removal, and category management is restricted to authorized VSS moderators and faculty administrators.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => switchDemoUser('moderator')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30 transition"
          >
            Switch to Moderator (Ananya)
          </button>
          <button
            onClick={() => switchDemoUser('admin')}
            className="px-6 py-3 rounded-full bg-[#131B2E] border border-white/15 text-white text-xs font-bold hover:bg-[#1A243B] transition"
          >
            Switch to Admin Lead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-12 lg:px-16 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#f59e0b]" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Campus Moderation & Audit Desk
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/70 mt-1 font-normal">
            Logged in as <strong className="text-[#D8B4FE] font-mono">@{currentUser.username} ({currentUser.role.toUpperCase()})</strong> • Enforcing campus academic integrity policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => switchDemoUser('student')}
            className="px-4 py-2 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10"
          >
            Switch to Student
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 hover:bg-[#1A243B] p-6 shadow-card transition">
          <p className="text-xs font-bold text-white/60">Pending Flags</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">{pendingReports.length}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Requires review</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 hover:bg-[#1A243B] p-6 shadow-card transition">
          <p className="text-xs font-bold text-white/60">Total Audited</p>
          <p className="text-3xl font-extrabold text-white mt-1">{resolvedReports.length}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Reports concluded</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 hover:bg-[#1A243B] p-6 shadow-card transition">
          <p className="text-xs font-bold text-white/60">Live Resources</p>
          <p className="text-3xl font-extrabold text-white mt-1">{resources.length}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Published files</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#131B2E]/70 hover:bg-[#1A243B] p-6 shadow-card transition">
          <p className="text-xs font-bold text-white/60">Honor Code Status</p>
          <p className="text-3xl font-extrabold text-[#38BDF8] mt-1">Compliant</p>
          <p className="text-[11px] text-white/40 mt-0.5">Zero critical leaks</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 space-x-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-purple-400 text-[#D8B4FE]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Reported Resources ({pendingReports.length} pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'resources'
              ? 'border-purple-400 text-[#D8B4FE]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>All Uploaded Resources ({resources.length})</span>
        </button>
      </div>

      {/* Reports Queue */}
      {activeTab === 'reports' ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="p-16 text-center rounded-[2.5rem] border border-dashed border-white/15 bg-white/5">
              <CheckCircle className="h-10 w-10 text-[#38BDF8] mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Moderation Queue Clear</p>
              <p className="text-xs text-white/40 mt-1">No pending student reports.</p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className={`p-6 rounded-[2rem] border bg-[#131B2E]/80 shadow-card transition space-y-3.5 ${
                  rep.status === 'pending'
                    ? 'border-amber-400/30'
                    : 'border-white/10 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Reason: {rep.reason.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        rep.status === 'pending'
                          ? 'bg-amber-500/20 text-[#f59e0b] border border-amber-500/30'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      Status: {rep.status}
                    </span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">{formatDate(rep.created_at)}</span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">
                    {rep.resource_title}
                  </h3>
                  <p className="text-xs text-white/80 mt-2 bg-[#0B0F19] p-3 rounded-2xl border border-white/10 leading-relaxed">
                    <strong>Report Details:</strong> {rep.description}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1.5 font-mono">
                    Reported by: @{rep.reporter_username}
                  </p>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                    <Link
                      href={`/resource/${rep.resource_id}`}
                      className="px-4 py-2 rounded-full border border-white/20 text-xs font-bold text-white hover:bg-white/10 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect Resource</span>
                    </Link>

                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved', 'Audit complete; resource adheres to guidelines')}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:from-[#7C3AED] hover:to-[#2563EB] text-white text-xs font-extrabold shadow-sm transition"
                    >
                      Approve & Dismiss Flag
                    </button>

                    <button
                      onClick={() => handleRemoveResource(rep.resource_id, rep.id)}
                      className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Resource</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-white/10 bg-[#131B2E]/70 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#0B0F19] border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Downloads</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-bold text-white max-w-xs truncate">
                      {res.title}
                    </td>
                    <td className="p-4 font-mono text-[#38BDF8]">{res.course_code}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-[#D8B4FE] border border-purple-500/25">
                        {res.category}
                      </span>
                    </td>
                    <td className="p-4 text-white/60">{res.author_name}</td>
                    <td className="p-4 font-mono">{res.downloads_count}</td>
                    <td className="p-4 text-right space-x-3">
                      <Link
                        href={`/resource/${res.id}`}
                        className="text-[#D8B4FE] hover:underline font-bold"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRemoveResource(res.id)}
                        className="text-rose-400 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
