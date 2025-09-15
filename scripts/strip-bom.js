const fs=require("fs");
const p = 'package.json';
let s = fs.readFileSync(p);
if (s[0]===0xEF && s[1]===0xBB && s[2]===0xBF) {
  s = s.slice(3);
  fs.writeFileSync(p, s);
  console.log('BOM removed from package.json');
} else {
  console.log('No BOM in package.json');
}
