# Auditoria do Projeto ERP

## Visão geral

Este projeto é um ERP em desenvolvimento com:
- Backend em Node.js + Express
- Banco de dados PostgreSQL via Prisma
- Frontend em React + Vite + Tailwind
- Estrutura fullstack com API REST e SPA

## Módulos implementados

### Backend
- `auth`
  - cadastro de usuário
  - login JWT
  - login Google via OAuth token
- `clientes`
  - CRUD básico de clientes
- `produtos`
  - CRUD de produtos
  - controle de estoque com `quantidade`
- `movimentacoes`
  - entrada/saída de produtos
  - atualização de estoque em create/update/delete
- `gastos`
  - controle financeiro de despesas e receitas
  - status e totais financeiros
- `dashboard`
  - métricas de clientes, produtos, estoque e gastos
  - lista de produtos com estoque baixo
- `eventos`
  - CRUD de compromissos e agenda
- `services`
  - catálogo de serviços
  - CRUD de serviços
- `ordens-servico`
  - criação e listagem de OS
  - status de OS
  - integração com estoque e financeiro ao concluir

### Frontend
- Tela de login e registro com JWT
- Integração cliente-side com Google Sign-In
- Página de Financeiro com contas a pagar, receber e fluxo de caixa
- Página de Ordens de Serviço com status e exclusão
- Página de Serviços
- Serviço Axios central para chamada à API

### Banco de dados
Modelos principais:
- `Usuario`
- `Cliente`
- `Produto`
- `Movimentacao`
- `Gasto`
- `Evento`
- `Service`
- `OrdemServico`
- `OSServico`
- `OSProduto`

## O que já está completo
- Backend com rotas básicas de vários módulos
- Autenticação JWT funcional
- CRUD de clientes, produtos, serviços e eventos
- Controle de estoque e movimentações
- Financeiro básico
- Dashboard simples
- OS com cálculo de valor total e integração com estoque/financeiro
- Frontend com telas principais de financeiro, OS e serviços

## O que falta melhorar

### Backend
- segredo JWT hardcoded em `src/middlewares/auth.js`
- falta refresh token e controle de permissões
- validação de dados inconsistente
- tratamento de erros não padronizado
- falta testes automatizados
- falta documentação de API

### Frontend
- não usa rotas reais (`react-router` ausente)
- telas principais faltantes: clientes, produtos, estoque, dashboard completo, eventos
- feedback de erro/sucesso inconsistente
- acoplamento de estado alto em `App.jsx`
- proteção de rota e sessão expirada não robustas

### Produto comercial
- falta módulo de vendas/faturamento
- falta controle de usuários/permissões
- falta relatórios avançados
- falta exportação/importação de dados
- falta suporte multi-empresa/multi-loja
- falta onboarding e configuração inicial
- falta internacionalização

## Riscos críticos
- secret JWT exposto no código
- autenticação apenas JWT sem refresh
- falta de testes
- validação incompleta e segurança fraca
- UI incompleta e navegação parcial

## Recomendação para versão 1.0

### Prioridade essencial
1. Proteger `SECRET` em `.env`
2. Adicionar roles/permissões básicas
3. Implementar rotas de frontend com `react-router`
4. Desenvolver telas de:
   - Clientes
   - Produtos
   - Estoque
   - Dashboard
   - Eventos
5. Padronizar validação de payload no backend
6. Melhorar UX de login e sessão
7. Criar documentação de API

### Prioridade alta
1. Testes unitários e de integração
2. Testes de frontend
3. Melhorar segurança CORS e headers HTTP
4. Relatórios básicos de vendas e fluxo de caixa
5. Exportação CSV/PDF
6. UX de navegação e filtros

### Prioridade média
1. Logs e auditoria de ações
2. Suporte a múltiplos usuários/roles
3. Aprimorar módulo financeiro
4. Suporte a moedas/idiomas
5. Dashboards com KPIs reais

## Roadmap sugerido

1. Estabilizar núcleo: rotas, validação, autenticação e UI básica
2. Completar módulos ERP essenciais e integração entre eles
3. Qualidade: testes, documentação e polimento de UI
4. Preparar comercial: relatórios, exportação, configuração de empresa e ajustes de UX

## Conclusão

O projeto já possui uma base técnica sólida e vários módulos essenciais. Para chegar a um ERP comercial 1.0, o foco deve ser terminar as telas faltantes, fortalecer segurança, padronizar API e adicionar testes e documentação.
