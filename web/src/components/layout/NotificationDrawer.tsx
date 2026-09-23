import React, { useState } from 'react';
import { X, Bell, Info, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import { useNotifications, AlertNotification } from '../../context/NotificationContext';

interface NotificationDrawerProps {
  onNavigate: (tab: string) => void;
  onSelectHazard?: (hazardId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  onNavigate,
  onSelectHazard,
}) => {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    setIsDrawerOpen,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  if (!isDrawerOpen) return null;

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.severity === activeFilter;
  });

  const handleItemClick = (notif: AlertNotification) => {
    markAsRead(notif.id);
    setIsDrawerOpen(false);
    if (notif.hazardId && onSelectHazard) {
      onSelectHazard(notif.hazardId);
    }
    if (notif.linkTab) {
      onNavigate(notif.linkTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0d0d0f] shadow-2xl border-l border-slate-200 dark:border-[#27272a] flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-sans">Safety Broadcasts & Alerts</h3>
                <p className="text-[11px] text-slate-500 dark:text-[#a1a1aa] font-mono">
                  {unreadCount} Unacknowledged Notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#18181b] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Chips & Mark All Read */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0a0a0c] border-b border-slate-200 dark:border-[#27272a] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xs'
                      : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-[#a1a1aa] hover:bg-slate-100 dark:hover:bg-[#27272a] border border-slate-200 dark:border-[#27272a]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-slate-700 dark:text-slate-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-[#27272a]">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                No active notifications under this filter.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`pt-3 first:pt-0 p-3.5 rounded-[20px] border transition-all cursor-pointer ${
                    !item.read
                      ? 'bg-slate-50 dark:bg-[#18181b] border-slate-300 dark:border-[#3f3f46] shadow-xs'
                      : 'bg-white dark:bg-[#111111] border-slate-200 dark:border-[#27272a] hover:bg-slate-50 dark:hover:bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                          item.severity === 'critical'
                            ? 'bg-red-500 animate-pulse'
                            : item.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#a1a1aa] mt-1 leading-relaxed">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                          <span>{item.location}</span>
                          <span>•</span>
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(item.id);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 dark:bg-[#0a0a0c] border-t border-slate-200 dark:border-[#27272a] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">DISASTER CELL DISPATCH</span>
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onNavigate('home');
              }}
              className="text-xs font-bold text-slate-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              Close Drawer <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
