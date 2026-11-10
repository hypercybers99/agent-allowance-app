| Error Code | Plain Explanation | Recommended Next Step |
| :--- | :--- | :--- |
| `already claimed demo credits` | This address has already received its one-time 1,000 demo credits provision. | Use an alternate wallet address if you need additional demo testing credits. |
| `bad name` | Account name must be between 3 and 60 printable ASCII characters. | Provide a valid account name between 3 and 60 characters without non-ASCII characters. |
| `bad policy JSON` | The policy payload is not valid JSON or contains duplicate or unexpected keys. | Ensure the policy contains exactly the six canonical keys without duplicates. |
| `bad per_spend_cap` | Per-spend cap must be an integer greater than zero and at most total budget. | Set per_spend_cap to a positive number less than or equal to total_budget. |
| `bad total_budget` | Total budget must be an integer strictly greater than zero. | Enter a positive whole number for the total account budget. |
| `bad max_spends` | Maximum spends must be an integer strictly greater than zero. | Set max_spends to at least 1. |
| `bad currency` | Currency code must be a 3-letter uppercase ASCII string (e.g., USD or EUR). | Specify a standard 3-character currency code like USD or EUR. |
| `bad categories` | Categories must be a non-empty list of allowed categories without duplicates. | Select at least one allowed category from SOFTWARE, CLOUD, DATA, MARKETING, TRAVEL, OTHER. |
| `bad category` | The requested category is not in the allowed list for this system. | Choose an allowed category: SOFTWARE, CLOUD, DATA, MARKETING, TRAVEL, or OTHER. |
| `bad payees` | Payees list must contain between 1 and 5 unique payee entries. | Add between 1 and 5 distinct registered payees with valid 0x addresses. |
| `bad prefix: length` | The payee evidence URL prefix is too short or exceeds 300 characters. | Ensure the prefix URL is between 12 and 300 characters. |
| `bad prefix: trailing slash` | The evidence prefix must end with a trailing forward slash. | Append a trailing slash "/" to the payee evidence prefix. |
| `bad prefix: url` | The URL prefix is malformed or could not be parsed. | Enter a valid, absolute HTTPS URL prefix. |
| `bad prefix: scheme` | The evidence URL prefix scheme must be https. | Change the prefix scheme to https://. |
| `bad prefix: userinfo` | The evidence URL prefix must not contain embedded user credentials. | Remove any username or password from the prefix URL. |
| `bad prefix: host` | The evidence URL prefix is missing a valid host name. | Provide a valid hostname in the prefix (e.g. raw.githubusercontent.com). |
| `bad prefix: port` | Explicit ports are not allowed in the evidence URL prefix. | Remove port numbers from the prefix URL; standard HTTPS (443) is required. |
| `bad prefix: query` | Query parameters are not allowed in the payee URL prefix. | Remove query strings (anything after "?") from the prefix. |
| `bad prefix: fragment` | URL fragments (#) are not allowed in the evidence prefix. | Remove hash fragments from the prefix URL. |
| `unknown account` | The requested account id does not exist on-chain. | Verify the account id number and confirm it was created on-chain. |
| `not owner` | The caller is not the registered owner of this account. | Switch to the wallet address that created this spending account. |
| `account closed` | This account has been closed and cannot accept new actions. | Create a new spending account to resume agent operations. |
| `bad amount` | Amount must be an integer strictly greater than zero. | Enter a positive integer amount. |
| `funding exceeds the budget rule` | Funding this amount would cause total funded credits to exceed total budget. | Fund only up to the remaining budget ceiling for this account. |
| `insufficient balance` | Your address does not hold enough demo credits to fund this account. | Claim 1,000 demo credits on the credits page before funding. |
| `bad agent address` | The provided agent address is invalid or already registered. | Provide a valid, unique 40-hex character Ethereum address for the agent. |
| `too many agents` | The account has already reached the maximum limit of 5 authorized agents. | Remove an inactive agent before adding a new one. |
| `unknown spend` | The specified spend id does not exist. | Check the spend id in your account spends list. |
| `spend not pending` | The spend is not in PENDING status and cannot be resolved by owner. | Only spends held in PENDING (ASK_OWNER) status can be reviewed and resolved. |
| `limits no longer hold on resolve` | The account has insufficient balance or reached its spend ceiling since creation. | Fund the account with sufficient credits before approving the pending spend. |
| `not a registered agent` | The calling address is not an authorized agent for this account. | Have the account owner register your address in the account agent list. |
| `bad payee address` | Payee address is invalid or not in the account payee allowlist. | Select a payee registered in the account policy allowlist. |
| `evidence source unreachable` | The invoice evidence URL could not be reached or timed out. | Check that the invoice URL is publicly reachable without authentication. |
| `HTTP status not 200: ` | The invoice URL returned an HTTP error status code. | Verify that the server hosts the file and returns HTTP status 200. |
| `page too large` | The invoice page content exceeds the maximum size limit of 400,000 bytes. | Reduce the page size or use a clean static text or markdown document. |
| `page unreadable (too little text; it may need JavaScript)` | The document yielded fewer than 100 characters of readable text; SPAs not supported. | Ensure invoice content is pre-rendered static HTML or plain markdown. |
| `duplicate observation: ` | This invoice evidence URL has already been recorded for an executed spend. | Each spend must reference a distinct invoice URL; reuse is prohibited. |
| `sender must equal payee` | Only the registered payee address can execute the service fulfillment. | Connect the wallet matching the designated payee address. |
| `spend already served` | This spend has already been marked as fulfilled on SpendGate. | Each verified spend receipt can be served exactly once. |
| `spend not valid for these parameters` | The parameters provided do not match the on-chain verified spend receipt. | Verify the spend id, payee, amount, account id, and policy hash. |
