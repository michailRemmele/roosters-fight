const WEAPON_COMPONENT_NAME = 'weapon';
const PLAYERS_ENEMIES_NAME = 'playersEnemies';

export class EnemiesDetector {
  constructor(options) {
    this._gameObjectObserver = options.createGameObjectObserver({
      type: 'unit',
      components: [
        WEAPON_COMPONENT_NAME,
      ],
    });
    this._store = options.store;

    this._playersCount = 0;
  }

  _scan() {
    this._playersCount = this._gameObjectObserver.size();

    const playersEnemies = {};

    for (let i = 0; i < this._playersCount; i++) {
      const playerId = this._gameObjectObserver.getByIndex(i).getId();
      playersEnemies[playerId] = [];

      for (let j = 0; j < this._playersCount; j++) {
        if (i !== j) {
          playersEnemies[playerId].push(this._gameObjectObserver.getByIndex(j));
        }
      }
    }

    this._store.set(PLAYERS_ENEMIES_NAME, playersEnemies);
  }

  mount() {
    this._scan();
  }

  update() {
    if (this._playersCount !== this._gameObjectObserver.size()) {
      this._scan();
    }
  }
}
