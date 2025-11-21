#!/bin/bash
# Script para iniciar a aplicação em produção usando a versão do Node especificada no .nvmrc

# Carrega o nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usa a versão especificada no .nvmrc
nvm use

# Executa a aplicação (ESM bundle para compatibilidade com Baileys 7.x)
node --experimental-specifier-resolution=node dist/main.mjs

