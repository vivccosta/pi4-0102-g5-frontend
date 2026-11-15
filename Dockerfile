# Estágio 1: Build da aplicação React
FROM node:24-alpine AS builder

WORKDIR /app

# Copia manifestos e instala dependências de forma reprodutível
COPY package.json package-lock.json ./
RUN npm ci

# Copia código-fonte e compila para produção
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx servindo os arquivos estáticos
FROM nginx:stable-alpine AS runner

# Remove os arquivos padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia a configuração do Nginx com porta 3000 e regras de cache/SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o script de runtime para os hooks do entrypoint oficial do Nginx
COPY docker/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-config.sh && \
    chmod +x /docker-entrypoint.d/40-generate-config.sh

# Copia o bundle gerado no estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
