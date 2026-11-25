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

function createGame() {
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
  const localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  class Audio {
    pause() {}
    play() { return Promise.resolve(); }
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
    const actor = game.getActors().find(entry => entry.id === id && entry.visible);
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
