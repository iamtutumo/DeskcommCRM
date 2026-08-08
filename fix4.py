import sys

with open('hostgator-setup-kit/install.sh', 'r') as f:
    text = f.read()

text = text.replace(
'''  envq NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"''',
'''  envq SELF_HOSTED_SUPABASE "${SELF_HOSTED_SUPABASE:-}"
  envq POSTGRES_PASSWORD "${SB_PG_PASS:-}"
  envq JWT_SECRET "${JWT_SECRET:-}"
  envq NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL"'''
)

with open('hostgator-setup-kit/install.sh', 'w') as f:
    f.write(text)

print("Done fixing env output.")
