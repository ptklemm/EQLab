const fs = require('fs-extra');

(async () => {

    const EQ_DIR = "X:\\EQTrilogy";

    let list = await fs.readdir(EQ_DIR);
    list = list.filter(filename => filename.includes('global'));

    await fs.writeJSON("./trilogy.json", list);

})();
