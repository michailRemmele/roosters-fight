const KILL_MSG = 'KILL';

const GRAVEYARD_CLEAN_FREQUENCY = 1000;

export class Reaper {
  constructor(options) {
    this._gameObjectDestroyer = options.gameObjectDestroyer;
    this.messageBus = options.messageBus;
    this._allowedComponents = options.allowedComponents.reduce((storage, componentName) => {
      storage[componentName] = true;
      return storage;
    }, {});
    this._lifetime = options.lifetime;

    this._graveyard = [];
    this._timeCounter = 0;
  }

  _filterGameObjectComponents(gameObject) {
    gameObject.getComponentNamesList().forEach((componentName) => {
      if (!this._allowedComponents[componentName]) {
        gameObject.removeComponent(componentName);
      }
    });

    gameObject.getChildren().forEach((child) => this._filterGameObjectComponents(child));
  }

  update(options) {
    const { deltaTime } = options;

    const damageMessages = this.messageBus.get(KILL_MSG) || [];
    damageMessages.forEach((message) => {
      const { gameObject } = message;

      this._filterGameObjectComponents(gameObject);

      this._graveyard.push({
        gameObject: gameObject,
        lifetime: this._lifetime,
      });
    });

    this._timeCounter += deltaTime;
    if (this._timeCounter >= GRAVEYARD_CLEAN_FREQUENCY) {
      this._graveyard = this._graveyard.filter((entry) => {
        entry.lifetime -= this._timeCounter;

        if (entry.lifetime <= 0) {
          this._gameObjectDestroyer.destroy(entry.gameObject);

          return false;
        }

        return true;
      });

      this._timeCounter = 0;
    }
  }
}
