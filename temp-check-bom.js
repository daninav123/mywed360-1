const fs=require("fs");
const f=process.argv[2];
const b=fs.readFileSync(f);
console.log("file:", f);
console.log("first bytes:", Array.from(b.slice(0,3)));
console.log("startsWithBOM", b[0]===0xEF && b[1]===0xBB && b[2]===0xBF);
