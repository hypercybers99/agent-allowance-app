import fs from 'fs';
import { CONTRACT_ERRORS } from '../src/lib/errors.ts';

let md = '| Error Code | Plain Explanation | Recommended Next Step |\n| :--- | :--- | :--- |\n';
for (const [code, item] of Object.entries(CONTRACT_ERRORS)) {
  md += `| \`${code}\` | ${item.plain} | ${item.next} |\n`;
}

fs.writeFileSync('error_table.md', md, 'utf8');
console.log(`Generated error_table.md with ${Object.keys(CONTRACT_ERRORS).length} rows`);
