import effectApplicators from './effectApplicators';
import effects from './effects';

const ADD_EFFECT_MSG = 'ADD_EFFECT';
const REMOVE_EFFECT_MSG = 'REMOVE_EFFECT';

export class EffectsSystem {
  constructor(options) {
    this._gameObjectObserver = options.createGameObjectObserver({});
    this.messageBus = options.messageBus;

    this._activeEffectsMap = {};
    this._activeEffects = [];
  }

  mount() {
    this._gameObjectObserver.subscribe('onremove', this._handleEntitiyRemove);
  }

  unmount() {
    this._gameObjectObserver.unsubscribe('onremove', this._handleEntitiyRemove);
  }

  _removeEffect(name, gameObjectId) {
    if (!this._activeEffectsMap[gameObjectId] || !this._activeEffectsMap[gameObjectId][name]) {
      return;
    }

    this._activeEffectsMap[gameObjectId][name].cancel();
    this._activeEffectsMap[gameObjectId][name] = null;

    this._activeEffects = this._activeEffects.filter((entry) => {
      return entry.name !== name || entry.gameObjectId !== gameObjectId;
    });
  }

  _processNewEffects(messageBus) {
    const newEffects = messageBus.get(ADD_EFFECT_MSG) || [];
    newEffects.forEach((message) => {
      const {
        name,
        effectType,
        effect: effectName,
        applicatorOptions,
        effectOptions,
        gameObject,
      } = message;

      const gameObjectId = gameObject.getId();

      const effect = new effects[effectName](gameObject, messageBus, effectOptions);
      const effectApplicator = new effectApplicators[effectType](effect, applicatorOptions);

      this._activeEffectsMap[gameObjectId] = this._activeEffectsMap[gameObjectId] || {};

      this._removeEffect(name, gameObjectId);

      this._activeEffectsMap[gameObjectId][name] = effectApplicator;
      this._activeEffects.push({
        name: name,
        gameObjectId: gameObjectId,
        effectApplicator: effectApplicator,
      });
    });
  }

  _processEffectsCancellation(messageBus) {
    const cancelledEffects = messageBus.get(REMOVE_EFFECT_MSG) || [];
    cancelledEffects.forEach((message) => {
      const { name, gameObject } = message;
      this._removeEffect(name, gameObject.getId());
    });
  }

  _handleEntitiyRemove = (gameObject) => {
    const gameObjectId = gameObject.getId();

    const activeEffectNames = Object.keys(this._activeEffectsMap[gameObjectId] || {});
    activeEffectNames.forEach((name) => {
      this._removeEffect(name, gameObjectId);
    });
  }

  update(options) {
    const deltaTime = options.deltaTime;

    this._gameObjectObserver.fireEvents();

    this._processNewEffects(this.messageBus);
    this._processEffectsCancellation(this.messageBus);

    this._activeEffects = this._activeEffects.filter((entry) => {
      const { name, gameObjectId, effectApplicator } = entry;

      effectApplicator.update(deltaTime);

      if (effectApplicator.isFinished()) {
        this._activeEffectsMap[gameObjectId][name].cancel();
        this._activeEffectsMap[gameObjectId][name] = null;

        return false;
      }

      return true;
    });
  }
}
