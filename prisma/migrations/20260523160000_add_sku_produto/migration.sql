-- Add sku column to Produto
ALTER TABLE "Produto"
ADD COLUMN "sku" TEXT;

-- Optional unique index to keep SKUs unique while allowing NULL values.
CREATE UNIQUE INDEX "Produto_sku_key" ON "Produto" ("sku");
