import { VectorOps, MathOps } from 'remiz';

const DAMAGE_MSG = 'DAMAGE';
const COLLISION_ENTER_MSG = 'COLLISION_ENTER';
const SHOT_MSG = 'SHOT';
const ADD_IMPULSE_MSG = 'ADD_IMPULSE';
const ADD_EFFECT_MSG = 'ADD_EFFECT';

const TRANSFORM_COMPONENT_NAME = 'transform';
const WEAPON_COMPONENT_NAME = 'weapon';
const HEALTH_COMPONENT_NAME = 'health';
const HITBOX_COMPONENT_NAME = 'hitBox';

const LIFETIME_EFFECT = {
  name: 'lifetime',
  effect: 'damage',
  effectType: 'delayed',
  applicatorOptions: {
    timer: 800,
  },
};

const FETTER_EFFECT = {
  name: 'weaponFetter',
  effect: 'fetter',
  effectType: 'timeLimited',
};

export class ShootingSystem {
  constructor(options) {
    this._gameObjectObserver = options.createGameObjectObserver({
      components: [
        WEAPON_COMPONENT_NAME,
      ],
    });
    this.messageBus = options.messageBus;
    this._gameObjectSpawner = options.gameObjectSpawner;

    this._firedBullets = [];
  }

  _pushTarget(target, directionVector, messageBus) {
    messageBus.send({
      type: ADD_IMPULSE_MSG,
      value: directionVector,
      gameObject: target,
      id: target.getId(),
    });
  }

  _processFiredBullets(messageBus) {
    this._firedBullets = this._firedBullets.filter((entry) => {
      const { shooter, bullet, directionVector, damage, fetterDuration } = entry;
      const bulletId = bullet.getId();

      const collisionMessages = messageBus.getById(COLLISION_ENTER_MSG, bulletId) || [];
      return collisionMessages.every((message) => {
        const { gameObject2 } = message;

        const hitBox = gameObject2.getComponent(HITBOX_COMPONENT_NAME);
        const target = gameObject2.parent;

        if (!hitBox || !target) {
          return true;
        }

        const targetId = target.getId();

        if (shooter.getId() === targetId || bulletId === targetId) {
          return true;
        }

        const bulletHealth = bullet.getComponent(HEALTH_COMPONENT_NAME);

        messageBus.send({
          type: DAMAGE_MSG,
          id: bulletId,
          gameObject: bullet,
          value: bulletHealth.points,
        });
        messageBus.send({
          type: DAMAGE_MSG,
          id: targetId,
          gameObject: target,
          value: damage,
        });
        messageBus.send({
          type: ADD_EFFECT_MSG,
          id: targetId,
          gameObject: target,
          ...FETTER_EFFECT,
          applicatorOptions: {
            duration: fetterDuration,
          },
        });

        this._pushTarget(target, directionVector, messageBus);

        return false;
      });
    });
  }

  _processWeaponsCooldown(deltaTime) {
    this._gameObjectObserver.forEach((gameObject) => {
      const weapon = gameObject.getComponent(WEAPON_COMPONENT_NAME);

      if (weapon.cooldownRemaining > 0) {
        weapon.cooldownRemaining -= deltaTime;
      }
    });
  }

  _fire(shooter, targetX, targetY, messageBus) {
    const { offsetX, offsetY } = shooter.getComponent(TRANSFORM_COMPONENT_NAME);
    const weapon = shooter.getComponent(WEAPON_COMPONENT_NAME);

    if (weapon.cooldownRemaining > 0) {
      messageBus.deleteById(SHOT_MSG, shooter.getId());
      return;
    }

    const bullet = this._gameObjectSpawner.spawn(weapon.bullet);
    const bulletTransform = bullet.getComponent(TRANSFORM_COMPONENT_NAME);
    const bulletHealth = bullet.getComponent(HEALTH_COMPONENT_NAME);

    bulletTransform.offsetX = offsetX;
    bulletTransform.offsetY = offsetY;

    const angle = MathOps.getAngleBetweenTwoPoints(targetX, offsetX, targetY, offsetY);

    bulletTransform.rotation = MathOps.radToDeg(angle);

    const directionVector = VectorOps.getVectorByAngle(angle);

    directionVector.multiplyNumber(weapon.speed);

    const flightTime = 1000 * weapon.range / weapon.speed;

    messageBus.send({
      type: ADD_IMPULSE_MSG,
      value: directionVector,
      gameObject: bullet,
      id: bullet.getId(),
    });

    messageBus.send({
      type: ADD_EFFECT_MSG,
      id: bullet.getId(),
      gameObject: bullet,
      ...LIFETIME_EFFECT,
      applicatorOptions: {
        timer: flightTime,
      },
      effectOptions: {
        value: bulletHealth.points,
      },
    });

    this._firedBullets.push({
      shooter: shooter,
      bullet: bullet,
      directionVector: directionVector.clone(),
      damage: weapon.damage,
      fetterDuration: weapon.fetterDuration,
    });

    weapon.cooldownRemaining = weapon.cooldown;
  }

  update(options) {
    const { deltaTime } = options;

    this._processFiredBullets(this.messageBus);
    this._processWeaponsCooldown(deltaTime);

    const messages = this.messageBus.get(SHOT_MSG) || [];
    messages.forEach((message) => {
      const { gameObject, x, y } = message;
      this._fire(gameObject, x, y, this.messageBus);
    });
  }
}
