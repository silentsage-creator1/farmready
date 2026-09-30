# FarmReady Nigeria

FarmReady Nigeria is a decision-support tool for prospective farmers and farm investors. It helps users organize a farm proposal, review its readiness across seven systems, explore basic financial assumptions, and identify questions to resolve before committing significant capital.

## Run locally

**Prerequisite:** Node.js

1. Install dependencies with `npm install`.
2. Start the calculator API in one terminal with `npm run dev:api` (port 3001).
3. Start the Vite app in a second terminal with `npm run dev` (port 3000).
4. Open the local URL printed by Vite. Vite forwards `/api` requests to the calculator API.

The current assessment and inventory data are stored in the browser's local storage. Calculator requests are computed by the Express API in `server/`; calculation formulas are kept server-side and the UI displays returned results. Production deployments must run the API and route `/api` requests to it from the same origin as the frontend. The app includes a sample project for demonstration; create a new assessment to enter a separate farm proposal.

## Available scripts

- `npm run dev` — start the Vite development server.
- `npm run dev:api` — start the Express calculator API.
- `npm run build` — create a production build.
- `npm run lint` — run the TypeScript compiler without emitting files.

Financial projections and readiness ratings depend on entered assumptions. They are planning aids, not guarantees of yield, market demand, or investment returns.
