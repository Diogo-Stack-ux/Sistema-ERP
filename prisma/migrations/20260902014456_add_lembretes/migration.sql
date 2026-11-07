-- CreateTable
CREATE TABLE "Lembrete" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "equipamentoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT,
    "dataLembrete" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "canal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lembrete_clienteId_idx" ON "Lembrete"("clienteId");

-- CreateIndex
CREATE INDEX "Lembrete_equipamentoId_idx" ON "Lembrete"("equipamentoId");

-- CreateIndex
CREATE INDEX "Lembrete_dataLembrete_idx" ON "Lembrete"("dataLembrete");

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
