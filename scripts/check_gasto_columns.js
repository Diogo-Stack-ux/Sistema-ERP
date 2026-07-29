(async () => {
  const prisma = require('../src/lib/prisma');

  const candidates = ['Gasto', 'gasto', 'gastos'];

  for (const name of candidates) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = '${name}'`);
      console.log(`Columns for table name='${name}':`, res.map(r => r.column_name));
    } catch (e) {
      console.log(`Error querying table '${name}':`, e.message);
    }
  }

  process.exit(0);
})();