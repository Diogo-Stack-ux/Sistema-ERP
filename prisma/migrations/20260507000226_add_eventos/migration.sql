-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
