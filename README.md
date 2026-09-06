# Simulador de Financiamento — Clínica Haddad

Aplicação web (React + TypeScript + Vite no front-end, Express + PostgreSQL no
back-end) usada pela equipe da Clínica Haddad durante negociações de
tratamentos odontológicos. Calcula financiamento pelo Sistema Price, mostra em
qual parcela o custo direto e o valor principal são recuperados, separa a
visão comercial da área gerencial, gera propostas comerciais para WhatsApp e
permite salvar nome + telefone de pacientes para consulta posterior.

Não possui login. Tratamentos cadastrados e parâmetros de risco ficam salvos
em `localStorage` (por navegador); CPF nunca é salvo em lugar nenhum; nome e
telefone só são gravados no banco de dados quando o usuário clica
explicitamente em "Salvar paciente".

## Estrutura do projeto

```
server/
  index.js          Servidor Express: serve o front-end (dist/) e a API /api/patients
src/
  api/              Cliente HTTP para a API de pacientes
  components/       Componentes visuais (formulário, resultados, diálogos, gráfico)
  finance/          Funções financeiras puras (Price, amortização, recuperação de custo/principal, risco)
  storage/          Persistência local (allowlist de chaves permitidas no localStorage)
  utils/            Formatação de moeda/percentual e máscaras de CPF/telefone
  App.tsx           Composição da tela e estado da simulação
tests/
  finance/          Testes das funções financeiras
  storage/          Testes de persistência local
  components/       Testes de separação de visões e fluxo da proposta
  utils/            Testes de parsing/formatação e máscaras
```

## Banco de dados

A tabela `pacientes_simulador` (nome, telefone, data) é criada automaticamente
pelo servidor na primeira inicialização (`CREATE TABLE IF NOT EXISTS`). Basta
apontar a variável de ambiente `DATABASE_URL` para um banco Postgres (Neon ou
outro) — não é necessário rodar migrations manualmente.

## Instalação

```bash
npm install
```

## Desenvolvimento local

Rodar o front-end com hot reload:

```bash
npm run dev
```

Abre em `http://localhost:5173`. Chamadas para `/api/*` são redirecionadas
(proxy do Vite) para `http://localhost:8787` — rode o backend nesse endereço
em outro terminal:

```bash
DATABASE_URL="postgresql://usuario:senha@host/banco" npm run server:dev
```

## Testes

```bash
npm test
```

Executa a suíte completa (Vitest + React Testing Library) uma vez. Use
`npm run test:watch` para modo interativo.

## Build e execução em produção

```bash
npm run build
DATABASE_URL="postgresql://usuario:senha@host/banco" npm run start
```

`npm run build` gera a pasta `dist/`; `npm run start` sobe o servidor Express
que serve esses arquivos estáticos e expõe a API em `/api/patients`.

## Notas de segurança e privacidade

- A "Área gerencial" é uma separação **visual**, não uma barreira de
  autenticação — a aplicação é pública e não tem login. Isso vale também para
  a busca de pacientes salvos, que fica na área gerencial mas sem senha real.
- CPF nunca é salvo em lugar nenhum, nunca aparece na proposta e usa
  `autocomplete="off"`.
- Nome do paciente e telefone só são enviados ao banco de dados quando o
  usuário clica em "Salvar paciente" — nunca automaticamente. Fora isso,
  existem apenas em memória (estado do React) e somem ao recarregar a página.
- `src/storage/safeStorage.ts` é o único ponto de acesso ao `localStorage` do
  navegador e restringe a gravação a duas chaves: tratamentos cadastrados e
  parâmetros de risco (nada de dados de pacientes passa por aqui).
