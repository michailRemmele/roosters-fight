import AIProcessorPlugin from './aiProcessorPlugin/aiProcessorPlugin';
import DamageProcessorPlugin from './damageProcessorPlugin/damageProcessorPlugin';
import EffectsProcessorPlugin from './effectsProcessorPlugin/effectsProcessorPlugin';
import EnemiesDetectorPlugin from './enemiesDetectorPlugin/enemiesDetectorPlugin';
import FallProcessorPlugin from './fallProcessorPlugin/fallProcessorPlugin';
import GameOverProcessorPlugin from './gameOverProcessorPlugin/gameOverProcessorPlugin';
import MovementProcessorPlugin from './movementProcessorPlugin/movementProcessorPlugin';
import PlatformDestroyerPlugin from './platformDestroyerPlugin/platformDestroyerPlugin';
import PlatformObserverPlugin from './platformObserverPlugin/platformObserverPlugin';
import PlatformSizeMeterPlugin from './platformSizeMeterPlugin/platformSizeMeterPlugin';
import ShootingProcessorPlugin from './shootingProcessorPlugin/shootingProcessorPlugin';
import ReaperPlugin from './reaperPlugin/reaperPlugin';

export default {
  aiProcessor: AIProcessorPlugin,
  damageProcessor: DamageProcessorPlugin,
  effectsProcessor: EffectsProcessorPlugin,
  enemiesDetector: EnemiesDetectorPlugin,
  fallProcessor: FallProcessorPlugin,
  gameOverProcessor: GameOverProcessorPlugin,
  movementProcessor: MovementProcessorPlugin,
  platformDestroyer: PlatformDestroyerPlugin,
  platformObserver: PlatformObserverPlugin,
  platformSizeMeter: PlatformSizeMeterPlugin,
  shootingProcessor: ShootingProcessorPlugin,
  reaper: ReaperPlugin,
};
