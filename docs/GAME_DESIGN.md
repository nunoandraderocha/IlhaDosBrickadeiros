# Documento de design — A Ilha dos Brincadeiros

## Visão

RPG 2D top-down para browser, inspirado na exploração de jogos de aventura e nas histórias de Natal escritas com o Carlos. A aventura segue os capítulos de `historia_completa.txt`, preservando os acontecimentos centrais.

## Personagens

- **Pinguim Alfredo:** protagonista controlado pelo jogador; usa chapéu de explorador.
- **Irmãozinho:** companheiro permanente, segue Alfredo pelo percurso sem atravessar obstáculos.
- **Medusa Musical:** apresenta o enigma do som perdido.
- **Tiozão:** pescador à procura dos dois peixes-gato mágicos.
- **Sardanisca Dentista:** trata animais marinhos feridos e cuida dos peixes-gato.
- **Peixes-gato branco e preto:** guiam os irmãos até à gruta.
- **Guarda da espada e guarda da lança:** propõem o enigma das caixas na Feira de LEGO.
- **Arqueólogo Malfeitor:** guarda os Blocos Mágicos no museu.
- **Polvo, gaivota e caranguejo:** pacientes da Sardanisca na gruta.

Cada NPC tem um sprite SVG próprio; esse mesmo recurso é mostrado como avatar na caixa de diálogo.

## Zonas e progressão

1. **Praia do Começo:** Alfredo encontra a mensagem na garrafa, recolhe o mapa e parte na jangada LEGO.
2. **Caminho das Medusas:** os irmãos observam o grupo de medusas e atravessam o caminho sobre elas.
3. **Tempestade dos Sons:** a Medusa Musical pede a construção de uma nota e de uma caixa musical para abrir a passagem.
4. **Ilhota do Farol:** o Tiozão pede ajuda para atrair os peixes-gato com redes e um isco musical.
5. **Gruta da Sardanisca Dentista:** os irmãos encontram os animais em tratamento e ajudam o Tiozão e a Sardanisca a cuidar juntos dos peixes-gato.
6. **Cidade e Feira de LEGO:** os guardas apresentam o enigma das caixas; no museu, o Arqueólogo aprende a partilhar os Blocos Mágicos.

As zonas são desbloqueadas em sequência, seguindo os capítulos 1–11. O ecrã inicial apresenta o prefácio e permite continuar um progresso guardado ou começar uma aventura nova.

## Sistemas implementados

- Movimento em quatro direções, corrida, colisão e interação por proximidade.
- Companheiro com procura de percurso sobre os tiles transitáveis.
- Mapas em grelha, passagens entre zonas, objetos e objetivos narrativos.
- Diálogos com escolhas e retratos de NPC.
- Música por zona, controlada pelo jogador e com troca automática.
- Progresso local em `localStorage` e opção de reiniciar.

## Direção artística

Mundo 2D de inspiração pixel art, com mapas em tiles e sprites SVG de formas simples e cores distintas. Os retratos e sprites usam a mesma ilustração para manter a identidade visual das personagens.

## Tecnologia

- HTML5, CSS3 e JavaScript.
- Canvas 2D e `requestAnimationFrame`.
- Mapas tile-based e `localStorage`.
- Protótipo jogável concentrado em `index.html`, publicável como site estático.
