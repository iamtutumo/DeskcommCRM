import re
import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

# 1. Translate prompts and echoes (only specific well-known blocks to avoid breaking code)
replacements = {
    "Fase 1/4 · Preparando o servidor": "Phase 1/4 · Preparing the server",
    "Verificando dependências": "Checking dependencies",
    "Localizando o projeto": "Locating the project",
    "rodando dentro do repositório": "running inside the repository",
    "Fase 2/4 · Suas informações": "Phase 2/4 · Your information",
    "Qual inteligência artificial vai atender seus clientes?": "Which AI will serve your customers?",
    "uma chave, centenas de modelos de vários fabricantes.": "one key, hundreds of models from various vendors.",
    "O caminho mais simples para experimentar.": "The simplest way to experiment.",
    "É o que melhor segue instruções longas e usa": "Best at following long instructions and using",
    "as ferramentas do CRM.": "CRM tools.",
    "Dá para trocar depois, e por parte do sistema, em Agente de IA → Provedores.": "You can change this later in the system under AI Agent -> Providers.",
    "Escolha (Enter = 2):": "Choice (Enter = 2):",
    "Dica: em qualquer pergunta, digite 'voltar' para refazer a anterior.": "Tip: on any question, type 'back' to redo the previous one.",
    "A chave da OpenAI é opcional, mas sem ela a IA não ouve áudio nem consulta a base de conhecimento.": "The OpenAI key is optional, but without it the AI will not listen to audio or query the knowledge base.",
    "Domínio do CRM (ex: crm.suaempresa.com.br)": "CRM Domain (ex: crm.yourcompany.com)",
    "Seu e-mail (avisos de SSL)": "Your email (for SSL alerts)",
    "Imagem Docker do app": "App Docker image",
    "E-mail do primeiro admin (dono)": "First admin email (owner)",
    "Senha do primeiro admin (mínimo 8 caracteres)": "First admin password (min 8 chars)",
    "Nome que aparece na interface (Enter para o padrão)": "Name displayed in the UI (Enter for default)",
    "Chave da OpenAI — só para ouvir áudios e usar a base de conhecimento (Enter pula)": "OpenAI Key — only for audio and knowledge base (Enter to skip)",
    "Fase 3/4 · Banco de Dados": "Phase 3/4 · Database",
    "Fase 4/4 · Subindo o servidor": "Phase 4/4 · Starting the server",
    "Instalação concluída!": "Installation complete!",
    "o IP deste VPS": "this VPS IP",
    "Agentes de IA que atendem no WhatsApp, dentro do seu CRM.": "AI Agents that serve on WhatsApp, inside your CRM.",
    "Open-source · roda no seu servidor · os dados são seus.": "Open-source · runs on your server · your data is yours."
}

for pt, en in replacements.items():
    text = text.replace(pt, en)

# 2. Modify dc() and dc_files() to include selfhost-supabase
dc_func_orig = '''dc() {
  if [ "${REVERSE_PROXY:-caddy}" = "traefik" ]; then
    docker compose -f "$COMPOSE" -f "$COMPOSE_TRAEFIK" "$@"
  else
    docker compose -f "$COMPOSE" "$@"
  fi
}'''
dc_func_new = '''dc() {
  if [ "${REVERSE_PROXY:-caddy}" = "traefik" ]; then
    docker compose -f "$COMPOSE" -f "$COMPOSE_TRAEFIK" -f docker-compose.selfhost-supabase.yml "$@"
  else
    docker compose -f "$COMPOSE" -f docker-compose.selfhost-supabase.yml "$@"
  fi
}'''
text = text.replace(dc_func_orig, dc_func_new)

dc_files_orig = '''dc_files() {
  if [ "${REVERSE_PROXY:-caddy}" = "traefik" ]; then
    printf -- '-f %s -f %s' "$COMPOSE" "$COMPOSE_TRAEFIK"
  else
    printf -- '-f %s' "$COMPOSE"
  fi
}'''
dc_files_new = '''dc_files() {
  if [ "${REVERSE_PROXY:-caddy}" = "traefik" ]; then
    printf -- '-f %s -f %s -f docker-compose.selfhost-supabase.yml' "$COMPOSE" "$COMPOSE_TRAEFIK"
  else
    printf -- '-f %s -f docker-compose.selfhost-supabase.yml' "$COMPOSE"
  fi
}'''
text = text.replace(dc_files_orig, dc_files_new)

# 3. Remove Supabase prompts from FIELDS
# They look like this:
#  "NEXT_PUBLIC_SUPABASE_URL|Supabase Project URL (Settings > API)||v_supabase_url||"
#  "NEXT_PUBLIC_SUPABASE_ANON_KEY|Supabase anon key (Settings > API)||v_anon||"
#  "SUPABASE_SERVICE_ROLE_KEY|Supabase service_role key (Settings > API)||v_service|secret|"
#  "SUPABASE_DB_URL|Supabase connection string — Session pooler, modo URI (Settings > Database)||v_db_url|secret|"

fields_orig = '''  "NEXT_PUBLIC_SUPABASE_URL|Supabase Project URL (Settings > API)||v_supabase_url||"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY|Supabase anon key (Settings > API)||v_anon||"
  "SUPABASE_SERVICE_ROLE_KEY|Supabase service_role key (Settings > API)||v_service|secret|"
  "SUPABASE_DB_URL|Supabase connection string — Session pooler, modo URI (Settings > Database)||v_db_url|secret|"'''
text = text.replace(fields_orig, "")

# 4. Inject auto-generation of Supabase creds BEFORE the interactive loop
# Find a place before `while true; do` (around line 980) or where `step "Configuração"` is.
# Let's find: `step "Configuração"`

injection_auto_supabase = '''
# Auto-generate Self-Hosted Supabase Credentials
generate_jwt() {
  local role="$1" secret="$2"
  local header='{"alg":"HS256","typ":"JWT"}'
  local payload
  if [ "$role" = "service_role" ]; then
    payload='{"role":"service_role","iss":"supabase","iat":1700000000,"exp":2000000000}'
  else
    payload='{"role":"anon","iss":"supabase","iat":1700000000,"exp":2000000000}'
  fi
  local h_b64 p_b64 sig
  h_b64="$(printf '%s' "$header" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  p_b64="$(printf '%s' "$payload" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  sig="$(printf '%s.%s' "$h_b64" "$p_b64" | openssl dgst -sha256 -hmac "$secret" -binary | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  printf '%s.%s.%s' "$h_b64" "$p_b64" "$sig"
}
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
    export SB_PG_PASS="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 32 || echo 'DeskcommPgSecret2026Secure')"
    export JWT_SECRET="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 40 || echo 'DeskcommJwtSecretTokenWithAtLeast32CharsLong2026')"
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(generate_jwt "anon" "$JWT_SECRET")"
    export SUPABASE_SERVICE_ROLE_KEY="$(generate_jwt "service_role" "$JWT_SECRET")"
    export NEXT_PUBLIC_SUPABASE_URL="http://supabase-kong:8000"
    export SUPABASE_DB_URL="postgresql://postgres:${SB_PG_PASS}@supabase-db:5432/postgres"
    export SELF_HOSTED_SUPABASE=true
fi
'''

text = text.replace('step "Configuration"', injection_auto_supabase + '\nstep "Configuration"')
text = text.replace('step "Configuração"', injection_auto_supabase + '\nstep "Configuration"') # In case it didn't translate

# 5. Inject DB startup before applying schema
db_startup = '''
step "Starting Self-Hosted Supabase"
# Stop existing just in case
dc stop supabase-db supabase-kong supabase-rest supabase-auth supabase-storage || true
dc up -d supabase-db
c_dim "Waiting for self-hosted DB to be ready..."
sleep 10
# Also inject the env variables explicitly for the DB run
export POSTGRES_PASSWORD="$SB_PG_PASS"
'''
# We find: step "Aplicando o schema no Supabase (baseline.sql)"
text = text.replace('step "Aplicando o schema no Supabase (baseline.sql)"', db_startup + '\nstep "Aplicando o schema no Supabase (baseline.sql)"')

# Wait, `SUPABASE_DB_URL` points to `supabase-db`, but from host (running the install script)
# the script tries to run `docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL"`.
# Since `supabase-db` is not exposed on localhost by default, the `docker run` MUST be on the same network!
# Let's fix that `docker run` line to use the network:
docker_run_orig = 'docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL"'
docker_run_new = 'docker run --rm --network deskcommcrm_default postgres:17-alpine psql "$SUPABASE_DB_URL"'
text = text.replace(docker_run_orig, docker_run_new)
# Wait, if project folder is not DeskcommCRM, the network name is different. Let's just use `docker exec` on supabase-db!
docker_exec_new = 'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres'
# No, `install.sh` does this:
# docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c ...
# I will replace it.
text = text.replace('''docker run --rm postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c \\
    "create extension if not exists vector with schema public; create extension if not exists citext with schema public; create extension if not exists pg_trgm with schema public;" \\''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \\
    "create extension if not exists vector with schema public; create extension if not exists citext with schema public; create extension if not exists pg_trgm with schema public;" \\''')

text = text.replace('''psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/baseline.sql''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < supabase/baseline.sql''')

text = text.replace('''psql "$SUPABASE_DB_URL" -f supabase/baseline.sql''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -f /dev/stdin < supabase/baseline.sql''')

text = text.replace('''psql "$SUPABASE_DB_URL" -f "$f"''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -f /dev/stdin < "$f"''')

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Replacement done.")
