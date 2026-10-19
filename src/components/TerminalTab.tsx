import React, { useState, useRef, useEffect } from 'react';
import { ServerDetail } from '../types';
import { Terminal as TerminalIcon, Play, Trash2, ArrowRight, CornerDownLeft } from 'lucide-react';

interface TerminalTabProps {
  server: ServerDetail;
  onExecuteCommand: (cmd: string) => Promise<any>;
  isExecuting: boolean;
}

interface CommandLog {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  server,
  onExecuteCommand,
  isExecuting,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      command: 'uname -a && uptime',
      output: `${server.kernel}\n ${new Date().toLocaleTimeString()} up ${server.uptime}, 2 users, load average: ${server.metrics.cpu.loadAvg.join(', ')}`,
      exitCode: 0,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      command: 'smart-sysadmin --check-health',
      output: `[INFO] Smart SysAdmin CLI v2.4 initialized on ${server.name} (${server.host})\n[WARN] Root disk usage: ${server.metrics.disk[0]?.usePercent}%\n[ALERT] Failed service: nginx.service (Worker exited)\nType "help" or click presets below for rapid maintenance.`,
      exitCode: 0,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    if (trimmed === 'clear') {
      setLogs([]);
      setInputVal('');
      return;
    }

    if (trimmed === 'help') {
      setLogs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: trimmed,
          output: `Smart SysAdmin CLI Kullanılabilir Komutlar:
  • df -h                       : Disk bölümlerini ve doluluk oranlarını listeler
  • free -m                     : RAM ve Swap bellek durumunu gösterir
  • uptime                      : Sunucu çalışma süresi ve load average
  • top                         : En çok kaynak tüketen süreçleri gösterir
  • journalctl --vacuum-time=3d : 3 günden eski systemd loglarını siler
  • docker system prune -f      : Kullanılmayan Docker katmanlarını temizler
  • systemctl restart nginx     : Nginx web servisini yeniden başlatır
  • clear                       : Terminal ekranını temizler`,
          exitCode: 0,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setInputVal('');
      return;
    }

    const res = await onExecuteCommand(trimmed);
    if (res) {
      setLogs((prev) => [
        ...prev,
        {
          id: `cmd-${Date.now()}`,
          command: trimmed,
          output: res.stdout || res.stderr || '[Done]',
          exitCode: res.exitCode ?? 0,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(history[nextIndex]);
      }
    }
  };

  const quickPresets = [
    'df -h',
    'free -m',
    'uptime',
    'top',
    'sudo journalctl --vacuum-time=3d',
    'sudo docker system prune -f',
    'sudo systemctl restart nginx',
  ];

  return (
    <div className="space-y-4">
      {/* Quick Action Presets Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Hızlı Komutlar:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => runCommand(preset)}
              disabled={isExecuting}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 font-mono text-[11px] border border-slate-700 transition"
            >
              {preset}
            </button>
          ))}
          <button
            onClick={() => setLogs([])}
            title="Terminali Temizle"
            className="p-1 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-slate-400 text-[11px] ml-2">
              sysadmin@{server.name}:~ (SSH-2.0-OpenSSH)
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
            CANLI BAĞLANTI
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-4 space-y-3 min-h-[420px] max-h-[580px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-sky-400 font-bold">sysadmin@{server.name}</span>
                <span className="text-slate-500">:</span>
                <span className="text-amber-300">~</span>
                <span className="text-slate-400">$</span>
                <span className="text-slate-100 font-semibold">{log.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{log.timestamp}</span>
              </div>
              <div className="text-slate-300 whitespace-pre-wrap pl-4 leading-relaxed font-mono">
                {log.output}
              </div>
            </div>
          ))}

          {isExecuting && (
            <div className="flex items-center gap-2 text-sky-400 italic py-1">
              <span className="animate-spin">⠋</span>
              <span>Komut sunucuda yürütülüyor...</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Prompt Input Bar */}
        <div className="bg-slate-900/90 px-4 py-2.5 border-t border-slate-800 flex items-center gap-2">
          <span className="text-sky-400 font-bold">sysadmin@{server.name}</span>
          <span className="text-slate-500">:</span>
          <span className="text-amber-300">~</span>
          <span className="text-slate-400">$</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir Bash komutu yazın... ('help' yazarak yardım alabilirsiniz)"
            className="flex-1 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none placeholder:text-slate-600"
            autoFocus
          />
          <button
            onClick={() => runCommand(inputVal)}
            disabled={!inputVal.trim() || isExecuting}
            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-30"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
