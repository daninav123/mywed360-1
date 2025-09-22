const fs = require('fs');
const file = process.argv[2] || 'src/components/tasks/TasksRefactored.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let j=0;j<line.length;j++){
    if (line.charCodeAt(j) > 127){
      console.log((i+1)+': '+line);
      break;
    }
  }
}
