# Agent Context — cryptara

## What this app is

Cryptara is a crypto portfolio and DeFi platform. Users can track their portfolio, swap tokens, stake assets, and view transaction history. It's a monorepo with a React frontend, a .NET backend, and Hardhat smart contracts.

## Stack

- **frontend/**: React 18, Vite, TypeScript, Redux Toolkit, Tailwind CSS — entry at `frontend/src/main.tsx`
- **backend/**: .NET (C#), [ASP.NET](http://ASP.NET) Core, Entity Framework, SQLite (`finance.db`)
- **smart-contracts/**: Hardhat, Solidity — contracts in `smart-contracts/contracts/`

## Frontend structure

- `frontend/src/views/` — page-level components: `Home/`, `Dashboard/`, `Exchange/`, `Portfolio/`, `Staking/`, `Transactions/`, `Login/`, `Signup/`
- `frontend/src/components/` — shared UI
- `frontend/src/redux/` — Redux slices
- `frontend/src/services/` — API calls to backend
- `frontend/src/hooks/` — custom hooks
- `frontend/src/lib/` — utilities

## Backend structure

- `backend/Controllers/` — [ASP.NET](http://ASP.NET) controllers
- `backend/Services/` — business logic
- `backend/Models/` — entity models
- `backend/Data/` — EF DbContext

## Key patterns

- Frontend calls .NET backend via REST (configured in `frontend/src/config/`)
- Redux for frontend state, `useSelector` / `useDispatch`
- Smart contracts deployed via Hardhat, ABI consumed by frontend via `ethers.js` or `web3.js`
- Auth likely JWT-based from the .NET backend

## Focus for this agent

- Exchange/swap UI — token selection dropdowns, swap button, price display may be unwired
- Staking UI — stake/unstake buttons may not call contracts or backend
- Portfolio — may show hardcoded balances instead of real wallet data
- Dashboard — stats cards likely hardcoded
- Transaction history — may be empty or mocked
