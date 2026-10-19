/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServerSummary, ServerDetail, GeminiDiagnosis, AlertEmailRecord } from './types';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { GeminiAiTab } from './components/GeminiAiTab';
import { LogsTab } from './components/LogsTab';
import { DockerServicesTab } from './components/DockerServicesTab';
import { TerminalTab } from './components/TerminalTab';
import { AlertsTab } from './components/AlertsTab';
import { NewServerModal } from './components/NewServerModal';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function App() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [activeServerId, setActiveServerId] = useState<string>('prod-app-01');
  const [activeServer, setActiveServer] = useState<ServerDetail | null>(null);

  const [activeTab, setActiveTab] = useState<string>('overview');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [executingCmd, setExecutingCmd] = useState<string | null>(null);

  const [diagnosis, setDiagnosis] = useState<GeminiDiagnosis | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertEmailRecord[]>([]);
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);

  const [isNewServerModalOpen, setIsNewServerModalOpen] = useState(false);
  const [previewingAlert, setPreviewingAlert] = useState<AlertEmailRecord | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warn' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch servers list
  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      const data = await res.json();
      if (data.servers) {
        setServers(data.servers);
      }
    } catch (err) {
      console.error('Failed to load servers:', err);
    }
  };

  // Fetch single server detailed metrics
  const fetchServerDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/servers/${id}`);
      const data = await res.json();
      if (data.server) {
        setActiveServer(data.server);
      }
    } catch (err) {
      console.error('Failed to fetch server details:', err);
    }
  };

  // Fetch alert emails audit history
  const fetchAlertHistory = async () => {
    try {
      const res = await fetch('/api/alerts/history');
      const data = await res.json();
      if (data.history) {
        setAlertHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to fetch alert history:', err);
    }
  };

  useEffect(() => {
    fetchServers();
    fetchServerDetails(activeServerId);
    fetchAlertHistory();
  }, [activeServerId]);

  // Initial auto-diagnose on startup for immediate value
  useEffect(() => {
    if (activeServer && !diagnosis && !isDiagnosing) {
      handleRunGeminiDiagnose();
    }
  }, [activeServer?.id]);

  // Execute full health scan
  const handleQuickScan = async () => {
    if (!activeServer) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: activeServer.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServerDetails(activeServer.id);
        await fetchServers();
        if (data.scan.isCritical) {
          showToast(
            `Tarama tamamlandı: ${data.scan.alerts.length} adet kritik sorun tespit edildi!`,
            'warn'
          );
        } else {
          showToast('Tek tıkla tarama tamamlandı: Sistem değerleri normal.', 'success');
        }
      }
    } catch (err: any) {
      showToast(`Tarama hatası: ${err.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Run deep Gemini AI diagnosis
  const handleRunGeminiDiagnose = async (customPrompt?: string) => {
    if (!activeServer) return;
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: activeServer.id, customPrompt }),
      });
      const data = await res.json();
      if (data.success && data.diagnosis) {
        setDiagnosis(data.diagnosis);
        showToast('Gemini SRE teşhisi ve güvenli reçeteler güncellendi.', 'success');
      } else {
        showToast(data.error || 'Gemini analizi tamamlanamadı.', 'error');
      }
    } catch (err: any) {
      showToast(`AI analiz hatası: ${err.message}`, 'error');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Execute command on server (either safe remediation, docker command, or terminal command)
  const handleExecuteCommand = async (cmd: string) => {
    if (!activeServer) return null;
    setExecutingCmd(cmd);
    try {
      const res = await fetch('/api/ssh/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: activeServer.id, command: cmd }),
      });
      const data = await res.json();

      // Refresh server metrics to reflect freed disk space or restarted services!
      await fetchServerDetails(activeServer.id);
      await fetchServers();

      showToast(`Komut başarıyla çalıştırıldı: ${cmd}`, 'success');
      return data;
    } catch (err: any) {
      showToast(`Komut hatası: ${err.message}`, 'error');
      return { stderr: err.message, exitCode: 1 };
    } finally {
      setExecutingCmd(null);
    }
  };

  // Trigger alert email to recipient
  const handleTriggerAlert = async (customRecipient?: string, subject?: string) => {
    if (!activeServer) return;
    setIsSendingAlert(true);
    try {
      const recipient = customRecipient || 'kustaskin@gmail.com';
      const rootDisk = activeServer.metrics.disk[0];

      const res = await fetch('/api/alerts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          subject,
          serverId: activeServer.id,
          severity:
            rootDisk?.usePercent >= 90 || activeServer.metrics.services.some((s) => s.status === 'failed')
              ? 'CRITICAL'
              : 'WARNING',
          triggerReason: `Disk doluluğu %${rootDisk?.usePercent || 92} & ${
            activeServer.metrics.services.filter((s) => s.status === 'failed').length
          } arızalı servis`,
          remediationSnippet: diagnosis?.remediations[0]?.command || 'sudo journalctl --vacuum-time=3d',
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchAlertHistory();
        showToast(
          `Alarm e-postası başarıyla gönderildi: ${recipient}`,
          'success'
        );
        if (data.alert) {
          setPreviewingAlert(data.alert);
        }
      }
    } catch (err: any) {
      showToast(`E-posta gönderim hatası: ${err.message}`, 'error');
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Add new server
  const handleAddServer = async (serverData: any) => {
    try {
      const res = await fetch('/api/servers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServers();
        setActiveServerId(data.server.id);
        showToast(`Sunucu eklendi ve bağlantı kuruldu: ${data.server.name}`, 'success');
      }
    } catch (err: any) {
      showToast(`Sunucu ekleme hatası: ${err.message}`, 'error');
    }
  };

  const handleAskGeminiAboutLog = (logSnippet: string) => {
    setActiveTab('gemini');
    handleRunGeminiDiagnose(`Şu log kayıtlarındaki hatanın kök nedenini analiz et: \n${logSnippet}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10'
                : toastMessage.type === 'warn'
                ? 'bg-slate-900 border-amber-500/50 text-amber-300 shadow-amber-500/10'
                : 'bg-slate-900 border-rose-500/50 text-rose-300 shadow-rose-500/10'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        servers={servers}
        activeServer={activeServer}
        onSelectServer={(id) => setActiveServerId(id)}
        onOpenNewServerModal={() => setIsNewServerModalOpen(true)}
        onQuickScan={handleQuickScan}
        onRunGeminiDiagnose={() => {
          setActiveTab('gemini');
          handleRunGeminiDiagnose();
        }}
        onOpenSendEmail={() => {
          setActiveTab('alerts');
          handleTriggerAlert();
        }}
        isScanning={isScanning}
        isDiagnosing={isDiagnosing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeServer ? (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                server={activeServer}
                onNavigateToAi={() => setActiveTab('gemini')}
                onExecuteCommand={handleExecuteCommand}
                executingCmd={executingCmd}
              />
            )}

            {activeTab === 'gemini' && (
              <GeminiAiTab
                server={activeServer}
                diagnosis={diagnosis}
                isLoading={isDiagnosing}
                onRefreshDiagnose={() => handleRunGeminiDiagnose()}
                onExecuteCommand={handleExecuteCommand}
                executingCmd={executingCmd}
                onOpenSendEmail={(subj, snippet) => {
                  setActiveTab('alerts');
                  handleTriggerAlert('kustaskin@gmail.com', subj);
                }}
              />
            )}

            {activeTab === 'logs' && (
              <LogsTab
                server={activeServer}
                onExecuteCommand={handleExecuteCommand}
                executingCmd={executingCmd}
                onAskGeminiAboutLog={handleAskGeminiAboutLog}
              />
            )}

            {activeTab === 'docker' && (
              <DockerServicesTab
                server={activeServer}
                onExecuteCommand={handleExecuteCommand}
                executingCmd={executingCmd}
              />
            )}

            {activeTab === 'terminal' && (
              <TerminalTab
                server={activeServer}
                onExecuteCommand={handleExecuteCommand}
                isExecuting={executingCmd !== null}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsTab
                server={activeServer}
                alertHistory={alertHistory}
                onTriggerAlert={handleTriggerAlert}
                isSending={isSendingAlert}
                onPreviewEmail={(item) => setPreviewingAlert(item)}
                onRefreshHistory={fetchAlertHistory}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-20 text-slate-500 font-mono text-sm">
            Sunucu verileri yükleniyor...
          </div>
        )}
      </main>

      {/* Modals */}
      <NewServerModal
        isOpen={isNewServerModalOpen}
        onClose={() => setIsNewServerModalOpen(false)}
        onAddServer={handleAddServer}
      />

      <EmailPreviewModal
        alert={previewingAlert}
        onClose={() => setPreviewingAlert(null)}
      />
    </div>
  );
}
