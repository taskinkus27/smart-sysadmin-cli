import React from 'react';
import { ServerDetail } from '../types';
import {
  Cpu,
  HardDrive,
  Activity,
  Box,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Server as ServerIcon,
  Play,
  RotateCcw,
} from 'lucide-react';

interface OverviewTabProps {
  server: ServerDetail;
  onNavigateToAi: () => void;
  onExecuteCommand: (cmd: string) => void;
  executingCmd: string | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  server,
  onNavigateToAi,
  onExecuteCommand,
  executingCmd,
}) => {
  const rootDisk = server.metrics.disk.find((d) => d.mount === '/') || server.metrics.disk[0];
  const diskPercent = rootDisk?.usePercent || 0;
  const ramUsed = server.metrics.memory.usedMb;
  const ramTotal = server.metrics.memory.totalMb;
  const ramPercent = Math.round((ramUsed / ramTotal) * 100);
  const cpuPercent = server.metrics.cpu.usagePercent;

  const failedServices = server.metrics.services.filter((s) => s.status === 'failed');
  const unhealthyContainers = server.metrics.docker.filter(
    (d) => d.state === 'restarting' || d.state === 'exited'
  );

  const hasCriticalIssue = diskPercent >= 90 || ramPercent >= 90 || failedServices.length > 0;

  return (
    <div className="space-y-6">
      {/* Critical System Banner if issue exists */}
      {hasCriticalIssue && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-rose-950/80 via-red-900/40 to-slate-900 border border-rose-600/50 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-rose-200">
                    Kritik Sistem Darboğazı & Disk Uyarısı Tespit Edildi
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider">
                    Eylem Gerekiyor
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 mt-1 max-w-2xl">
                  {diskPercent >= 90 && (
                    <span>
                      • Kök dizin (/) doluluğu <strong>%{diskPercent}</strong> seviyesine ulaştı. 
                      /var/log/journal ve eski Docker katmanları kritik yer kaplıyor.{' '}
                    </span>
                  )}
                  {failedServices.length > 0 && (
                    <span>
                      • Çöken servisler: <strong>{failedServices.map((s) => s.name).join(', ')}</strong>.{' '}
                    </span>
                  )}
                  {unhealthyContainers.length > 0 && (
                    <span>
                      • Hatalı konteynerler:{' '}
                      <strong>{unhealthyContainers.map((c) => c.name).join(', ')}</strong>.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={onNavigateToAi}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gemini ile Reçeteyi Uygula</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Meta Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">Sunucu Host / IP</span>
          <span className="text-slate-100 font-semibold">{server.host}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">İşletim Sistemi</span>
          <span className="text-slate-100 font-semibold">{server.os}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">Kernel</span>
          <span className="text-slate-100 font-semibold">{server.kernel}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] font-sans">Sistem Uptime</span>
          <span className="text-slate-100 font-semibold">{server.uptime}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" /> CPU Kullanımı
            </span>
            <span className="text-xs font-mono text-slate-400">{server.metrics.cpu.cores} Çekirdek</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-slate-100">%{cpuPercent}</span>
            <span className="text-xs text-slate-400">aktif yük</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cpuPercent > 80 ? 'bg-rose-500' : cpuPercent > 60 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(cpuPercent, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Load Avg:</span>
            <span className="text-slate-200">{server.metrics.cpu.loadAvg.join(', ')}</span>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> RAM Bellek
            </span>
            <span className="text-xs font-mono text-slate-400">
              {Math.round(ramTotal / 1024)} GB
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-slate-100">%{ramPercent}</span>
            <span className="text-xs text-slate-400">
              ({Math.round(ramUsed / 1024)}GB / {Math.round(ramTotal / 1024)}GB)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ramPercent > 85 ? 'bg-rose-500' : ramPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(ramPercent, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Swap:</span>
            <span className="text-slate-200">
              {server.metrics.memory.swapUsedMb}MB / {server.metrics.memory.swapTotalMb}MB
            </span>
          </div>
        </div>

        {/* Disk Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" /> Kök Disk (/)
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                diskPercent >= 90 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {rootDisk?.size}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className={`text-3xl font-bold font-mono ${
                diskPercent >= 90 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
              }`}
            >
              %{diskPercent}
            </span>
            <span className="text-xs text-slate-400">
              ({rootDisk?.used} dolu / {rootDisk?.avail} boş)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                diskPercent >= 90 ? 'bg-rose-500' : diskPercent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(diskPercent, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between font-mono">
            <span>Durum:</span>
            <span className={diskPercent >= 90 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {diskPercent >= 90 ? 'KRİTİK EŞİK AŞILDI' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Docker & Services Health Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-4 h-4 text-purple-400" /> Docker & Servisler
            </span>
            <span className="text-xs font-mono text-slate-400">
              {server.metrics.docker.length} Konteyner
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-slate-100">
              {server.metrics.docker.filter((d) => d.state === 'running').length} /{' '}
              {server.metrics.docker.length || server.metrics.services.length}
            </span>
            <span className="text-xs text-slate-400">aktif</span>
          </div>
          <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
            {failedServices.length > 0 ? (
              <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{failedServices.length} arızalı systemd servisi</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Tüm temel servisler aktif</span>
              </div>
            )}
            {unhealthyContainers.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{unhealthyContainers.length} konteyner yeniden başlıyor / durdu</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Disk Partition Explorer & Top Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disk Partitions (df -h) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">Disk Bölümleri & Doluluk Dağılımı</h4>
            </div>
            <span className="text-xs font-mono text-slate-500">df -h</span>
          </div>

          <div className="space-y-3.5">
            {server.metrics.disk.map((d) => {
              const isCrit = d.usePercent >= 90;
              const isWarn = d.usePercent >= 75 && d.usePercent < 90;
              return (
                <div key={d.mount} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{d.mount}</span>
                      <span className="text-slate-500 text-[11px] font-mono">({d.filesystem})</span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      %{d.usePercent} ({d.used} / {d.size})
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(d.usePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>Boş Alan: {d.avail}</span>
                    {isCrit && <span className="text-rose-400 font-semibold">⚠️ Temizlik Önerilir</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Safe Clean Trigger */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Eski logları güvenle silmek için:
            </span>
            <button
              onClick={() => onExecuteCommand('sudo journalctl --vacuum-time=3d')}
              disabled={executingCmd !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-300 border border-slate-700 transition"
            >
              <RotateCcw className={`w-3 h-3 ${executingCmd === 'sudo journalctl --vacuum-time=3d' ? 'animate-spin' : ''}`} />
              <span>vacuum journal (3d)</span>
            </button>
          </div>
        </div>

        {/* Top Resource Consuming Processes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-bold text-slate-200">En Çok Kaynak Tüketen Süreçler</h4>
            </div>
            <span className="text-xs font-mono text-slate-500">ps aux --sort=-%cpu</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-semibold">PID</th>
                  <th className="pb-2 font-semibold">KULLANICI</th>
                  <th className="pb-2 font-semibold">%CPU</th>
                  <th className="pb-2 font-semibold">%MEM</th>
                  <th className="pb-2 font-semibold">KOMUT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {server.metrics.cpu.topProcesses.map((p) => (
                  <tr key={p.pid} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 text-slate-400">{p.pid}</td>
                    <td className="py-2.5 text-slate-300">{p.user}</td>
                    <td className="py-2.5 font-bold text-sky-400">%{p.cpu}</td>
                    <td className="py-2.5 text-emerald-400">%{p.mem}</td>
                    <td className="py-2.5 text-slate-200 truncate max-w-[200px]" title={p.command}>
                      {p.command}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Docker katmanlarını temizlemek için:</span>
            <button
              onClick={() => onExecuteCommand('sudo docker system prune -f')}
              disabled={executingCmd !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-purple-300 border border-slate-700 transition"
            >
              <RotateCcw className={`w-3 h-3 ${executingCmd === 'sudo docker system prune -f' ? 'animate-spin' : ''}`} />
              <span>docker system prune</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
