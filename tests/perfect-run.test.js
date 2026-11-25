const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class Element {
  constructor() {
    this.children = [];
    this.dataset = {};
    this.hidden = false;
    this.style = {};
    this.classList = { add() {}, remove() {} };
  }

  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  prepend(...children) { this.children.unshift(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute() {}
}

function createGame({ storage = new Map(), random = 0.5 } = {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)][0]?.[1];
  assert.ok(source, 'game script should exist');

  const elements = new Map();
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, new Element());
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  const canvasContext = new Proxy({}, { get: () => () => {} });
  getElementById('game').getContext = () => canvasContext;

  const document = {
    body: new Element(),
    head: new Element(),
    createElement: () => new Element(),
    getElementById,
    querySelector: selector => selector === '.hud' ? getElementById('hud') : new Element(),
    querySelectorAll: () => []
  };
  const window = { addEventListener() {} };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  };
  const math = Object.create(Math);
  math.random = () => random;
  class Audio {
    constructor() { this.playCount = 0; }
    pause() {}
    play() { this.playCount++; return Promise.resolve(); }
    addEventListener() {}
  }

  const context = vm.createContext({
    Audio,
    Image: class {},
    clearInterval() {},
    confirm: () => true,
    document,
    localStorage,
    location: { protocol: 'http:', search: '?test=1', reload() {} },
    Math: math,
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setInterval: () => 1,
    window
  });
  vm.runInContext(source, context, { filename: 'index.html' });
  assert.ok(window.__gameTest, 'test API should be enabled for ?test=1');
  return window.__gameTest;
}

function createRunner(game) {
  function dismissMessage() {
    const dialog = game.getDialog();
    if (!dialog) return;
    assert.equal(dialog.choices.length, 0, `unexpected choices in ${dialog.who}'s dialogue`);
    game.next();
  }

  function walkTo(goalX, goalY) {
    const state = game.getState();
    const start = { x: Math.floor(state.x), y: Math.floor(state.y) };
    const goal = { x: Math.round(goalX), y: Math.round(goalY) };
    const key = (x, y) => `${x},${y}`;
    const queue = [start];
    const parents = new Map([[key(start.x, start.y), null]]);
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length && !parents.has(key(goal.x, goal.y))) {
      const current = queue.shift();
      for (const [dx, dy] of directions) {
        const x = current.x + dx;
        const y = current.y + dy;
        const tile = game.getTile(x, y);
        const currentState = game.getState();
        const isUnshieldedMedusa = currentState.zone === 1
          && !currentState.flags.jellyfishShield
          && [3, 4, 12].includes(tile);
        if (game.isBlocked(x + 0.5, y + 0.5) || isUnshieldedMedusa) continue;
        const nextKey = key(x, y);
        if (parents.has(nextKey)) continue;
        parents.set(nextKey, key(current.x, current.y));
        queue.push({ x, y });
      }
    }

    assert.ok(parents.has(key(goal.x, goal.y)), `no safe path from ${start.x},${start.y} to ${goal.x},${goal.y} in zone ${state.zone}`);
    const route = [];
    for (let cursor = key(goal.x, goal.y); cursor; cursor = parents.get(cursor)) {
      const [x, y] = cursor.split(',').map(Number);
      route.push({ x, y });
    }
    route.reverse();

    for (const waypoint of route.slice(1)) {
      while (Math.hypot(waypoint.x - game.getState().x, waypoint.y - game.getState().y) > 0.0001) {
        const current = game.getState();
        const dx = Math.sign(waypoint.x - current.x);
        const dy = Math.sign(waypoint.y - current.y);
        const distance = Math.hypot(waypoint.x - current.x, waypoint.y - current.y);
        game.move(dx, dy, Math.min(0.04, distance / 4.4));
        dismissMessage();
      }
    }
  }

  function interactAt(id) {
    const actor = game.getActors().find(entry => entry.id === id && entry.visible && entry.available);
    assert.ok(actor, `actor ${id} should be visible`);
    const target = game.isBlocked(actor.x + 0.5, actor.y + 0.5)
      ? [[actor.x - 1, actor.y], [actor.x + 1, actor.y], [actor.x, actor.y - 1], [actor.x, actor.y + 1]]
        .find(([x, y]) => !game.isBlocked(x + 0.5, y + 0.5))
      : [actor.x, actor.y];
    assert.ok(target, `no accessible tile next to ${id}`);
    walkTo(target[0], target[1]);
    game.interact();
    assert.ok(game.getDialog(), `interacting with ${id} should open dialogue`);
  }

  function choose(label) {
    game.choose(label);
  }

  return { choose, dismissMessage, interactAt, walkTo };
}

test('a perfect playthrough completes every zone without losing health', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();

  run.interactAt('bottle');
  run.dismissMessage();
  run.interactAt('map');
  run.dismissMessage();
  run.interactAt('raft');
  assert.match(game.getDialog().msg, /jangada está incompleta/);
  run.dismissMessage();
  for (const id of ['raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-palm-north', 'raft-palm-south']) {
    run.interactAt(id);
    run.dismissMessage();
  }
  assert.equal(game.getState().items.filter(id => id.startsWith('raft-piece-')).length, 5);
  run.interactAt('raft');
  run.choose('Construir a jangada');
  assert.equal(game.getState().flags.raftBuilt, true);
  run.dismissMessage();
  run.interactAt('raft');
  run.choose('Partir');
  run.dismissMessage();

  run.walkTo(16, 11);
  assert.equal(game.getState().flags.jellyfishShield, true, 'the shield should be collected in the maze');
  run.walkTo(19, 18);
  assert.equal(game.getState().flags.medusaChallengeCompleted, true, 'crossing the group should complete the challenge');
  run.dismissMessage();
  run.interactAt('sea-route');
  run.choose('Continuar a viagem');
  run.dismissMessage();

  for (const id of ['music-crystal-a', 'music-crystal-b']) {
    run.interactAt(id);
    run.dismissMessage();
  }
  run.interactAt('musical-medusa');
  run.dismissMessage();
  run.interactAt('music-crystal-c');
  run.dismissMessage();
  run.interactAt('music-gear-a');
  run.dismissMessage();
  run.interactAt('music-gear-b');
  run.dismissMessage();
  run.interactAt('musical-medusa');
  run.choose('Construir a nota musical');
  run.dismissMessage();
  run.interactAt('musical-medusa');
  run.choose('Construir a caixa musical');
  run.dismissMessage();
  run.interactAt('musical-medusa');
  run.choose('Entregar a caixa');
  run.dismissMessage();
  run.interactAt('sound-storm');
  run.choose('Seguir o caminho');
  run.dismissMessage();

  run.interactAt('tiozao');
  run.dismissMessage();
  for (const id of ['bait-tuna', 'bait-mouse', 'bait-thread', 'bait-yarn']) {
    run.interactAt(id);
    run.dismissMessage();
  }
  assert.equal(game.getState().items.filter(id => id.startsWith('bait-')).length, 4);
  run.interactAt('tiozao');
  run.choose('Construir redes e isco');
  run.dismissMessage();
  run.interactAt('fish-white');
  run.dismissMessage();
  run.interactAt('fish-black');
  run.dismissMessage();
  run.interactAt('fishing-raft');
  run.choose('Seguir os peixes');
  run.dismissMessage();

  run.interactAt('tiozao-cave');
  run.choose('Propor que cuidem deles juntos');
  assert.ok(game.getClinicHeartAnimation() > 0, 'hearts should animate when the pair agrees to care for the cats together');
  run.dismissMessage();
  run.interactAt('clinic-exit');
  run.choose('Partir para a feira');
  run.dismissMessage();

  run.interactAt('guard-white');
  run.choose('Entendi o enigma');
  run.dismissMessage();
  const ticketBox = game.getState().flags.museumTicketBox;
  assert.ok(['box-left', 'box-right'].includes(ticketBox), 'the ticket box should be randomized');
  run.interactAt(ticketBox);
  run.dismissMessage();
  run.interactAt('museum-door');
  run.choose('Entrar no museu');
  run.dismissMessage();

  run.interactAt('archaeologist');
  run.choose('Mostrar as construções da viagem');
  run.choose('Construir e brincar juntos');

  const finalState = game.getState();
  assert.equal(finalState.zone, 6);
  assert.equal(finalState.health, 10, 'a perfect run should not take damage');
  assert.equal(finalState.flags.blocksReturned, true);
  assert.equal(finalState.victory, true);
  assert.equal(game.isVictoryVisible(), true);
  assert.deepEqual([...finalState.unlocked], [0, 1, 2, 3, 4, 5, 6]);
});

test('the first-zone raft requires five pieces, including two collected from palm caches', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();

  for (const id of ['map', 'raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-palm-north', 'raft-palm-south']) {
    assert.equal(game.getActors().find(actor => actor.id === id).visible, false, `${id} should be hidden before finding the message`);
  }
  run.interactAt('bottle');
  run.dismissMessage();
  assert.equal(game.getActors().find(actor => actor.id === 'map').visible, true, 'reading the message should reveal the map');
  for (const id of ['raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-palm-north', 'raft-palm-south']) {
    assert.equal(game.getActors().find(actor => actor.id === id).visible, false, `${id} should stay hidden until the map is collected`);
  }
  run.interactAt('map');
  run.dismissMessage();
  for (const id of ['raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-palm-north', 'raft-palm-south']) {
    assert.equal(game.getActors().find(actor => actor.id === id).visible, true, `${id} should be revealed by the map`);
  }

  run.interactAt('raft');
  assert.match(game.getDialog().msg, /0\/5/);
  run.dismissMessage();

  for (const id of ['raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-palm-north', 'raft-palm-south']) {
    run.interactAt(id);
    run.dismissMessage();
  }

  assert.equal(game.getState().items.filter(id => id.startsWith('raft-piece-')).length, 5);
  for (const id of ['raft-palm-north', 'raft-palm-south']) {
    assert.equal(game.getActors().find(actor => actor.id === id).available, false, `${id} should be empty after searching it`);
  }

  run.interactAt('raft');
  assert.deepEqual([...game.getDialog().choices], ['Construir a jangada', 'Construir mais tarde']);
  run.choose('Construir a jangada');
  assert.equal(game.getState().flags.raftBuilt, true);
});

test('medusa collisions damage and knock Alfredo back, while the shield prevents collisions', () => {
  const game = createGame();
  game.startNewGame();
  game.setState({ zone: 1, x: 5.8, y: 13, health: 10 });

  game.move(1, 0, 0.1);
  let state = game.getState();
  assert.equal(state.health, 9, 'colliding with a medusa should cause one damage');
  assert.ok(state.x < 5.8, 'the collision should knock Alfredo backwards');
  assert.equal(game.getTile(Math.floor(state.x), Math.floor(state.y)) === 3, false, 'Alfredo should not be left inside a medusa tile');

  game.move(1, 0, 0.1);
  assert.equal(game.getState().health, 9, 'approaching without contacting the medusa should not cause extra damage');
  game.move(1, 0, 0.1);
  state = game.getState();
  assert.equal(state.health, 8, 'a second collision should cause another damage');
  assert.ok(state.x < 5.8, 'the second collision should also knock Alfredo backwards');

  game.setState({ x: 5.8, y: 13, health: 10, flags: { jellyfishShield: true } });
  assert.equal(game.isBlocked(16.5, 14.5), false, 'the shield should open the medusa group blockade');
  game.move(1, 0, 0.1);
  assert.equal(game.getState().health, 10, 'the shield should prevent medusa damage');
  game.setState({ flags: { jellyfishShield: false } });
  assert.equal(game.isBlocked(16.5, 14.5), true, 'the blockade should stop an unshielded player');
});

test('the tenth medusa collision returns Alfredo to the starting beach', () => {
  const game = createGame();
  game.startNewGame();
  game.setState({ zone: 1, x: 5.8, y: 13, health: 10 });
  let collisions = 0;
  let health = 10;

  for (let attempt = 0; attempt < 30 && game.getState().zone === 1; attempt++) {
    game.move(1, 0, 0.1);
    const state = game.getState();
    if (state.zone === 0) collisions++;
    else if (state.health < health) collisions += health - state.health;
    health = state.zone === 1 ? state.health : 10;
  }

  const state = game.getState();
  assert.equal(collisions, 10, 'the reset should happen on exactly the tenth collision');
  assert.equal(state.zone, 0);
  assert.equal(state.x, 7);
  assert.equal(state.y, 12);
  assert.equal(state.health, 10);
  assert.match(game.getDialog().msg, /dez vezes/);
});

test('losing all health returns the player to the starting beach and saves the reset state', () => {
  const game = createGame();
  game.startNewGame();
  game.setState({ zone: 1, x: 5.8, y: 13, health: 1, flags: { jellyfishShield: false } });

  game.move(1, 0, 0.1);

  const state = game.getState();
  assert.equal(state.zone, 0);
  assert.equal(state.x, 7);
  assert.equal(state.y, 12);
  assert.equal(state.health, 10);
  assert.equal(state.flags.jellyfishShield, false);
  assert.match(game.getDialog().msg, /Voltei à Praia do Começo/);
  assert.equal(JSON.parse(game.getSavedProgress()).state.zone, 0, 'the reset state should be persisted');
});

test('random ticket box differs across new adventures and survives saving and resuming', () => {
  const leftStorage = new Map();
  const leftGame = createGame({ storage: leftStorage, random: 0.1 });
  leftGame.startNewGame();
  const leftBox = leftGame.getState().flags.museumTicketBox;
  assert.equal(leftBox, 'box-left');

  leftGame.setState({ zone: 5, flags: { guardsSolved: true } });
  leftGame.saveProgress();
  leftGame.continueGame();
  assert.equal(leftGame.isStartScreenVisible(), false);
  assert.equal(leftGame.getState().zone, 5);
  assert.equal(leftGame.getState().flags.museumTicketBox, leftBox, `resuming should preserve the original random choice (stored ${JSON.parse(leftGame.getSavedProgress()).state.flags.museumTicketBox})`);

  const rightGame = createGame({ random: 0.9 });
  rightGame.startNewGame();
  assert.equal(rightGame.getState().flags.museumTicketBox, 'box-right');
  assert.notEqual(rightGame.getState().flags.museumTicketBox, leftBox, 'a new adventure should be able to choose the other box');
});

test('music can be toggled on and starts only one copy of the active track', () => {
  const game = createGame();
  game.startNewGame();

  game.toggleMusic();
  assert.equal(game.getMusicState().enabled, true);
  assert.equal(game.getMusicState().playCount, 1, 'enabling music should only start one playback');

  game.toggleMusic();
  assert.equal(game.getMusicState().enabled, false);
  assert.equal(game.getMusicState().playCount, 1, 'disabling music should not restart playback');
});

test('the brother follows a navigable route around trees without entering blocked tiles', () => {
  const game = createGame();
  game.startNewGame();
  game.setState({ zone: 0, x: 13.5, y: 10.5, brother: { x: 8.5, y: 9.5 } });
  assert.equal(game.isBlocked(10.5, 10.5), true, 'the tree should be a blocked tile');

  const initialDistance = Math.hypot(game.getState().x - game.getState().brother.x, game.getState().y - game.getState().brother.y);
  let minimumDistance = initialDistance;
  for (let frame = 0; frame < 1200; frame++) {
    game.stepBrother(0.04);
    const state = game.getState();
    assert.equal(game.isBlocked(state.brother.x, state.brother.y), false, 'the brother must never step into a blocked tile');
    minimumDistance = Math.min(minimumDistance, Math.hypot(state.x - state.brother.x, state.y - state.brother.y));
  }
  const finalState = game.getState();
  assert.ok(minimumDistance < 1.25, `the brother should follow the player around the obstacle (distance ${minimumDistance.toFixed(2)}, position ${finalState.brother.x.toFixed(2)},${finalState.brother.y.toFixed(2)})`);
});

test('the brother reminds Alfredo of the current objective in story order and only when close enough', () => {
  const game = createGame();
  game.startNewGame();
  game.setState({ zone: 0, x: 5, y: 12, brother: { x: 8, y: 12 } });

  game.interact();
  assert.match(game.getDialog().msg, /Não há ninguém ou nada por perto/);
  game.next();

  game.setState({ brother: { x: 5.7, y: 12 } });
  game.interact();
  assert.equal(game.getDialog().who, 'Irmãozinho');
  assert.equal(game.getDialog().msg, 'Olha, ali, uma mensagem na garrafa. Vamos ver o que diz!');
  assert.equal(game.getState().face, 2, 'Alfredo should turn towards his brother');
  game.next();

  game.setState({ flags: { bottle: true } });
  game.interact();
  assert.equal(game.getDialog().msg, 'Vamos procurar o mapa para sabermos para onde ir.');
  game.next();

  game.setState({ flags: { map: true } });
  game.interact();
  assert.match(game.getDialog().msg, /cinco peças para construir a jangada/);
  assert.match(game.getDialog().msg, /pedras e às árvores da ilha/);
  game.next();

  game.setState({ items: ['raft-piece-shore-a', 'raft-piece-shore-b', 'raft-piece-shore-c', 'raft-piece-palm-north', 'raft-piece-palm-south'] });
  game.interact();
  assert.match(game.getDialog().msg, /Já temos as cinco peças/);
  game.next();

  game.setState({ zone: 1, x: 4, y: 13, brother: { x: 4.7, y: 13 } });
  game.interact();
  assert.equal(game.getDialog().who, 'Irmãozinho');
  assert.match(game.getDialog().msg, /escudo e atravessa o labirinto das medusas/);
  game.next();

  game.setState({ zone: 2, x: 4, y: 13, brother: { x: 4.7, y: 13 } });
  game.interact();
  assert.match(game.getDialog().msg, /cristais nas rochas e engrenagens nas algas/);
});

test('the fishing bait requires the tuna, mouse, thread, and yarn after meeting Tiozao', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();
  game.setState({ zone: 3, x: 4, y: 13 });

  for (const id of ['bait-tuna', 'bait-mouse', 'bait-thread', 'bait-yarn']) {
    assert.equal(game.getActors().find(actor => actor.id === id).visible, false, 'bait ingredients should appear after meeting Tiozao');
  }
  run.interactAt('tiozao');
  run.dismissMessage();

  for (const id of ['bait-tuna', 'bait-mouse', 'bait-thread', 'bait-yarn']) {
    assert.equal(game.getActors().find(actor => actor.id === id).visible, true);
  }
  run.interactAt('tiozao');
  assert.match(game.getDialog().msg, /atum, um rato, um fio e um novelo/);
  assert.deepEqual([...game.getDialog().choices], []);
  run.dismissMessage();

  for (const id of ['bait-tuna', 'bait-mouse', 'bait-thread']) {
    run.interactAt(id);
    run.dismissMessage();
  }
  run.interactAt('tiozao');
  assert.match(game.getDialog().msg, /3\/4/);
  assert.deepEqual([...game.getDialog().choices], []);
  run.dismissMessage();

  run.interactAt('bait-yarn');
  run.dismissMessage();
  run.interactAt('tiozao');
  assert.deepEqual([...game.getDialog().choices], ['Construir redes e isco', 'Ainda não']);
  run.choose('Construir redes e isco');
  assert.equal(game.getState().flags.lureBuilt, true);
  assert.equal(game.getActors().find(actor => actor.id === 'fish-white').visible, true);
});

test('the sound storm path only opens after the Musical Medusa receives the music box', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();
  game.setState({ zone: 2, x: 30, y: 13 });

  run.interactAt('sound-storm');
  assert.match(game.getDialog().msg, /tempestade musical ainda bloqueia/);
  run.dismissMessage();

  game.setState({ flags: { musicDelivered: true } });
  run.interactAt('sound-storm');
  assert.deepEqual([...game.getDialog().choices], ['Seguir o caminho']);
  run.choose('Seguir o caminho');
  assert.equal(game.getState().zone, 3);
});

test('an NPC trembles while speaking and stops when the dialogue closes', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();
  game.setState({ zone: 3, x: 13, y: 11 });

  run.interactAt('tiozao');
  assert.equal(game.getSpeakingNpc(), 'tiozao');
  run.dismissMessage();
  assert.equal(game.getSpeakingNpc(), '');
});

test('hearts animate when Tiozao and Sardanisca agree to care for the cats together', () => {
  const game = createGame();
  const run = createRunner(game);
  game.startNewGame();
  game.setState({ zone: 4, x: 13, y: 13 });

  run.interactAt('tiozao-cave');
  run.choose('Propor que cuidem deles juntos');
  assert.equal(game.getState().flags.clinicResolved, true);
  assert.ok(game.getClinicHeartAnimation() > 0);
  assert.match(game.getDialog().msg, /cuidar deles juntos/);
});
