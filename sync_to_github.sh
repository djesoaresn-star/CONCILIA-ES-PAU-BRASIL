#!/bin/bash
# Script de sincronização com o GitHub para CONCILIA-ES-PAU-BRASIL
# Uso: GITHUB_TOKEN="seu_token_aqui" ./sync_to_github.sh

REPO_OWNER="djesoaresn-star"
REPO_NAME="CONCILIA-ES-PAU-BRASIL"
BRANCH="main"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERRO: Variavel de ambiente GITHUB_TOKEN nao fornecida."
  echo "Exemplo de uso:"
  echo "  GITHUB_TOKEN=\"ghp_seuTokenAqui\" ./sync_to_github.sh"
  exit 1
fi

echo "Configurando remote autenticado..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"

echo "Staging de todas as alterações..."
git add -A

echo "Criando commit..."
git commit -m "update: sincronizacao automatica com correcoes de pipeline e dados" 2>/dev/null || true

echo "Enviando para o GitHub (${BRANCH})..."
git push -u origin "$BRANCH" --force

echo "Concluido com sucesso! O GitHub Actions iniciara a publicacao automaticamente."
