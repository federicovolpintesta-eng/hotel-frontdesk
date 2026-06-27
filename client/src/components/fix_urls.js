const fs = require('fs');
const files = ['HRDashboard.jsx', '../App.jsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/http:\/\/localhost:3001/g, 'http://localhost:3001'); // reset first if any
  content = content.replace(/\'\$\{import\.meta\.env\.VITE_API_URL \|\| \'http:\/\/localhost:3001\'\}/g, 'http://localhost:3001');
  content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| \'http:\/\/localhost:3001\'\}/g, 'http://localhost:3001');
  
  // Now proper replacement
  if (!content.includes('const API_URL')) {
    content = content.replace('import React', "const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';\nimport React");
  }
  
  content = content.replace(/'http:\/\/localhost:3001/g, '`${API_URL}');
  content = content.replace(/http:\/\/localhost:3001/g, '${API_URL}');
  
  // Fix the trailing quotes from the first replace
  content = content.replace(/API_URL\}'/g, 'API_URL}`');
  
  fs.writeFileSync(file, content);
}
console.log("Fixed URLs");
