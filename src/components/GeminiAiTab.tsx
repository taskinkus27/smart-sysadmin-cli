import React, { useState } from 'react';
import { GeminiDiagnosis, RemediationStep, ServerDetail } from '../types';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  Play,
  RotateCw,
  Send,
  Terminal,
  Info,
  ShieldAlert,
  Mail,
  Flame,
  Check,
} from 'lucide-react';

interface GeminiAiTabProps {
  server: ServerDetail;
  diagnosis: GeminiDiagnosis | null;
  isLoading: boolean;
  onRefreshDiagnose: () => void;
  onExecuteCommand: (cmd: string) => Promise<void>;
  executingCmd: string | null;
  onOpenSendEmail: (recommendedSubject?: string, recommendedSnippet?: string) => void;
}

export const GeminiAiTab: React.FC<GeminiAiTabProps> = ({
  server,
  diagnosis,
  isLoading,
  onRefreshDiagnose,
  onExecuteCommand,
  executingCmd,
  onOpenSendEmail,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [executingAll, setExecutingAll] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'user' | 'gemini'; text: string; timestamp: string }>
  >([
    {
      sender: 'gemini',
      text: `Merhaba! Ben sunucunuz (${server.name}) için çalışan yapay zeka destekli SysAdmin asistanıyım. Disk dolulukları, /var/log kayıtları, Docker container hataları veya özel Bash komutları hakkında her şeyi bana sorabilirsiniz.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleExecuteAllSafe = async () => {
    if (!diagnosis) return;
    const safeSteps = diagnosis.remediations.filter((r) => r.safetyLevel === 'SAFE');
    if (safeSteps.length === 0) return;

    setExecutingAll(true);
    for (const step of safeSteps) {
      await onExecuteCommand(step.command);
    }
    setExecutingAll(false);
  };

  const handleAskSysAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isAsking) return;

    const queryText = userQuery.trim();
    setUserQuery('');
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: queryText, timestamp: new Date().toLocaleTimeString() },
    ]);
    setIsAsking(true);

    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, serverId: server.id }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: data.reply || 'Yanıt alınamadı.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: `Hata oluştu: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const getSafetyBadge = (level: string) => {
    switch (level) {
      case 'SAFE':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" /> GÜVENLİ (SAFE)
          </span>
        );
      case 'CAUTION':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> DİKKAT (CAUTION)
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Flame className="w-3 h-3" /> RİSKLİ (CRITICAL)
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
            {level}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top AI Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 font-mono">
                Gemini SRE Kök Neden Teşhisi & Güvenli Reçeteler
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                models/gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Sunucu günlüklerini, disk doluluk paternlerini ve çöken Docker/systemd servislerini
              anlık analiz ederek sistem çökmesini önleyen güvenli Bash komutları üretir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={onRefreshDiagnose}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analiz Yapılıyor...' : 'Yeniden Teşhis Et'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-inner">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            Gemini 3.8 Flash Sunucu Durumunu Analiz Ediyor...
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            /var/log kayıtları, disk inode ve blok dolulukları, Docker hata logları ve bellek
            sızıntıları taranıyor. Güvenli çözüm komutları hazırlanıyor.
          </p>
        </div>
      ) : diagnosis ? (
        <div className="space-y-6">
          {/* Incident Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                  Teşhis Raporu
                </span>
                <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                  {diagnosis.incidentTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    diagnosis.overallHealth === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : diagnosis.overallHealth === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  Genel Durum: {diagnosis.overallHealth}
                </span>

                {diagnosis.alertEmailRecommended && (
                  <button
                    onClick={() =>
                      onOpenSendEmail(
                        diagnosis.emailAlert?.subject,
                        diagnosis.remediations[0]?.command
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Alarm E-postası Gönder</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-4 leading-relaxed font-sans">
              {diagnosis.summary}
            </p>

            {/* Issues Breakdown */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {diagnosis.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      {issue.component}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-slate-300">{issue.description}</p>
                  {issue.impact && (
                    <p className="text-slate-400 text-[11px] mt-1.5 pt-1.5 border-t border-slate-800/60 font-sans italic">
                      Etki: {issue.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Remediation Recipes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Adım Adım Güvenli Çözüm Komutları (Safe Remediations)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Her komutun arkasındaki mekanizma, güvenlik seviyesi ve kurtarılacak disk boyutu
                  belirtilmiştir.
                </p>
              </div>

              {diagnosis.remediations.some((r) => r.safetyLevel === 'SAFE') && (
                <button
                  onClick={handleExecuteAllSafe}
                  disabled={executingAll || executingCmd !== null}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{executingAll ? 'Çalıştırılıyor...' : 'Tüm Güvenli Adımları Sırayla Uygula'}</span>
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {diagnosis.remediations.map((step, idx) => {
                const isCurrentlyExecuting = executingCmd === step.command;
                const isCopied = copiedCmd === step.command;

                return (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[11px] font-mono font-bold text-slate-300">
                          {idx + 1}
                        </span>
                        <h5 className="font-semibold text-slate-200 text-sm">{step.title}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSafetyBadge(step.safetyLevel)}
                        {step.expectedGain && (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                            +{step.expectedGain}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Command Box */}
                    <div className="relative mt-2 bg-slate-900/90 rounded-lg p-3 font-mono text-xs text-emerald-300 border border-slate-800 flex items-center justify-between group">
                      <div className="flex items-center gap-2 overflow-x-auto pr-16 select-all">
                        <span className="text-slate-500 select-none">$</span>
                        <code className="text-emerald-300 font-semibold">{step.command}</code>
                      </div>
                      <div className="absolute right-2 flex items-center gap-1 bg-slate-900/95 pl-2">
                        <button
                          onClick={() => handleCopy(step.command)}
                          title="Komutu Kopyala"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onExecuteCommand(step.command)}
                          disabled={isCurrentlyExecuting || executingCmd !== null}
                          title="Sunucuda Çalıştır"
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                        >
                          <Play className={`w-3 h-3 fill-current ${isCurrentlyExecuting ? 'animate-pulse' : ''}`} />
                          <span>{isCurrentlyExecuting ? 'Çalışıyor...' : 'Çalıştır'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Explanations */}
                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <p className="flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{step.explanation}</span>
                      </p>
                      {step.rollbackNote && (
                        <p className="flex items-start gap-1.5 text-slate-400 italic">
                          <span className="text-amber-400 text-[11px] font-bold">Güvenlik Notu:</span>
                          <span>{step.rollbackNote}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive SysAdmin AI Chat Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-200">
              SysAdmin AI Asistanı ile Doğrudan Soru-Cevap
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Sunucu durumuna göre özelleştirilmiş danışmanlık
          </span>
        </div>

        {/* Chat message feed */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 mb-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none font-sans'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                <span className="text-[10px] text-slate-400 block mt-1 text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Gemini düşünüyor ve sunucu mimarisini inceliyor...</span>
            </div>
          )}
        </div>

        {/* Query Input */}
        <form onSubmit={handleAskSysAdmin} className="flex gap-2">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Örn: Nginx 502 hatasını nasıl debug edebilirim? Veya swap boyutunu nasıl artırırım?"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
          />
          <button
            type="submit"
            disabled={!userQuery.trim() || isAsking}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sor</span>
          </button>
        </form>
      </div>
    </div>
  );
};
