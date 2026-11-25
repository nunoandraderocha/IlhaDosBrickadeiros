# Documento de design — A Ilha dos Brincadeiros

## Visão
RPG 2D top-down para browser, inspirado na exploração dos primeiros Pokémon e nas histórias de Natal escritas com o Carlos.

## Personagens
- **Pinguim Alfredo:** protagonista controlado pelo jogador; camisola azul e chapéu de explorador.
- **Irmãozinho:** companheiro permanente que segue Alfredo.
- **Tiozão:** personagem recorrente, potencial fonte de orientação e missões.
- **Sardanisca:** personagem recorrente, a preservar conforme as histórias originais.

As ilustrações definitivas devem respeitar as referências originais. Não inventar detalhes visuais ou narrativos que contradigam o material existente.

## História e progressão
A aventura começa numa ilha inicial. O jogador aprende a mover-se, interagir, recolher objetos e falar com personagens. Encontra um mapa e inicia a missão de reunir peças LEGO para construir uma jangada. A jangada permite alcançar outras regiões. A história deve avançar por capítulos, sem contradizer os acontecimentos originais.

## Regiões planeadas
1. **Praia do Começo:** tutorial, mapa, NPCs e peças LEGO para a jangada.
2. **Floresta dos Sussurros:** exploração, pistas, objetos escondidos e caminhos secretos.
3. **Grutas dos Ecos:** enigmas, símbolos, sequências e mecanismos.
4. **Arquipélago das Estrelas:** navegação, ilhas secundárias, objetos raros e portais.

As regiões devem estar ligadas por caminhos, praias, pontes, grutas e navegação, e o mundo deve poder crescer sem reescrever o motor.

## Desafios e desbloqueios
- Recolha de objetos e peças.
- Enigmas de lógica, símbolos e sequências.
- Perguntas de conhecimento e memória feitas por NPCs.
- Descoberta de passagens secretas.
- Ativação de mecanismos e portais.
- Missões de ajuda a personagens.
- Desbloqueios por itens, respostas, exploração, missões ou progressão.

Uma resposta errada não deve bloquear permanentemente a história. Devem existir pistas e novas tentativas.

## Sistemas de jogo
- Movimento, colisões e interação por proximidade.
- Câmara que acompanha o protagonista.
- Companheiro com seguimento e recuperação quando fica preso.
- Inventário, diário, missões e recompensas.
- Diálogos com retratos e expressões.
- Mapa de mundo e regiões desbloqueadas.
- Gravação local de progresso e opção de reiniciar.

## Direção artística
Mundo em pixel art 2D, com tilesets e sprites animados. Retratos e ilustrações com linguagem de livro infantil, pintura artesanal, cores quentes, formas suaves e expressividade. Os retratos e sprites devem representar consistentemente as mesmas personagens.

## Tecnologia
- HTML5, CSS3 e JavaScript.
- Canvas 2D para renderização.
- `requestAnimationFrame` para o ciclo do jogo.
- Mapas tile-based, com camadas de terreno, decoração, colisões e objetos.
- `localStorage` para gravação local.
- Sem backend obrigatório; publicação estática em GitHub Pages.
- O protótipo atual é distribuído em `index.html`; modularizar gradualmente em `src/` e `data/`.
