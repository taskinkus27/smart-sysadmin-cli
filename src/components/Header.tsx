import React from 'react';
import { ServerSummary, ServerDetail } from '../types';
import {
  Terminal,
  Server,
  Zap,
  Sparkles,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

interface HeaderProps {
  servers: ServerSummary[];
  activeServer: ServerDetail | null;
  onSelectServer: (id: string) => void;
  onOpenNewServerModal: () => void;
  onQuickScan: () => void;
  onRunGeminiDiagnose: () => void;
  onOpenSendEmail: () => void;
  isScanning: boolean;
  isDiagnosing: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  servers,
  activeServer,
  onSelectServer,
  onOpenNewServerModal,
  onQuickScan,
  onRunGeminiDiagnose,
  onOpenSendEmail,
  isScanning,
  isDiagnosing,
  activeTab,
  setActiveTab,
}) => {
  const isServerCritical =
    activeServer?.metrics.disk.some((d) => d.usePercent >= 90) ||
    activeServer?.metrics.services.some((s) => s.status === 'failed');

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding & server selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight font-mono">
                  Smart SysAdmin CLI
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI SRE Assistant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otomatik SSH & Linux Sunucu Bakım ve Akıllı Teşhis Sistemi
              </p>
            </div>
          </div>

          {/* Server Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
              <Server className="w-4 h-4 text-slate-400" />
              <select
                value={activeServer?.id || ''}
                onChange={(e) => onSelectServer(e.target.value)}
                className="bg-transparent text-sm font-mono text-slate-200 outline-none cursor-pointer pr-2"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.host}) {s.status === 'CRITICAL' ? '⚠️ [KRİTİK]' : '✓ [OK]'}
                  </option>
                ))}
              </select>
              {isServerCritical ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> KRİTİK
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> SAĞLIKLI
                </span>
              )}
            </div>

            <button
              onClick={onOpenNewServerModal}
              title="Yeni SSH Sunucusu Ekle"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Quick Actions Buttons */}
            <button
              onClick={onQuickScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Taranıyor...' : 'Tek Tıkla Tara'}</span>
            </button>

            <button
              onClick={onRunGeminiDiagnose}
              disabled={isDiagnosing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-700/20 transition disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-pulse' : ''}`} />
              <span>{isDiagnosing ? 'AI Analiz Ediyor...' : 'Gemini AI Teşhis'}</span>
            </button>

            <button
              onClick={onOpenSendEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
              title="Kritik Alarm E-postası Gönder"
            >
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Alarm E-postası</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 text-xs font-medium no-scrollbar">
          {[
            { id: 'overview', label: 'Genel Bakış & Metrikler', icon: HardDrive },
            { id: 'gemini', label: 'Gemini AI Teşhis & Reçete', icon: Sparkles, badge: 'Önemli' },
            { id: 'terminal', label: 'SSH Web Terminal', icon: Terminal },
            { id: 'logs', label: '/var/log & Journal', icon: Zap },
            { id: 'docker', label: 'Docker & Servisler', icon: Server },
            { id: 'alerts', label: 'Otomasyon & E-posta Bildirimleri', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
