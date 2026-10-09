# Simulador de Financiamento — Clínica Haddad

Aplicação web (React + TypeScript + Vite no front-end, serverless functions +
PostgreSQL no back-end, hospedada na Vercel) usada pela equipe da Clínica
Haddad durante negociações de tratamentos odontológicos. Calcula financiamento
pelo Sistema Price, mostra em qual parcela o custo direto e o valor principal
são recuperados (sempre em modo gerencial — sem alternância de visão), gera
propostas comerciais para WhatsApp e permite salvar nome + telefone + CPF
(opcional) de pacientes para consulta e edição posterior.

Não possui login. Tratamentos cadastrados e parâmetros de risco ficam salvos
em `localStorage` (por navegador); nome, telefone, CPF (quando informado) e a
simulação atual só são gravados no banco de dados quando o usuário clica
explicitamente em "Salvar paciente" — depois disso, alterações na simulação
são salvas automaticamente. Nome e telefone são obrigatórios para liberar o
cálculo; CPF é opcional, mas fica salvo quando preenchido. O CPF nunca
aparece na proposta comercial enviada ao paciente.

## Estrutura do projeto

```
api/
  patients.js       Serverless function (Vercel): POST salva, GET busca pacientes
src/
  api/              Cliente HTTP para a API de pacientes
  components/       Telas e blocos do simulador (formulário, resultados, gráfico, pacientes, diálogos)
    shell/          Estrutura padrão Haddad: menu lateral recolhível, barra do celular, tema, Ctrl+K
    ui/             Kit do design system (Button, Card, StatCard, Badge, Drawer, Toast, Sparkline...)
  finance/          Funções financeiras puras (Price, amortização, recuperação de custo/principal, risco)
  storage/          Persistência local (allowlist de chaves permitidas no localStorage)
  styles/           haddad.css — tokens do design system (cores, raios, sombras, luzes, animações)
  utils/            Formatação de moeda/percentual, máscaras de CPF/telefone e regras da lista de pacientes
  App.tsx           Composição da tela e estado da simulação
tailwind.config.js  Liga os tokens do haddad.css às classes do Tailwind (bg-card, text-muted-foreground...)
tests/
  finance/          Testes das funções financeiras
  storage/          Testes de persistência local
  components/       Testes de telas, menu lateral, kit de componentes e fluxo da proposta
  utils/            Testes de parsing/formatação, máscaras e regras da lista de pacientes
```

## Design system Haddad

A interface segue o design system do ecossistema Haddad (mesmos valores de
`design-system-haddad` e do Contas a Receber): tema escuro por padrão, tema
claro opcional, menu lateral recolhível, cartões de indicador com mini
gráficos, tabelas com filtros/ordenação/paginação e painel lateral de
detalhes, animações de 150–300 ms e números tabulares.

- **Tokens**: tudo (cores, raios, sombras, luzes, tempos) vive em
  `src/styles/haddad.css`. Mudou a identidade? Mude só ali. O tema claro é o
  bloco `:root[data-tema='claro']`; o `index.html` aplica o tema salvo antes da
  primeira pintura (sem piscar).
- **Tailwind 3**: o design system original é escrito para Tailwind 4. Aqui o
  `tailwind.config.js` mantém os mesmos nomes de cor e usa `color-mix` para as
  classes com transparência (`bg-primary/15`), então os componentes são
  intercambiáveis entre os sistemas. Não há dependências novas (gráficos em SVG
  próprio, animações em CSS).
- **Navegadores**: Chrome/Edge 111+, Safari 16.4+ e Firefox 113+ (as cores com
  transparência usam `color-mix`; é o mesmo requisito dos outros sistemas
  Haddad em Tailwind 4).
- **Só dados reais**: indicadores, variações e mini gráficos recebem números
  calculados pelo próprio sistema. Sem período anterior não há "variação";
  sem série não há gráfico.
- **Janelas e gavetas** (`Modal`, `Drawer`, menu do celular) são desenhadas no
  `<body>` (`ui/Portal.tsx`). As animações de entrada usam preenchimento
  `backwards`: com `both`, o elemento fica com uma `transform` permanente e
  vira o "chão" dos filhos `position: fixed`, empurrando o rodapé dos painéis
  para fora da tela.
- **Acessibilidade**: foco preso e devolvido em janelas, `Esc` fecha,
  `aria-sort` nas tabelas, alvos de 44 px em telas de toque, respeito a
  `prefers-reduced-motion`.

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
- CPF é opcional. Quando informado, é salvo no banco de dados (para não
  precisar ser redigitado ao editar um paciente já cadastrado), mas nunca
  aparece na proposta comercial enviada ao paciente e usa `autocomplete="off"`.
  Nome e telefone continuam obrigatórios para liberar o cálculo.
- Nome, telefone, CPF (quando informado) e a simulação atual só começam a ser
  enviados ao banco de dados quando o usuário clica em "Salvar paciente" pela
  primeira vez; depois disso, alterações são salvas automaticamente (upsert
  pelo par nome+telefone). Antes do primeiro salvamento, tudo existe apenas em
  memória (estado do React) e some ao recarregar a página.
- `src/storage/safeStorage.ts` é o único ponto de acesso ao `localStorage` do
  navegador e restringe a gravação a uma lista fechada de chaves: tratamentos
  cadastrados, parâmetros de risco e preferências de tela (tema, menu
  recolhido, ordenação e itens por página da lista de pacientes). Nada de dados
  de pacientes passa por aqui — nem o texto digitado na busca.
