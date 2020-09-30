import { ProcessorPlugin } from 'flyer-engine';

import FallProcessor from 'game/processors/fallProcessor/fallProcessor';

class FallProcessorPlugin extends ProcessorPlugin {
  async load(options) {
    return new FallProcessor({
      gameObjectObserver: options.gameObjectObserver,
      store: options.store,
    });
  }
}

export default FallProcessorPlugin;
