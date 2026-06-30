const bcrypt = require('bcrypt');
async function test() {
  const hash = '$2b$10$oi0XsGIb/xiXGGlS2K9TJe2PBD2oCAnt/zwcWamHn9aQjYaWjBihy';
  const match = await bcrypt.compare('password', hash);
  console.log('Does password match?', match);
}
test();
