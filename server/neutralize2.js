const fs = require('fs');
if (fs.existsSync('situations.js')) {
  let content = fs.readFileSync('situations.js', 'utf8');
  content = content.replace(/"feedback":\s*"Esta acción es deficiente y viola los procedimientos de hospitalidad establecidos."/g, '"feedback": "Decisión registrada en el perfil del candidato."');
  content = content.replace(/"feedback":\s*"Acción impecable\. Cumpliste con los estándares profesionales de manera excepcional\."/g, '"feedback": "Decisión registrada en el perfil del candidato."');
  fs.writeFileSync('situations.js', content);
  console.log("situations.js neutralizado");
}
