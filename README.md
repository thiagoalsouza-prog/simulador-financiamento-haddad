# Simulador de Financiamento — Clínica Haddad

Aplicação web (React + TypeScript + Vite no front-end, serverless functions +
PostgreSQL no back-end, hospedada na Vercel) usada pela equipe da Clínica
Haddad durante negociações de tratamentos odontológicos. Calcula financiamento
pelo Sistema Price, mostra em qual parcela o custo direto e o valor principal
são recuperados (sempre em modo gerencial — sem alternância de visão), gera
propostas comerciais para WhatsApp e permite salvar nome + telefone de
pacientes para consulta posterior.

Não possui login. Tratamentos cadastrados e parâmetros de risco ficam salvos
em `localStorage` (por navegador); CPF nunca é salvo em lugar nenhum; nome e
telefone só são gravados no banco de dados quando o usuário clica
explicitamente em "Salvar paciente".

## Estrutura do projeto

```
api/
  patients.js       Serverless function (Vercel): POST salva, GET busca pacientes
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
pela função serverless na primeira chamada (`CREATE TABLE IF NOT EXISTS`).
Basta apontar a variável de ambiente `DATABASE_URL` para um banco Postgres
Neon — não é necessário rodar migrations manualmente. A leitura usa
`@neondatabase/serverless`, recomendado pela própria Neon para ambientes
serverless (evita esgotar conexões TCP a cada invocação).

## Instalação

```bash
npm install
```

## Desenvolvimento local

Front-end apenas (sem API):

```bash
npm run dev
```

Abre em `http://localhost:5173`. Para testar também as rotas `/api/*`
localmente, use a CLI da Vercel (emula front-end + funções serverless juntos):

```bash
npx vercel dev
```

Configure `DATABASE_URL` no arquivo `.env.local` (não versionado) antes de
rodar.

## Testes

```bash
npm test
```

Executa a suíte completa (Vitest + React Testing Library) uma vez. Use
`npm run test:watch` para modo interativo.

## Deploy

Hospedado na Vercel (plano gratuito, sem cartão de crédito). O deploy é
automático a cada push na branch `main` conectada ao projeto na Vercel.
Configuração necessária no dashboard da Vercel: variável de ambiente
`DATABASE_URL` apontando para o banco Neon.

## Notas de segurança e privacidade

- A aplicação é pública e não tem login (nem para as informações gerenciais,
  que ficam sempre visíveis). Isso vale também para a busca de pacientes
  salvos, sem senha real.
- CPF nunca é salvo em lugar nenhum, nunca aparece na proposta e usa
  `autocomplete="off"`.
- Nome, telefone e a simulação atual só começam a ser enviados ao banco de
  dados quando o usuário clica em "Salvar paciente" pela primeira vez; depois
  disso, alterações na simulação são salvas automaticamente (upsert pelo par
  nome+telefone). Antes do primeiro salvamento, tudo existe apenas em memória
  (estado do React) e some ao recarregar a página.
- `src/storage/safeStorage.ts` é o único ponto de acesso ao `localStorage` do
  navegador e restringe a gravação a duas chaves: tratamentos cadastrados e
  parâmetros de risco (nada de dados de pacientes passa por aqui).
