import {
  Engine,
  contribSystems,
  contribComponents,
} from 'remiz';

import config from 'resources/config.json';
import { systems as gameSystems } from './game/systems';
import { components as gameComponents } from './game/components';
import helpers from './helpers';

const options = {
  config,
  systems: {
    ...contribSystems,
    ...gameSystems,
  },
  components: {
    ...contribComponents,
    ...gameComponents,
  },
  helpers: {
    ...helpers,
  },
};

const engine = new Engine(options);
engine.start();

console.log('Hello! You can contact the author via email: mikhail.remmele@gmail.com');
