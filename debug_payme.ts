
import fs from 'fs';
const key = process.env.PAYME_SELLER_KEY;
const result = {
  present: !!key,
  length: key ? key.length : 0,
  firstChar: key ? key.substring(0, 1) : null,
  lastChar: key ? key.substring(key.length - 1) : null,
  allKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes('payme'))
};
fs.writeFileSync('payme-env-debug.txt', JSON.stringify(result, null, 2));
