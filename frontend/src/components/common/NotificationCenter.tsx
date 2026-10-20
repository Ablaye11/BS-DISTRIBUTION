import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { SystemNotification } from '../../types';
import { db } from '../../db/database';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onRefreshData: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onRefreshData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await db.notifications.update(id, { isRead: true });
    onRefreshData();
  };

  const handleClearAll = async () => {
    await db.notifications.clear();
    onRefreshData();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 hover:bg-slate-800 text-amber-400 transition-all"
        title="Centre d'Alertes & Notifications (Section 24)"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[600] overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h4 className="font-extrabold text-slate-100 text-xs flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Notifications & Alertes ({notifications.length})
            </h4>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-[10px] text-slate-400 hover:text-red-400 font-semibold"
                >
                  Effacer tout
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">Aucune alerte pour le moment.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 space-y-1 transition-all ${!n.isRead ? 'bg-amber-500/10 border-l-2 border-amber-500' : 'hover:bg-slate-800/40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{n.date}</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{n.message}</p>
                  {!n.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] text-emerald-400 font-bold hover:underline block pt-1"
                    >
                      Marquer comme lue
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
