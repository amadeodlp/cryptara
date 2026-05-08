# Agent Context — cryptara

## Vision — where this app is headed

Cryptara is a DeFi portfolio and trading platform. The end goal is a working dashboard where a logged-in user can see their real token balances (pulled from their connected wallet or the .NET backend), swap tokens, stake assets, view live price feeds, and manage notifications — all backed by real API calls to the .NET backend and/or the Hardhat smart contracts.

The app's visual structure is complete across all views. The remaining work is replacing hardcoded mock data with real API calls, and wiring action buttons (stake, unstake, mark notification read) to the backend. The agent should move the app toward a state where every number on screen comes from a real source and every button does something that persists.

## Stack

- **frontend/**: React 18, Vite, TypeScript, Redux Toolkit, Tailwind CSS — entry at `frontend/src/main.tsx`
- **backend/**: .NET (C#), ASP.NET Core, Entity Framework, SQLite (`finance.db`)
- **smart-contracts/**: Hardhat, Solidity — contracts in `smart-contracts/contracts/`

## Frontend structure

- `frontend/src/views/` — page-level components: `Home/`, `Dashboard/`, `Exchange/`, `Portfolio/`, `Staking/`, `Transactions/`, `Login/`, `Signup/`
- `frontend/src/components/` — shared UI: `atoms/` (Button, Input, Toast), `molecules/` (WalletConnect), `organisms/` (MainLayout), plus `Notifications/` and `PortfolioAnalytics/`
- `frontend/src/redux/` — Redux slices: `authSlice`, `notificationSlice`, `walletSlice`; API layer in `redux/api/authApi.ts`
- `frontend/src/services/` — `web3Service.ts`, `blockchain/portfolioService.ts`, `blockchain/transactionService.ts`
- `frontend/src/config/` — `http.ts` (Axios base client), `contracts.ts` (contract addresses)
- `frontend/src/hooks/` — `useWallet.ts`

## Key patterns

- All HTTP calls go through the Axios instance in `frontend/src/config/http.ts` — do not use fetch directly
- Redux for global state — `useSelector` / `useDispatch`; do not add new slices unless necessary
- Backend endpoints follow REST convention: `GET /api/{resource}`, `POST /api/{resource}`, etc.
- Smart contract interactions use ethers.js or web3.js via `web3Service.ts` — follow that pattern for any new contract calls
- The .NET backend is the primary data source for portfolio, staking, notifications, and price feeds — Supabase (`frontend/src/lib/supabase.ts`) is secondary
- Agent scope is **frontend only** — do not modify .NET backend files or Solidity contracts

## Known incomplete areas — prioritize these

- `views/Home/Home.tsx` — balance displays hardcoded `$1,234.56` set via `setTimeout`; replace with a real call to `GET /api/portfolio/balance` via the Axios client and display the result
- `views/Dashboard/Dashboard.tsx` — market overview falls back to hardcoded prices; wire it to `GET /api/pricefeed/bulk` and display live values; show a loading state while fetching
- `views/Exchange/Exchange.tsx` — BTC/ETH/SOL/CRA market table rows are hardcoded HTML; replace with a mapped render over data fetched from `GET /api/pricefeed/bulk`
- `views/Portfolio/Portfolio.tsx` — assets table shows hardcoded mock rows; replace with data from `GET /api/portfolio/assets` or `portfolioService.ts`
- `views/Staking/Staking.tsx` — stake/unstake buttons update local state only; wire them to `POST /api/staking/stake` and `POST /api/staking/unstake` with the correct payload, and reflect the response in state
- `components/Notifications/NotificationCenter.tsx` — fetches hardcoded mock notifications; replace with `GET /api/notification`, and wire mark-as-read and delete actions to the corresponding API endpoints so they persist
