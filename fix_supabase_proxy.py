import sys

# Modify Caddyfile
with open('Caddyfile', 'r') as f:
    caddy = f.read()

supabase_caddy = '''		# Supabase proxy
		handle_path /supabase/* {
			reverse_proxy supabase-kong:8000
		}

		# O runner de agente'''
caddy = caddy.replace('# O runner de agente', supabase_caddy)

with open('Caddyfile', 'w') as f:
    f.write(caddy)

# Modify docker-compose.traefik.yml
with open('docker-compose.traefik.yml', 'r') as f:
    traefik = f.read()

supabase_traefik = '''      - "traefik.http.routers.deskcommcrm.entrypoints=${TRAEFIK_ENTRYPOINT_HTTP},${TRAEFIK_ENTRYPOINT}"

  # Supabase Kong proxy rules
  supabase-kong:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.supabase.rule=Host(`${DOMAIN}`) && PathPrefix(`/supabase`)"
      - "traefik.http.middlewares.supabase-stripprefix.stripprefix.prefixes=/supabase"
      - "traefik.http.routers.supabase.middlewares=supabase-stripprefix"
      - "traefik.http.routers.supabase.entrypoints=${TRAEFIK_ENTRYPOINT}"
      - "traefik.http.routers.supabase.tls.certresolver=${TRAEFIK_CERTRESOLVER}"
      - "traefik.http.services.supabase.loadbalancer.server.port=8000"'''

traefik = traefik.replace('      - "traefik.http.routers.deskcommcrm.entrypoints=${TRAEFIK_ENTRYPOINT_HTTP},${TRAEFIK_ENTRYPOINT}"', supabase_traefik)

with open('docker-compose.traefik.yml', 'w') as f:
    f.write(traefik)

# Now update NEXT_PUBLIC_SUPABASE_URL in install.sh to use https://${DOMAIN}/supabase
with open('hostgator-setup-kit/install.sh', 'r') as f:
    install_sh = f.read()

install_sh = install_sh.replace(
    '''export NEXT_PUBLIC_SUPABASE_URL="http://supabase-kong:8000"''',
    '''export NEXT_PUBLIC_SUPABASE_URL="https://${DOMAIN}/supabase"'''
)

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(install_sh)

print("Done fixing Supabase public access.")
