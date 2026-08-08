import sys

with open('hostgator-setup-kit/_common.sh', 'r') as f:
    text = f.read()

reps = {
    "não encontrado — instale o pacote 'cron' e rode de novo pra ativar as automações.": "not found — install the 'cron' package and run again to enable automations.",
    "falta INTERNAL_SECRET/INTERNAL_CRON_SECRET — não ativei o cron das automações.": "missing INTERNAL_SECRET/INTERNAL_CRON_SECRET — did not activate automations cron.",
    "falta NEXT_PUBLIC_APP_URL — não ativei o cron das automações.": "missing NEXT_PUBLIC_APP_URL — did not activate automations cron.",
    "automações ativas (cron do event-log-drain, a cada minuto)": "automations active (event-log-drain cron, every minute)",
    "eventos pendentes com mais de 7 dias marcados como concluídos": "pending events older than 7 days marked as completed",
    "não consegui higienizar eventos antigos — confira manualmente a tabela event_log se necessário.": "could not sanitize old events — check event_log table manually if necessary.",
    "não encontrado — o botão de atualizar pela tela não vai funcionar.": "not found — the UI update button will not work.",
    "falta INTERNAL_SECRET — não ativei o agente de atualização.": "missing INTERNAL_SECRET — did not activate update agent.",
    "falta NEXT_PUBLIC_APP_URL — não ativei o agente de atualização.": "missing NEXT_PUBLIC_APP_URL — did not activate update agent.",
    "atualização pela tela ativa (agente a cada 5 minutos)": "UI updates active (agent every 5 minutes)",
    "chave de cifra dos segredos gerada e gravada no .env": "secrets encryption key generated and saved in .env",
    "chave de cifra ativa no banco (segredos de webhook são guardados cifrados)": "encryption key active in db (webhook secrets are stored encrypted)",
    "não consegui semear a chave de cifra no banco — segredos de webhook não poderão ser salvos até rodar update.sh de novo.": "could not seed encryption key in db — webhook secrets cannot be saved until running update.sh again."
}

for k, v in reps.items():
    text = text.replace(k, v)

with open('hostgator-setup-kit/_common.sh', 'w') as f:
    f.write(text)

print("Translated _common.sh.")
