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

## Known incomplete areas

- Dashboard — market overview falls back to hardcoded prices when `/api/pricefeed/bulk` is unavailable
- NotificationCenter — the `/api/notification` endpoint requires auth; if the JWT is expired the component silently shows no notifications with no retry/refresh mechanism
- Staking UI — when multiple active positions exist for the same token symbol, only the most recent position ID is tracked per pool row; unstaking always targets that single position. Partial unstake across multiple positions is not supported.
- Exchange swap settings button (⚙️) has no handler — clicking it does nothing.
- TokenPurchase component (`Exchange/TokenPurchase/TokenPurchase.tsx`) references `ethers.BigNumber` which does not exist in ethers v6; this component is not rendered in the current Exchange view but would error if used.
