# Jonamat macro planner

Try it live: [https://macroplanner.jmat.it/](https://macroplanner.jmat.it/)

Macro planner is a full-stack meal-planning companion that stores your favorite ingredients, tracks macro targets per meal, and uses an optimization engine to balance ingredient quantities against those goals.

> **Disclaimer**  
> This planner is not a medical tool, and the author does not accept responsibility for the results. Use it to keep eating what you enjoy—just calibrate ingredient weights so they line up with your personalized plan. Craft that plan with guidance from a licensed nutritionist, a trustworthy online calculator, or fine-tuned AI tool.

## Highlights

- Personal ingredient library with carbs/protein/fat per 100 g, optional min/max bounds, mandatory grams, and indivisible serving sizes.
- Meal targets and history stored per authenticated user via an Express + Prisma API backed by SQLite.
- Custom TypeScript solver (`optimizeMealToMacro`) that balances ingredients to hit macro targets within a tolerance window and reports per-macro deviation.
- Responsive React UI built with Chakra UI, React Router, and React Toastify, including import/export helpers for sharing plans as JSON.
- First-time onboarding copy (Info page) plus guarded routes using a lightweight auth provider that persists JWTs in local storage.

## Core Workflows

- **Create macro targets** on the Meals page, specifying grams of carbohydrates, protein, and fat per meal. Targets are scoped to the signed-in user.
- **Build an ingredient catalogue from your kitchen** with optional minimum/maximum grams, mandatory weights, and indivisible steps (useful for packaged foods that only come in fixed increments).
- **Optimize meals** from the home dashboard. Toggle the ingredients you want to include, fine-tune their constraints, and trigger the solver to generate gram weights, macro totals, and deviation indicators.
- **Review, export, and iterate** using Results cards. Export meals or ingredients as JSON for backups or sharing, then re-import them from the modals when needed.

## Monorepo At A Glance

- `apps/client` – Vite + React SPA that drives the macro planner experience.
- `apps/server` – Express API with JWT authentication, Prisma ORM, and static serving of the client build.
- `packages/shared` – Reusable optimization logic and shared TypeScript types consumed by both server and client.

## Getting Started

1. **Requirements**  
   - Node.js 18+  
   - Yarn (Berry/classic) workspaces enabled  
   - SQLite (bundled with Node) for local development

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` – SQLite connection string (defaults to `file:./prisma/data/dev.db`).  
   - `JWT_SECRET` – Secret used to sign access tokens.  
   - `SERVER_PORT` – Port for the Express API (client proxies to this when running in dev).

4. **Apply database migrations**
   ```bash
   yarn migrate
   ```

5. **Start everything in watch mode**
   ```bash
   yarn dev
   ```
   This spawns the shared package compiler, the API (`@macro-calculator/server`), and the Vite dev server (`@macro-calculator/client`) in parallel.

Common alternatives:

- API only: `yarn dev:server`
- Client only: `yarn dev:client`
- Shared package watch: `yarn workspace @macro-calculator/shared dev`


## API Overview

All routes are prefixed with `/api`.

| Method | Route | Description |
| ------ | ----- | ----------- |
| `GET` | `/health` | Liveness probe. |
| `POST` | `/auth/signup` | Create an account, returning a JWT + user object. |
| `POST` | `/auth/login` | Authenticate an existing user. |
| `GET` | `/ingredients` | List the current user's ingredients. |
| `POST` | `/ingredients` | Create a new ingredient entry. |
| `PATCH` | `/ingredients/:id` | Update ingredient macros or constraints. |
| `DELETE` | `/ingredients/:id` | Remove an ingredient. |
| `GET` | `/meals` | Fetch saved macro targets. |
| `POST` | `/meals` | Create a target. |
| `PATCH` | `/meals/:id` | Edit a target. |
| `DELETE` | `/meals/:id` | Delete a target. |

Authentication: Bearer token (JWT) returned from signup/login endpoints. Routes under `/ingredients` and `/meals` require a valid token.

## Testing & Quality

- Run monorepo unit tests (shared + server):
  ```bash
  yarn test
  ```
- Type-check the client:
  ```bash
  yarn workspace @macro-calculator/client typecheck
  ```
- Launch Playwright UI tests (uses an ephemeral SQLite database and boots the stack automatically):
  ```bash
  yarn workspace @macro-calculator/client test
  ```
- Build artefacts before releasing:
  ```bash
  yarn build
  ```

## Deployment Notes

- Production build bundles the shared package and emits `apps/server/dist` + `apps/client/dist`.
- Serve with:
  ```bash
  yarn workspace @macro-calculator/server build
  yarn workspace @macro-calculator/client build
  yarn workspace @macro-calculator/server start
  ```
- The server automatically serves the Vite output from `apps/client/dist`; deploying a single Node process is sufficient. Configure `DATABASE_URL`, `JWT_SECRET`, and `SERVER_PORT` in your production environment.

## Publishing Checklist

- [ ] Replace temporary copy (e.g., Info page notes) with branded content and onboarding links.
- [ ] Capture and add screenshots or GIFs that showcase the optimisation workflow.
- [ ] Update `package.json` fields (`name`, `description`, `repository`, `homepage`) before publishing.
- [ ] Run `yarn build && yarn test` and ensure Playwright checks pass in CI.
- [ ] Tag a release, push to GitHub, then publish release notes.

## License

Released under the [MIT License](LICENSE).
