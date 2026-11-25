# A Ilha dos Brincadeiros

RPG 2D de aventura, exploração e enigmas inspirado nas histórias de Natal do Carlos.

## Estado atual

O `index.html` contém o protótipo jogável v3. A estrutura de pastas prepara a separação gradual do código, dados e recursos visuais nas próximas versões.

## Executar localmente

A forma mais simples é abrir `index.html` num navegador moderno (Chrome, Edge ou Firefox). Como o jogo atual é autónomo, não necessita de servidor nem de dependências.

Opcionalmente, iniciar um servidor local na raiz do projeto:

```bash
python -m http.server 8000
```

Depois abrir http://localhost:8000.

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
├── index.html              # Entrada publicada pelo GitHub Pages (protótipo v3)
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
