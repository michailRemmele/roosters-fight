const COLLISION_ENTER_MSG = 'COLLISION_ENTER';
const ADD_EFFECT_MSG = 'ADD_EFFECT';

const PLATFORM_SIZE_NAME = 'platformSize';

const TRANSFORM_COMPONENT_NAME = 'transform';
const COLLIDER_COMPONENT_NAME = 'colliderContainer';
const RIGID_BODY_COMPONENT_NAME = 'rigidBody';
const RENDERABLE_COMPONENT_NAME = 'renderable';
const WEAPON_COMPONENT_NAME = 'weapon';

const SPACE_SORTING_LAYER = 'space';

const FALL_EFFECT = {
  name: 'fall',
  effect: 'damage',
  effectType: 'periodical',
  applicatorOptions: {
    frequency: 200,
  },
  effectOptions: {
    value: 25,
  },
};
const FETTER_EFFECT = {
  name: 'fallFetter',
  effect: 'fetter',
  effectType: 'continuous',
};

export class FallSystem {
  constructor(options) {
    this._gameObjectObserver = options.createGameObjectObserver({
      components: [
        TRANSFORM_COMPONENT_NAME,
        COLLIDER_COMPONENT_NAME,
        RIGID_BODY_COMPONENT_NAME,
        RENDERABLE_COMPONENT_NAME,
        WEAPON_COMPONENT_NAME,
      ],
    });
    this._store = options.store;
    this.messageBus = options.messageBus;

    this._fallingGameObjectsMap = {};
    this._fallingGameObjects = [];
  }

  mount() {
    this._gameObjectObserver.subscribe('onremove', this._handleEntitiyRemove);
  }

  unmount() {
    this._gameObjectObserver.unsubscribe('onremove', this._handleEntitiyRemove);
  }

  _handleEntitiyRemove = (gameObject) => {
    const gameObjectId = gameObject.getId();

    if (this._fallingGameObjectsMap[gameObjectId]) {
      this._fallingGameObjects = this._fallingGameObjects.filter((gameObject) => {
        return gameObject.getId() !== gameObjectId;
      });
    }

    this._fallingGameObjectsMap[gameObjectId] = null;
  }

  _isFalling(gameObject) {
    const { minX, maxX, minY, maxY } = this._store.get(PLATFORM_SIZE_NAME);
    const { offsetX, offsetY } = gameObject.getComponent(TRANSFORM_COMPONENT_NAME);
    const { collider } = gameObject.getComponent(COLLIDER_COMPONENT_NAME);
    const { centerX, centerY, sizeX, sizeY } = collider;

    const colliderX = offsetX + centerX;
    const colliderY = offsetY + centerY;

    const x0 = colliderX - (sizeX / 2);
    const x1 = colliderX + (sizeX / 2);
    const y0 = colliderY - (sizeY / 2);
    const y1 = colliderY + (sizeY / 2);

    return x1 < minX || x0 > maxX || y1 < minY || y0 > maxY;
  }

  update() {
    this._gameObjectObserver.fireEvents();

    this._fallingGameObjects = this._fallingGameObjects.filter((gameObject) => {
      const collisionMessages = this.messageBus.getById(COLLISION_ENTER_MSG, gameObject.getId()) || [];
      return collisionMessages.every((message) => {
        const { gameObject2 } = message;
        const rigidBody = gameObject2.getComponent(RIGID_BODY_COMPONENT_NAME);

        if (rigidBody) {
          const renderable = gameObject.getComponent(RENDERABLE_COMPONENT_NAME);
          renderable.sortingLayer = SPACE_SORTING_LAYER;
          return false;
        }
        return true;
      });
    });

    this._gameObjectObserver.forEach((gameObject) => {
      const gameObjectId = gameObject.getId();
      const rigidBody = gameObject.getComponent(RIGID_BODY_COMPONENT_NAME);

      if (!this._fallingGameObjectsMap[gameObjectId] && this._isFalling(gameObject)) {
        rigidBody.useGravity = true;
        rigidBody.ghost = true;

        this.messageBus.send({
          type: ADD_EFFECT_MSG,
          id: gameObject.getId(),
          gameObject,
          ...FALL_EFFECT,
        });
        this.messageBus.send({
          type: ADD_EFFECT_MSG,
          id: gameObject.getId(),
          gameObject,
          ...FETTER_EFFECT,
        });

        this._fallingGameObjectsMap[gameObjectId] = true;
        this._fallingGameObjects.push(gameObject);
      }
    });
  }
}
