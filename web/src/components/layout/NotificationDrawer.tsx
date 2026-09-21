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
        className="absolute inset-0 bg-[#075B8A]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-float border-l border-[#DCEBED] flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#DCEBED] flex items-center justify-between bg-[#075B8A] text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#18C3D0] text-[#075B8A] flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white font-sans">Safety Broadcasts & Alerts</h3>
                <p className="text-[11px] text-[#A7D7E8] font-mono">
                  {unreadCount} Unacknowledged Notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Chips & Mark All Read */}
          <div className="px-4 py-2.5 bg-[#F4F8FA] border-b border-[#DCEBED] flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {(['all', 'critical', 'warning', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-[#075B8A] text-white shadow-xs'
                      : 'bg-white text-[#708696] hover:bg-[#EEF5F8] border border-[#DCEBED]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#075B8A] hover:text-[#0B6E9E] font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#18C3D0]" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#F4F8FA]">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[#708696] text-xs">
                <Info className="w-8 h-8 mx-auto mb-2 text-[#A7D7E8]" />
                No active notifications under this filter.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`pt-3 first:pt-0 p-3.5 rounded-[20px] border transition-all cursor-pointer ${
                    !item.read
                      ? 'bg-[#EDFAFC]/60 border-[#AEEBF0] shadow-xs'
                      : 'bg-white border-[#DCEBED] hover:bg-[#F4F8FA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                          item.severity === 'critical'
                            ? 'bg-[#E94B68] animate-pulse'
                            : item.severity === 'warning'
                            ? 'bg-[#F4C84A]'
                            : 'bg-[#18C3D0]'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#18364A]">{item.title}</span>
                          {!item.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E94B68] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[#708696] mt-1 leading-relaxed">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-[#708696] font-mono">
                          <span>{item.location}</span>
                          <span>•</span>
                          <span>{item.source}</span>
                          <span>•</span>
                          <span className="text-[#A7D7E8]">{item.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(item.id);
                      }}
                      className="text-[#708696] hover:text-[#E94B68] p-1 transition-colors cursor-pointer"
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
          <div className="p-4 bg-[#F4F8FA] border-t border-[#DCEBED] text-xs text-[#708696] flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-[#075B8A]">DISASTER CELL DISPATCH</span>
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onNavigate('activity');
              }}
              className="text-xs font-bold text-[#075B8A] hover:text-[#0B6E9E] flex items-center gap-1 cursor-pointer"
            >
              View Full Activity Log <ChevronRight className="w-3.5 h-3.5 text-[#18C3D0]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
