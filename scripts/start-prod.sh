#!/bin/bash
# Script para iniciar a aplicação em produção usando a versão do Node especificada no .nvmrc

# Carrega o nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usa a versão especificada no .nvmrc
nvm use

# Executa a aplicação (ESM bundle gerado em dist/src)
node dist/src/main.js

