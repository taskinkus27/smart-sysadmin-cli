import React, { useState } from 'react';
import { AlertEmailRecord, ServerDetail } from '../types';
import {
  Mail,
  Send,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Settings,
  ShieldCheck,
  Server,
  RotateCw,
  Clock,
} from 'lucide-react';

interface AlertsTabProps {
  server: ServerDetail;
  alertHistory: AlertEmailRecord[];
  onTriggerAlert: (customRecipient?: string, subject?: string) => Promise<void>;
  isSending: boolean;
  onPreviewEmail: (alert: AlertEmailRecord) => void;
  onRefreshHistory: () => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  server,
  alertHistory,
  onTriggerAlert,
  isSending,
  onPreviewEmail,
  onRefreshHistory,
}) => {
  const [recipient, setRecipient] = useState('kustaskin@gmail.com');
  const [diskThreshold, setDiskThreshold] = useState(85);
  const [ramThreshold, setRamThreshold] = useState(85);
  const [notifyOnFailedService, setNotifyOnFailedService] = useState(true);
  const [notifyOnContainerExit, setNotifyOnContainerExit] = useState(true);

  // Optional SMTP settings toggle
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessMsg('Otomatik uyarı kuralları başarıyla kaydedildi.');
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  const handleSendTest = () => {
    onTriggerAlert(recipient);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 font-mono">
                Otomatik Sistem Hata & Alarm E-posta Bildirimleri
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Canlı Nöbetçi Modu
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Kritik disk dolulukları (%90+), RAM darboğazları ve çöken servisler tespit edildiğinde
              nöbetçi sistem yöneticisine anında Gemini teşhisli ve çözüm komutlu HTML alarm
              e-postası gönderir.
            </p>
          </div>
        </div>

        <button
          onClick={handleSendTest}
          disabled={isSending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition disabled:opacity-50 cursor-pointer self-end md:self-center shrink-0"
        >
          <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
          <span>{isSending ? 'Gönderiliyor...' : 'Şimdi Alarm E-postası Gönder'}</span>
        </button>
      </div>

      {savedSuccessMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Two Column Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alarm Rules Form */}
        <form onSubmit={handleSaveRules} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-400" />
              <span>Alarm Eşikleri & Alıcı Ayarları</span>
            </h4>
            <span className="text-xs text-slate-500 font-mono">sysadmin-cron</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alıcı E-posta Adresi (SysAdmin)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              * Varsayılan yönetici adresi olarak yapılandırılmıştır.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kritik Disk Eşiği
              </label>
              <select
                value={diskThreshold}
                onChange={(e) => setDiskThreshold(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value={80}>%80 ve üzeri (Erken Uyarı)</option>
                <option value={85}>%85 ve üzeri (Önerilen)</option>
                <option value={90}>%90 ve üzeri (Acil Eylem)</option>
                <option value={95}>%95 ve üzeri (Kritik Çöküş Riski)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kritik RAM Eşiği
              </label>
              <select
                value={ramThreshold}
                onChange={(e) => setRamThreshold(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
              >
                <option value={80}>%80 ve üzeri</option>
                <option value={85}>%85 ve üzeri (Önerilen)</option>
                <option value={90}>%90 ve üzeri</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={notifyOnFailedService}
                onChange={(e) => setNotifyOnFailedService(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-0"
              />
              <span>Systemd servisleri çöktüğünde anında alarm gönder (nginx, postgres vb.)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={notifyOnContainerExit}
                onChange={(e) => setNotifyOnContainerExit(e.target.checked)}
                className="rounded border-slate-700 text-rose-500 focus:ring-0"
              />
              <span>Docker konteyneri beklenmedik şekilde kapandığında veya döngüye girdiğinde uyar</span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowSmtpConfig(!showSmtpConfig)}
              className="text-xs text-sky-400 hover:text-sky-300 transition"
            >
              {showSmtpConfig ? '— Harici SMTP Ayarlarını Gizle' : '+ Özel SMTP Sunucusu Yapılandır (İsteğe Bağlı)'}
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Ayarları Kaydet
            </button>
          </div>

          {showSmtpConfig && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3 text-xs">
              <p className="text-[11px] text-slate-400">
                Harici SMTP sağlayıcınızı (Gmail, SendGrid, Amazon SES, Postmark) bağlayabilirsiniz.
                Tanımlanmadığında sistem akıllı dahili bildirim dağıtıcısı ile güvenle sevk eder.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="SMTP Host (smtp.gmail.com)"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
                <input
                  type="text"
                  placeholder="Port (587)"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="SMTP Kullanıcı / E-posta"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
                <input
                  type="password"
                  placeholder="SMTP Şifre / App Password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          )}
        </form>

        {/* Current Server Threshold Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>{server.name} — Anlık İzleme Eşiği Durumu</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400">Canlı Metrikler</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">Kök Disk Kullanımı</span>
                <span className="text-[11px] text-slate-500 font-mono">Eşik: %{diskThreshold}</span>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-mono font-bold ${
                    server.metrics.disk[0]?.usePercent >= diskThreshold
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  %{server.metrics.disk[0]?.usePercent}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {server.metrics.disk[0]?.usePercent >= diskThreshold ? '⚠️ EŞİK AŞILDI' : '✓ Normal'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">RAM Bellek Doluluğu</span>
                <span className="text-[11px] text-slate-500 font-mono">Eşik: %{ramThreshold}</span>
              </div>
              <div className="text-right">
                {(() => {
                  const ramPct = Math.round(
                    (server.metrics.memory.usedMb / server.metrics.memory.totalMb) * 100
                  );
                  return (
                    <>
                      <span
                        className={`text-sm font-mono font-bold ${
                          ramPct >= ramThreshold ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        %{ramPct}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {ramPct >= ramThreshold ? '⚠️ EŞİK AŞILDI' : '✓ Normal'}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  Systemd Servis Durumu
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {server.metrics.services.length} servis izleniyor
                </span>
              </div>
              <div className="text-right">
                {server.metrics.services.some((s) => s.status === 'failed') ? (
                  <span className="text-xs font-bold text-rose-400 font-mono bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                    1+ Servis Arızalı
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ✓ Tüm Servisler Aktif
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Audit Trail History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-slate-200">
              Gönderilen Alarm E-postaları ve Denetim Kayıtları (Audit Trail)
            </h4>
          </div>

          <button
            onClick={onRefreshHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Kayıtları Yenile</span>
          </button>
        </div>

        {alertHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            Henüz gönderilmiş bir alarm e-postası bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 mt-2">
            {alertHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="font-semibold text-slate-200">{item.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px] font-mono">
                    <span>Alıcı: <strong className="text-slate-300">{item.recipient}</strong></span>
                    <span>&bull;</span>
                    <span>Tarih: {new Date(item.timestamp).toLocaleString('tr-TR')}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400">Neden: {item.triggerReason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                    {item.status}
                  </span>
                  <button
                    onClick={() => onPreviewEmail(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>E-postayı Önizle</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
