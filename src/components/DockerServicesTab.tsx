import React from 'react';
import { ServerDetail, DockerContainer, SystemService } from '../types';
import {
  Box,
  Server,
  Play,
  RotateCcw,
  Square,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

interface DockerServicesTabProps {
  server: ServerDetail;
  onExecuteCommand: (cmd: string) => void;
  executingCmd: string | null;
}

export const DockerServicesTab: React.FC<DockerServicesTabProps> = ({
  server,
  onExecuteCommand,
  executingCmd,
}) => {
  return (
    <div className="space-y-6">
      {/* Docker Containers Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Docker Konteynerleri & Orkestrasyon
              </h3>
              <p className="text-xs text-slate-400">
                Çalışan, çöken veya yeniden başlama döngüsüne giren konteynerlerin izlenmesi
              </p>
            </div>
          </div>

          <button
            onClick={() => onExecuteCommand('sudo docker system prune -f')}
            disabled={executingCmd !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/60 text-xs font-semibold shadow transition disabled:opacity-50"
            title="Kullanılmayan imaj ve derleme katmanlarını temizler"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kullanılmayan Katmanları Temizle (Prune)</span>
          </button>
        </div>

        {server.metrics.docker.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            Bu sunucuda aktif Docker daemon veya tanımlı konteyner bulunmuyor.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {server.metrics.docker.map((container) => {
              const isRestarting = container.state === 'restarting';
              const isExited = container.state === 'exited';

              return (
                <div
                  key={container.id}
                  className={`bg-slate-950/80 border rounded-xl p-4 transition ${
                    isRestarting
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : isExited
                      ? 'border-rose-500/50 bg-rose-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                          container.state === 'running'
                            ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse'
                            : isRestarting
                            ? 'bg-amber-400 shadow-md shadow-amber-400/50 animate-ping'
                            : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-mono font-bold text-sm text-slate-100">
                            {container.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {container.id.substring(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          İmaj: <span className="text-slate-300">{container.image}</span>
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs font-mono text-right">
                        <div className="text-slate-300 font-bold">{container.status}</div>
                        <div className="text-slate-500 text-[11px]">
                          CPU: %{container.cpuPercent} &bull; RAM: {container.memUsage}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onExecuteCommand(`sudo docker restart ${container.name}`)}
                          disabled={executingCmd !== null}
                          title="Konteyneri Yeniden Başlat"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onExecuteCommand(`sudo docker stop ${container.name}`)}
                          disabled={executingCmd !== null}
                          title="Konteyneri Durdur"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {container.ports && container.ports !== '-' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className="text-slate-500">Port Eşlemesi:</span>
                      <span className="text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/60">
                        {container.ports}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Systemd Services Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono">
                Systemd Temel Servisleri
              </h3>
              <p className="text-xs text-slate-400">
                Arka plan sistem servislerinin (systemctl status) durumu
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {server.metrics.services.length} Servis
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {server.metrics.services.map((svc) => {
            const isFailed = svc.status === 'failed';
            return (
              <div
                key={svc.name}
                className={`bg-slate-950 p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isFailed
                    ? 'border-rose-500/50 bg-rose-950/20'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-200">{svc.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isFailed
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {svc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{svc.description}</p>
                </div>

                <button
                  onClick={() => onExecuteCommand(`sudo systemctl restart ${svc.name}`)}
                  disabled={executingCmd !== null}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                    isFailed
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Servisi Yeniden Başlat"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isFailed ? 'Düzelt & Başlat' : 'Yenile'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
