# Auth notes

Stack decision: Node.js + Express

Libraries:
- bcrypt for password hashing
- jsonwebtoken for JWT sign/verify
- dotenv for env config
- cors for Vite frontend access

Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

Seeded admin (from .env):
- email: admin@email.com
- password: admin123

Frontend should:
1. Call POST /auth/login or /auth/register
2. Store the returned JWT
3. Send Authorization: Bearer <token> on protected requests
4. Call GET /auth/me for role-based routing
5. On logout, discard the token client-side
