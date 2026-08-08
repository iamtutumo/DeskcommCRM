import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

text = text.replace(
'''docker run --rm --network deskcommcrm_default postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c \\
    "create extension if not exists vector with schema public; create extension if not exists citext with schema public; create extension if not exists pg_trgm with schema public;" \\''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \\
    "create extension if not exists vector with schema public; create extension if not exists citext with schema public; create extension if not exists pg_trgm with schema public;" \\''')

text = text.replace(
'''docker run --rm --network deskcommcrm_default postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/baseline.sql''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < supabase/baseline.sql''')

text = text.replace(
'''docker run --rm --network deskcommcrm_default postgres:17-alpine psql "$SUPABASE_DB_URL" -f supabase/baseline.sql''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -f /dev/stdin < supabase/baseline.sql''')

text = text.replace(
'''docker run --rm --network deskcommcrm_default postgres:17-alpine psql "$SUPABASE_DB_URL" -f "$f"''',
'''docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -f /dev/stdin < "$f"''')

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)
print("Done fixing docker run.")
