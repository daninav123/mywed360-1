const watcher = require('chokidar').watch('src/components/HomePage.jsx'); watcher.on('change',()=>console.log('change',Date.now())); setTimeout(()=>console.log('ready'),1000);
