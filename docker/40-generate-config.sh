#!/bin/sh
set -eu

# Lê variáveis de ambiente com suporte aos nomes do compose e nomes padrão
API_URL="${REACT_APP_API_URL:-${API_URL:-http://localhost:8080}}"
WS_URL="${REACT_APP_WS_URL:-${WS_URL:-ws://localhost:8080}}"

# Função para escapar caracteres especiais em literais de string JS/JSON
escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

ESCAPED_API_URL=$(escape_js "$API_URL")
ESCAPED_WS_URL=$(escape_js "$WS_URL")

CONFIG_PATH="/usr/share/nginx/html/config.js"

cat <<EOF > "$CONFIG_PATH"
window.__TIMBRO_CONFIG__ = {
  apiUrl: "$ESCAPED_API_URL",
  wsUrl: "$ESCAPED_WS_URL"
};
EOF

echo "[timbro] config.js gerado com sucesso em $CONFIG_PATH:"
echo "  apiUrl: $API_URL"
echo "  wsUrl:  $WS_URL"
