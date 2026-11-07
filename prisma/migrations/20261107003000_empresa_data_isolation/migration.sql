BEGIN;

-- Permite preparar a atribuicao dos dados legados antes desta migracao.
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Movimentacao" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Gasto" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Evento" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Lembrete" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "OrdemServico" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Equipamento" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;

DO $$
DECLARE
  empresa_count INTEGER;
  empresa_id INTEGER;
  tabela TEXT;
  sem_empresa BOOLEAN;
BEGIN
  SELECT COUNT(*), MIN("id")
  INTO empresa_count, empresa_id
  FROM "Empresa";

  IF empresa_count > 1 THEN
    FOREACH tabela IN ARRAY ARRAY[
      'Cliente', 'Produto', 'Movimentacao', 'Gasto', 'Evento',
      'Lembrete', 'Service', 'OrdemServico', 'Equipamento'
    ] LOOP
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE "empresaId" IS NULL)', tabela)
        INTO sem_empresa;
      IF sem_empresa THEN
        RAISE EXCEPTION
          'A tabela % possui dados sem empresa e existem % empresas. Defina a propriedade dos registros antes de aplicar esta migracao.',
          tabela, empresa_count;
      END IF;
    END LOOP;
    -- Nao atribui usuarios nem sobrescreve o mapeamento preparado.
    RETURN;
  END IF;

  IF empresa_count = 0 THEN
    INSERT INTO "Empresa" ("nome", "updatedAt")
    VALUES ('Empresa legada', CURRENT_TIMESTAMP)
    RETURNING "id" INTO empresa_id;
  END IF;

  UPDATE "Usuario"
  SET "empresaId" = empresa_id
  WHERE "empresaId" IS NULL;

  UPDATE "Cliente" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Produto" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Movimentacao" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Gasto" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Evento" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Lembrete" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Service" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "OrdemServico" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
  UPDATE "Equipamento" SET "empresaId" = empresa_id WHERE "empresaId" IS NULL;
END $$;

ALTER TABLE "Cliente" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Produto" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Movimentacao" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Gasto" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Evento" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Lembrete" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "OrdemServico" ALTER COLUMN "empresaId" SET NOT NULL;
ALTER TABLE "Equipamento" ALTER COLUMN "empresaId" SET NOT NULL;

DROP INDEX IF EXISTS "Produto_sku_key";
CREATE UNIQUE INDEX "Produto_empresaId_sku_key"
  ON "Produto"("empresaId", "sku");

CREATE INDEX "Cliente_empresaId_idx" ON "Cliente"("empresaId");
CREATE INDEX "Movimentacao_empresaId_idx" ON "Movimentacao"("empresaId");
CREATE INDEX "Gasto_empresaId_idx" ON "Gasto"("empresaId");
CREATE INDEX "Evento_empresaId_idx" ON "Evento"("empresaId");
CREATE INDEX "Lembrete_empresaId_idx" ON "Lembrete"("empresaId");
CREATE INDEX "Service_empresaId_idx" ON "Service"("empresaId");
CREATE INDEX "OrdemServico_empresaId_idx" ON "OrdemServico"("empresaId");
CREATE INDEX "Equipamento_empresaId_idx" ON "Equipamento"("empresaId");

ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Equipamento" ADD CONSTRAINT "Equipamento_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
