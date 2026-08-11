# DeskcommCRM — Self-Host Installation Kit (VPS / Docker Compose)

> English documentation for installing DeskcommCRM on a Linux VPS (HostGator or any Ubuntu/Debian server) with **Open-Source Self-Hosted Supabase**, **Evolution API** for WhatsApp, and Docker Compose.

---

## 1. Quick Install (Interactive English Installer)

SSH into your Linux server and run:

```bash
git clone https://github.com/melgarafael/DeskcommCRM.git
cd DeskcommCRM
bash hostgator-setup-kit/install.sh
```

The primary `install.sh` installer displays its prompts, progress messages, and errors in English. It is idempotent, so you can run the same command again after correcting a configuration or infrastructure problem.

### What `install.sh` Asks You

1. **CRM domain and SSL email:** for example, `crm.yourcompany.com`. The installer configures HTTPS through Caddy, or detects and uses a supported existing Traefik proxy.
2. **AI provider:** OpenRouter, Anthropic, or OpenAI, plus the relevant API key. AI keys are optional and can be configured later.
3. **First admin account:** the email and password used to sign in to DeskcommCRM.
4. **Application name and image source:** use the prebuilt image (recommended), or build from the current source checkout.

The installer generates the local Supabase credentials and other internal secrets automatically, starts the database, applies `supabase/baseline.sql`, starts the application stack, and creates the first administrator.

For unattended installation, copy `.env.hostgator.example` to `.env`, fill in the required values, and run:

```bash
bash hostgator-setup-kit/install.sh --yes
```

---

## 2. Docker Compose Architecture

The installer deploys two Compose stacks:

* `docker-compose.prod.yml`: DeskcommCRM, Evolution API, Redis, and the Caddy HTTPS proxy.
* `docker-compose.selfhost-supabase.yml`: Open-Source Supabase (`supabase/postgres:15.1.1.78` with pgvector, GoTrue, PostgREST, Storage API, and Kong).

On a server whose existing Traefik already owns ports 80 and 443, the installer also uses `docker-compose.traefik.yml` instead of starting Caddy.

### Useful Commands

```bash
# Check the containers
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml ps

# Follow application logs
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml logs -f app

# Restart the stack
docker compose -f docker-compose.prod.yml -f docker-compose.selfhost-supabase.yml restart
```

---

## 3. Microfinance & Authoritative Double-Entry Accounting

* **UGX default currency:** DeskcommCRM's double-entry accounting engine defaults to **Uganda Shillings (`UGX`)**.
* **Decoupled ledger architecture:** Mifos X is used for loan schedules and savings tracking, while all general-ledger double-entry accounting (`accounting_accounts`, `accounting_journal_entries`, `accounting_journal_lines`, Trial Balance, Balance Sheet, and Income Statement) occurs authoritatively inside DeskcommCRM.
