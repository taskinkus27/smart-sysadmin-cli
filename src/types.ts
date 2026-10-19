export interface ServerMetricProcess {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

export interface DiskMount {
  filesystem: string;
  mount: string;
  size: string;
  used: string;
  avail: string;
  usePercent: number;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'restarting' | 'exited' | 'paused';
  cpuPercent: number;
  memUsage: string;
  ports: string;
}

export interface SystemService {
  name: string;
  status: 'active' | 'failed' | 'inactive';
  description: string;
}

export interface ServerMetrics {
  cpu: {
    usagePercent: number;
    cores: number;
    loadAvg: [number, number, number];
    topProcesses: ServerMetricProcess[];
  };
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    buffCacheMb: number;
    swapTotalMb: number;
    swapUsedMb: number;
  };
  disk: DiskMount[];
  logs: {
    journal: string[];
    syslog: string[];
    auth: string[];
    nginx?: string[];
    docker?: string[];
  };
  docker: DockerContainer[];
  services: SystemService[];
}

export interface ServerSummary {
  id: string;
  name: string;
  host: string;
  os: string;
  uptime: string;
  isRealSSH: boolean;
  diskPercent: number;
  ramPercent: number;
  cpuPercent: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ServerDetail {
  id: string;
  name: string;
  host: string;
  os: string;
  kernel: string;
  uptime: string;
  isRealSSH: boolean;
  metrics: ServerMetrics;
}

export interface RemediationStep {
  title: string;
  command: string;
  safetyLevel: 'SAFE' | 'CAUTION' | 'CRITICAL';
  explanation: string;
  expectedGain?: string;
  rollbackNote?: string;
}

export interface IssueItem {
  component: string;
  severity: string;
  description: string;
  impact?: string;
}

export interface GeminiDiagnosis {
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  incidentTitle: string;
  summary: string;
  issues: IssueItem[];
  remediations: RemediationStep[];
  alertEmailRecommended: boolean;
  emailAlert?: {
    subject: string;
    summary: string;
    urgency: string;
    immediateAction: string;
  };
}

export interface AlertEmailRecord {
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
