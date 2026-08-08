import re

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

# Pattern for basic docker run psql
text = re.sub(
    r'docker run --rm --network deskcommcrm_default postgres:17-alpine psql "\$SUPABASE_DB_URL" -tAc',
    r'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -tAc',
    text
)

# Pattern for baseline.sql update (line 1387)
text = text.replace(
    'postgres:17-alpine psql "$SUPABASE_DB_URL" -q -f /baseline.sql 2>&1',
    'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -q -f /dev/stdin < supabase/baseline.sql 2>&1'
)

# Pattern for baseline.sql fresh (line 1399)
text = text.replace(
    'postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f /baseline.sql \\',
    'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < supabase/baseline.sql \\'
)

# Pattern for user creation EOF
text = text.replace(
    'docker run --rm -i postgres:17-alpine psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<SQL \\',
    'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<SQL \\'
)

# Fix check_db function (line 286) where it checks connection
text = text.replace(
    'docker run --rm postgres:17-alpine psql "$1" -tAc',
    'docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -tAc'
)

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Done fixing all psql.")
