'use client';

import {
  Resource,
  ProjectItem,
  UserProfile,
  ResourceComment,
  ResourceReport,
  NotificationItem,
  ResourceRequest,
  RequestOffer,
  RequestResponse,
  SavedRequest,
  RequestReport,
  RequestStatus,
  OfferStatus,
  SecurityAuditLog,
  ReferralCode,
  ReferralUsage,
} from '@/types';
import { SAMPLE_RESOURCES } from '@/lib/data/sample-data';

const STORAGE_KEYS = {
  RESOURCES: 'vss_resources_v4',
  PROJECTS: 'vss_projects_v4',
  COMMENTS: 'vss_comments_v4',
  REPORTS: 'vss_reports_v4',
  BOOKMARKS: 'vss_bookmarks_v4',
  LIKED_RESOURCES: 'vss_liked_v4',
  CURRENT_USER: 'vss_current_user_v4',
  NOTIFICATIONS: 'vss_notifications_v4',
  OTP_PENDING: 'vss_otp_pending_v4',
  REQUESTS: 'vss_requests_v4',
  OFFERS: 'vss_offers_v4',
  RESPONSES: 'vss_responses_v4',
  SAVED_REQUESTS: 'vss_saved_requests_v4',
  REQUEST_REPORTS: 'vss_request_reports_v4',
  SECURITY_AUDIT_LOGS: 'vss_security_audit_logs_v4',
  RATE_LIMIT: 'vss_rate_limits_v4',
  REFERRAL_CODES: 'vss_referral_codes_v4',
  REGISTERED_USERS: 'vss_registered_users_v4',
  ANNOUNCEMENT: 'vss_platform_announcement_v4',
  DELETED_RESOURCES: 'vss_deleted_resources_v4',
};

// Initial Resource Requests, Offers, Comments, Reports, Notifications
const INITIAL_REQUESTS: ResourceRequest[] = [];
const INITIAL_OFFERS: RequestOffer[] = [];
const INITIAL_RESPONSES: RequestResponse[] = [];
const INITIAL_COMMENTS: ResourceComment[] = [];
const INITIAL_REPORTS: ResourceReport[] = [];
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export class MockStorageManager {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  static removeLegacyDemoData(): void {
    if (!this.isBrowser()) return;

    // Purge any legacy keys (v1, v2, v3, demo, or unversioned) from localStorage
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => Boolean(key && key.startsWith('vss_') && !key.endsWith('_v4')))
      .forEach((key) => localStorage.removeItem(key));

    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('vss_files_db_v1');
      } catch {}
    }
  }

  // --- Current User ---
  static getCurrentUser(): UserProfile | null {
    if (!this.isBrowser()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        const parsed: UserProfile = JSON.parse(data);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed reading currentUser from storage', e);
    }
    return null;
  }

  static setCurrentUser(user: UserProfile): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    window.dispatchEvent(new Event('klu_auth_change'));
  }

  static logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new Event('klu_auth_change'));
  }

  // --- Resources ---
  static getResources(): Resource[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.RESOURCES, '[]');
      return [];
    } catch (e) {
      console.warn('Failed reading resources from storage', e);
      return [];
    }
  }

  static saveResources(resources: Resource[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    } catch {
      // If localStorage quota is exceeded due to binary Data URLs, strip Data URLs from localStorage
      // (The authentic binary remains safely preserved in IndexedDB / Memory Cache)
      try {
        const lightweight = resources.map((r) => ({
          ...r,
          file_data_url: undefined,
          file_url: r.file_url?.startsWith('data:') ? `/samples/${r.file_name}` : r.file_url,
        }));
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(lightweight));
      } catch (e) {
        console.warn('Storage quota limit reached', e);
      }
    }
    window.dispatchEvent(new Event('klu_resources_change'));
  }

  static getDeletedResourceIds(): Set<string> {
    if (!this.isBrowser()) return new Set();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_RESOURCES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (e) {
      console.warn('Failed reading deleted resource IDs', e);
    }
    return new Set();
  }

  static recordDeletedResourceId(id: string): void {
    if (!this.isBrowser() || !id) return;
    try {
      const set = this.getDeletedResourceIds();
      set.add(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_RESOURCES, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn('Failed recording deleted resource ID', e);
    }
  }

  static clearAllResources(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.RESOURCES, '[]');
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        window.indexedDB.deleteDatabase('vss_files_db_v1');
      } catch {}
    }
    window.dispatchEvent(new Event('klu_resources_change'));
  }

  static mergeSharedResources(shared: Resource[]): void {
    if (!this.isBrowser() || !Array.isArray(shared)) return;
    // Server is the authoritative single source of truth for all cloud shared resources.
    // If the server returns active resources, clear any stale local deletion tombstones for them.
    const deleted = this.getDeletedResourceIds();
    if (deleted.size > 0) {
      let changed = false;
      shared.forEach((r) => {
        if (deleted.has(r.id)) {
          deleted.delete(r.id);
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEYS.DELETED_RESOURCES, JSON.stringify(Array.from(deleted)));
        } catch {}
      }
    }

    const local = this.getResources();
    const localById = new Map(local.map((resource) => [resource.id, resource]));
    const sharedIds = new Set(shared.map((resource) => resource.id));
    const mergedShared = shared.map((resource) => {
      const existing = localById.get(resource.id);
      return existing ? {
        ...resource,
        likes_count: Math.max(resource.likes_count, existing.likes_count),
        downloads_count: Math.max(resource.downloads_count, existing.downloads_count),
        views_count: Math.max(resource.views_count, existing.views_count),
      } : resource;
    });
    // Server is the authoritative single source of truth for all cloud shared resources.
    // If a cloud resource (res-user-) was deleted on the server, drop it locally too! Never resurrect it.
    const deviceOnly = local.filter((resource) => !sharedIds.has(resource.id) && !resource.id.startsWith('res-user-'));
    this.saveResources([...mergedShared, ...deviceOnly]);
  }

  static findResourceByHash(hash?: string): Resource | undefined {
    if (!hash) return undefined;
    const target = hash.trim().toLowerCase();
    return this.getResources().find((r) => r.file_hash?.toLowerCase() === target && r.status === 'approved');
  }

  static checkDuplicateResource(data: {
    title: string;
    course_code: string;
    category?: string;
    file_name?: string;
    file_size?: number;
    file_content_preview?: string;
    file_hash?: string;
  }): { isDuplicate: boolean; pioneer?: Resource; matchType?: 'hash' | 'file' | 'title' | 'content' } {
    const resources = this.getResources().filter((r) => r.status === 'approved');
    const norm = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const targetTitle = norm(data.title || '');
    const targetCode = (data.course_code || '').trim().toUpperCase();
    const targetHash = data.file_hash?.trim().toLowerCase();

    for (const r of resources) {
      // 0. Cryptographic SHA-256 hash match (100% byte-for-byte identical document)
      if (
        targetHash &&
        r.file_hash &&
        targetHash === r.file_hash.trim().toLowerCase()
      ) {
        return { isDuplicate: true, pioneer: r, matchType: 'hash' };
      }

      // 1. Exact identical file match (same file name and same byte size)
      if (
        data.file_name &&
        r.file_name &&
        r.file_name.toLowerCase() === data.file_name.toLowerCase() &&
        data.file_size &&
        r.file_size &&
        data.file_size === r.file_size
      ) {
        return { isDuplicate: true, pioneer: r, matchType: 'file' };
      }

      // 2. Exact identical title match in the same course code
      // (Requires 100% exact normalized title match, so distinct assignments/units are never blocked)
      if ((r.course_code || '').toUpperCase() === targetCode && targetTitle.length >= 6) {
        const existingTitle = norm(r.title);
        if (targetTitle === existingTitle) {
          return { isDuplicate: true, pioneer: r, matchType: 'title' };
        }
      }

      // 3. Exact file content preview match
      if (
        data.file_content_preview &&
        data.file_content_preview.length > 50 &&
        r.file_content_preview &&
        r.file_content_preview.length > 50 &&
        data.file_content_preview.trim() === r.file_content_preview.trim()
      ) {
        return { isDuplicate: true, pioneer: r, matchType: 'content' };
      }
    }

    return { isDuplicate: false };
  }

  static getWeeklyUploadCount(userId?: string, authorName?: string, username?: string): number {
    const resources = this.getResources();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return resources.filter((r) => {
      if (r.status !== 'approved' || r.is_anonymous) return false;
      const createdTime = new Date(r.created_at).getTime();
      if (isNaN(createdTime) || createdTime < oneWeekAgo) return false;

      return (
        (userId && r.author_id === userId) ||
        (authorName && r.author_name === authorName) ||
        (username && r.author_username === username)
      );
    }).length;
  }

  static isPdfStudioUnlocked(userId?: string, authorName?: string, username?: string): {
    isUnlocked: boolean;
    weeklyCount: number;
    required: number;
    remaining: number;
    progressPercent: number;
  } {
    const REQUIRED = 5;
    const weeklyCount = this.getWeeklyUploadCount(userId, authorName, username);
    const isUnlocked = weeklyCount >= REQUIRED;
    const remaining = Math.max(0, REQUIRED - weeklyCount);
    const progressPercent = Math.min(100, Math.round((weeklyCount / REQUIRED) * 100));

    return {
      isUnlocked,
      weeklyCount,
      required: REQUIRED,
      remaining,
      progressPercent,
    };
  }

  static addResource(newResource: Omit<Resource, 'id' | 'likes_count' | 'downloads_count' | 'views_count' | 'created_at' | 'updated_at'>): Resource {
    const resources = this.getResources();

    // DUPLICATE WORK DETECTION:
    // If work already exists, accept the first pioneer and REJECT the duplicate!
    const dupCheck = this.checkDuplicateResource({
      title: newResource.title,
      course_code: newResource.course_code,
      category: newResource.category,
      file_name: newResource.file_name,
      file_size: newResource.file_size,
      file_content_preview: newResource.file_content_preview,
      file_hash: newResource.file_hash,
    });

    if (dupCheck.isDuplicate && dupCheck.pioneer) {
      const pioneer = dupCheck.pioneer;
      const rejectedResource: Resource = {
        ...newResource,
        id: `res-rejected-${Date.now()}`,
        likes_count: 0,
        downloads_count: 0,
        views_count: 0,
        status: 'rejected',
        is_pioneer: false,
        rejection_reason: `Duplicate detected: This work was already submitted by ${pioneer.author_name} for ${pioneer.course_code} on ${new Date(pioneer.created_at).toLocaleDateString()}. VSS accepts only the original first submission.`,
        duplicate_of_id: pioneer.id,
        duplicate_of_title: pioneer.title,
        duplicate_of_author: pioneer.author_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (newResource.author_id) {
        this.addNotification({
          id: `notif-dup-reject-${Date.now()}`,
          user_id: newResource.author_id,
          actor_name: 'VSS Integrity Engine',
          type: 'system',
          title: '🛡️ Duplicate Eliminated: Pioneer Work Exists',
          message: `The duplicate submission "${newResource.title}" was eliminated because an identical copy was already published by ${pioneer.author_name}. All your other distinct uploads (including your 2nd, 3rd, 4th, 5th works) are fully accepted!`,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }

      // DUPLICATE IS COMPLETELY ELIMINATED: Not persisted into the resources collection
      return rejectedResource;
    }

    // ORIGINAL PIONEER SUBMISSION: ACCEPTED & APPROVED
    const created: Resource = {
      ...newResource,
      id: `res-user-${Date.now()}`,
      likes_count: 0,
      downloads_count: 0,
      views_count: 1,
      status: 'approved',
      is_pioneer: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [created, ...resources];
    this.saveResources(updated);

    if (newResource.author_id) {
      const weeklyCount = this.getWeeklyUploadCount(newResource.author_id);
      this.addNotification({
        id: `notif-upload-success-${Date.now()}`,
        user_id: newResource.author_id,
        actor_name: 'VSS Academic Network',
        type: 'system',
        title: '🎉 Pioneer Work Accepted!',
        message: `Your upload "${newResource.title}" is verified as original. Weekly upload count: ${weeklyCount}/5 towards unlocking PDF Studio.`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return created;
  }

  static getResourceById(id: string): Resource | undefined {
    const list = this.getResources();
    const exact = list.find((r) => r.id === id);
    if (exact) return exact;

    // Check directly in SAMPLE_RESOURCES if not in current list
    // sample lookup removed
    const sampleExact = undefined;
    if (sampleExact) return sampleExact;

    // Support numeric indices like /resource/1 or /resource/2
    const num = parseInt(id, 10);
    if (!isNaN(num) && num >= 1 && num <= list.length) {
      return list[num - 1];
    }

    // Support slug match or filename match
    const lower = id.toLowerCase();
    const matched = list.find((r) => r.file_name.toLowerCase().includes(lower) || r.title.toLowerCase().includes(lower));
    if (matched) return matched;

    return undefined;
  }

  static deleteResource(id: string): boolean {
    this.recordDeletedResourceId(id);
    const resources = this.getResources();
    const filtered = resources.filter((r) => r.id !== id);
    this.saveResources(filtered);
    return true;
  }

  static updateResourceStatus(id: string, status: 'approved' | 'pending' | 'flagged' | 'archived' | 'rejected'): void {
    const resources = this.getResources();
    const updated = resources.map((r) => (r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r));
    this.saveResources(updated);
  }

  static incrementDownload(id: string): void {
    const resources = this.getResources();
    const updated = resources.map((r) => (r.id === id ? { ...r, downloads_count: r.downloads_count + 1 } : r));
    this.saveResources(updated);
  }

  // --- Likes ---
  static getLikedResourceIds(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIKED_RESOURCES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading likes', e);
    }
    return [];
  }

  static toggleLike(resourceId: string): boolean {
    if (!this.isBrowser()) return false;
    const liked = this.getLikedResourceIds();
    const hasLiked = liked.includes(resourceId);
    let newLiked: string[];

    if (hasLiked) {
      newLiked = liked.filter((id) => id !== resourceId);
    } else {
      newLiked = [...liked, resourceId];
    }
    localStorage.setItem(STORAGE_KEYS.LIKED_RESOURCES, JSON.stringify(newLiked));

    const resources = this.getResources();
    const updated = resources.map((r) => {
      if (r.id === resourceId) {
        return {
          ...r,
          likes_count: hasLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1,
        };
      }
      return r;
    });
    this.saveResources(updated);
    window.dispatchEvent(new Event('klu_likes_change'));
    return !hasLiked;
  }

  // --- Bookmarks / Saved Resources ---
  static getSavedResourceIds(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading bookmarks', e);
    }
    return [];
  }

  static toggleBookmark(resourceId: string): boolean {
    if (!this.isBrowser()) return false;
    const saved = this.getSavedResourceIds();
    const isSaved = saved.includes(resourceId);
    let newSaved: string[];

    if (isSaved) {
      newSaved = saved.filter((id) => id !== resourceId);
    } else {
      newSaved = [...saved, resourceId];
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newSaved));
    window.dispatchEvent(new Event('klu_bookmarks_change'));
    return !isSaved;
  }

  // --- Projects ---
  static getProjects(): ProjectItem[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, '[]');
      return [];
    } catch (e) {
      console.warn('Failed reading projects', e);
      return [];
    }
  }

  static saveProjects(projects: ProjectItem[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    window.dispatchEvent(new Event('klu_projects_change'));
  }

  static addProject(newProject: Omit<ProjectItem, 'id' | 'likes_count' | 'created_at'>): ProjectItem {
    const projects = this.getProjects();
    const created: ProjectItem = {
      ...newProject,
      id: `proj-user-${Date.now()}`,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...projects];
    this.saveProjects(updated);
    return created;
  }

  // --- Comments ---
  static getComments(resourceId?: string): ResourceComment[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const comments: ResourceComment[] = data ? JSON.parse(data) : [];
      if (resourceId) {
        return comments.filter((c) => c.resource_id === resourceId);
      }
      return comments;
    } catch (e) {
      console.warn('Failed reading comments', e);
    }
    return [];
  }

  static addComment(resourceId: string, content: string, user: UserProfile): ResourceComment {
    const comments = this.getComments();
    const created: ResourceComment = {
      id: `comm-${Date.now()}`,
      resource_id: resourceId,
      user_id: user.id,
      user_name: user.code_name || user.username || 'Anonymous',
      user_username: user.username,
      user_avatar: user.avatar_url,
      content,
      created_at: new Date().toISOString(),
    };
    const updated = [...comments, created];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_comments_change'));
    }
    return created;
  }

  static deleteComment(commentId: string): void {
    const comments = this.getComments();
    const updated = comments.filter((c) => c.id !== commentId);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_comments_change'));
    }
  }

  // --- Reports (Admin / Moderation) ---
  static getReports(): ResourceReport[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading reports', e);
    }
    return [];
  }

  static addReport(report: Omit<ResourceReport, 'id' | 'status' | 'created_at'>): ResourceReport {
    const reports = this.getReports();
    const created: ResourceReport = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...reports];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_reports_change'));
    }
    return created;
  }

  static resolveReport(reportId: string, status: 'resolved' | 'dismissed', notes?: string): void {
    const reports = this.getReports();
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status, resolution_notes: notes } : r
    );
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_reports_change'));
    }
  }

  // --- Notifications ---
  static getNotifications(): NotificationItem[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading notifications', e);
    }
    return [];
  }

  static markNotificationRead(notifId: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (n.id === notifId ? { ...n, is_read: true } : n));
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_notifs_change'));
    }
  }

  static markAllNotificationsRead(): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, is_read: true }));
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_notifs_change'));
    }
  }

  static addNotification(notif: NotificationItem): void {
    const notifs = this.getNotifications();
    const updated = [notif, ...notifs];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_notifs_change'));
    }
  }

  // --- Campus Institutional Email & OTP Verification ---
  static sendVerificationOtp(email: string): { success: boolean; otp?: string; message: string; expiry?: number } {
    const cleanEmail = email.trim().toLowerCase();
    const allowedDomains = ['kluniversity.in', 'klu.ac.in', 'klef.in', 'klef.edu.in'];
    const domain = cleanEmail.split('@')[1];

    if (!domain || !allowedDomains.includes(domain)) {
      return {
        success: false,
        message: 'Please enter a valid official KL University email ending in @kluniversity.in or @klu.ac.in',
      };
    }

    // Extract institutional identifier handle
    const usernamePart = cleanEmail.split('@')[0];
    const matchDigits = usernamePart.match(/\d{7,12}/);
    const studentId = matchDigits ? matchDigits[0] : usernamePart;

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (this.isBrowser()) {
      localStorage.setItem(
        STORAGE_KEYS.OTP_PENDING,
        JSON.stringify({ email: cleanEmail, otp, expiry, studentId })
      );
    }

    return {
      success: true,
      otp,
      expiry,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
    };
  }

  static getPendingOtpData(): { email: string; otp: string; expiry: number; studentId: string } | null {
    if (!this.isBrowser()) return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OTP_PENDING);
      if (data) return JSON.parse(data);
    } catch {
      return null;
    }
    return null;
  }

  static verifyInstitutionalOtp(
    email: string,
    enteredOtp: string
  ): { success: boolean; message: string; user?: UserProfile } {
    const cleanEmail = email.trim().toLowerCase();
    const pending = this.getPendingOtpData();

    if (!pending || pending.email !== cleanEmail) {
      return {
        success: false,
        message: 'No pending verification found for this email. Please request a new verification code.',
      };
    }

    if (Date.now() > pending.expiry) {
      return {
        success: false,
        message: 'The verification code has expired (valid for 5 minutes). Please request a fresh OTP.',
      };
    }

    if (pending.otp !== enteredOtp.trim()) {
      return {
        success: false,
        message: 'Incorrect 6-digit verification code. Please check and try again.',
      };
    }

    // Success! Update current user
    const currentUser = this.getCurrentUser();
    if (!currentUser) return { success: false, message: 'Sign in before verifying your account.' };
    const updatedUser: UserProfile = {
      ...currentUser,
      is_verified_student: true,
      university_email: cleanEmail,
      student_id: undefined,
      verified_at: new Date().toISOString(),
    };

    this.setCurrentUser(updatedUser);

    // Add celebration notification
    this.addNotification({
      id: `notif-verify-${Date.now()}`,
      user_id: updatedUser.id,
      actor_name: 'KLEF Academic Registry',
      type: 'system',
      title: '✓ Campus Identity Verified',
      message: `Your KL University email (${cleanEmail}) has been confirmed. You now possess the official "Verified KLEF Student" badge!`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (this.isBrowser()) {
      localStorage.removeItem(STORAGE_KEYS.OTP_PENDING);
    }

    return {
      success: true,
      message: 'Congratulations! Your official KL University student identity has been verified.',
      user: updatedUser,
    };
  }

  static unverifyCurrentUser(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;
    const updatedUser: UserProfile = {
      ...currentUser,
      is_verified_student: false,
      university_email: undefined,
      student_id: undefined,
      verified_at: undefined,
    };
    this.setCurrentUser(updatedUser);
  }

  // ==========================================
  // RESOURCE REQUESTS METHODS
  // ==========================================

  static getResourceRequests(): ResourceRequest[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.REQUESTS, '[]');
      return [];
    } catch (e) {
      console.warn('Failed reading requests from storage', e);
      return [];
    }
  }

  static saveResourceRequests(requests: ResourceRequest[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    window.dispatchEvent(new Event('klu_requests_change'));
  }

  static getResourceRequestById(id: string): ResourceRequest | undefined {
    return this.getResourceRequests().find((r) => r.id === id);
  }

  static addResourceRequest(
    data: Omit<ResourceRequest, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): ResourceRequest {
    const requests = this.getResourceRequests();
    const newRequest: ResourceRequest = {
      ...data,
      id: `req-user-${Date.now()}`,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newRequest, ...requests];
    this.saveResourceRequests(updated);

    // Notify user of successful request publishing
    this.addNotification({
      id: `notif-req-create-${Date.now()}`,
      user_id: data.user_id,
      actor_name: 'VSS Academic Network',
      type: 'system',
      title: 'Resource Request Published',
      message: `Your request for "${data.title}" is now active in the peer requests feed.`,
      request_id: newRequest.id,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return newRequest;
  }

  static updateResourceRequest(
    id: string,
    updates: Partial<ResourceRequest>
  ): ResourceRequest | undefined {
    const requests = this.getResourceRequests();
    let updatedReq: ResourceRequest | undefined;

    const updated = requests.map((r) => {
      if (r.id === id) {
        updatedReq = {
          ...r,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return updatedReq;
      }
      return r;
    });

    if (updatedReq) {
      this.saveResourceRequests(updated);
    }
    return updatedReq;
  }

  static deleteResourceRequest(id: string): boolean {
    const requests = this.getResourceRequests();
    const filtered = requests.filter((r) => r.id !== id);
    if (filtered.length !== requests.length) {
      this.saveResourceRequests(filtered);
      return true;
    }
    return false;
  }

  static updateRequestStatus(id: string, status: RequestStatus): boolean {
    const requests = this.getResourceRequests();
    let found = false;
    const now = new Date().toISOString();

    const updated = requests.map((r) => {
      if (r.id === id) {
        found = true;
        return {
          ...r,
          status,
          fulfilled_at: status === 'fulfilled' ? now : status === 'open' ? undefined : r.fulfilled_at,
          updated_at: now,
        };
      }
      return r;
    });

    if (found) {
      this.saveResourceRequests(updated);
    }
    return found;
  }

  // --- Request Offers ---
  static getRequestOffers(requestId?: string): RequestOffer[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFERS);
      const offers: RequestOffer[] = data ? JSON.parse(data) : [];
      return requestId ? offers.filter((o) => o.request_id === requestId) : offers;
    } catch (e) {
      console.warn('Failed reading offers from storage', e);
      return [];
    }
  }

  static saveRequestOffers(offers: RequestOffer[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
    window.dispatchEvent(new Event('klu_offers_change'));
  }

  static addRequestOffer(
    data: Omit<RequestOffer, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): RequestOffer {
    const offers = this.getRequestOffers();
    const newOffer: RequestOffer = {
      ...data,
      id: `off-user-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newOffer, ...offers];
    this.saveRequestOffers(updated);

    // If offer was an uploaded file, optionally add it to resources store as well
    if (data.offer_type === 'upload' && data.uploaded_file_name) {
      const request = this.getResourceRequestById(data.request_id);
      if (request) {
        const addedResource = this.addResource({
          title: data.title || `Resource for: ${request.title}`,
          description: data.description || `Shared to fulfill academic request: ${request.title}`,
          category: request.category,
          course_code: request.course_code,
          course_name: request.course_name,
          semester: request.semester,
          academic_year: request.academic_year || '2025-2026',
          resource_type: request.resource_type,
          file_name: data.uploaded_file_name,
          file_url: data.uploaded_file_url || '/samples/23CS2101_Exp5_AVL_Trees_LabRecord.pdf',
          file_size: data.uploaded_file_size || 154200,
          file_type: data.uploaded_file_type || 'pdf',
          author_id: data.contributor_id,
          author_name: data.contributor_name,
          author_username: data.contributor_username,
          author_avatar: data.contributor_avatar,
          author_is_verified: data.contributor_is_verified,
          is_anonymous: false,
          status: 'approved',
          tags: [...request.tags, 'RequestFulfillment'],
        });
        newOffer.resource_id = addedResource.id;
      }
    }

    // Notify the request owner
    const request = this.getResourceRequestById(data.request_id);
    if (request && request.user_id !== data.contributor_id) {
      this.addNotification({
        id: `notif-offer-${Date.now()}`,
        user_id: request.user_id,
        actor_name: data.contributor_name,
        type: 'request_offer',
        title: 'New Resource Offer Received',
        message: `${data.contributor_name} offered a resource for "${request.title}".`,
        request_id: request.id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return newOffer;
  }

  static updateOfferStatus(offerId: string, status: OfferStatus): RequestOffer | undefined {
    const offers = this.getRequestOffers();
    let updatedOffer: RequestOffer | undefined;

    const updated = offers.map((o) => {
      if (o.id === offerId) {
        updatedOffer = {
          ...o,
          status,
          updated_at: new Date().toISOString(),
        };
        return updatedOffer;
      }
      return o;
    });

    if (updatedOffer) {
      this.saveRequestOffers(updated);

      const request = this.getResourceRequestById(updatedOffer.request_id);
      if (status === 'accepted' && request) {
        // Automatically mark request as fulfilled when an offer is accepted
        this.updateRequestStatus(request.id, 'fulfilled');

        // Notify contributor that their offer was accepted
        this.addNotification({
          id: `notif-offer-acc-${Date.now()}`,
          user_id: updatedOffer.contributor_id,
          actor_name: request.requester_name,
          type: 'offer_accepted',
          title: '🎉 Your Resource Offer Was Accepted!',
          message: `${request.requester_name} accepted your offer for "${request.title}". You helped a fellow student!`,
          request_id: request.id,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return updatedOffer;
  }

  static deleteRequestOffer(offerId: string): boolean {
    const offers = this.getRequestOffers();
    const filtered = offers.filter((o) => o.id !== offerId);
    if (filtered.length !== offers.length) {
      this.saveRequestOffers(filtered);
      return true;
    }
    return false;
  }

  // --- Request Responses / Comments ---
  static getRequestResponses(requestId?: string): RequestResponse[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
      const responses: RequestResponse[] = data ? JSON.parse(data) : [];
      return requestId ? responses.filter((r) => r.request_id === requestId) : responses;
    } catch (e) {
      console.warn('Failed reading responses from storage', e);
      return [];
    }
  }

  static addRequestResponse(
    requestId: string,
    content: string,
    user: UserProfile,
    parentResponseId?: string | null
  ): RequestResponse {
    const responses = this.getRequestResponses();
    const newResponse: RequestResponse = {
      id: `resp-user-${Date.now()}`,
      request_id: requestId,
      user_id: user.id,
      user_name: user.code_name || user.username || 'Anonymous',
      user_username: user.username,
      user_avatar: user.avatar_url,
      user_department: user.department,
      user_is_verified: user.is_verified_student,
      parent_response_id: parentResponseId || null,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...responses, newResponse];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_request_responses_change'));
    }

    // Notify request owner
    const request = this.getResourceRequestById(requestId);
    if (request && request.user_id !== user.id) {
      this.addNotification({
        id: `notif-resp-${Date.now()}`,
        user_id: request.user_id,
        actor_name: user.code_name || user.username || 'Peer Scholar',
        type: 'request_comment',
        title: 'New Discussion Reply on Request',
        message: `${user.code_name || user.username} commented on "${request.title}".`,
        request_id: request.id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return newResponse;
  }

  static updateRequestResponse(responseId: string, content: string): RequestResponse | undefined {
    const responses = this.getRequestResponses();
    let updatedResp: RequestResponse | undefined;

    const updated = responses.map((r) => {
      if (r.id === responseId) {
        updatedResp = {
          ...r,
          content,
          updated_at: new Date().toISOString(),
        };
        return updatedResp;
      }
      return r;
    });

    if (updatedResp && this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_request_responses_change'));
    }
    return updatedResp;
  }

  static deleteRequestResponse(responseId: string): boolean {
    const responses = this.getRequestResponses();
    const filtered = responses.filter((r) => r.id !== responseId);
    if (filtered.length !== responses.length) {
      if (this.isBrowser()) {
        localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(filtered));
        window.dispatchEvent(new Event('klu_request_responses_change'));
      }
      return true;
    }
    return false;
  }

  // --- Saved Requests (Bookmarks for Requests) ---
  static getSavedRequestIds(): string[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_REQUESTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.SAVED_REQUESTS, '[]');
      return [];
    } catch (e) {
      console.warn('Failed reading saved requests', e);
      return [];
    }
  }

  static toggleSavedRequest(requestId: string): boolean {
    if (!this.isBrowser()) return false;
    const saved = this.getSavedRequestIds();
    const isSaved = saved.includes(requestId);
    let newSaved: string[];

    if (isSaved) {
      newSaved = saved.filter((id) => id !== requestId);
    } else {
      newSaved = [...saved, requestId];
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_REQUESTS, JSON.stringify(newSaved));
    window.dispatchEvent(new Event('klu_saved_requests_change'));
    return !isSaved;
  }

  // --- Request Reports ---
  static getRequestReports(): RequestReport[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUEST_REPORTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading request reports', e);
    }
    return [];
  }

  static addRequestReport(report: Omit<RequestReport, 'id' | 'status' | 'created_at'>): RequestReport {
    const reports = this.getRequestReports();
    const created: RequestReport = {
      ...report,
      id: `req-rep-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const updated = [created, ...reports];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REQUEST_REPORTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_request_reports_change'));
    }
    return created;
  }

  static resolveRequestReport(reportId: string, status: 'resolved' | 'dismissed', notes?: string): void {
    const reports = this.getRequestReports();
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status, resolution_notes: notes } : r
    );
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REQUEST_REPORTS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_request_reports_change'));
    }
  }

  // --- Summary Statistics ---
  static getRequestsSummaryStats(currentUserId?: string): {
    total: number;
    open: number;
    fulfilled: number;
    myRequests: number;
  } {
    const requests = this.getResourceRequests();
    const total = requests.length;
    const open = requests.filter((r) => r.status === 'open' || r.status === 'partially_fulfilled').length;
    const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;
    const myRequests = currentUserId
      ? requests.filter((r) => r.user_id === currentUserId).length
      : 0;

    return { total, open, fulfilled, myRequests };
  }

  // --- Security Audit Logs ---
  static getSecurityAuditLogs(): SecurityAuditLog[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SECURITY_AUDIT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading security audit logs', e);
    }
    const initialLogs: SecurityAuditLog[] = [
      {
        id: 'sec-log-001',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        event: 'LOGIN_SUCCESS',
        masked_erp_id: '23****0042',
        ip_address: '10.12.4.88 (Campus Subnet)',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'SUCCESS',
        details: 'ERP ID authenticated successfully with student session token issued.',
      },
    ];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.SECURITY_AUDIT_LOGS, JSON.stringify(initialLogs));
    }
    return initialLogs;
  }

  static recordSecurityAuditLog(data: Omit<SecurityAuditLog, 'id' | 'timestamp'>): SecurityAuditLog {
    const logs = this.getSecurityAuditLogs();
    const newLog: SecurityAuditLog = {
      ...data,
      id: `sec-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 100);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.SECURITY_AUDIT_LOGS, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_audit_logs_change'));
    }
    return newLog;
  }

  static clearSecurityAuditLogs(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(STORAGE_KEYS.SECURITY_AUDIT_LOGS);
    window.dispatchEvent(new Event('klu_audit_logs_change'));
  }

  // --- Strict Rate Limiting (5 attempts max, 60s cooldown) ---
  static checkRateLimit(identifier: string): { isLocked: boolean; remainingAttempts: number; lockTimeRemaining: number } {
    if (!this.isBrowser()) return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
      if (!data) return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
      const limits: Record<string, { attempts: number; lockedUntil?: number; lastAttempt: number }> = JSON.parse(data);
      const entry = limits[identifier];
      if (!entry) return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };

      const now = Date.now();
      if (entry.lockedUntil && entry.lockedUntil > now) {
        const remainingSecs = Math.ceil((entry.lockedUntil - now) / 1000);
        return { isLocked: true, remainingAttempts: 0, lockTimeRemaining: remainingSecs };
      }

      if (now - entry.lastAttempt > 600000) {
        return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
      }

      const remaining = Math.max(0, 5 - entry.attempts);
      return { isLocked: remaining === 0, remainingAttempts: remaining, lockTimeRemaining: 0 };
    } catch {
      return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
    }
  }

  static recordLoginAttempt(
    identifier: string,
    success: boolean
  ): { isLocked: boolean; remainingAttempts: number; lockTimeRemaining: number } {
    if (!this.isBrowser()) return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATE_LIMIT);
      const limits: Record<string, { attempts: number; lockedUntil?: number; lastAttempt: number }> = data ? JSON.parse(data) : {};
      const now = Date.now();

      if (success) {
        delete limits[identifier];
        localStorage.setItem(STORAGE_KEYS.RATE_LIMIT, JSON.stringify(limits));
        return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
      }

      const entry = limits[identifier] || { attempts: 0, lastAttempt: now };
      entry.attempts += 1;
      entry.lastAttempt = now;

      if (entry.attempts >= 5) {
        entry.lockedUntil = now + 60000; // 60-second cooldown
        limits[identifier] = entry;
        localStorage.setItem(STORAGE_KEYS.RATE_LIMIT, JSON.stringify(limits));
        return { isLocked: true, remainingAttempts: 0, lockTimeRemaining: 60 };
      }

      limits[identifier] = entry;
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT, JSON.stringify(limits));
      return { isLocked: false, remainingAttempts: 5 - entry.attempts, lockTimeRemaining: 0 };
    } catch {
      return { isLocked: false, remainingAttempts: 5, lockTimeRemaining: 0 };
    }
  }

  // --- Manual Course Syncing when ERP is Unavailable ---
  static updateUserEnrolledCourses(courseCodes: string[]): boolean {
    if (!this.isBrowser()) return false;
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    currentUser.enrolled_courses = courseCodes;
    this.setCurrentUser(currentUser);
    this.recordSecurityAuditLog({
      event: 'MANUAL_COURSE_SYNC',
      masked_erp_id: currentUser.student_id ? `${currentUser.student_id.slice(0, 2)}****${currentUser.student_id.slice(-4)}` : 'STUDENT_SYNC',
      ip_address: '127.0.0.1 (Local Client)',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
      status: 'SUCCESS',
      details: `Manual course synchronization completed: ${courseCodes.length} course(s) mapped [${courseCodes.join(', ')}].`,
    });
    window.dispatchEvent(new Event('klu_courses_synced'));
    return true;
  }

  // --- Referral Codes & Growth Tracking ---
  static getReferralCodes(): ReferralCode[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REFERRAL_CODES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading referral codes', e);
    }
    const initialCodes: ReferralCode[] = [
      {
        code: 'KLU-STUDENT-PASS',
        label: 'Campus VIP Pioneer Pass',
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        uses_count: 0,
        referrals: [],
      },
      {
        code: 'CAMPUS-VIP-75',
        label: 'Core Inner Circle Access',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        uses_count: 0,
        referrals: [],
      },
      {
        code: 'CAMPUS-HONOURS',
        label: 'Academic Honours Referral',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        uses_count: 0,
        referrals: [],
      },
      {
        code: 'PIONEER-SCHOLAR',
        label: 'Academic Honours Referral',
        created_at: new Date().toISOString(),
        uses_count: 0,
        referrals: [],
      },
      {
        code: 'VSS-FRIENDS',
        label: 'Study Circle Peer Invite',
        created_at: new Date().toISOString(),
        uses_count: 0,
        referrals: [],
      },
    ];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REFERRAL_CODES, JSON.stringify(initialCodes));
    }
    return initialCodes;
  }

  static createReferralCode(code: string, label: string): ReferralCode {
    const list = this.getReferralCodes();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const existing = list.find((r) => r.code === cleanCode);
    if (existing) return existing;

    const newCode: ReferralCode = {
      code: cleanCode,
      label: label.trim() || 'Custom Referral Invite',
      created_at: new Date().toISOString(),
      uses_count: 0,
      referrals: [],
    };
    const updated = [newCode, ...list];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.REFERRAL_CODES, JSON.stringify(updated));
      window.dispatchEvent(new Event('klu_referrals_change'));
    }
    return newCode;
  }

  static applyReferralCode(
    code: string,
    studentId: string,
    username: string
  ): { success: boolean; message: string; referral?: ReferralCode } {
    if (!code || !this.isBrowser()) return { success: false, message: 'Invalid referral code.' };
    const list = this.getReferralCodes();
    const cleanCode = code.trim().toUpperCase();
    const match = list.find((r) => r.code === cleanCode);

    if (!match) {
      return { success: false, message: 'Referral code not found.' };
    }

    match.uses_count += 1;
    match.referrals.unshift({
      student_id: studentId,
      username: username,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(STORAGE_KEYS.REFERRAL_CODES, JSON.stringify(list));
    window.dispatchEvent(new Event('klu_referrals_change'));

    return {
      success: true,
      message: `Referral code [${cleanCode}] applied! Welcome from ${match.label}.`,
      referral: match,
    };
  }

  static deleteReferralCode(code: string): boolean {
    if (!this.isBrowser()) return false;
    const list = this.getReferralCodes();
    const updated = list.filter((r) => r.code !== code);
    localStorage.setItem(STORAGE_KEYS.REFERRAL_CODES, JSON.stringify(updated));
    window.dispatchEvent(new Event('klu_referrals_change'));
    return true;
  }

  static validateReferralCode(code: string): { valid: boolean; label?: string } {
    if (!code || !this.isBrowser()) return { valid: false };
    const list = this.getReferralCodes();
    const cleanCode = code.trim().toUpperCase();
    const match = list.find((r) => r.code === cleanCode);
    return match ? { valid: true, label: match.label } : { valid: false };
  }

  // --- Registered Users Registry for Admin ---
  static getRegisteredUsers(): UserProfile[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading registered users', e);
    }
    return [];
  }

  static saveRegisteredUser(user: UserProfile): void {
    if (!this.isBrowser()) return;
    const users = this.getRegisteredUsers();
    const index = users.findIndex((u) => u.id === user.id || u.username === user.username || u.email === user.email);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.unshift(user);
    }
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    window.dispatchEvent(new Event('klu_users_change'));
  }

  static updateUserRole(userId: string, role: 'student' | 'admin' | 'moderator'): void {
    if (!this.isBrowser()) return;
    const users = this.getRegisteredUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
    window.dispatchEvent(new Event('klu_users_change'));
  }

  // --- Platform Controls & Global Announcement ---
  static getPlatformAnnouncement(): { active: boolean; title: string; message: string; type: 'info' | 'warning' | 'alert' } {
    if (!this.isBrowser()) return { active: false, title: '', message: '', type: 'info' };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading announcement', e);
    }
    return {
      active: true,
      title: 'End-Semester 2026 Study Vault & Exam Material Hub Live',
      message: 'Verified KL University scholars can access high-yield question banks, lab manuals, and peer notes.',
      type: 'info',
    };
  }

  static setPlatformAnnouncement(announcement: { active: boolean; title: string; message: string; type: 'info' | 'warning' | 'alert' }): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT, JSON.stringify(announcement));
    window.dispatchEvent(new Event('klu_announcement_change'));
  }
}
