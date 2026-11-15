# Salary Management API

Express, TypeScript, Sequelize, and PostgreSQL backend. The API listens on port `4000` by default.

## Setup

1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`, set the database values, and replace the JWT secret and seed passwords with private values. `JWT_SECRET` must be at least 32 characters.
3. From `backendServer`, install dependencies and create the PostgreSQL database named in `DB_NAME`.
4. Run `npm run db:migrate`, then `npm run seed`.
5. Start with `npm run dev`, or run `npm run build` followed by `npm start`.

The seed command creates the five roles, five permissions, a System_ADMIN account, a Standard salary structure, and 10,000 employee accounts. Seeded employees use `EMPLOYEE_SEED_PASSWORD`; change that value before running the seed and protect it as a credential.

## API

All application endpoints are under `/api/v1`. Send authenticated requests with `Authorization: Bearer <token>`.

- `POST /user/login`, `POST /user/logout`
- `POST /user`, `GET /user`, `GET /user/:id`, `PATCH /user/:id`, `DELETE /user/:id`
- `GET /roles`, `GET /roles/:id`, `GET /roles/permissions`; role create/update/delete endpoints are permission-gated
- `GET /salary`, `GET /salary/employees/:userId`, and `PUT /salary/employees/:userId`
- `GET /salary/structures` and structure create/update/delete endpoints
- `GET /health`

List endpoints accept `page` and `limit`; user search also accepts `search`. Access is controlled by the seeded Create, Read, Update, Delete, and Approve permissions. Password hashes and token version fields are excluded from normal user responses.

## Validation

Run `npm test` for basic tests and `npm run build` for TypeScript type-checking and compilation.
