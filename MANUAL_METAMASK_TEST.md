# Manual MetaMask Verification Guide (Preview)

> **Notice:** The automated testing agent operates in a non-interactive environment using throwaway keys and typed RPC calls. Every MetaMask interaction described below is marked **"Not run by the agent"** and requires a human reviewer with a browser wallet.

---

## 1. Network Configuration

Add the GenLayer Studionet network to MetaMask:

| Parameter | Value | Status |
| :--- | :--- | :--- |
| **Network Name** | GenLayer Studionet | Preview |
| **RPC URL** | `https://studio.genlayer.com/api` | Verified |
| **Chain ID** | `61999` (Hex: `0xf22f`) | Verified |
| **Currency Symbol** | `GEN` | Demo currency |
| **Block Explorer** | `https://explorer-studio.genlayer.com` | Verified |

*(Manual network configuration: **Not run by the agent**)*

---

## 2. Interactive Verification Checklist

### Step 1: Connect Wallet & Claim Demo Credits
- **Route:** `/credits`
- **Action:** Click "Connect Wallet". Approve connection in MetaMask.
- **Verification:** Connected address appears with a 0 credit balance.
- **Action:** Click "Claim 1,000 Demo Credits". Confirm the `claim_demo_credits()` transaction in MetaMask.
- **Verification:** Balance updates to `1000 CREDITS`.
- *(Status: **Not run by the agent**)*

### Step 2: Configure & Create an Allowance Account
- **Route:** `/accounts/new`
- **Action:**
  - Name: `Production Micro-Services Account`
  - Currency: `USD`
  - Per-Spend Limit: `300`
  - Total Budget: `1000`
  - Max Spends: `10`
  - Category: `CLOUD`
  - Payee: `0x...` (your secondary address or merchant address)
  - Evidence Prefix: `https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/cloudco/`
- **Action:** Click "Create Allowance Account". Confirm `create_account` in MetaMask.
- **Verification:** Account ID is discovered and redirects to `/accounts/:id`.
- *(Status: **Not run by the agent**)*

### Step 3: Fund Account & Authorize AI Agent
- **Route:** `/accounts/:id`
- **Action:** Click "Fund Account", enter `500` credits, and confirm in MetaMask (`fund_account`).
- **Verification:** Account balance displays `500 CREDITS`; owner demo balance decreases by 500.
- **Action:** Click "Authorize Agent", enter an agent address (e.g. secondary wallet), and confirm in MetaMask (`add_agent`).
- **Verification:** Agent appears in Authorized Agents list.
- *(Status: **Not run by the agent**)*

### Step 4: Request Spend Execution (Agent Perspective)
- **Route:** `/accounts/:id/spend`
- **Action:** Switch MetaMask active account to the authorized agent address.
- **Select Preset:** "Valid Invoice A (120 USD)"
  - Payee: Configured payee address
  - Amount: `120`
  - Category: `CLOUD`
  - Evidence URL: `https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/cloudco/inv-a-120.md`
- **Action:** Click "Submit Spend Request for Consensus". Confirm in MetaMask (`request_spend`).
- **Verification:** GenLayer validators evaluate the invoice non-deterministically, reach consensus, and return `APPROVED`. Ledger reflects payment of 120 credits to payee.
- *(Status: **Not run by the agent**)*

### Step 5: Test Downstream SpendGate Service Delivery
- **Route:** `/gate`
- **Action:** Switch MetaMask to the payee address.
- **Parameters:**
  - Spend ID: `1`
  - Account ID: `1`
  - Payee Address: Payee address
  - Amount: `120`
  - Policy Hash: (auto-filled from receipt)
- **Verification:** Verification check shows "Valid Spend - Eligible for Service Delivery".
- **Action:** Click "Execute Service Delivery (serve)". Confirm in MetaMask.
- **Verification:** Status changes to `SERVED`.
- **Action:** Click "Execute Service Delivery" again.
- **Verification:** Reverts with error `spend already served`.
- *(Status: **Not run by the agent**)*

### Step 6: Close Account & Refund Owner
- **Route:** `/accounts/:id`
- **Action:** Switch MetaMask back to account owner. Click "Close Account".
- **Action:** Confirm in MetaMask (`close_account`).
- **Verification:** Account status becomes `CLOSED`. Remaining unspent credits are automatically refunded to owner balance.
- *(Status: **Not run by the agent**)*

---

## 3. Automated Suite Equivalent Proof

While interactive MetaMask steps are not executed by headless automated scripts, every single contract call in the sequence above is executed on GenLayer Studionet by `scripts/e2e_full_chain.mjs`, and raw receipt artifacts with transaction hashes are preserved in `tests/e2e_receipts/`.
