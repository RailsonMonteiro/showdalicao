<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17F2MbKU_h2BpHXA1BGUhJAi7LICbHP_N

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Gerar App .exe (Windows)

Este projeto foi configurado para empacotar como aplicativo desktop usando Electron.

1. Instale as dependencias:
   `npm.cmd install`
2. Teste em modo desktop (desenvolvimento):
   `npm.cmd run dev:desktop`
3. Gere o instalador .exe:
   `npm.cmd run dist:win`

Saida esperada:
- O instalador sera gerado em `release/`

## Atualizar a versao instalada

A atualizacao da instalacao usa a versao publicada no GitHub. O app instalado compara a propria versao com a release mais recente do repositório.

Quando for lancar uma nova versao:

1. Atualize a versao no [package.json](package.json).
2. Gere o instalador:
   `npm.cmd run dist:win`
3. Publique a nova release no GitHub.

Depois disso, o app instalado vai detectar a nova versao e oferecer a atualizacao automaticamente.

## Publicar no GitHub Pages

Este projeto ja esta configurado para deploy automatico no GitHub Pages usando GitHub Actions.

1. Suba o projeto para um repositorio no GitHub.
2. Garanta que a branch principal seja `main`.
3. No GitHub, abra `Settings > Pages` e em `Build and deployment` selecione `GitHub Actions`.
4. Faça push para a branch `main`.
5. Aguarde o workflow `Deploy GitHub Pages` finalizar na aba `Actions`.

URL final esperada:
- `https://SEU_USUARIO.github.io/showdalicao/`

Observacoes:
- O workflow já está fixado para o base path do repositório `showdalicao`.
- Para build local simulando o Pages:
   `VITE_BASE_PATH=/showdalicao/ npm run build:web`
