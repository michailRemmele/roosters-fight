import { ProcessorPlugin } from 'flyer-engine';

import PlatformSizeMeter from 'game/processors/platformSizeMeter/platformSizeMeter';

class PlatformSizeMeterPlugin extends ProcessorPlugin {
  async load(options) {
    const {
      store,
    } = options;

    return new PlatformSizeMeter({
      store: store,
    });
  }
}

export default PlatformSizeMeterPlugin;
