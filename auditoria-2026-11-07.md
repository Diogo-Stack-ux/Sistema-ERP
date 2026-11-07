# Varredura do sistema — 07/11/2026

## Atualização após a correção do cadastro

Após confirmação do usuário de que todos os registros legados pertencem à
Minha empresa (ID 1), os dados foram copiados para um backup local em
`backend/.local-postgres/backups/antes-isolamento-1794070469389.json` e
atribuídos a essa empresa. A migração de isolamento foi aplicada, o cliente
Prisma foi regenerado e o backend foi reiniciado. Todas as seis migrações
estão aplicadas.

Validação na API em execução: os dez GETs abaixo passaram a retornar 200;
POST /clientes retornou 201; nome vazio retornou 400; campos opcionais foram
aceitos e a empresa autenticada prevaleceu sobre empresaId enviado no corpo.
O cliente de teste ficou invisível para a empresa 4 e foi excluído ao final.
As contagens originais dos nove modelos foram preservadas. O frontend também
mostra a mensagem de falha de cadastro ao usuário.

Os achados abaixo descrevem o estado anterior à correção. Os problemas de
estoque, OS, sessão e demais itens não foram alterados nessa correção.

## Escopo e resultado

Revisão do backend Express, autenticação Firebase/JWT, rotas dos dez módulos,
serviços de estoque/OS/financeiro/lembretes, schema e migrações Prisma,
configuração local, integração do frontend e verificações de build/lint.
Consultas ao banco foram somente de leitura. Reproduções de escrita usaram
objetos em memória, sem gravar no banco.

O sistema compila, mas os dez módulos consultados retornaram HTTP 500 no estado
local atual. Há incompatibilidade confirmada entre código, cliente Prisma
gerado e banco. Também foram identificados defeitos de integridade em estoque e OS.

Não foram aplicadas migrações nem alteradas regras de negócio nesta varredura.
As modificações que já existiam nos repositórios backend/frontend foram preservadas.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Frontend: `npm.cmd run build` | Passou; 683 módulos transformados |
| Frontend: `npm.cmd run lint` | Falhou com quatro erros |
| Backend: `prisma.cmd validate` | Schema válido |
| Backend: `prisma.cmd migrate status` | Uma migração pendente |
| Sintaxe de 29 arquivos JavaScript do backend/scripts | 28 passaram; um arquivo incompatível com CommonJS |
| Consulta Prisma com filtro `Cliente.empresaId` | Falhou com `PrismaClientValidationError` |
| Inspeção do cliente Prisma gerado | Modelo Cliente não contém `empresaId` |
| Inspeção das colunas do banco | `empresaId` existe somente em Usuario, entre as tabelas públicas inspecionadas |
| Contagens sem identificação pessoal | Quatro empresas; um usuário sem empresa |
| Middleware com JWT local válido de usuário existente | Passou |
| Comparação dos projetos Firebase configurados | Frontend/backend apontam para o mesmo projeto |
| GET dos dez módulos, usando JWT válido | Todos retornaram 500 |
| Saída de estoque negativa, em memória | Aceita com HTTP 200; estoque de 10 passou para 13 |
| Concluir, reabrir e concluir uma OS, em memória | Criou duas movimentações e dois lançamentos financeiros |
| `npm.cmd audit --json`, backend/frontend | Consulta ao registro falhou; vulnerabilidades de dependências não verificadas |

Os GETs foram executados em uma instância temporária Express, ligada apenas a
127.0.0.1 e porta aleatória, com o middleware e os routers reais e o banco
configurado. Essa instância foi encerrada ao final. Não se trata de validação
do processo de API que estava aberto no navegador do usuário.

Rotas verificadas: `/clientes`, `/produtos`, `/movimentacoes`, `/gastos`,
`/eventos`, `/dashboard`, `/services`, `/ordens-servico`, `/equipamentos`,
`/lembretes`.

## Prioridade imediata

### 1. Código, cliente Prisma e banco incompatíveis — confirmado

O código inclui `empresaId` nas consultas dos módulos. O schema fonte já possui
esse campo, mas o cliente gerado ainda não o conhece e as colunas não existem
nas tabelas dos módulos. A consulta de leitura falha antes mesmo de executar SQL.
Isso explica os 500 reproduzidos nas rotas.

Referências: `backend/prisma/schema.prisma`, `backend/src/lib/prisma.js`,
`backend/src/routes/cliente.routes.js:31` e demais filtros por empresa.

Migração pendente: `20261107003000_empresa_data_isolation`.

**Atenção ao procedimento:** há quatro empresas no banco. A migração atual,
na linha 22, interrompe quando encontra mais de uma. Portanto, simplesmente
executar `migrate deploy` não resolve este ambiente. É necessário definir a
propriedade dos dados legados e preparar uma migração que preserve essa
atribuição. O SQL atual atribui todos os registros à única empresa encontrada;
não tem mecanismo para receber um mapeamento por registro. Depois de resolver
o schema e os dados, gerar novamente o cliente Prisma e reiniciar a API.

Não foi escolhida uma empresa arbitrária e nenhuma migração foi aplicada.

### 2. Quantidade negativa altera estoque no sentido errado — reproduzido

`backend/src/routes/movimentacao.routes.js:39` converte a quantidade com
`Number`, sem exigir inteiro positivo. Uma saída de -3 aumenta o saldo de 10
para 13 e registra quantidade negativa. A atualização também não valida
adequadamente tipo e quantidade; excluir uma entrada pode deixar saldo negativo.

Correção: validar IDs, quantidade inteira positiva, tipos permitidos e saldo
final em todas as operações, incluindo reversões.

### 3. Estoque e histórico podem divergir — identificado no código

Em `backend/src/routes/movimentacao.routes.js:51`, o produto é atualizado antes
da gravação da movimentação, sem transação. Isso também ocorre ao atualizar e
excluir. Falhas na segunda operação deixam o estoque modificado sem histórico
correspondente. A leitura seguida de atualização absoluta também permite perda
de atualizações em requisições simultâneas.

Correção: transação com alteração condicional/atômica do saldo e controle de
concorrência. Cobrir falha intermediária e duas saídas simultâneas com testes.

### 4. OS pode baixar estoque e lançar receita mais de uma vez — reproduzido

`backend/src/services/ordemServicoService.js:298` executa os efeitos ao entrar
em CONCLUIDA. O mesmo serviço permite voltar a ABERTA/EM_ANDAMENTO/CANCELADA
sem estorno. Concluir novamente repete os efeitos. Reabrir também permite
contornar a proibição de excluir uma OS concluída.

A leitura do status fica fora da transação, permitindo ainda que conclusões
simultâneas observem o mesmo estado anterior. A verificação de saldo seguida
de decremento não garante saldo não negativo sob concorrência.

Correção: definir transições permitidas, estorno explícito quando aplicável,
conclusão idempotente e controle de concorrência dentro da transação.

### 5. Receita de OS é criada como despesa pendente negativa — reproduzido

`backend/src/services/ordemServicoService.js:341` cria Gasto com valor negativo
e omite tipo/status. O schema aplica DESPESA/PENDENTE. Já os totais financeiros
consideram RECEITA/RECEBIDO e DESPESA/PAGO. Assim, a receita da OS não entra
corretamente nos totais e aparece classificada como despesa.

Correção: adotar valor positivo, tipo RECEITA e estado financeiro definido pela
regra de recebimento. Vincular o lançamento à OS para impedir duplicidade e
permitir conciliação/estorno. Concluir serviço não implica necessariamente pagamento.

## Autenticação e isolamento

### 6. Restauração da sessão Firebase tem condição de corrida — identificado no código

`frontend/src/App.jsx:51` restaura imediatamente o token salvo e dispara as
consultas iniciais. `frontend/src/services/api.js:9` consulta `currentUser`
sem aguardar a restauração da sessão Firebase. Nesse intervalo pode enviar um
ID token antigo do localStorage. Um 401 dispara logout de toda a aplicação.

Não há assinatura de `onAuthStateChanged`/`onIdTokenChanged` no App para
coordenar a inicialização. É uma causa plausível dos 401 anexados, mas não foi
reproduzida em navegador com a sessão do usuário. JWT local válido passou no
teste e os projetos Firebase configurados coincidem.

Correção: aguardar a inicialização da autenticação antes de carregar dados,
sincronizar a sessão e tratar renovação/expiração sem disparar vários logouts.

### 7. Erros internos na autenticação são devolvidos como 401 — identificado no código

`backend/src/middlewares/auth.js:162` captura também erros de banco/provisionamento
e retorna "Token invalido ou expirado". O interceptor do frontend interpreta
qualquer 401 como perda da sessão. Uma falha interna pode, assim, desconectar
um usuário autenticado e ocultar a causa operacional.

Correção: separar token inválido de indisponibilidade/erro interno, retornando
5xx para estes últimos. Há autenticação repetida em app/routers e, em GET
clientes, também na própria rota; eliminar a repetição reduz verificações e consultas.

### 8. Login Google legado cria senha derivada de identificador — identificado no código

`backend/src/routes/auth.routes.js:194` usa `google:${googleUser.sub}` como senha
de novos usuários Google. O identificador `sub` não deve ser tratado como segredo
de autenticação. A rota de login por senha compara contra esse mesmo hash.

Correção: impedir login por senha para contas exclusivas de provedor ou gerar
segredo aleatório não conhecido, como já faz o fluxo Firebase. Avaliar contas
legadas criadas por esse endpoint. Não foi executado login em contas de terceiros.

### 9. Criação de serviço aceita campos e relações do corpo inteiro — revisão necessária

`backend/src/controllers/service.controller.js:7` espalha `req.body` no Prisma.
Embora sobrescreva `empresaId`, não limita os demais campos, como ID e relações
aninhadas `osServicos`. Isso expande a superfície de escrita e exige verificar
referências de OS por empresa em qualquer criação aninhada aceita pelo Prisma.

Correção: lista explícita dos campos editáveis e validação de todas as relações.
A exploração entre empresas não foi executada; o schema pendente impede uma
validação funcional completa do isolamento atual.

### 10. Validação e respostas de erro inconsistentes — identificado no código

Clientes, produtos, eventos e serviços deixam valores inválidos chegarem ao
Prisma; produtos aceitam preços/quantidades negativos sem rejeição explícita.
Financeiro não restringe tipo/status a combinações válidas. Várias rotas
devolvem mensagens internas do Prisma e usam 500 para registro inexistente,
conflito ou erro de entrada. Login legado distingue usuário inexistente de
senha incorreta e não tem limitação de tentativas no Express inspecionado.

Correção: validar tipos, limites e enums antes de persistir; padronizar
400/401/403/404/409/500; retirar detalhes internos de respostas de produção;
proteger endpoints públicos de autenticação contra tentativas em excesso.

## Outros problemas funcionais e de manutenção

- **Gráfico do dashboard:** em `frontend/src/App.jsx:65`, o ResizeObserver é
  instalado em efeito com dependências vazias. Se a primeira montagem exibir
  login, o contêiner não existe; após entrar, o efeito não roda novamente e a
  largura pode permanecer zero, impedindo a renderização do gráfico.
- **Carga inicial indivisível:** `frontend/src/App.jsx:812` usa Promise.all para
  cinco módulos. Uma única falha impede aplicar todos os resultados; o catch
  somente registra no console. Tratar falha por módulo e mostrar feedback.
- **Dados ao trocar de conta:** o logout limpa token/assinatura, mas não limpa
  listas de clientes/produtos/movimentações/eventos. Se a próxima carga falhar,
  dados anteriores podem continuar na memória e na interface. Limpar estados
  por sessão e cancelar/ignorar respostas da sessão anterior.
- **Equipamento sem frequência opcional:** em
  `backend/src/controllers/equipamento.controller.js:54`, ausência do campo
  produz `Number(undefined)`, ou seja, NaN. Normalizar undefined para null e
  validar frequência positiva e unidade permitida.
- **Lembrete com cliente trocado:** em
  `backend/src/services/lembrete.service.js:147`, só se confere a propriedade do
  equipamento quando `equipamentoId` vem no corpo. Mudar apenas clienteId pode
  manter um equipamento do cliente anterior. Validar a combinação final.
- **Quatro erros de lint:** `App.jsx:403` tem filtro/setFiltro sem uso;
  `EquipmentHealthCard.jsx:148` tem formatDate sem uso;
  `LembreteModal.jsx:37` dispara a regra set-state-in-effect.
- **Arquivo indevido no backend:** `backend/src/services/equipamentoApi.js`
  contém imports/exports ESM em pacote CommonJS e importa `./api`, inexistente
  ali. Parece cópia do frontend. Não está no caminho de inicialização auditado,
  mas falha na verificação de sintaxe e falharia se carregado como CommonJS.
- **Banco local inconsistente:** o helper `start-local-postgres.ps1` inicia na
  porta 5433, enquanto o DATABASE_URL usado pela auditoria aponta para 5432.
  Há senha literal no helper e no docker-compose versionado. Centralizar a
  configuração, retirar segredos literais e revisar exposição da porta do banco.
- **Dinheiro como Float:** valores monetários usam ponto flutuante. Planejar
  Decimal ou centavos inteiros para cálculos e arredondamento consistentes.
- **Assinaturas:** a busca de pagamentos consulta somente 50 resultados gerais
  e depois filtra email em memória; pagamentos válidos podem ficar fora dessa
  página. Falta timeout nas consultas externas. A aplicação local está com
  exigência de assinatura desativada. Não foram feitas chamadas reais ao Mercado Pago.
- **Entrega do frontend:** bundle principal de aproximadamente 804 kB minificado
  e três imagens entre 1,39 e 2,24 MB. O build avisa sobre chunks acima de 500 kB
  e base Browserslist antiga. Otimizar imagens e divisão de código.
- **Testes:** backend não tem suíte configurada (`npm test` é placeholder de
  falha). O script test_gastos cria usuário e imprime token; não foi executado
  para evitar alterar o banco e expor credenciais. Faltam testes de isolamento,
  estoque concorrente, sessão e integração OS/financeiro.
- **Documentação antiga:** `auditoria-resumo.md` contém conclusões que não
  refletem o código atual, como segredo JWT fixo e ausência de telas já existentes.
  O segredo JWT atual vem do ambiente.

## Ordem sugerida de correção

1. Fazer backup, definir proprietários dos dados legados das quatro empresas e
   preparar/aplicar migração compatível; regenerar Prisma e reiniciar API.
2. Revalidar GETs e isolamento entre empresas com o schema sincronizado.
3. Corrigir atomicidade e validação de estoque, conclusão idempotente de OS e
   classificação dos lançamentos financeiros, com testes de regressão.
4. Coordenar inicialização Firebase, tratamento de 401/5xx e limpeza de sessão.
5. Restringir payloads, corrigir autenticação Google legada e padronizar erros.
6. Resolver os quatro erros de lint, gráfico, lembretes e configuração local;
   estabelecer testes automáticos e otimizar assets.

## Limites

Esta varredura não valida todos os fluxos por navegador, envio de email,
pagamentos reais, instalação de produção ou vulnerabilidades de dependências
publicadas. O endpoint de auditoria npm não respondeu com sucesso no ambiente.
Não é possível afirmar que os 401 históricos tenham uma única causa com base
no log do navegador. As causas confirmadas dos 500, por outro lado, foram
reproduzidas com código real e consultas de leitura.
