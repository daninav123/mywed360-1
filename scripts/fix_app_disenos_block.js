const fs = require('fs');
const path = 'src/App.jsx';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
function setLine(n, text){ if(n>=1 && n<=lines.length){ lines[n-1] = text; } }
// Replace imports (by line numbers observed)
setLine(43, "const DisenosLayout = React.lazy(() => import('./pages/disenos/DisenosLayout'));");
setLine(44, "const DisenosInvitaciones = React.lazy(() => import('./pages/disenos/Invitaciones'));");
setLine(45, "const DisenosLogo = React.lazy(() => import('./pages/disenos/Logo'));");
setLine(50, "const DisenosVectorEditor = React.lazy(() => import('./pages/disenos/VectorEditor'));");
setLine(51, "const MisDisenos = React.lazy(() => import('./pages/disenos/MisDisenos'));");
// Replace route usages
setLine(161, "                {/* Diseños */}");
setLine(162, "                <Route path=\"disenos\" element={<DisenosLayout />}>");
setLine(164, "                  <Route path=\"invitaciones\" element={<DisenosInvitaciones />} />");
setLine(165, "                  <Route path=\"invitacion-vector\" element={<DisenosInvitaciones />} />");
setLine(166, "                  <Route path=\"logo\" element={<DisenosLogo />} />");
setLine(171, "                  <Route path=\"vector-editor\" element={<DisenosVectorEditor />} />");
setLine(172, "                  <Route path=\"mis-disenos\" element={<MisDisenos />} />");
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Patched App.jsx disenos imports and routes');
