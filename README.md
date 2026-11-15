# Timbro: Autenticação de documentos com blockchain para pequenos negócios

Este repositório contém o código-fonte do frontend do Timbro, um sistema de autenticação de documentos usando Blockchain desenvolvido como Projeto Integrador do quarto semestre do curso de Sistemas de Informação na Pontifícia Universidade Católica de Campinas (PUC-Campinas).

## Integrantes

* Caio Lucena Andrade
* Emely Miguel Moreira
* Caique Martinez Spadari
* Gabriel Biazon Galeazzi
* Viviane Conceição Costa
* Leandro Augusto Pessagno Miranda

## Como executar

### Pré-requisitos
- Node.js >= 24
- npm >= 10

### Instalação
```bash
npm install
```

### Scripts disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento na porta padrão (5173).
- `npm run dev:mock`: Inicia a aplicação com mocks MSW ativos no navegador (sem backend).
- `npm test`: Executa os testes unitários e de integração com Vitest.
- `npm run test:watch`: Executa os testes em modo watch contínuo.
- `npm run build`: Realiza a verificação de tipos e compila os arquivos para produção na pasta `dist/`.
- `npm run lint`: Executa o linter ESLint no projeto.
- `npm run typecheck`: Executa a checagem de tipos com TypeScript (`tsc -b`).

## Estrutura de pastas

```text
src/
├── api/          # Cliente HTTP, schemas Zod e tratamento de erros
├── app/          # Layout base, roteamento, queryClient e páginas comuns (404)
├── components/   # Componentes de UI reutilizáveis (Header, Footer, Button, Field, Alert, Spinner)
├── config/       # Leitura de configuração em runtime (window.__TIMBRO_CONFIG__)
├── features/     # Telas e fluxos de negócio (verificação, auth, painel, registro, admin)
├── lib/          # Utilitários puros (datas, jwt, clipboard, sessão)
├── mocks/        # Handlers e fixtures MSW para testes e modo mock
├── styles/       # Design tokens CSS e estilos globais
└── test/         # Setup e configurações globais de teste (Vitest)
```
