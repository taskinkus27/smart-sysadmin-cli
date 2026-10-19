import React from 'react';
import { AlertEmailRecord } from '../types';
import { X, Mail, CheckCircle, ShieldAlert, Clock } from 'lucide-react';

interface EmailPreviewModalProps {
  alert: AlertEmailRecord | null;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  alert,
  onClose,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Alarm E-postası Önizlemesi (Gelen Kutusu Görünümü)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Header */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800 text-xs space-y-1.5 shrink-0 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold w-16">Kimden:</span>
              <span className="text-slate-200 font-mono">
                Smart SysAdmin Alert Dispatcher &lt;alerts@smart-sysadmin.local&gt;
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {alert.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold w-16">Kime:</span>
            <span className="text-emerald-400 font-bold font-mono">{alert.recipient}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold w-16">Konu:</span>
            <span className="text-slate-100 font-bold">{alert.subject}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-slate-500 font-semibold w-16">Tarih:</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleString('tr-TR')}
            </span>
          </div>
        </div>

        {/* Email HTML Body Rendered */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900">
          <div
            dangerouslySetInnerHTML={{ __html: alert.htmlContent }}
            className="prose prose-sm max-w-none text-slate-900"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[11px] text-slate-500">
            {alert.deliveryDetail}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
