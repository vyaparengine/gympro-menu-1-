import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, Megaphone, Dumbbell, Flame, Sparkles, X, Clock, AlertCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService, PushAnnouncement, playNotificationChime } from '../lib/notificationService';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<PushAnnouncement[]>([]);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [newAnnouncementAlert, setNewAnnouncementAlert] = useState<PushAnnouncement | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load permission state and announcements
  useEffect(() => {
    setPermission(notificationService.getPermissionState());
    loadAnnouncements();

    // Set up auto-registration
    notificationService.registerDevice();

    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Subscribe to real-time broadcasts
    const unsubscribe = notificationService.subscribeToAnnouncements((newAnn) => {
      // Received a new broadcast!
      setAnnouncements(prev => [newAnn, ...prev].slice(0, 15));
      setHasUnread(true);
      playNotificationChime();
      
      // Show elegant visual overlay toast
      setNewAnnouncementAlert(newAnn);

      // Trigger native browser notification if allowed
      if (Notification.permission === 'granted') {
        try {
          new Notification(newAnn.title, {
            body: newAnn.body,
            icon: '/vite.svg',
            tag: newAnn.id
          });
        } catch (e) {
          console.warn('Native notification failed:', e);
        }
      }
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      unsubscribe();
    };
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await notificationService.getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Close the in-app alert card after 8 seconds
  useEffect(() => {
    if (newAnnouncementAlert) {
      const timer = setTimeout(() => {
        setNewAnnouncementAlert(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [newAnnouncementAlert]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleBellClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-850 bg-neutral-900/50 text-neutral-400 hover:border-amber-500/40 hover:text-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all cursor-pointer"
        aria-label="View notifications"
        id="notification-center-bell"
      >
        {hasUnread ? (
          <BellRing className="h-5 w-5 text-amber-500 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {/* Red unread dot */}
        {hasUnread && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-left"
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Store Announcements</h3>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                {announcements.length} Alerts
              </span>
            </div>

            {/* Notification Subscription banner */}
            {permission !== 'granted' && (
              <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <Smartphone className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider">Enable Push Alerts</h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">
                      Get real-time push alerts about stock refills and announcements.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestPermission}
                  className="w-full text-center py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] cursor-pointer"
                >
                  Turn On Notifications
                </button>
              </div>
            )}

            {/* Announcements List */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-800/50 flex items-center justify-center mb-3 border border-neutral-800">
                    <Bell className="h-5 w-5 text-neutral-500" />
                  </div>
                  <p className="text-xs text-neutral-400 font-semibold">No recent announcements</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Notifications from the Gym Owner will appear here.</p>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="group relative rounded-xl border border-neutral-850 bg-neutral-950/40 p-3 hover:border-neutral-700 transition-all hover:bg-neutral-950/75"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon Container depending on category */}
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ann.category === 'new_stock'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {ann.category === 'new_stock' ? (
                          <Flame className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-black text-white leading-snug break-words">
                            {ann.title}
                          </h4>
                          <span className="text-[9px] text-neutral-500 flex items-center gap-1 shrink-0 font-mono">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTimestamp(ann.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed break-words pr-2">
                          {ann.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating In-App Dynamic Broadcast Alert Toast */}
      <AnimatePresence>
        {newAnnouncementAlert && (
          <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96">
            <motion.div
              initial={{ opacity: 0, x: 50, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-neutral-950 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl p-4 text-left"
            >
              {/* Top border glowing highlight */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse" />

              <div className="flex items-start gap-3">
                {/* Visual Category Icon */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  newAnnouncementAlert.category === 'new_stock'
                    ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}>
                  {newAnnouncementAlert.category === 'new_stock' ? (
                    <Dumbbell className="h-5 w-5 fill-neutral-950" />
                  ) : (
                    <Sparkles className="h-5 w-5 fill-neutral-950" />
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      newAnnouncementAlert.category === 'new_stock'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {newAnnouncementAlert.category === 'new_stock' ? 'REFREEZE / STOCK REFILL' : 'ANNOUNCEMENT'}
                    </span>
                    <span className="text-[8px] text-neutral-500 font-semibold uppercase">just now</span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-1 leading-snug">
                    {newAnnouncementAlert.title}
                  </h4>
                  <p className="text-[10px] text-neutral-400 leading-relaxed mt-1 break-words">
                    {newAnnouncementAlert.body}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setNewAnnouncementAlert(null)}
                  className="absolute top-3 right-3 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-lg p-1 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
