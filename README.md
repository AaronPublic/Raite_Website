1. Git clone
2. ENV

DATABASE_URL="postgresql://postgres:admin@localhost:5432/raite_registration?schema=public"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2VsZWN0ZWQtc3F1aWQtMjQuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_yMclnhqSUV0nxyUKgsPFAhjKDhjhLL8DMWTzlXj0cl
CLERK_WEBHOOK_SECRET="whsec_G+GYRKpxs1Xtq+GQ9AdhDUuISH/rxYAC"

RESEND_API_KEY="re_w4ZkG7vV_HmvZtwUJErDPaRvbcK4hwZn8"

UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

GOOGLE_GENERATIVE_AI_API_KEY="..."

NEXT_PUBLIC_SUPABASE_URL="https://auybatfdhhusbvcgnnkc.supabase.co/"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eWJhdGZkaGh1c2J2Y2dubmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNzI3MzUsImV4cCI6MjA5NTk0ODczNX0.Ro4oQ0JuBOZeq5zJAdIhOWkh7XIl4f1UzWNjCfGnZoA"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_oG0WuYOpOB5YCIStRXwIUQ_r-y9ocPO"

NEXT_PUBLIC_APP_URL="http://localhost:3000/"

3. create database raite_registration;
4. cd raite_registration
5. npm install

6. new terminal npx prisma generate
7. npx prisma db push
8. npx prisma studio

9. setup ngrock terminal
10. winget install ngrok -s msstore
11. ngrok config add-authtoken $YOUR_AUTHTOKEN
12. ngrok http 80

13. cd raite_registration / npm run dev
