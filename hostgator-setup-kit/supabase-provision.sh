#!/usr/bin/env bash
#
# Cria o projeto Supabase pela Management API e devolve as 4 credenciais que o
# install.sh precisa — em vez de a pessoa criar o projeto no navegador e copiar
# quatro campos à mão.
#
# POR QUE ISTO EXISTE
# -------------------
# Numa instalação medida de ponta a ponta, o script levou ~3 minutos e a
# preparação levou ~59. A maior fatia foi criar o projeto Supabase e copiar
# URL, anon, service_role e connection string — o passo mais lento e o mais
# fácil de errar (copiar a "Direct connection", que é IPv6-only e não conecta
# de um VPS IPv4, era a armadilha número um).
#
# USO
#   export SUPABASE_ACCESS_TOKEN=sbp_...      # Personal Access Token
#   bash supabase-provision.sh "Nome do Projeto" [regiao]
#
# Escreve as 4 variáveis em stdout no formato `CHAVE='valor'`, prontas para
# concatenar num .env. Nada é impresso em log.
#
# ⚠️ O TOKEN É UMA CHAVE MESTRA: dá acesso a TODOS os projetos da conta. Ele é
# lido do ambiente, nunca gravado em disco por este script, e não deve ficar no
# .env do servidor do cliente. Quem instala para terceiros: use o token DO
# CLIENTE, ou rode este script na sua máquina e leve só as 4 credenciais.
#
# LIMITE DO PLANO GRÁTIS: são 2 projetos gratuitos por USUÁRIO, contados em
# todas as organizações onde ele é Owner/Admin. Não dá para hospedar N clientes
# numa conta só — cada cliente precisa da conta dele (ou de plano pago).
#
# Dependências: as mesmas do kit (bash + curl). Sem jq, sem python.

set -euo pipefail

API="https://api.supabase.com/v1"
PROJECT_NAME="${1:-DeskcommCRM}"
REGION="${2:-${SUPABASE_REGION:-sa-east-1}}"

c_red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
c_grn() { printf '\033[32m%s\033[0m\n' "$*" >&2; }
c_ylw() { printf '\033[33m%s\033[0m\n' "$*" >&2; }
c_dim() { printf '\033[2m%s\033[0m\n' "$*" >&2; }
die()   { c_red "✖ $*"; exit 1; }

# Senha do banco: 32 alfanuméricos, sem os caracteres que quebram uma URL
# (@ : / ? # &) — ela entra na connection string, e um '@' aqui parte o host.
#
# Antes isto era uma ATRIBUIÇÃO NO ESCOPO DO SCRIPT:
#   DB_PASS="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
# e o script morria ali, todas as vezes. O head fecha o pipe ao juntar os 32
# caracteres, o `tr` — que continuaria lendo /dev/urandom para sempre — leva
# SIGPIPE e sai 141, e com pipefail esse 141 vira o status da atribuição, que
# sob `set -e` mata o script inteiro DEPOIS de a senha existir. Medido na VPS e
# reproduzido fora dela: a criação automática do banco falhava sempre, e o
# instalador só dizia "Não consegui criar o projeto Supabase", sem motivo.
#
# O que fecha o buraco é ESTA função existir: o status de `$(gen_db_pass)` passa
# a ser o do `printf` final, não o do pipe lá dentro (medido: com o pipe antigo
# dentro de uma função, o script sobrevive; no escopo, sai 141). Ler um bloco
# FINITO é defesa em profundidade — não depende desse detalhe de propagação, e
# vale se alguém um dia inlinar a chamada de volta. 4096 bytes rendem ~980
# alfanuméricos (24% dos bytes), folga larga para 32.
# Coberta por test-validators.sh, no call site — que é onde o bug morava.
gen_db_pass() {
  local p
  p="$(LC_ALL=C tr -dc 'A-Za-z0-9' < <(head -c 4096 /dev/urandom))"
  printf '%s' "${p:0:32}"
}

# Carrega só as funções acima, sem provisionar nada — é assim que o
# test-validators.sh exercita o gerador de senha.
if [ "${SUPABASE_PROVISION_LIB:-}" = "1" ]; then return 0; fi

# Passo numerado: quem instala precisa saber ONDE está e QUANTO falta. "▶ Criando
# projeto" sozinho não diz se é o começo ou o fim.
TOTAL_PASSOS=6
PASSO=0
step() {
  PASSO=$((PASSO + 1))
  printf '\n\033[1m[%d/%d] %s\033[0m\n' "$PASSO" "$TOTAL_PASSOS" "$*" >&2
}

# Mostra segredo sem vazá-lo no terminal (nem no screenshot que a pessoa manda
# pedindo ajuda): primeiros 6 e últimos 4.
mascara() {
  local v="$1"
  if [ "${#v}" -le 14 ]; then printf '%s' "••••••"; else printf '%s…%s' "${v:0:6}" "${v: -4}"; fi
}

moldura() {
  local txt="$1" larg=60 pad
  # `printf %-60s` conta BYTES, e acento/·/em traço ocupam 2+ em UTF-8: a borda
  # direita saía torta em qualquer título com acento — que em português é quase
  # todo. `${#txt}` conta CARACTERES, então o preenchimento sai certo.
  pad=$(( larg - ${#txt} )); [ "$pad" -lt 0 ] && pad=0
  printf '\033[36m╭%s╮\033[0m\n' "$(printf '─%.0s' $(seq 1 $((larg + 2))))" >&2
  printf '\033[36m│\033[0m \033[1m%s%*s\033[0m \033[36m│\033[0m\n' "$txt" "$pad" '' >&2
  printf '\033[36m╰%s╯\033[0m\n' "$(printf '─%.0s' $(seq 1 $((larg + 2))))" >&2
}

moldura "DeskcommCRM · creating your Supabase database"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  c_red "✖ Missing Supabase access token."
  printf '\n' >&2
  c_dim "  1. Open https://supabase.com/dashboard/account/tokens"
  c_dim "  2. Select Generate new token, name it (e.g. deskcommcrm), and copy it"
  c_dim "  3. Run:  export SUPABASE_ACCESS_TOKEN=sbp_...  and try again"
  printf '\n' >&2
  exit 1
fi

# Extrai um campo string de um JSON PLANO. Mesmo estilo do jwt_claim() do
# install.sh: o kit promete depender só de bash+curl, então nada de jq/python.
# Só serve para os campos simples que a API devolve (ref, id, name, status).
#
# O `|| true` no fim não é preguiça — é o que mantém as mensagens de erro
# ALCANÇÁVEIS. Campo ausente faz o `grep` sair 1; com `pipefail`, isso derruba a
# substituição, e com `set -e` o script inteiro morre em silêncio na linha da
# atribuição — antes do `die` que explicaria o problema. Medido com token
# inválido: a API respondia {"message":"Unauthorized"} e o terminal apenas
# voltava, sem uma palavra. Falhando vazio, quem decide o que dizer é o `die`.
json_str() { grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" <<<"$1" | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true; }

api() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$API$path" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -sS -X "$method" "$API$path" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
  fi
}

# ── 1. Organização ──────────────────────────────────────────────────────────
step "Finding the organization"
ORG_ID="${SUPABASE_ORG_ID:-}"
if [ -z "$ORG_ID" ]; then
  orgs="$(api GET /organizations)"
  ORG_ID="$(json_str "$orgs" id)"
  [ -n "$ORG_ID" ] || die "No organization was found. Check the token."
  c_grn "✓ organization: $(json_str "$orgs" name) ($ORG_ID)"
fi

# ── 2. Senha do banco ───────────────────────────────────────────────────────
# Sem caracteres que quebram uma URL (@ : / ? # &) — a senha entra na
# connection string, e um '@' aqui parte o host no meio.
DB_PASS="$(gen_db_pass)"
[ "${#DB_PASS}" -eq 32 ] || die "could not generate the database password (only ${#DB_PASS} characters). Run it again."

# ── 3. Cria o projeto ───────────────────────────────────────────────────────
step "Creating project '$PROJECT_NAME' in $REGION"
created="$(api POST /projects "{\"name\":\"$PROJECT_NAME\",\"organization_id\":\"$ORG_ID\",\"region\":\"$REGION\",\"db_pass\":\"$DB_PASS\"}")"
REF="$(json_str "$created" ref)"
[ -n "$REF" ] || { c_red "API response:"; printf '%s\n' "$created" >&2; die "Could not create the project."; }
c_grn "✓ project created: $REF"

# ── 4. Espera ficar de pé ───────────────────────────────────────────────────
# Projeto novo NÃO nasce pronto: passa por COMING_UP até ACTIVE_HEALTHY. Sem
# esperar, o passo do schema falha com "connection refused" e a instalação
# morre no meio sem explicar por quê.
step "Waiting for the database to start"
c_dim "      A new project takes 2–5 minutes to start. Keep this running."
ok=""
inicio=$SECONDS
LIMITE=60   # 60 x 10s = 10 minutos
for i in $(seq 1 $LIMITE); do
  st="$(json_str "$(api GET "/projects/$REF")" status)"
  case "$st" in
    ACTIVE_HEALTHY) ok=1; break;;
    INACTIVE|REMOVED|RESTORE_FAILED)
      printf '\n' >&2
      die "Project entered '$st' status — check supabase.com/dashboard/project/$REF";;
  esac
  # Uma linha que se reescreve: barra + estado REAL vindo da API + tempo
  # decorrido. Ponto solto por 10 minutos parece travamento; ver COMING_UP
  # mudando e o relógio andando mostra que está vivo.
  preenchido=$((i * 24 / LIMITE))
  # `printf 'x%.0s' $(seq 1 0)` NÃO imprime nada — imprime UMA vez, porque
  # printf sem argumentos ainda roda o formato uma vez. Sem este guarda a barra
  # nascia com 1 bloco a mais no início e no fim (25 de 24).
  barra=""; [ "$preenchido" -gt 0 ] && barra="$(printf '█%.0s' $(seq 1 "$preenchido"))"
  vazio="";  [ $((24 - preenchido)) -gt 0 ] && vazio="$(printf '░%.0s' $(seq 1 $((24 - preenchido))))"
  printf '\r      \033[36m%s%s\033[0m  %-16s %dm%02ds' \
    "$barra" "$vazio" "${st:-checking…}" $(( (SECONDS-inicio)/60 )) $(( (SECONDS-inicio)%60 )) >&2
  sleep 10
done
printf '\r%*s\r' 70 '' >&2
[ "$ok" = 1 ] || die "The project was not ready after 10 minutes. Check supabase.com/dashboard/project/$REF"
c_grn "✓ database is ready (took $(( (SECONDS-inicio)/60 ))m$(( (SECONDS-inicio)%60 ))s)"

# ── 5. Chaves ───────────────────────────────────────────────────────────────
step "Fetching API keys"
keys="$(api GET "/projects/$REF/api-keys")"
# `|| true` pelo mesmo motivo do json_str(): sem ele, resposta inesperada da API
# mata o script na atribuição e a linha de baixo — que imprime a resposta crua e
# explica o que houve — nunca roda.
ANON="$(grep -o '"name"[[:space:]]*:[[:space:]]*"anon"[^}]*' <<<"$keys" | grep -o '"api_key"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)"
SERVICE="$(grep -o '"name"[[:space:]]*:[[:space:]]*"service_role"[^}]*' <<<"$keys" | grep -o '"api_key"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true)"
[ -n "$ANON" ] && [ -n "$SERVICE" ] || { printf '%s\n' "$keys" >&2; die "Could not read anon/service_role keys."; }
c_grn "✓ anon and service_role keys retrieved"

# ── 6. Descobre o host do POOLER — testando, não adivinhando ────────────────
# O host é `aws-<N>-<regiao>.pooler.supabase.com`, e esse <N> VARIA por projeto
# (0, 1, …). Construir às cegas erra, e o erro é justamente o que mais atrapalha
# quem instala: a Direct connection (`db.<ref>.supabase.co`) só existe em IPv6 e
# nunca conecta de um VPS IPv4, mas falha com uma mensagem de rede genérica.
#
# Então: monta os candidatos e PROVA cada um com uma conexão real, via o mesmo
# postgres:17-alpine que o install.sh já usa para aplicar o schema. Fica o que
# responde — sem chute.
step "Finding the pooler host (testing a real connection)"
DB_URL=""
for n in 0 1 2; do
  cand="postgresql://postgres.${REF}:${DB_PASS}@aws-${n}-${REGION}.pooler.supabase.com:5432/postgres"
  if docker run --rm postgres:17-alpine psql "$cand" -c 'select 1' >/dev/null 2>&1; then
    DB_URL="$cand"; c_grn "✓ pooler: aws-${n}-${REGION}"; break
  fi
done
[ -n "$DB_URL" ] || die "No pooler host responded. Copy the Session pooler URI from Settings > Database."

# ── 7. Saída ────────────────────────────────────────────────────────────────
printf '\n' >&2
moldura "Supabase project is ready"
# O resumo vai MASCARADO: quem instala costuma mandar print pedindo ajuda, e um
# service_role inteiro num screenshot é acesso total ao banco, sem RLS.
printf '  %-14s %s\n' "Project"  "$PROJECT_NAME ($REF)" >&2
printf '  %-14s %s\n' "Region"   "$REGION" >&2
printf '  %-14s %s\n' "URL"      "https://$REF.supabase.co" >&2
printf '  %-14s %s\n' "anon"     "$(mascara "$ANON")" >&2
printf '  %-14s %s\n' "service"  "$(mascara "$SERVICE")" >&2
printf '  %-14s %s\n' "database" "$(mascara "$DB_PASS") @ $(sed 's|.*@||; s|:5432.*||' <<<"$DB_URL")" >&2
printf '\n' >&2
c_ylw "  ⚠ The database password CANNOT be retrieved through the API later. Save it now."
c_dim "     Dashboard: https://supabase.com/dashboard/project/$REF"
printf '\n' >&2
c_grn "  Paste the four lines below into .env (or redirect output with: >> .env)"
printf '\n' >&2

# stdout limpo: só as 4 linhas, para `bash supabase-provision.sh ... >> .env`
# funcionar. Todo o visual acima foi para stderr de propósito.
printf "NEXT_PUBLIC_SUPABASE_URL='https://%s.supabase.co'\n" "$REF"
printf "NEXT_PUBLIC_SUPABASE_ANON_KEY='%s'\n" "$ANON"
printf "SUPABASE_SERVICE_ROLE_KEY='%s'\n" "$SERVICE"
printf "SUPABASE_DB_URL='%s'\n" "$DB_URL"
