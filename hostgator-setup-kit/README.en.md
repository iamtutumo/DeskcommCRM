# DeskcommCRM — Self-Host Installation Kit (VPS / Docker Compose)

> English documentation for installing DeskcommCRM on a Linux VPS (HostGator or any Ubuntu/Debian server) with **Open-Source Self-Hosted Supabase** (`https://supabase.com/open-source`), **Evolution API** for WhatsApp, and **Standard SMTP** for email.

---

## 1. Quick Install (Interactive English Installer)

SSH into your Linux server and run:

```bash
git clone https://github.com/melgarafael/DeskcommCRM.git
cd DeskcommCRM
bash hostgator-setup-kit/install-en.sh
```

### What `install-en.sh` Asks You

1. **CRM Domain:** e.g., `crm.yourcompany.com` (Caddy automatically configures SSL HTTPS certificates).
2. **Supabase Setup Choice:**
   * **Option 1: Open-Source Self-Hosted Supabase** (`https://supabase.com/open-source`) — Automatically provisions Supabase Docker containers (`supabase-db`, `supabase-auth`, `supabase-rest`, `supabase-storage`, `supabase-kong`) on your VPS without requiring an external cloud subscription.
   * **Option 2: External / Cloud Supabase Project** — Enter an existing Supabase URL and keys manually.
3. **WhatsApp Engine (Evolution API):** Enter your Evolution API URL, API key, and instance name (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`).
4. **Transactional Email (Standard SMTP):** Enter your SMTP mail server host, port, user, password, and sender address (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`).
5. **First Admin Owner Account:** Your email and password for logging into DeskcommCRM.

---

## 2. Docker Compose Architecture

When you select Open-Source Self-Hosted Supabase, `install-en.sh` deploys two composed stacks:
* `docker-compose.prod.yml`: DeskcommCRM App (`next.js`), Evolution API, Redis, and Caddy HTTPS proxy.
* `docker-compose.selfhost-supabase.yml`: Open-Source Supabase stack (`supabase/postgres:15.1.1.78` with `pgvector`, `gotrue`, `postgrest`, `storage-api`, and `kong`).

### Useful Commands

```bash
# Check status of all containers
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml ps

# View live logs
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml logs -f app

# Restart stack
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml restart
```

---

## 3. Microfinance & Authoritative Double-Entry Accounting

* **UGX Default Currency:** DeskcommCRM's double-entry accounting engine defaults to **Uganda Shillings (`UGX`)**.
* **Decoupled Ledger Architecture:** Mifos X is used purely for loan schedule and savings tracking, while all general ledger (GL) double-entry accounting (`accounting_accounts`, `accounting_journal_entries`, `accounting_journal_lines`, Trial Balance, Balance Sheet, Income Statement) occurs authoritatively inside DeskcommCRM.
