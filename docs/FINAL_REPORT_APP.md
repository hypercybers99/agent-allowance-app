# Final Application Evidence & Verification Report: Agent Allowance (Preview)

STATUS: READY

## 1. Active Deployed Contracts & Source Parity (GenLayer Studionet - Chain 61999)

- **AllowanceVault**: `0xd89C4fCB63773C01e8494EebaE7375C4d5992E07`
  - Deploy Transaction: `0x53965fc7c6a0c0bbfec2f0eb3a76395dcfae6eeb246f4439c2794eb827051ae3` (deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address)
  - Source SHA-256: `ff656818cd98e7387794cce80dc0f0bb8da8b6a85e80a8deaa2e20087866b4ea`
  - Explorer: https://explorer-studio.genlayer.com/address/0xd89C4fCB63773C01e8494EebaE7375C4d5992E07
- **SpendGate**: `0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528`
  - Deploy Transaction: `0x3ab3717dfb119cb45a4773ebfc48d9aa1787c9339e1f5c66b8d276b89ae6e10f` (deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address)
  - Source SHA-256: `619f9fd95e40678b6aca68bf90b2de9c579b965a1f62ed707b3d73a3d9162101`
  - Explorer: https://explorer-studio.genlayer.com/address/0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528
- **ProbeExtract**: `0x9EBE36E328c1A4b8609c8dcB300eF4DF90db8997`
  - Deploy Transaction: `0xdb335abaca6e9c82b1d56a809ccb5aee66d378a49225a0b61b1ef34c6f238831`
  - Source SHA-256: `34b23f6e846a9caeecf7dabb480f987224f28a8ab58f31230152f377c74e9f0c`
- **Superseded Vault**: `0x63D63C490AD9Cf9C35E196D8366e23748212C5c2`
  - Deploy Transaction: `0xba40c31c067912e8a5f425f69b4f068a4007c6f555262594517829777c327a9f`
  - Documented honestly as superseded.

### Byte-for-Byte On-Chain Parity Table
| Contract | Address | Local SHA-256 | Expected SHA-256 | Diff | Status |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **AllowanceVault** | `0xd89C4fCB63773C01e8494EebaE7375C4d5992E07` | `ff656818cd98e7387794cce80dc0f0bb8da8b6a85e80a8deaa2e20087866b4ea` | `ff656818cd98e7387794cce80dc0f0bb8da8b6a85e80a8deaa2e20087866b4ea` | Empty | **byte-for-byte** |
| **SpendGate** | `0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528` | `619f9fd95e40678b6aca68bf90b2de9c579b965a1f62ed707b3d73a3d9162101` | `619f9fd95e40678b6aca68bf90b2de9c579b965a1f62ed707b3d73a3d9162101` | Empty | **byte-for-byte** |

---

## 2. Application Architecture & Responsive Page List

| Page Name | Route | What Is Read (Views) | What Is Written (Writes) | Screenshots (Light & Dark) |
| :--- | :--- | :--- | :--- | :--- |
| **Overview** | `/` | `get_stats()`, `get_limits()` | None | `overview-1280-*`, `overview-360-*` |
| **Accounts** | `/accounts` | `list_accounts_by_owner()`, `get_account()` | None | `accounts-1280-*`, `accounts-360-*` |
| **Create Account** | `/accounts/new` | None | `create_account(name, policy)` | `create-account-1280-*`, `create-account-360-*` |
| **Account Detail** | `/accounts/:id` | `get_account()`, `list_spends_by_account()` | `fund_account()`, `add_agent()`, `close_account()` | `account-detail-1280-*`, `account-detail-360-*` |
| **Request Spend** | `/accounts/:id/spend` | `get_account()` | `request_spend(account_id, payee, amount, cat, url)` | `request-spend-1280-*`, `request-spend-360-*` |
| **Spend Detail** | `/spends/:id` | `get_spend()`, `get_account()` | `resolve_spend(spend_id, approve)` | `spend-detail-1280-*`, `spend-detail-360-*` |
| **SpendGate** | `/gate` | `get_spend()`, `get_account()`, `is_spend_valid_for()`, `get_service()` | `serve(spend_id, account_id, payee, amount, hash)` | `spendgate-1280-*`, `spendgate-360-*` |
| **Demo Credits** | `/credits` | `balance_of(address)` | `claim_demo_credits()` | `credits-1280-*`, `credits-360-*` |
| **Evidence** | `/evidence` | Canonical R1-R13, 60-run robustness summary, finalization data | None | `evidence-1280-*`, `evidence-360-*` |
| **Limitations** | `/limits` | `get_limits()` | None | `limits-1280-*`, `limits-360-*` |
| **Not Found** | `/404` | None | None | `not-found-1280-*`, `not-found-360-*` |

Total Saved Screenshots: 44 files under `docs/screens/` (44 captures across 11 routes, 2 viewports [1280px, 360px], and 2 color schemes [light, dark]).

---

## 3. Error-Map & Golden Schema Verification Metrics

### Error-Mapping Parity (`tests/errors.test.ts`)
```
ERROR PARITY TEST METRICS:
  AllowanceVault Unique Exact Errors: 35
  AllowanceVault Prefix Errors:       2
  SpendGate Unique Exact Errors:      3
  SpendGate Prefix Errors:           0
  Total Unique Contract Error Keys:   40
  Total Mapped Errors in errors.ts:   40
  Missing in Mapping (Diff):         []
  Extra in Mapping (Diff):           []
```
- Contract UserErrors: 40 unique conditions
- Mapped in `src/lib/errors.ts`: 40/40 (100% bidirectional parity, zero diffs)

### Golden Schema Parity (`tests/golden.test.ts`)
- 5 golden schema suites verified against chain outputs:
  - `get_account` schema: exact property match, zero invented fields
  - `get_spend` schema: exact property match, zero invented fields
  - `get_stats` schema: exact property match, zero invented fields
  - `get_limits` schema: exact property match, zero invented fields
  - SpendGate `get_service` / `is_spend_valid_for`: exact property match, zero invented fields

---

## 4. Full On-Chain E2E Execution & Ledger Invariant Proof

Executed on GenLayer studionet (Chain 61999) via `scripts/e2e_full_chain.mjs` using zero-balance throwaway accounts.

### Participants
- **Account Owner**: `0xF83B98094B37C2DA250242ae445a33ee80B409a5`
- **Authorized Agent**: `0xd59eA518b3F09937C0E70E751F9eCE9B589cB37b`
- **Payee Address**: `0x29ce6d6cf20851d18EB6716B7528beABc791034E`
- **Assigned Account ID**: `12`

### E2E On-Chain Transaction Log (Writes Only)
| Step | Function Call | Transaction Hash | Status Name | Result Name | Leader Execution | Latency |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `claim_demo_credits` | `0x2a3e78bcb24db45b0b637a8e5de96fb121a3f6ea688a014fdca2af11b766cf6b` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 9.64s |
| 2 | `create_account` | `0xbc4e4297a459a98028c92afbb284d0fafe07e895d7620e64067f0835384a0376` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.39s |
| 3 | `fund_account` | `0xce9bb3af9df57d3701975608750609eae7fa40e8b8d639edcf4e823d4c88ec3c` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.45s |
| 4 | `add_agent` | `0xd35f71a9271b59bebefb1e5b2637bd07170c8eb9ba0b90363a9848447a22aab7` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.44s |
| 5 | `request_spend` | `0x389bcc8eeaea4b7303a9cf87f2795ccf0c0cb52cd883a3b0b99b941733f16f04` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 15.04s |
| 6 | `request_spend` | `0x51f974d979a303babbfcf5b92db327a487014ff0c1c10dee038624b80cace471` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.53s |
| 7 | `request_spend` | `0xfbe5bf12433e9e9753136bff162e5dc68703aa01ce161309cd3d8793625733ec` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.26s |
| 8 | `request_spend` | `0xdad36b0217ec8d7d613403e21e8f0e9a7ec31cdf08a83b97293e9a55b52d91e6` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 35.01s |
| 9 | `resolve_spend` | `0x06b4d89400419dcad987e1ffe16095620f904af85b1b1907885d53bd12fded7b` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.50s |
| 10 | `serve` | `0x8d832b7560ffb366e51b3b5165f00ee289f670a326cbc6f399eddd1290290405` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.56s |
| 11 | `close_account` | `0xf89c93c882dd5b6415424b2aec65ac9ca349bc69f066e23ae34dc033757bf2f0` | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.66s |

### On-Chain Reads Verified Separately
- `balance_of(owner)`: 0 -> 1000 -> 400 -> 680 (final)
- `balance_of(payee)`: 0 -> 120 -> 320 (final)
- `get_account("12")`: name="Production Allowance Account", balance=600 -> 480 -> 280 -> 0 (closed)
- `get_spend("45")`: declared=120, decision=APPROVED, executed=true
- `get_spend("46")`: declared=450, decision=DENIED, reason=over_cap
- `get_spend("47")`: declared=100, decision=DENIED, reason=amount_mismatch
- `get_spend("48")`: declared=200, decision=OWNER_APPROVED (after owner resolution)
- `is_spend_valid_for`: returns `true` for valid parameters; returns `false` when altered payee, amount, or policy hash
- `get_service("45")`: `SERVED` after execution; refused second serve on SpendGate with revert `spend already served`

### Ledger Conservation Invariant Proof
- Owner Final Balance: 680 CREDITS
- Payee Final Balance: 320 CREDITS
- Total Balance Sum: 1000 CREDITS
- Total Minted for Participants: 1000 CREDITS
- Invariant Result: **EXACT CONSERVATION** (Sum of balances equals total minted for session participants).

### Execution Summary Counts
- Total Write Attempts: 11
- Successful On-Chain Transactions: 11 (100% receipt rule passed)
- Refusals Enforced by Contract: 3 (2 spends DENIED on-chain [over_cap, amount_mismatch], 1 duplicate serve refused by SpendGate)
- Undetermined Transactions: 0
- Execution Failures: 0

---

## 5. Automated Audits, Scanners & Verification Proofs

### Static Scanners Suite
- **Banned Words Scan** (`scripts/scan_banned.mjs`): 0 violations found across all files. Status word: Preview. Credits notice: "Credits are demo credits, not money" present on all balance views.
- **Visual Styling Scan** (`scripts/scan_gradients.mjs`): 0 forbidden gradients, 0 glassmorphism, 0 forbidden drop shadows.
- **Contrast Audit** (`scripts/scan_contrast.mjs`): 100% WCAG AA compliance (all body and label contrast ratios >= 4.5:1).

### Automated Test Suites
- **Unit & Property Tests (Vitest)**: 7 test files, 44 tests PASSING (100%).
- **Browser Automation & Accessibility (Playwright)**: 8 tests PASSING (100% across desktop and mobile 360px viewport). Zero critical or serious Axe accessibility violations.

### GitHub Actions CI & Pages Deployment
- App Repository: `https://github.com/hypercybers99/agent-allowance-app`
- Pages URL: `https://hypercybers99.github.io/agent-allowance-app/`
- Release Tag: `agent-allowance-app-v1`
- CI Run (`ci.yml`): Run ID `42754460954` (status: completed, conclusion: success)
- Deploy Run (`deploy.yml`): Run ID `42754461025` (status: completed, conclusion: success)
- Git HEAD: `03e2b42d7b4ff44faea35cfca3bf8d7955c464ef`

---

## 6. Contract Repository Fixes (`agent-allowance-genlayer`, Tag `aa-v1b`)

### Verified Grep Proofs
1. Unrecorded retry status in `docs/FINAL_REPORT.md`:
```
docs/FINAL_REPORT.md:- **Transient Gateway Retries**: no record saved (two transient RPC write retries observed during batch execution were recovered in memory by write retry logic with no persistent failure record written to disk; not claimed).
```
2. Historical deploy transaction wording in `docs/`:
```
docs/FINAL_REPORT.md:  NOT_FOUND_IN_RPC         : 2 transactions (deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address)
docs/FINAL_REPORT.md:- **Historical Deploy Transactions**: deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address.
docs/LIMITATIONS.md:- For active contracts AllowanceVault and SpendGate: deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address.
docs/VERIFICATION.md:2. For AllowanceVault and SpendGate: deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address via gen_getContractCode.
```

### Contract Repo CI Run Proof (`aa-v1b`)
```json
{"conclusion":"success","head_sha":"1880a063e2967c0f885ee4b2e6c7c951a7b72c1b","html_url":"https://github.com/hypercybers99/agent-allowance-genlayer/actions/runs/42746127467","id":42746127467,"status":"completed"}
```

---

## 7. Honest Limitations & Unmeasured Scope

1. **MetaMask Interactive Signing**: Real interactive MetaMask was not run by the agent. All interactive wallet steps are documented in `MANUAL_METAMASK_TEST.md` with status "Not run by the agent". Automated on-chain testing used throwaway private keys in memory.
2. **Calendar Reset Windows**: Not measured. The contract implements cumulative lifetime budgets, per-spend caps, and max spend counts; it does not implement rolling monthly resets.
3. **RPC Deploy Lookup Status**: Deploy transactions for `AllowanceVault` (`0x5396...`) and `SpendGate` (`0x3ab3...`) are not found on the RPC, cause not determined; contract source was verified byte-for-byte against contract code stored on the contract address.
