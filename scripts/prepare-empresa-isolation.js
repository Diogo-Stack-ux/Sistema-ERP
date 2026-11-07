require("dotenv/config");
const fs = require("node:fs/promises");
const path = require("node:path");
const prisma = require("../src/lib/prisma");

const tables = [
  "Cliente", "Produto", "Movimentacao", "Gasto", "Evento",
  "Lembrete", "Service", "OrdemServico", "Equipamento",
];

async function main() {
  const empresaId = Number(process.argv[2]);
  if (!Number.isSafeInteger(empresaId) || empresaId <= 0) {
    throw new Error("Uso: node scripts/prepare-empresa-isolation.js ID_EMPRESA. Use somente quando TODOS os dados legados pertencerem a essa empresa.");
  }
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresa) throw new Error("Empresa nao encontrada.");

  const backupDir = path.join(__dirname, "../.local-postgres/backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `antes-isolamento-${Date.now()}.json`);

  await prisma.$transaction(async (tx) => {
    // Bloqueia gravacoes enquanto captura os dados e prepara a atribuicao.
    await tx.$executeRawUnsafe(
      `LOCK TABLE ${tables.map((table) => `"${table}"`).join(", ")} IN ACCESS EXCLUSIVE MODE`
    );
    const backup = { empresaId, createdAt: new Date().toISOString(), tables: {} };
    for (const table of tables) {
      backup.tables[table] = await tx.$queryRawUnsafe(`SELECT * FROM "${table}"`);
    }
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2), { flag: "wx" });
    for (const table of tables) {
      await tx.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER`);
      await tx.$executeRawUnsafe(`UPDATE "${table}" SET "empresaId" = $1 WHERE "empresaId" IS NULL`, empresaId);
    }
  }, { timeout: 60000 });
  console.log(`Dados legados sem empresa atribuidos a empresa ${empresaId}. Backup: ${backupFile}`);
  console.log("Agora execute prisma migrate deploy e prisma generate; depois reinicie a API.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
