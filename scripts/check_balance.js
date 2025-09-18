const fs = require('fs');
const s = fs.readFileSync('src/hooks/useSeatingPlan.js','utf8');
let paren=0, brace=0, bracket=0;
for (let i=0;i<s.length;i++){
  const ch = s[i];
  if (ch==='(') paren++;
  else if (ch===')') paren--;
  else if (ch=='{') brace++;
  else if (ch=='}') brace--;
  else if (ch=='[') bracket++;
  else if (ch==']') bracket--;
}
console.log('balance', {paren, brace, bracket});
