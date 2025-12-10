#!/bin/bash

# Script simple para desplegar reglas de Firestore

echo "🚀 Desplegando reglas de Firestore..."
echo ""

# Obtener token de acceso
echo "🔑 Obteniendo token de acceso..."
TOKEN=$(node -e "
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
(async () => {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, '../backend/serviceAccount.json'),
    scopes: ['https://www.googleapis.com/auth/firebase.rules']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log(token.token);
})();
")

if [ -z "$TOKEN" ]; then
  echo "❌ Error obteniendo token"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# Leer reglas
echo "📝 Leyendo reglas..."
RULES=$(cat firestore.rules | jq -Rs .)

# Crear payload
PAYLOAD=$(cat <<EOF
{
  "source": {
    "files": [
      {
        "name": "firestore.rules",
        "content": $RULES
      }
    ]
  }
}
EOF
)

echo "📤 Creando ruleset..."
# Crear ruleset
RESPONSE=$(curl -s -X POST \
  "https://firebaserules.googleapis.com/v1/projects/lovenda-98c77/rulesets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Verificar si hay error
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Error creando ruleset:"
  echo "$RESPONSE" | jq .
  exit 1
fi

RULESET_NAME=$(echo "$RESPONSE" | jq -r '.name')
echo "✅ Ruleset creado: $RULESET_NAME"
echo ""

# Desplegar ruleset
echo "🚀 Desplegando ruleset..."
RELEASE_PAYLOAD="{\"rulesetName\":\"$RULESET_NAME\"}"

RELEASE_RESPONSE=$(curl -s -X PATCH \
  "https://firebaserules.googleapis.com/v1/projects/lovenda-98c77/releases/cloud.firestore" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RELEASE_PAYLOAD")

# Verificar si hay error
if echo "$RELEASE_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Error desplegando:"
  echo "$RELEASE_RESPONSE" | jq .
  exit 1
fi

echo "✅ Reglas desplegadas correctamente!"
echo "$RELEASE_RESPONSE" | jq .
