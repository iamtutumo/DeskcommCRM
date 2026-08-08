import sys

with open('docker-compose.traefik.yml', 'r') as f:
    text = f.read()

text = text.replace('''  supabase-kong:
    labels:''', '''  supabase-kong:
    networks:
      - internal
      - proxy
    labels:
      - "traefik.docker.network=${TRAEFIK_NETWORK:-traefik}"
''')

with open('docker-compose.traefik.yml', 'w') as f:
    f.write(text)

print("Fixed supabase-kong traefik networking.")
