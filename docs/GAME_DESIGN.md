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

1. **Praia do Começo:** Alfredo encontra a mensagem na garrafa e o mapa, recolhe cinco peças LEGO espalhadas pela ilha e escondidas em duas palmeiras, e monta a jangada antes de partir.
2. **Caminho das Medusas:** os irmãos percorrem um labirinto sinuoso sobre a água. O grupo de medusas bloqueia o corredor até encontrarem o escudo; os outros contactos tiram um ponto de vida a Alfredo. A saída final abre quando atravessam o grupo com o escudo.
3. **Tempestade dos Sons:** a Medusa Musical pede a construção de uma nota e de uma caixa musical. Quando recebe a caixa, a tempestade dissipa-se numa animação e revela o caminho para a Ilhota do Farol.
4. **Ilhota do Farol:** depois de falar com o Tiozão, os irmãos recolhem um atum, um rato, um fio e um novelo para preparar o isco e as redes que atraem os peixes-gato.
5. **Gruta da Sardanisca Dentista:** os irmãos encontram os animais em tratamento e ajudam o Tiozão e a Sardanisca a cuidar juntos dos peixes-gato.
6. **Cidade e Feira de LEGO:** os guardas apresentam o enigma das caixas; a posição do bilhete é sorteada no início de cada aventura. A caixa errada está vazia e pode ser tentada novamente.
7. **Interior do Museu LEGO:** Alfredo encontra a arca dos Blocos Mágicos e convence o Arqueólogo a partilhá-los. A aventura termina com música e um ecrã de vitória; é possível começar uma nova aventura.

As zonas são desbloqueadas em sequência, seguindo os capítulos 1–11. O ecrã inicial apresenta o prefácio e permite continuar um progresso guardado ou começar uma aventura nova.

## Sistemas implementados

- Movimento em quatro direções, corrida, colisão e interação por proximidade.
- Dez pontos de vida para Alfredo; o contacto com medusas ao longo do movimento causa um ponto de dano por entrada. Ao perder toda a vida, regressa ao início da aventura.
- A passagem no fim do Caminho das Medusas fica bloqueada até Alfredo atravessar o percurso ainda com vida; o power-up a meio protege-o das medusas.
- O Caminho das Medusas tem corredores sinuosos de três tiles de largura e uma barreira de medusas que só deixa passar com o escudo.
- Cinco peças LEGO recolhíveis na Tempestade dos Sons: dois cristais constroem a nota musical e as cinco peças constroem a caixa musical.
- A entrega da caixa à Medusa Musical anima a abertura do caminho luminoso; a passagem fica disponível e permanece aberta ao retomar a aventura.
- Na Ilhota do Farol, falar com o Tiozão revela quatro ingredientes recolhíveis (atum, rato, fio e novelo); só depois de os reunir é possível preparar o isco e construir as redes.
- Companheiro com procura de percurso sobre os tiles transitáveis e velocidade para acompanhar Alfredo; lembra o objetivo da zona quando Alfredo se aproxima para falar com ele.
- Tiozão e Sardanisca aproximam-se um do outro na gruta.
- Mapas em grelha, passagens entre zonas, objetos e objetivos narrativos. Na praia, cinco peças LEGO (três à vista e duas escondidas nas palmeiras) são necessárias para construir a jangada.
- Diálogos com escolhas e retratos de NPC.
- Música por zona, controlada pelo jogador e com troca automática.
- Progresso local em `localStorage`, mapa/HUD de sete zonas, ecrã de vitória retomável e opção de jogar novamente.

## Direção artística

Mundo 2D de inspiração pixel art, com mapas em tiles, variação determinística de textura para relva, areia e caminhos, e sprites SVG de formas simples e cores distintas. Alfredo e o irmãozinho usam pinguins desenhados no canvas, com volumes, sombras, roupa e animações próprias. As peças LEGO da jangada têm sprite desenhado no canvas. Os sprites e retratos SVG dos NPCs usam a mesma ilustração, realçada no mapa por um halo e uma etiqueta de alto contraste para manter a identidade e a legibilidade das personagens.

O ecrã inicial usa a ilustração fornecida para o projeto em `assets/images/alfredo-title-screen.png`.

## Tecnologia

- HTML5, CSS3 e JavaScript.
- Canvas 2D e `requestAnimationFrame`.
- Mapas tile-based e `localStorage`.
- Protótipo jogável concentrado em `index.html`, publicável como site estático.
