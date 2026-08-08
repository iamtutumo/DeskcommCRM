import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

# Fix 1386-1387
text = text.replace(
'''    raw="$(docker run --rm -i -v "$PROJECT_DIR/supabase/baseline.sql:/baseline.sql:ro" \\
          docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -q -f /dev/stdin < supabase/baseline.sql 2>&1 || true)"''',
'''    raw="$(docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -q -f /dev/stdin < "$PROJECT_DIR/supabase/baseline.sql" 2>&1 || true)"'''
)

# Fix 1398-1399
text = text.replace(
'''    if docker run --rm -i -v "$PROJECT_DIR/supabase/baseline.sql:/baseline.sql:ro" \\
        docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < supabase/baseline.sql \\''',
'''    if docker exec -i "$(docker ps -q -f name=supabase-db | head -n 1)" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < "$PROJECT_DIR/supabase/baseline.sql" \\'''
)

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Done fixing wrapper.")
