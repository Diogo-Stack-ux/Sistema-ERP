# Sistema-ERP

## Isolamento por empresa

Os registros de clientes, produtos, movimentações, gastos, eventos, serviços,
ordens de serviço, equipamentos e lembretes são vinculados à empresa do usuário
autenticado. Para ativar o isolamento em um banco existente, aplique as
migrações e gere novamente o cliente Prisma:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy
.\node_modules\.bin\prisma.cmd generate
```

Execute os comandos dentro da pasta `backend`. Os registros antigos são
atribuídos à empresa existente quando há somente uma; se o banco tiver várias
empresas, a migração é interrompida para evitar misturar dados. Nesse caso,
defina manualmente a empresa proprietária dos registros antigos antes de
reaplicar a migração.

Quando TODOS os dados legados pertencerem à mesma empresa, prepare a atribuição
explicitamente antes de executar os dois comandos acima:

```powershell
node scripts/prepare-empresa-isolation.js ID_EMPRESA
```

Substitua `ID_EMPRESA` pelo ID confirmado da proprietária dos dados. O script
salva os registros afetados em `.local-postgres/backups`, dentro da pasta
ignorada pelo Git, e preenche somente `empresaId` ainda nulo em uma transação.
Não altera a empresa de usuários nem registros já atribuídos. Se os dados
pertencerem a várias empresas, prepare o mapeamento individual dos registros;
não use esse comando para escolher uma empresa arbitrariamente. A migração
preserva atribuições existentes e bloqueia registros ainda sem empresa.
