
import fs from 'fs';
const keys = Object.keys(process.env).filter(k => k.toLowerCase().includes('payme'));
fs.writeFileSync('payme-env-check.txt', `Found PayMe Keys: ${JSON.stringify(keys)}
All Keys: ${JSON.stringify(Object.keys(process.env))}`);
