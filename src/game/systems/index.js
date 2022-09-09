import { AISystem } from './ai-system';
import { DamageSystem } from './damage-system';
import { EffectsSystem } from './effects-system';
import { EnemiesDetector } from './enemies-detector';
import { FallSystem } from './fall-system';
import { GameOverSystem } from './game-over-system';
import { MovementSystem } from './movement-system';
import { PlatformDestroyer } from './platform-destroyer';
import { PlatformObserver } from './platform-observer';
import { PlatformSizeMeter } from './platform-size-meter';
import { Reaper } from './reaper';
import { ShootingSystem } from './shooting-system';

export const systems = {
  aiSystem: AISystem,
  damageSystem: DamageSystem,
  effectsSystem: EffectsSystem,
  enemiesDetector: EnemiesDetector,
  fallSystem: FallSystem,
  gameOverSystem: GameOverSystem,
  movementSystem: MovementSystem,
  platformDestroyer: PlatformDestroyer,
  platformObserver: PlatformObserver,
  platformSizeMeter: PlatformSizeMeter,
  reaper: Reaper,
  shootingSystem: ShootingSystem,
};
