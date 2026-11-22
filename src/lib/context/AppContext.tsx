'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, NotificationItem } from '@/types';
import { MockStorageManager } from '@/lib/storage/mock-store';

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile) => void;
  logout: () => void;
  likedIds: string[];
  toggleLike: (resourceId: string) => void;
  savedIds: string[];
  toggleBookmark: (resourceId: string) => void;
  savedRequestIds: string[];
  toggleSavedRequest: (requestId: string) => void;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  isVerifyModalOpen: boolean;
  openVerifyModal: () => void;
  closeVerifyModal: () => void;
  isBenefitsAdOpen: boolean;
  openBenefitsAd: () => void;
  closeBenefitsAd: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedRequestIds, setSavedRequestIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isBenefitsAdOpen, setIsBenefitsAdOpen] = useState(false);

  const openVerifyModal = () => setIsVerifyModalOpen(true);
  const closeVerifyModal = () => setIsVerifyModalOpen(false);

  const openBenefitsAd = () => {
    // Strictly only allow opening if user is signed in
    if (MockStorageManager.getCurrentUser()) {
      setIsBenefitsAdOpen(true);
    }
  };
  const closeBenefitsAd = () => setIsBenefitsAdOpen(false);

  // Listen for ad popup events, strictly verifying user is authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleShowAdEvent = () => {
        if (MockStorageManager.getCurrentUser()) {
          setIsBenefitsAdOpen(true);
        }
      };
      window.addEventListener('vss_show_benefits_ad', handleShowAdEvent);
      return () => {
        window.removeEventListener('vss_show_benefits_ad', handleShowAdEvent);
      };
    }
  }, []);

  const refreshState = useCallback(() => {
    setCurrentUserState(MockStorageManager.getCurrentUser());
    setLikedIds(MockStorageManager.getLikedResourceIds());
    setSavedIds(MockStorageManager.getSavedResourceIds());
    setSavedRequestIds(MockStorageManager.getSavedRequestIds());
    setNotifications(MockStorageManager.getNotifications());
  }, []);

  useEffect(() => {
    MockStorageManager.removeLegacyDemoData();
    refreshState();

    fetch('/api/auth/erp', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const erp = data?.profile;
        if (!erp?.rollNumber || !erp?.name) return;
        const existing = MockStorageManager.getCurrentUser();
        const user: UserProfile = {
          id: `erp-${erp.rollNumber}`,
          username: erp.rollNumber,
          full_name: erp.name,
          email: existing?.email || `${erp.rollNumber}@vss.local`,
          department: erp.department || existing?.department || 'KLU',
          semester: erp.semester || (erp.rollNumber.startsWith('26') ? 'Tri-Sem 1 (T1)' : erp.rollNumber.startsWith('25') ? 'Sem 3' : erp.rollNumber.startsWith('24') ? 'Sem 5' : 'Sem 1'),
          academic_year: erp.academicYear,
          registered_courses: Array.isArray(erp.courses) ? erp.courses : [],
          academic_context_source: 'erp',
          role: 'student',
          student_id: erp.rollNumber,
          is_verified_student: true,
          created_at: existing?.created_at || new Date().toISOString(),
        };
        MockStorageManager.setCurrentUser(user);
        setCurrentUserState(user);
      })
      .catch(() => undefined);

    const handleAuthChange = () => refreshState();
    const handleLikesChange = () => setLikedIds(MockStorageManager.getLikedResourceIds());
    const handleBookmarksChange = () => setSavedIds(MockStorageManager.getSavedResourceIds());
    const handleSavedRequestsChange = () => setSavedRequestIds(MockStorageManager.getSavedRequestIds());
    const handleNotifsChange = () => setNotifications(MockStorageManager.getNotifications());

    window.addEventListener('klu_auth_change', handleAuthChange);
    window.addEventListener('klu_likes_change', handleLikesChange);
    window.addEventListener('klu_bookmarks_change', handleBookmarksChange);
    window.addEventListener('klu_saved_requests_change', handleSavedRequestsChange);
    window.addEventListener('klu_notifs_change', handleNotifsChange);

    return () => {
      window.removeEventListener('klu_auth_change', handleAuthChange);
      window.removeEventListener('klu_likes_change', handleLikesChange);
      window.removeEventListener('klu_bookmarks_change', handleBookmarksChange);
      window.removeEventListener('klu_saved_requests_change', handleSavedRequestsChange);
      window.removeEventListener('klu_notifs_change', handleNotifsChange);
    };
  }, [refreshState]);

  const setCurrentUser = (user: UserProfile) => {
    MockStorageManager.setCurrentUser(user);
    setCurrentUserState(user);
    showToast(`Signed in as ${user.full_name}`, 'success');
  };

  const logout = () => {
    MockStorageManager.logout();
    setCurrentUserState(null);
    setIsBenefitsAdOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vss_show_benefits_ad');
      sessionStorage.removeItem('vss_seen_benefits_ad');
    }
    showToast('Signed out of session', 'info');
  };

  const toggleLike = (resourceId: string) => {
    const isNowLiked = MockStorageManager.toggleLike(resourceId);
    showToast(isNowLiked ? 'Added to liked resources' : 'Removed like', 'info');
  };

  const toggleBookmark = (resourceId: string) => {
    const isNowSaved = MockStorageManager.toggleBookmark(resourceId);
    showToast(isNowSaved ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
  };

  const toggleSavedRequest = (requestId: string) => {
    const isNowSaved = MockStorageManager.toggleSavedRequest(requestId);
    showToast(isNowSaved ? 'Request saved to bookmarks' : 'Request removed from bookmarks', 'info');
  };

  const markNotificationRead = (id: string) => {
    MockStorageManager.markNotificationRead(id);
  };

  const markAllNotificationsRead = () => {
    MockStorageManager.markAllNotificationsRead();
    showToast('All notifications marked as read', 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        likedIds,
        toggleLike,
        savedIds,
        toggleBookmark,
        savedRequestIds,
        toggleSavedRequest,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        showToast,
        toast,
        isVerifyModalOpen,
        openVerifyModal,
        closeVerifyModal,
        isBenefitsAdOpen,
        openBenefitsAd,
        closeBenefitsAd,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
