import { ProcessorPlugin } from 'flyer-engine';

import DamageProcessor from 'game/processors/damageProcessor/damageProcessor';

class DamageProcessorPlugin extends ProcessorPlugin {
  async load() {
    return new DamageProcessor();
  }
}

export default DamageProcessorPlugin;
