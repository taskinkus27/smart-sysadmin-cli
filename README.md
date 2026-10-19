# 🐧 Smart SysAdmin CLI & Server Maintenance Assistant

**Smart SysAdmin CLI** is a lightweight, AI-driven server health auditing and troubleshooting tool. It connects to local or remote Linux servers via SSH, gathers real-time system metrics (CPU, RAM, Disk, systemd journals, auth logs, Docker containers), and leverages **Google Gemini AI** to diagnose performance bottlenecks, disk space issues, and system anomalies—complete with copy-pasteable safe fix commands.

---

## ✨ Features

### 1. 📊 Automated System Health Diagnostics
* **Resource Monitoring:** Instant check of CPU load, RAM usage, swap space, and disk partition occupancy (`df -h`).
* **Log & Journal Inspection:** Analyzes recent `/var/log/syslog`, `/var/log/auth.log`, and `journalctl` error logs for anomalies.
* **Docker Container Audit:** Inspects running/stopped containers, high CPU/RAM consuming processes, and container log errors.
* **Process Snapshot:** Identifies top memory and CPU-hogging processes (`ps aux`).

### 2. 🤖 Gemini AI Forensic & Remediation Engine
* **Root Cause Analysis:** Converts raw system metrics and log outputs into structured health summaries.
* **Actionable Fix Suggestions:** Suggests exact, safe Linux commands (e.g., clearing `journalctl` logs, vacuuming Docker images, rotating log files, adjusting systemd limits).
* **Safety First:** Clear separation between non-destructive inspection commands and system-modifying remediation scripts.

### 3. ⚙️ Flexible Execution Modes
* **Local Mode:** Runs directly on the host system via standard shell commands.
* **Remote SSH Mode:** Connects to remote edge servers, VPS, or cloud instances using SSH keys.
* **JSON / Markdown Export:** Generates downloadable server audit reports.

---

## 🚀 Quick Start

### Prerequisites
* **Python 3.10+** or **Node.js 18+**
* **Google Gemini API Key** ([Get your API Key from Google AI Studio](https://aistudio.google.com/))
* SSH access to target Linux servers (for remote checks)

### Installation

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/smart-sysadmin-cli.git](https://github.com/YOUR_USERNAME/smart-sysadmin-cli.git)
   cd smart-sysadmin-cli
