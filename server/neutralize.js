const fs = require('fs');
let content = fs.readFileSync('situations_cleaned.js', 'utf8');

content = content.replace(/"feedback":\s*"Esta acción es deficiente y viola los procedimientos de hospitalidad establecidos."/g, '"feedback": "Decisión registrada en el perfil del candidato."');
content = content.replace(/"feedback":\s*"Acción impecable\. Cumpliste con los estándares profesionales de manera excepcional\."/g, '"feedback": "Decisión registrada en el perfil del candidato."');

fs.writeFileSync('situations_cleaned.js', content);
console.log("Feedback neutralizado");
