const fs = require('fs');
const p = 'src/components/tasks/TasksRefactored.jsx';
let s = fs.readFileSync(p, 'utf8');
const before = s;
// Replace any page-title heading that ends with 'Tareas'
s = s.replace(/<h1 className=\"page-title\">[\s\S]*?Tareas<\/h1>/, '<h1 className="page-title">Gestión de Tareas</h1>');
if (s !== before) { fs.writeFileSync(p, s, 'utf8'); console.log('Updated TasksRefactored title'); } else { console.log('No change'); }
