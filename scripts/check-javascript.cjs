/* Compila scripts locais e inline sem executar código de navegador. */
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm');
const root = path.resolve(__dirname, '..'); let checked = 0;
for (const name of fs.readdirSync(path.join(root, 'js'))) {
  if (!name.endsWith('.js')) continue;
  new vm.Script(fs.readFileSync(path.join(root, 'js', name), 'utf8'), { filename: 'js/' + name }); checked++;
}
new vm.Script(fs.readFileSync(path.join(root, 'sala-coe-3d/modelo.js'), 'utf8'), { filename: 'sala-coe-3d/modelo.js' }); checked++;
new vm.Script(fs.readFileSync(path.join(root, 'sala-coe-3d/editor.js'), 'utf8'), { filename: 'sala-coe-3d/editor.js' }); checked++;
for (const name of ['sala-coe-3d/index.html', 'index.html', 'arq3d/index.html', 'holambra-avare-3d/index.html']) {
  const html = fs.readFileSync(path.join(root, name), 'utf8'); let index = 0;
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    index++;
    if (/src=|application\/json/.test(match[1]) || !match[2].trim()) continue;
    new vm.Script(match[2], { filename: name + ':script-' + index }); checked++;
  }
}
console.log('Sintaxe JavaScript válida: ' + checked + ' scripts locais/inline.');
