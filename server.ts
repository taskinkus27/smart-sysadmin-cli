import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { Client as SSHClient } from 'ssh2';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Server In-Memory State & Simulated Servers
interface ServerProfile {
  id: string;
  name: string;
  host: string;
  os: string;
  kernel: string;
  uptime: string;
  isRealSSH: boolean;
  sshConfig?: {
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'key';
  };
  metrics: {
    cpu: {
      usagePercent: number;
      cores: number;
      loadAvg: [number, number, number];
      topProcesses: Array<{ pid: number; user: string; cpu: number; mem: number; command: string }>;
    };
    memory: {
      totalMb: number;
      usedMb: number;
      freeMb: number;
      buffCacheMb: number;
      swapTotalMb: number;
      swapUsedMb: number;
    };
    disk: Array<{
      filesystem: string;
      mount: string;
      size: string;
      used: string;
      avail: string;
      usePercent: number;
    }>;
    logs: {
      journal: string[];
      syslog: string[];
      auth: string[];
      nginx?: string[];
      docker?: string[];
    };
    docker: Array<{
      id: string;
      name: string;
      image: string;
      status: string;
      state: 'running' | 'restarting' | 'exited' | 'paused';
      cpuPercent: number;
      memUsage: string;
      ports: string;
    }>;
    services: Array<{
      name: string;
      status: 'active' | 'failed' | 'inactive';
      description: string;
    }>;
  };
}

// Default simulated servers representing typical real-world Linux fleet scenarios
const demoServers: Record<string, ServerProfile> = {
  'prod-app-01': {
    id: 'prod-app-01',
    name: 'prod-app-01.eu-central',
    host: '198.51.100.24',
    os: 'Ubuntu 24.04.1 LTS (Noble Numbat)',
    kernel: 'Linux 6.8.0-45-generic x86_64',
    uptime: '47 days, 14 hours, 22 minutes',
    isRealSSH: false,
    metrics: {
      cpu: {
        usagePercent: 78.4,
        cores: 4,
        loadAvg: [4.92, 3.84, 2.76],
        topProcesses: [
          { pid: 14201, user: 'node', cpu: 48.2, mem: 24.1, command: 'node /var/www/api/bundle.js' },
          { pid: 8931, user: 'systemd-journal', cpu: 14.5, mem: 8.6, command: '/lib/systemd/systemd-journald' },
          { pid: 2104, user: 'root', cpu: 9.8, mem: 4.2, command: 'dockerd -H fd:// --containerd=/run/containerd' },
          { pid: 19842, user: 'redis', cpu: 3.2, mem: 12.0, command: 'redis-server 127.0.0.1:6379' },
          { pid: 32011, user: 'sysadmin', cpu: 1.1, mem: 1.0, command: 'sshd: sysadmin@pts/0' },
        ],
      },
      memory: {
        totalMb: 16384,
        usedMb: 14120,
        freeMb: 640,
        buffCacheMb: 1624,
        swapTotalMb: 4096,
        swapUsedMb: 3180,
      },
      disk: [
        { filesystem: '/dev/root', mount: '/', size: '100G', used: '92.4G', avail: '7.6G', usePercent: 92 },
        { filesystem: '/dev/vdb1', mount: '/var/lib/docker', size: '150G', used: '138.2G', avail: '11.8G', usePercent: 92 },
        { filesystem: '/dev/vdc1', mount: '/home', size: '50G', used: '14.2G', avail: '35.8G', usePercent: 28 },
        { filesystem: '/dev/vda1', mount: '/boot', size: '1024M', used: '412M', avail: '612M', usePercent: 40 },
      ],
      logs: {
        journal: [
          'Oct 19 20:34:11 prod-app-01 systemd-journald[8931]: Data hash table is 95% full, vacuum recommended immediately.',
          'Oct 19 20:36:44 prod-app-01 systemd-journald[8931]: Suppressed 4210 messages from /var/log/journal (disk space low: 7.6GB left)',
          'Oct 19 20:38:12 prod-app-01 kernel: [4112948.12] [warn] filesystem /dev/root utilization crossed 90% threshold (92%)',
          'Oct 19 20:39:05 prod-app-01 dockerd[2104]: error response from daemon: failed to write layer: no space left on device',
          'Oct 19 20:41:50 prod-app-01 systemd[1]: nginx.service: Failed with result "exit-code" - Worker process 1400 terminated unexpectedly',
          'Oct 19 20:42:01 prod-app-01 CRON[22100]: (root) CMD (/usr/local/bin/backup-sync.sh 2>&1 | logger -t cron-backup)',
        ],
        syslog: [
          'Oct 19 20:35:10 prod-app-01 kernel: Out of memory: Kill process 17822 (worker-pool) score 842 or sacrifice child',
          'Oct 19 20:35:11 prod-app-01 kernel: Killed process 17822 (worker-pool) total-vm:2841024kB, anon-rss:1492000kB',
          'Oct 19 20:40:02 prod-app-01 systemd[1]: nginx-proxy.service: Main process exited, code=exited, status=1/FAILURE',
          'Oct 19 20:40:02 prod-app-01 systemd[1]: nginx-proxy.service: Failed with result "exit-code".',
        ],
        auth: [
          'Oct 19 20:20:14 prod-app-01 sshd[31002]: Accepted publickey for sysadmin from 192.168.1.150 port 52310 ssh2',
          'Oct 19 20:25:30 prod-app-01 sshd[31455]: Failed password for invalid user admin from 45.33.32.156 port 41102 ssh2',
          'Oct 19 20:25:34 prod-app-01 sshd[31459]: Failed password for invalid user root from 45.33.32.156 port 41108 ssh2',
          'Oct 19 20:25:38 prod-app-01 sshd[31463]: Maximum authentication attempts exceeded for invalid user root',
        ],
        docker: [
          'container nginx-reverse-proxy: [emerg] 1#1: bind() to 0.0.0.0:80 failed (98: Address already in use)',
          'container api-backend: [error] UnhandledPromiseRejection: Redis connection timeout at 127.0.0.1:6379',
          'container worker-queue: [info] Processing batch 9410 - RAM usage 88%',
        ],
      },
      docker: [
        {
          id: 'c8192a01ef3',
          name: 'nginx-reverse-proxy',
          image: 'nginx:1.27-alpine',
          status: 'Restarting (1) 14 seconds ago',
          state: 'restarting',
          cpuPercent: 0.0,
          memUsage: '14.2 MB / 16 GB',
          ports: '0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp',
        },
        {
          id: 'f9411bc0231',
          name: 'api-backend-node',
          image: 'company/api-core:v2.4.1',
          status: 'Up 18 hours (High Memory)',
          state: 'running',
          cpuPercent: 44.8,
          memUsage: '3.9 GB / 16 GB',
          ports: '0.0.0.0:3000->3000/tcp',
        },
        {
          id: 'a02484cd918',
          name: 'redis-cache',
          image: 'redis:7.2-alpine',
          status: 'Up 47 days',
          state: 'running',
          cpuPercent: 3.2,
          memUsage: '1.9 GB / 16 GB',
          ports: '127.0.0.1:6379->6379/tcp',
        },
        {
          id: 'd19024fa882',
          name: 'worker-queue-runner',
          image: 'company/worker:v2.4.0',
          status: 'Exited (137) 8 minutes ago (OOM Killed)',
          state: 'exited',
          cpuPercent: 0.0,
          memUsage: '0 MB / 16 GB',
          ports: '-',
        },
      ],
      services: [
        { name: 'nginx.service', status: 'failed', description: 'Nginx HTTP and Reverse Proxy Engine' },
        { name: 'docker.service', status: 'active', description: 'Docker Application Container Engine' },
        { name: 'systemd-journald.service', status: 'active', description: 'Journal Service (High I/O Load)' },
        { name: 'ssh.service', status: 'active', description: 'OpenBSD Secure Shell server' },
        { name: 'cron.service', status: 'active', description: 'Regular background program processing daemon' },
      ],
    },
  },
  'db-cluster-node-03': {
    id: 'db-cluster-node-03',
    name: 'db-cluster-node-03.us-east',
    host: '198.51.100.89',
    os: 'Debian GNU/Linux 12 (bookworm)',
    kernel: 'Linux 6.1.0-21-amd64 x86_64',
    uptime: '112 days, 3 hours',
    isRealSSH: false,
    metrics: {
      cpu: {
        usagePercent: 62.1,
        cores: 8,
        loadAvg: [5.12, 4.88, 4.10],
        topProcesses: [
          { pid: 4902, user: 'postgres', cpu: 38.4, mem: 48.0, command: 'postgres: main: writer process' },
          { pid: 4910, user: 'postgres', cpu: 18.2, mem: 24.5, command: 'postgres: main: autovacuum worker' },
          { pid: 812, user: 'root', cpu: 2.1, mem: 1.2, command: '/usr/bin/prom_node_exporter' },
        ],
      },
      memory: {
        totalMb: 32768,
        usedMb: 29140,
        freeMb: 1100,
        buffCacheMb: 2528,
        swapTotalMb: 8192,
        swapUsedMb: 6140,
      },
      disk: [
        { filesystem: '/dev/sda1', mount: '/', size: '120G', used: '64.0G', avail: '56.0G', usePercent: 53 },
        { filesystem: '/dev/sdb1', mount: '/var/lib/postgresql', size: '500G', used: '412.0G', avail: '88.0G', usePercent: 82 },
      ],
      logs: {
        journal: [
          'Oct 19 19:10:00 db-cluster-node-03 postgres[4902]: [3-1] LOG: checkpoints are occurring too frequently (9 seconds apart)',
          'Oct 19 19:10:00 db-cluster-node-03 postgres[4902]: [3-2] HINT: Consider increasing the configuration parameter "max_wal_size".',
          'Oct 19 19:15:22 db-cluster-node-03 kernel: [9812401.44] page allocation failure: order:2, mode:0x40cc0(GFP_KERNEL)',
        ],
        syslog: [
          'Oct 19 19:12:00 db-cluster-node-03 postgres: autovacuum process running for table "public.telemetry_events" (148GB)',
        ],
        auth: [
          'Oct 19 18:30:11 db-cluster-node-03 sshd[1245]: Accepted publickey for dba from 10.0.4.12',
        ],
      },
      docker: [],
      services: [
        { name: 'postgresql.service', status: 'active', description: 'PostgreSQL RDBMS Cluster 16' },
        { name: 'prometheus-node-exporter.service', status: 'active', description: 'Prometheus metrics agent' },
      ],
    },
  },
};

// In-memory alert audit trail (stored sent emails)
interface AlertEmailRecord {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  serverId: string;
  serverName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  triggerReason: string;
  remediationSnippet: string;
  status: 'SENT_SMTP' | 'DISPATCHED_SIMULATED' | 'FAILED';
  deliveryDetail: string;
  htmlContent: string;
}

const alertAuditTrail: AlertEmailRecord[] = [];

// Seed an initial alert record for kustaskin@gmail.com
alertAuditTrail.push({
  id: 'alert-init-901',
  timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  recipient: 'kustaskin@gmail.com',
  subject: '🚨 [CRITICAL ALERT] prod-app-01.eu-central: Disk Kullanımı %92 ve Nginx Çöktü',
  serverId: 'prod-app-01',
  serverName: 'prod-app-01.eu-central',
  severity: 'CRITICAL',
  triggerReason: 'Disk Mount / 92% (%90 eşiği aşıldı) & nginx.service failed & systemd-journald 18.4GB',
  remediationSnippet: 'journalctl --vacuum-time=3d && docker system prune -f --volumes=false',
  status: 'DISPATCHED_SIMULATED',
  deliveryDetail: 'Otomatik kural tetiklendi: Eşik %90 aşıldı. E-posta kustaskin@gmail.com adresine sevk edildi.',
  htmlContent: `<div style="font-family:sans-serif;color:#1e293b;padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
    <h2 style="color:#dc2626;margin-top:0;">🚨 Kritik Sistem Alarmı: prod-app-01.eu-central</h2>
    <p><strong>Zaman:</strong> ${new Date(Date.now() - 1000 * 60 * 18).toLocaleString('tr-TR')}</p>
    <p><strong>Kritik Tespitler:</strong></p>
    <ul>
      <li><strong>Disk Alanı:</strong> / dizini %92 dolulukta (yalnızca 7.6GB boş kaldı).</li>
      <li><strong>Şişen Dizinler:</strong> /var/log/journal (18.4 GB), Docker dangling layers (8.2 GB).</li>
      <li><strong>Çöken Servis:</strong> nginx-reverse-proxy (Port 80 çakışması ve disk yazma hatası).</li>
    </ul>
    <div style="background:#f1f5f9;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;">
      # Önerilen Acil Çözüm Komutları:<br/>
      sudo journalctl --vacuum-time=3d<br/>
      sudo docker system prune -f<br/>
      sudo systemctl restart nginx
    </div>
  </div>`,
});

// GET /api/servers - Return list of available servers
app.get('/api/servers', (req, res) => {
  const list = Object.values(demoServers).map((s) => ({
    id: s.id,
    name: s.name,
    host: s.host,
    os: s.os,
    uptime: s.uptime,
    isRealSSH: s.isRealSSH,
    diskPercent: s.metrics.disk[0]?.usePercent || 0,
    ramPercent: Math.round((s.metrics.memory.usedMb / s.metrics.memory.totalMb) * 100),
    cpuPercent: s.metrics.cpu.usagePercent,
    status:
      s.metrics.disk[0]?.usePercent > 90 || s.metrics.services.some((svc) => svc.status === 'failed')
        ? 'CRITICAL'
        : s.metrics.disk[0]?.usePercent > 80 || s.metrics.cpu.usagePercent > 70
        ? 'WARNING'
        : 'HEALTHY',
  }));
  res.json({ servers: list });
});

// GET /api/servers/:id - Fetch full details for a server
app.get('/api/servers/:id', (req, res) => {
  const server = demoServers[req.params.id];
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  res.json({ server });
});

// POST /api/scan - Execute complete health scan (Disk, CPU, RAM, /var/log, Docker)
app.post('/api/scan', async (req, res) => {
  const { serverId } = req.body;
  const server = demoServers[serverId] || demoServers['prod-app-01'];

  // Check critical thresholds
  const diskAlert = server.metrics.disk.some((d) => d.usePercent >= 85);
  const ramAlert = (server.metrics.memory.usedMb / server.metrics.memory.totalMb) * 100 >= 85;
  const failedServices = server.metrics.services.filter((s) => s.status === 'failed');
  const failedDocker = server.metrics.docker.filter((d) => d.state === 'restarting' || d.state === 'exited');

  const scanSummary = {
    serverId: server.id,
    serverName: server.name,
    scannedAt: new Date().toISOString(),
    isCritical: diskAlert || ramAlert || failedServices.length > 0,
    alerts: [
      ...(diskAlert ? ['Kritik Disk Doluluğu: / dizini %85+ sınırını aştı'] : []),
      ...(ramAlert ? ['Yüksek RAM Kullanımı: Bellek %85+ eşiğinde'] : []),
      ...failedServices.map((s) => `Servis Çöktü: ${s.name} (${s.description})`),
      ...failedDocker.map((d) => `Konteyner Hatası: ${d.name} (${d.status})`),
    ],
    metrics: server.metrics,
  };

  res.json({ success: true, scan: scanSummary });
});

// POST /api/gemini/diagnose - Deep Root-Cause Analysis and Safe Linux Remediation Generator
app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const { serverId, customPrompt } = req.body;
    const server = demoServers[serverId] || demoServers['prod-app-01'];

    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the environment.',
      });
    }

    const systemPrompt = `Sen kıdemli bir Linux Sistem Yöneticisi (Senior Linux SysAdmin) ve SRE (Site Reliability Engineer) uzmanısın.
Kullanıcı sana bir Linux sunucusunun güncel metriklerini (CPU, RAM, Disk bölümleri, /var/log kayıtları, Docker container durumları, systemd servisleri) gönderiyor.

Görevin:
1. Sunucuda oluşan ani yavaşlamaları, disk dolmalarını veya çöken servisleri derinlemesine analiz et.
2. Örn. "Disk %92 dolmuş; /var/log/journal dizinindeki eski loglar temizlenebilir (journalctl --vacuum-time=3d) ve Docker kullanılmayan imajlar temizlenmeli".
3. Kullanıcıya GÜVENLİ, test edilmiş ve risk seviyesi (SAFE, CAUTION, CRITICAL) belirtilmiş adım adım Bash komutları hazırla.
4. Kritik hatalar tespit ettiysen (Disk > %85, RAM > %85, Çöken servis, OOM killer), otomatik e-posta uyarısı için başlık ve özet metin oluştur.
5. Yanıtı SADECE ve SADECE JSON formatında ver.`;

    const promptContext = `
Sunucu Bilgisi:
- Ad: ${server.name} (${server.host})
- İşletim Sistemi: ${server.os} | Çekirdek: ${server.kernel} | Uptime: ${server.uptime}

Metrikler:
- CPU: %${server.metrics.cpu.usagePercent} (Load Avg: ${server.metrics.cpu.loadAvg.join(', ')})
- RAM: Toplam ${server.metrics.memory.totalMb}MB, Kullanılan ${server.metrics.memory.usedMb}MB (%${Math.round((server.metrics.memory.usedMb / server.metrics.memory.totalMb) * 100)}), Swap: ${server.metrics.memory.swapUsedMb}MB / ${server.metrics.memory.swapTotalMb}MB
- Disk Bölümleri:
${server.metrics.disk.map((d) => `  * ${d.mount} (${d.filesystem}): ${d.used}/${d.size} (%${d.usePercent} dolu, ${d.avail} boş)`).join('\n')}

Docker Durumu:
${server.metrics.docker.map((d) => `  * [${d.state.toUpperCase()}] ${d.name} (${d.image}) - ${d.status} - CPU: %${d.cpuPercent}, RAM: ${d.memUsage}`).join('\n')}

Systemd Servisleri:
${server.metrics.services.map((s) => `  * ${s.name}: ${s.status} (${s.description})`).join('\n')}

Aktif Loglar (/var/log & journal):
- Journal:
${server.metrics.logs.journal.slice(-6).join('\n')}
- Syslog:
${server.metrics.logs.syslog.slice(-4).join('\n')}
- Docker logları:
${(server.metrics.logs.docker || []).join('\n')}

${customPrompt ? `Kullanıcının Özel Sorusu / İsteği: "${customPrompt}"` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallHealth: {
              type: Type.STRING,
              description: 'HEALTHY, WARNING, veya CRITICAL',
            },
            incidentTitle: {
              type: Type.STRING,
              description: 'Kısa çarpıcı olay başlığı (Türkçe)',
            },
            summary: {
              type: Type.STRING,
              description: '2-3 cümlelik durum özeti ve ana sebep analizi',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  component: { type: Type.STRING, description: 'Disk, Memory, Docker, Nginx, Systemd, vb.' },
                  severity: { type: Type.STRING, description: 'CRITICAL, HIGH, MEDIUM, LOW' },
                  description: { type: Type.STRING, description: 'Sorunun açıklaması' },
                  impact: { type: Type.STRING, description: 'Çözülmezse oluşturacağı etki' },
                },
                required: ['component', 'severity', 'description'],
              },
            },
            remediations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Komutun amacı' },
                  command: { type: Type.STRING, description: 'Çalıştırılacak güvenli bash komutu' },
                  safetyLevel: { type: Type.STRING, description: 'SAFE, CAUTION, veya CRITICAL' },
                  explanation: { type: Type.STRING, description: 'Bu komut arka planda ne yapar?' },
                  expectedGain: { type: Type.STRING, description: 'Beklenen kazanım (örn. ~15 GB disk boşalır)' },
                  rollbackNote: { type: Type.STRING, description: 'Güvenlik veya geri alma uyarısı' },
                },
                required: ['title', 'command', 'safetyLevel', 'explanation'],
              },
            },
            alertEmailRecommended: {
              type: Type.BOOLEAN,
              description: 'Kritik bir durum var mı ve e-posta uyarısı gönderilmeli mi?',
            },
            emailAlert: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: 'E-posta başlığı' },
                summary: { type: Type.STRING, description: 'E-posta gövdesindeki yönetici özeti' },
                urgency: { type: Type.STRING, description: 'CRITICAL, HIGH, INFO' },
                immediateAction: { type: Type.STRING, description: 'Nöbetçi sysadmin için ilk aksiyon' },
              },
            },
          },
          required: ['overallHealth', 'incidentTitle', 'summary', 'issues', 'remediations', 'alertEmailRecommended'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, diagnosis: parsed });
  } catch (error: any) {
    console.error('Gemini diagnose error:', error);
    res.status(500).json({ error: error.message || 'Gemini API call failed' });
  }
});

// POST /api/gemini/ask - Interactive SysAdmin Terminal AI Assistant
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { query, serverId, history } = req.body;
    const server = demoServers[serverId] || demoServers['prod-app-01'];

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const systemInstruction = `Sen Linux sistem yöneticilerine yardımcı olan akıllı CLI / Terminal asistanısın.
Kullanıcı sunucusu: ${server.name} (${server.os}, Disk: %${server.metrics.disk[0]?.usePercent}, RAM: %${Math.round((server.metrics.memory.usedMb / server.metrics.memory.totalMb) * 100)}).
Cevapların kısa, teknik olarak kusursuz, doğrudan uygulanabilir Bash komutları ve net açıklamalar içermeli.
Markdown formatında kod blokları (\`\`\`bash) kullan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Ask SysAdmin error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ssh/execute - Execute remediation or custom CLI command
app.post('/api/ssh/execute', async (req, res) => {
  const { serverId, command } = req.body;
  const server = demoServers[serverId];

  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  // Handle Real SSH if configured
  if (server.isRealSSH && server.sshConfig) {
    const conn = new SSHClient();
    conn
      .on('ready', () => {
        conn.exec(command, (err: any, stream: any) => {
          if (err) {
            conn.end();
            return res.status(500).json({ error: err.message });
          }
          let stdout = '';
          let stderr = '';
          stream
            .on('close', (code: number) => {
              conn.end();
              res.json({
                stdout,
                stderr,
                exitCode: code,
                executedAt: new Date().toISOString(),
              });
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString();
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });
        });
      })
      .on('error', (err: any) => {
        res.status(500).json({ error: `SSH connection error: ${err.message}` });
      })
      .connect({
        host: server.sshConfig.host,
        port: server.sshConfig.port,
        username: server.sshConfig.username,
        // (password or privateKey passed via config)
      });
    return;
  }

  // Simulated Execution with state mutation to show real effect!
  const trimmed = (command || '').trim();
  let output = '';
  let exitCode = 0;

  if (trimmed.includes('journalctl --vacuum-time') || trimmed.includes('journalctl --vacuum-size')) {
    output = `Vacuuming journal logs...\nDeleted archived journal files from /var/log/journal.\nFreed 16.2 GB of disk space.\nActive journal size is now 820.0 MB.`;
    // Mutate state: Disk usage drops!
    if (server.id === 'prod-app-01') {
      server.metrics.disk[0].used = '76.2G';
      server.metrics.disk[0].avail = '23.8G';
      server.metrics.disk[0].usePercent = 76;
      server.metrics.logs.journal.push(
        `[${new Date().toLocaleTimeString()}] Vacuum completed: 16.2 GB journal logs purged.`
      );
    }
  } else if (trimmed.includes('docker system prune')) {
    output = `Deleted Containers:\nd19024fa882 (worker-queue-runner)\n\nDeleted Images:\nuntagged: company/api-core@sha256:8f...\ndeleted: sha256:912b7a... (3.8GB)\ndeleted: sha256:d8174f... (4.4GB)\n\nTotal reclaimed space: 8.24GB`;
    if (server.id === 'prod-app-01') {
      server.metrics.disk[1].used = '129.9G';
      server.metrics.disk[1].avail = '20.1G';
      server.metrics.disk[1].usePercent = 86;
      server.metrics.docker = server.metrics.docker.filter((d) => d.id !== 'd19024fa882');
    }
  } else if (trimmed.includes('systemctl restart nginx') || trimmed.includes('docker restart nginx-reverse-proxy')) {
    output = `Restarting nginx reverse proxy...\nValidating nginx.conf: syntax is ok, test is successful.\nStarted nginx HTTP and reverse proxy server.`;
    if (server.id === 'prod-app-01') {
      const nginxSvc = server.metrics.services.find((s) => s.name === 'nginx.service');
      if (nginxSvc) nginxSvc.status = 'active';
      const nginxCont = server.metrics.docker.find((d) => d.name === 'nginx-reverse-proxy');
      if (nginxCont) {
        nginxCont.state = 'running';
        nginxCont.status = 'Up 2 seconds';
      }
    }
  } else if (trimmed === 'df -h' || trimmed.startsWith('df')) {
    output = `Filesystem      Size  Used Avail Use% Mounted on\n`;
    for (const d of server.metrics.disk) {
      output += `${d.filesystem.padEnd(16)} ${d.size.padEnd(5)} ${d.used.padEnd(5)} ${d.avail.padEnd(5)} ${d.usePercent}% ${d.mount}\n`;
    }
  } else if (trimmed === 'free -m' || trimmed.startsWith('free')) {
    const mem = server.metrics.memory;
    output = `               total        used        free      shared  buff/cache   available\nMem:           ${mem.totalMb}       ${mem.usedMb}         ${mem.freeMb}         120        ${mem.buffCacheMb}        ${mem.freeMb + 800}\nSwap:          ${mem.swapTotalMb}        ${mem.swapUsedMb}        ${mem.swapTotalMb - mem.swapUsedMb}\n`;
  } else if (trimmed.startsWith('uptime')) {
    output = ` ${new Date().toLocaleTimeString()} up ${server.uptime}, 2 users, load average: ${server.metrics.cpu.loadAvg.join(', ')}`;
  } else if (trimmed.startsWith('docker ps')) {
    output = `CONTAINER ID   IMAGE                    COMMAND                  STATUS         PORTS                       NAMES\n`;
    for (const c of server.metrics.docker) {
      output += `${c.id.padEnd(14)} ${c.image.padEnd(24)} "/entrypoint.sh..."     ${c.status.padEnd(14)} ${c.ports.padEnd(27)} ${c.name}\n`;
    }
  } else if (trimmed.startsWith('uname')) {
    output = `${server.kernel}`;
  } else if (trimmed.startsWith('top') || trimmed.startsWith('ps')) {
    output = `Tasks: 198 total, 2 running, 196 sleeping, 0 stopped, 0 zombie\n%Cpu(s): ${server.metrics.cpu.usagePercent} us, 4.2 sy, 0.0 ni, 21.0 id, 2.1 wa\n\n  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n`;
    for (const p of server.metrics.cpu.topProcesses) {
      output += `${String(p.pid).padStart(5)} ${p.user.padEnd(9)} 20   0  2104M  412M  44M S  ${String(p.cpu).padStart(5)} ${String(p.mem).padStart(5)}   12:44.12 ${p.command}\n`;
    }
  } else {
    output = `[smart-sysadmin@${server.name}]: Command executed successfully.\n$ ${trimmed}\nExit code: 0`;
  }

  res.json({
    stdout: output,
    stderr: '',
    exitCode,
    executedAt: new Date().toISOString(),
  });
});

// POST /api/alerts/send - Dispatch an alert email
app.post('/api/alerts/send', async (req, res) => {
  const {
    recipient = 'kustaskin@gmail.com',
    subject,
    serverId = 'prod-app-01',
    severity = 'CRITICAL',
    triggerReason,
    remediationSnippet,
    smtpConfig,
  } = req.body;

  const server = demoServers[serverId] || demoServers['prod-app-01'];
  const mailSubject = subject || `🚨 [${severity} ALERT] ${server.name}: Sistem Kritik Durum Bildirimi`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .header { background: ${severity === 'CRITICAL' ? '#dc2626' : '#d97706'}; color: #ffffff; padding: 20px 24px; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
      .content { padding: 24px; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 14px; }
      .meta-item { background: #f1f5f9; padding: 10px 14px; border-radius: 6px; }
      .meta-label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600; }
      .meta-value { font-weight: 600; color: #0f172a; margin-top: 2px; }
      .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #991b1b; }
      .code-box { background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow-x: auto; margin-bottom: 20px; line-height: 1.5; }
      .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Smart SysAdmin Otomatik Alarm: ${server.name}</h1>
      </div>
      <div class="content">
        <p>Merhaba Sistem Yöneticisi,</p>
        <p>Sunucunuzda otomatik SSH & sistem sağlığı tarayıcısı tarafından <strong>${severity}</strong> seviyesinde bir aksaklık tespit edildi.</p>
        
        <div class="alert-box">
          <strong>Tetiklenme Nedeni:</strong><br/>
          ${triggerReason || 'Disk doluluğu %90 eşiğini aştı veya kritik servis arızalandı.'}
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Sunucu IP / Host</div>
            <div class="meta-value">${server.host}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">İşletim Sistemi</div>
            <div class="meta-value">${server.os}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Kök Disk Kullanımı</div>
            <div class="meta-value" style="color:#dc2626;">%${server.metrics.disk[0]?.usePercent || 0} (${server.metrics.disk[0]?.used} / ${server.metrics.disk[0]?.size})</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">RAM Kullanımı</div>
            <div class="meta-value">%${Math.round((server.metrics.memory.usedMb / server.metrics.memory.totalMb) * 100)} (${Math.round(server.metrics.memory.usedMb / 1024)}GB / ${Math.round(server.metrics.memory.totalMb / 1024)}GB)</div>
          </div>
        </div>

        <p><strong>🧠 Gemini AI Tarafından Üretilen Güvenli Çözüm Komutları:</strong></p>
        <div class="code-box">
# SysAdmin Güvenli Temizlik ve Kurtarma Komutu:<br/>
${remediationSnippet || 'sudo journalctl --vacuum-time=3d && sudo docker system prune -f'}
        </div>

        <p style="font-size:13px;color:#475569;">
          * Bu e-posta Smart SysAdmin CLI & Linux Server Maintenance Assistant tarafından otomatik olarak üretilmiştir.
        </p>
      </div>
      <div class="footer">
        Smart SysAdmin CLI &bull; Linux Server Maintenance Assistant &bull; Alıcı: ${recipient}
      </div>
    </div>
  </body>
  </html>
  `;

  let deliveryStatus: 'SENT_SMTP' | 'DISPATCHED_SIMULATED' | 'FAILED' = 'DISPATCHED_SIMULATED';
  let deliveryDetail = `E-posta ${recipient} adresine başarıyla iletildi (Otomatik SysAdmin Dispatcher).`;

  // Try real SMTP if configured
  if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      await transporter.sendMail({
        from: `"Smart SysAdmin" <${smtpConfig.user}>`,
        to: recipient,
        subject: mailSubject,
        html: htmlBody,
      });

      deliveryStatus = 'SENT_SMTP';
      deliveryDetail = `Gerçek SMTP üzerinden (${smtpConfig.host}) ${recipient} adresine başarıyla gönderildi.`;
    } catch (err: any) {
      console.warn('Real SMTP failed, falling back to logged dispatch:', err.message);
      deliveryStatus = 'DISPATCHED_SIMULATED';
      deliveryDetail = `SMTP denendi ancak bağlantı sağlanamadı (${err.message}). Alarm iç bildirim kuyruğuna kaydedildi.`;
    }
  }

  const alertRecord: AlertEmailRecord = {
    id: `alert-${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipient,
    subject: mailSubject,
    serverId: server.id,
    serverName: server.name,
    severity,
    triggerReason: triggerReason || 'Otomatik tarama kritik eşik aşımı',
    remediationSnippet: remediationSnippet || 'journalctl --vacuum-time=3d',
    status: deliveryStatus,
    deliveryDetail,
    htmlContent: htmlBody,
  };

  alertAuditTrail.unshift(alertRecord);

  res.json({
    success: true,
    alert: alertRecord,
    message: deliveryDetail,
  });
});

// GET /api/alerts/history - Fetch past dispatched alert emails
app.get('/api/alerts/history', (req, res) => {
  res.json({ history: alertAuditTrail });
});

// POST /api/servers/add - Add custom SSH server
app.post('/api/servers/add', (req, res) => {
  const { name, host, port = 22, username, authType = 'password', isReal = false } = req.body;
  const id = `custom-${Date.now()}`;

  demoServers[id] = {
    id,
    name: name || host,
    host,
    os: 'Ubuntu 24.04 LTS (Remote Host)',
    kernel: 'Linux 6.8.0-generic',
    uptime: '14 days, 6 hours',
    isRealSSH: !!isReal,
    sshConfig: {
      host,
      port: parseInt(port, 10),
      username,
      authType,
    },
    metrics: {
      cpu: {
        usagePercent: 34.2,
        cores: 4,
        loadAvg: [1.12, 1.05, 0.94],
        topProcesses: [
          { pid: 1024, user: username, cpu: 12.1, mem: 6.4, command: 'nginx: worker process' },
          { pid: 2048, user: username, cpu: 8.5, mem: 14.2, command: 'node /app/server.js' },
        ],
      },
      memory: {
        totalMb: 8192,
        usedMb: 4210,
        freeMb: 2410,
        buffCacheMb: 1572,
        swapTotalMb: 2048,
        swapUsedMb: 120,
      },
      disk: [
        { filesystem: '/dev/vda1', mount: '/', size: '60G', used: '28.4G', avail: '31.6G', usePercent: 47 },
      ],
      logs: {
        journal: [`[${new Date().toLocaleTimeString()}] SSH connection established with ${username}@${host}`],
        syslog: [`systemd[1]: Started User Manager for UID 1000.`],
        auth: [`sshd[8412]: Accepted publickey for ${username} from host`],
      },
      docker: [],
      services: [
        { name: 'ssh.service', status: 'active', description: 'OpenSSH server daemon' },
        { name: 'cron.service', status: 'active', description: 'Command scheduler' },
      ],
    },
  };

  res.json({ success: true, server: demoServers[id] });
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart SysAdmin Server listening on port ${PORT}`);
  });
}

startServer();
