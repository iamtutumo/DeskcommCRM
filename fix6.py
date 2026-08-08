import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

reps = {
    "A instalação parou. Nada ficou pela metade sem conserto.": "Installation stopped. Nothing was left broken.",
    "não consegui checar a chave online": "could not check key online",
    "sigo com ela.": "continuing with it.",
    "Esse valor parece ter sido colado 2x seguidas": "This value seems to have been pasted twice",
    "Docker não está instalado — é o motor que roda o CRM.": "Docker is not installed — it is the engine that runs the CRM.",
    "Instalando (get.docker.com — o instalador oficial). Leva 1-2 minutos…": "Installing (get.docker.com). Takes 1-2 minutes...",
    "Últimas linhas do instalador do Docker:": "Last lines of Docker installer:",
    "Docker instalado": "Docker installed",
    "Este servidor tem": "This server has",
    "O CRM sobe, mas fica no limite:": "The CRM will start, but will be at the limit:",
    "são 7 contêineres e o WhatsApp usa": "there are 7 containers and WhatsApp uses",
    "Adicione swap antes de operar": "Add swap before operating",
    "repositório em ./$REPO_DIR": "repository at ./$REPO_DIR",
    "Clonando $REPO_URL ...": "Cloning $REPO_URL ...",
    "existente carregado": "existing loaded",
    "retomando:": "resuming:",
    "resposta(s) guardadas da tentativa anterior": "response(s) saved from previous attempt",
    "para responder tudo de novo do zero:": "to answer everything again from scratch:",
    "Aplicando o schema no Supabase": "Applying schema in Supabase",
    "extensões (vector, citext, pg_trgm) habilitadas no public": "extensions (vector, citext, pg_trgm) enabled in public",
    "não consegui habilitar as extensões — o schema pode falhar abaixo.": "could not enable extensions — schema might fail below.",
    "schema já existe — re-aplicando em modo update": "schema already exists — reapplying in update mode",
    "Erros no banco que NÃO são os esperados": "Database errors that are NOT expected",
    "schema re-aplicado (apêndice de migrations incluído)": "schema re-applied (migrations appendix included)",
    "schema aplicado": "schema applied",
    "baseline falhou num banco NOVO": "baseline failed on a NEW database",
    "dono criado e promovido a super-admin": "owner created and promoted to super-admin",
    "Não consegui promover o admin.": "Could not promote admin.",
    "containers no ar": "containers up",
    "Quase lá — falta o app responder": "Almost there — waiting for app to respond",
    "app no ar e saudável": "app is up and healthy",
    "os contêineres subiram, mas o app não respondeu que está saudável.": "containers are up, but app didn't respond healthy."
}

for k, v in reps.items():
    text = text.replace(k, v)

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Done translating more strings.")
