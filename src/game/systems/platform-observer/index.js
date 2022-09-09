const COLLIDER_COMPONENT_NAME = 'colliderContainer';
const TRANSFORM_COMPONENT_NAME = 'transform';
const RIGID_BODY_COMPONENT_NAME = 'rigidBody';

const PLATFORM_CHANGE_MSG = 'PLATFORM_CHANGE';

const PLATFORM_STORE_KEY = 'platform';

export class PlatformObserver {
  constructor(options) {
    this._gameObjectObserver = options.createGameObjectObserver({
      type: 'terrain',
      components: [
        RIGID_BODY_COMPONENT_NAME,
      ],
    });
    this._store = options.store;
    this.messageBus = options.messageBus;

    this._blocksCount = 0;
  }

  _sortPlatforms() {
    this._gameObjectObserver.sort((a, b) => {
      const aTransform = a.getComponent(TRANSFORM_COMPONENT_NAME);
      const bTransform = b.getComponent(TRANSFORM_COMPONENT_NAME);

      if (aTransform.offsetY > bTransform.offsetY) {
        return 1;
      }

      if (aTransform.offsetY < bTransform.offsetY) {
        return -1;
      }

      if (aTransform.offsetX > bTransform.offsetX) {
        return 1;
      }

      if (aTransform.offsetX < bTransform.offsetX) {
        return -1;
      }

      return 0;
    });
  }

  _updatePlatform() {
    if (!this._gameObjectObserver.size() || this._blocksCount === this._gameObjectObserver.size()) {
      return false;
    }

    this._blocksCount = this._gameObjectObserver.size();

    const platform = [];

    this._sortPlatforms();

    let rowIndex = 0;
    let lastOffsetY;

    for (let i = 0; i < this._blocksCount; i++) {
      const block = this._gameObjectObserver.getByIndex(i);
      const { offsetY } = block.getComponent(TRANSFORM_COMPONENT_NAME);
      const { collider: { centerY }} = block.getComponent(COLLIDER_COMPONENT_NAME);
      const currentOffsetY = offsetY + centerY;

      if (lastOffsetY && currentOffsetY !== lastOffsetY) {
        rowIndex += 1;
      }

      platform[rowIndex] = platform[rowIndex] || [];
      platform[rowIndex].push(block);
      lastOffsetY = currentOffsetY;
    }

    this._store.set(PLATFORM_STORE_KEY, platform);

    return true;
  }

  mount() {
    this._updatePlatform();
  }

  update() {
    if (this._updatePlatform()) {
      this.messageBus.send({
        type: PLATFORM_CHANGE_MSG,
      });
    }
  }
}
