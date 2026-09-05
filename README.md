# Simulador de Financiamento — Clínica Haddad

Aplicação web estática (React + TypeScript + Vite) usada pela equipe da Clínica
Haddad durante negociações de tratamentos odontológicos. Calcula financiamento
pelo Sistema Price, mostra em qual parcela o custo direto é recuperado, separa
a visão comercial da área gerencial e gera propostas comerciais para WhatsApp.

Não possui login, banco de dados ou backend. Roda inteiramente no navegador.
Apenas tratamentos cadastrados e parâmetros de risco ficam salvos em
`localStorage`; nome, CPF e simulações nunca são persistidos.

## Estrutura do projeto

```
src/
  components/       Componentes visuais (formulário, resultados, diálogos, gráfico)
  finance/          Funções financeiras puras (Price, amortização, recuperação de custo, risco)
  storage/          Persistência local (allowlist de chaves permitidas)
  utils/            Formatação de moeda/percentual e máscara de CPF
  App.tsx           Composição da tela e estado da simulação
tests/
  finance/          Testes das funções financeiras (cenários 1–9 do briefing)
  storage/          Testes de persistência (cenário 12)
  components/       Testes de separação de visões e fluxo da proposta (cenários 10–11)
  utils/            Testes de parsing/formatação de moeda
```

## Instalação

```bash
npm install
```

## Desenvolvimento local

```bash
npm run dev
```

Abre em `http://localhost:5173`.

## Testes

```bash
npm test
```

Executa a suíte completa (Vitest + React Testing Library) uma vez. Use
`npm run test:watch` para modo interativo.

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/` com os arquivos estáticos, prontos para publicação em
Netlify, Cloudflare Pages, Vercel, GitHub Pages ou qualquer hospedagem
estática.

## Pré-visualizar o build de produção

```bash
npm run preview
```

## Notas de segurança e privacidade

- A "Área gerencial" é uma separação **visual**, não uma barreira de
  autenticação — a aplicação é pública e não tem login.
- CPF nunca é salvo, nunca aparece na proposta e usa `autocomplete="off"`.
- Nome do paciente e CPF existem apenas em memória (estado do React) e somem
  ao recarregar ou fechar a página.
- `src/storage/safeStorage.ts` é o único ponto de acesso ao `localStorage` e
  restringe a gravação a duas chaves: tratamentos cadastrados e parâmetros de
  risco.
