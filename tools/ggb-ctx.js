const fs = require('fs');
const t = fs.readFileSync('C:/Users/Admin/AppData/Local/Temp/gspwork/sine-curves.xml', 'utf8');
const i = t.indexOf('<expression label="f"');
console.log(t.slice(Math.max(0, i - 900), i + 800));
