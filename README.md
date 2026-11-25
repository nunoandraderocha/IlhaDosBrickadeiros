# A Ilha dos Brincadeiros

RPG 2D de aventura, exploração e enigmas inspirado nas histórias de Natal do Carlos.

## Estado atual

O `index.html` contém o protótipo jogável v4, com ecrã inicial narrativo, sete zonas ligadas aos capítulos, NPCs com sprites e avatares de diálogo, recolha de peças LEGO, enigma da feira, ecrã de vitória e progresso guardado localmente.

## Executar localmente

Para jogar com música, inicia um servidor local na raiz do projeto:

```bash
python -m http.server 8000
```

Depois abre http://localhost:8000 num navegador moderno. Os navegadores bloqueiam o carregamento das faixas locais quando o jogo é aberto diretamente por `file://`; sem servidor, o jogo funciona sem música.

## Publicar com GitHub Pages

1. Criar um repositório público chamado `ilha-dos-brincadeiros`.
2. Enviar o conteúdo desta pasta para a branch `main`.
3. No GitHub, abrir **Settings → Pages**.
4. Em **Build and deployment**, selecionar **Deploy from a branch**.
5. Selecionar a branch `main` e a pasta `/ (root)` e guardar.
6. Aguardar a publicação. O endereço será `https://<utilizador>.github.io/ilha-dos-brincadeiros/`.

Cada `git push` para `main` atualizará a publicação.

## Estrutura

```text
.
├── index.html              # Entrada publicada pelo GitHub Pages (protótipo v4)
├── src/                    # Código JavaScript a modularizar
├── assets/
│   ├── sprites/            # Sprites e animações
│   ├── portraits/          # Retratos dos diálogos
│   ├── tilesets/           # Tiles e mapas gráficos
│   └── audio/              # Música e efeitos sonoros
├── data/                   # Mapas, diálogos, missões e configurações
├── docs/                   # Documentação de design e desenvolvimento
├── .nojekyll               # Evita processamento Jekyll
└── README.md
```

## Princípios do projeto

- Preservar a identidade e os acontecimentos estabelecidos nas histórias originais.
- Manter Alfredo como protagonista e o irmãozinho como companheiro seguidor.
- Expandir o mundo por zonas, missões, enigmas e desbloqueios variados.
- Manter o jogo estático e compatível com GitHub Pages; não introduzir backend sem necessidade.
- Validar cada alteração no navegador antes de publicar.
