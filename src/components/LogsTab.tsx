import React, { useState } from 'react';
import { ServerDetail } from '../types';
import {
  FileText,
  Search,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ShieldAlert,
  Terminal,
  Filter,
} from 'lucide-react';

interface LogsTabProps {
  server: ServerDetail;
  onExecuteCommand: (cmd: string) => void;
  executingCmd: string | null;
  onAskGeminiAboutLog: (logSnippet: string) => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  server,
  onExecuteCommand,
  executingCmd,
  onAskGeminiAboutLog,
}) => {
  const [activeLogType, setActiveLogType] = useState<'journal' | 'syslog' | 'auth' | 'docker'>('journal');
  const [searchFilter, setSearchFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERRORS' | 'WARNINGS'>('ALL');
  const [copied, setCopied] = useState(false);

  const rawLogs =
    activeLogType === 'journal'
      ? server.metrics.logs.journal
      : activeLogType === 'syslog'
      ? server.metrics.logs.syslog
      : activeLogType === 'auth'
      ? server.metrics.logs.auth
      : server.metrics.logs.docker || [];

  const filteredLogs = rawLogs.filter((line) => {
    const matchesSearch = !searchFilter || line.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;

    if (severityFilter === 'ERRORS') {
      return (
        line.toLowerCase().includes('fail') ||
        line.toLowerCase().includes('error') ||
        line.toLowerCase().includes('emerg') ||
        line.toLowerCase().includes('killed') ||
        line.toLowerCase().includes('critical')
      );
    }
    if (severityFilter === 'WARNINGS') {
      return (
        line.toLowerCase().includes('warn') ||
        line.toLowerCase().includes('suppressed') ||
        line.toLowerCase().includes('timeout')
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(filteredLogs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header with Log Type Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                /var/log & Journal Canlı Günlük Kayıtları
              </h3>
              <p className="text-xs text-slate-400">
                Sistem servislerinin, çekirdek olaylarının (dmesg) ve güvenlik günlüklerinin denetimi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeLogType === 'journal' && (
              <button
                onClick={() => onExecuteCommand('sudo journalctl --vacuum-time=3d')}
                disabled={executingCmd !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${executingCmd?.includes('vacuum') ? 'animate-spin' : ''}`} />
                <span>Journal'ı Temizle (3 Günlük)</span>
              </button>
            )}

            <button
              onClick={() => onAskGeminiAboutLog(filteredLogs.slice(-8).join('\n'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI ile Bu Hataları Çöz</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation for Log categories */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLogType('journal')}
              className={`px-3 py-1 rounded font-mono transition ${
                activeLogType === 'journal'
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /var/log/journal
            </button>
            <button
              onClick={() => setActiveLogType('syslog')}
              className={`px-3 py-1 rounded font-mono transition ${
                activeLogType === 'syslog'
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /var/log/syslog
            </button>
            <button
              onClick={() => setActiveLogType('auth')}
              className={`px-3 py-1 rounded font-mono transition ${
                activeLogType === 'auth'
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              /var/log/auth.log
            </button>
            <button
              onClick={() => setActiveLogType('docker')}
              className={`px-3 py-1 rounded font-mono transition ${
                activeLogType === 'docker'
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Docker stderr / stdout
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Log içinde ara (grep)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Kayıtlar</option>
              <option value="ERRORS">Sadece Hatalar (Error/Fail)</option>
              <option value="WARNINGS">Uyarılar (Warn)</option>
            </select>

            <button
              onClick={handleCopyLogs}
              title="Görüntülenen Logları Kopyala"
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal Log Viewer */}
        <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Arama kriterine uygun günlük kaydı bulunamadı.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log, index) => {
                const isError =
                  log.toLowerCase().includes('fail') ||
                  log.toLowerCase().includes('error') ||
                  log.toLowerCase().includes('emerg') ||
                  log.toLowerCase().includes('killed');
                const isWarn =
                  log.toLowerCase().includes('warn') ||
                  log.toLowerCase().includes('suppressed') ||
                  log.toLowerCase().includes('timeout');

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 py-0.5 px-1.5 rounded hover:bg-slate-900/80 transition ${
                      isError
                        ? 'text-rose-400 bg-rose-950/20'
                        : isWarn
                        ? 'text-amber-300 bg-amber-950/20'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 select-none text-[10px] w-6 shrink-0 text-right">
                      {index + 1}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
