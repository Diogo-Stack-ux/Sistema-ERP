(async () => {
  const prisma = require('../src/lib/prisma');

  const table = 'Gasto';
  const needed = [
    { name: 'tipo', sql: `ALTER TABLE "${table}" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'DESPESA';` },
    { name: 'categoria', sql: `ALTER TABLE "${table}" ADD COLUMN "categoria" TEXT;` },
    { name: 'status', sql: `ALTER TABLE "${table}" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDENTE';` },
    { name: 'vencimento', sql: `ALTER TABLE "${table}" ADD COLUMN "vencimento" TIMESTAMP;` },
  ];

  for (const col of needed) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${col.name}'`);
      if (res.length === 0) {
        console.log(`Adicionando coluna '${col.name}'...`);
        await prisma.$executeRawUnsafe(col.sql);
        console.log(`Coluna '${col.name}' adicionada.`);
      } else {
        console.log(`Coluna '${col.name}' já existe.`);
      }
    } catch (e) {
      console.error(`Erro ao verificar/adicionar coluna '${col.name}':`, e.message);
    }
  }

  console.log('Verificando colunas finais:');
  const final = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
  console.log(final.map(r => r.column_name));

  process.exit(0);
})();