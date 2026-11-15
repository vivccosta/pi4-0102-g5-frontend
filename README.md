# Timbro: Autenticação de documentos com blockchain para pequenos negócios

Este repositório contém o código-fonte do frontend do Timbro, um sistema de autenticação de documentos usando Blockchain desenvolvido como Projeto Integrador do quarto semestre do curso de Sistemas de Informação na Pontifícia Universidade Católica de Campinas (PUC-Campinas).

## Integrantes

* Caio Lucena Andrade
* Emely Miguel Moreira
* Caique Martinez Spadari
* Gabriel Biazon Galeazzi
* Viviane Conceição Costa
* Leandro Augusto Pessagno Miranda

## Como executar localmente (desenvolvimento)

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

## Executando com Docker

O frontend do Timbro utiliza uma imagem multi-stage baseada em Node.js (estágio de compilação) e Nginx estável Alpine (estágio de execução na porta 3000), com suporte a injeção de configurações em runtime.

### 1. Build da imagem

```bash
docker build -t timbro-frontend .
```

### 2. Executando o container

```bash
docker run --rm -p 3000:3000 -e REACT_APP_API_URL=http://localhost:8080 timbro-frontend
```

Após iniciar, o sistema estará acessível em `http://localhost:3000`.

### 3. Alterando a URL da API em runtime (sem rebuild)

A imagem é agnóstica de ambiente e não requer novo build para mudar a URL do backend. Ao iniciar o container, um script em `/docker-entrypoint.d/40-generate-config.sh` lê as variáveis de ambiente e gera o arquivo `config.js` dinamicamente:

```bash
docker run --rm -p 3000:3000 -e REACT_APP_API_URL=http://meu-servidor:8080 timbro-frontend
```

Variáveis suportadas:
* `REACT_APP_API_URL` (ou `API_URL`): URL base da API do Backend 1 (padrão: `http://localhost:8080`).
* `REACT_APP_WS_URL` (ou `WS_URL`): URL reservada de WebSocket (padrão: `ws://localhost:8080`).

> [!IMPORTANT]
> **Aviso de arquitetura (chamadas client-side):**
> O Timbro é uma aplicação SPA que roda inteiramente no **navegador do usuário**. Portanto, o valor de `REACT_APP_API_URL` deve ser um endereço acessível pelo **navegador** (como `http://localhost:8080` ou o IP/domínio público da máquina). **Não utilize** hostnames internos da rede Docker (como `http://backend1:8080`), pois o navegador do cliente não tem acesso aos aliases de rede internos do Docker Compose.

## Estrutura de pastas

```text
docker/           # Scripts de entrypoint para configuração em runtime
public/           # Arquivos estáticos públicos e config.js de desenvolvimento
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
