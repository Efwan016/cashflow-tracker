# Cashflow App

A React, TypeScript, and Vite application for tracking cashflow, expenses, inventory, transactions, and financial reports. The app is built as a practical portfolio project with a strong focus on maintainability, automated testing, and developer workflow quality.

## Features

- Dashboard for monitoring revenue, expenses, profit, and recent activity.
- Transaction management with inventory-aware sales tracking.
- Expense tracking with date-based filtering.
- Product and inventory management with stock status visibility.
- Financial reports with charts, trends, and export-friendly views.
- Supabase integration for authentication and persisted application data.
- Responsive UI built with Tailwind CSS.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- Chart.js and react-chartjs-2
- jsPDF and jspdf-autotable
- ESLint
- Vitest, React Testing Library, jest-dom, and jsdom
- Husky and lint-staged
- GitHub Actions

## Testing

The test suite uses Vitest with React Testing Library, jest-dom, and jsdom. Tests cover utility helpers and user-facing React behavior so the app can be checked quickly during local development and CI.

Run the test suite:

```bash
CI=true npm run test:run
```

Current verified test status:

- 7 test files passed
- 25 tests passed

## Git Hooks

Husky runs quality checks before commit and push.

- `pre-commit` runs `npm run lint:staged`.
- `lint-staged` runs ESLint on staged JavaScript and TypeScript files.
- `pre-push` runs `CI=true npm run test:run` and `npm run build`.

This keeps fast checks close to the commit step and runs heavier verification before code is pushed.

## GitHub Actions CI

GitHub Actions runs CI on `push` and `pull_request` events using Node.js 20.

The CI workflow:

1. Checks out the repository.
2. Sets up Node.js 20 with npm caching.
3. Installs dependencies with `npm ci`.
4. Runs `CI=true npm run test:run`.
5. Runs `npm run build`.

Workflow file:

```text
.github/workflows/ci.yml
```

## Local Development

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check with TypeScript and build the production app. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint across the project. |
| `npm run lint:staged` | Run lint-staged against staged files. |
| `npm run test` | Start Vitest in watch mode. |
| `npm run test:run` | Run the Vitest suite once. |
| `npm run test:ui` | Open the Vitest UI. |
| `npm run prepare` | Install Husky Git hooks after dependencies are installed. |

## Project Quality Checklist

- Type-safe React code with TypeScript.
- Automated tests with Vitest, React Testing Library, jest-dom, and jsdom.
- Local Git hooks with Husky and lint-staged.
- Pre-push verification for tests and production build.
- GitHub Actions CI on push and pull request.
- Utility helpers documented with JSDoc.
- Production build verified with Vite.
- No business logic changes required for quality workflow updates.
