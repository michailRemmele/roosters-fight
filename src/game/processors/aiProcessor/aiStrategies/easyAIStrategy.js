import { MathOps } from 'flyer-engine';

import AIStrategy from './aiStrategy';

const SHOT_MSG = 'SHOT';
const MOVEMENT_MSG = 'MOVEMENT';

const PLATFORM_SIZE_NAME = 'platformSize';
const PLAYERS_ENEMIES_NAME = 'playersEnemies';

const TRANSFORM_COMPONENT_NAME = 'transform';
const WEAPON_COMPONENT_NAME = 'weapon';
const COLLIDER_COMPONENT_NAME = 'colliderContainer';

const COOLDOWN = 1000;
const WAYPOINT_ERROR = 1;
const MELEE_RADIUS = 50;
const RETREAT_DISTANCE = 100;
const CLOSE_TO_FALL_DISTANCE = 50;

class EasyAIStrategy extends AIStrategy{
  constructor(player, store) {
    super();

    this._player = player;
    this._store = store;

    this._playerId = this._player.getId();
    this._cooldown = MathOps.random(0, COOLDOWN);
    this._distances = [];
    this._meleeEnemies = [];
    this._waypoint = null;
    this._enemy = null;
  }

  _getMovementBoundaries() {
    const { collider } = this._player.getComponent(COLLIDER_COMPONENT_NAME);
    const { centerX, centerY } = collider;
    const { minX, maxX, minY, maxY } = this._store.get(PLATFORM_SIZE_NAME);

    return {
      minX: minX - centerX,
      maxX: maxX - centerX,
      minY: minY - centerY,
      maxY: maxY - centerY,
    };
  }

  _updateDistances() {
    const playerEnemies = this._store.get(PLAYERS_ENEMIES_NAME)[this._playerId];

    this._distances = playerEnemies.map((enemy) => {
      const { offsetX, offsetY } = this._player.getComponent(TRANSFORM_COMPONENT_NAME);
      const { offsetX: enemyX, offsetY: enemyY } = enemy.getComponent(TRANSFORM_COMPONENT_NAME);

      return {
        distance: MathOps.getDistanceBetweenTwoPoints(enemyX, offsetX, enemyY, offsetY),
        enemy,
      };
    });
  }

  _updateMeleeEnemies() {
    this._meleeEnemies = this._distances.filter((item) => item.distance <= MELEE_RADIUS);
  }

  _findCloseToFallEnemies() {
    const { minX, maxX, minY, maxY } = this._getMovementBoundaries();
    const { range: weaponRange } = this._player.getComponent(WEAPON_COMPONENT_NAME);

    return this._distances.reduce((list, item) => {
      const { distance, enemy } = item;
      const transform = enemy.getComponent(TRANSFORM_COMPONENT_NAME);
      const { collider } = enemy.getComponent(COLLIDER_COMPONENT_NAME);
      const enemyX = transform.offsetX - collider.centerX;
      const enemyY = transform.offsetY - collider.centerY;

      const isCloseToFall = enemyX - minX <= CLOSE_TO_FALL_DISTANCE ||
      maxX - enemyX <= CLOSE_TO_FALL_DISTANCE ||
      enemyY - minY <= CLOSE_TO_FALL_DISTANCE ||
      maxY - enemyY <= CLOSE_TO_FALL_DISTANCE;

      if (isCloseToFall && distance <= weaponRange) {
        list.push(enemy);
      }

      return list;
    }, []);
  }

  _updateTargetEnemy() {
    const playerEnemies = this._store.get(PLAYERS_ENEMIES_NAME)[this._playerId];

    if (!playerEnemies.length) {
      this._enemy = null;
      return;
    }

    if (this._meleeEnemies.length) {
      this._enemy = this._meleeEnemies[MathOps.random(0, this._meleeEnemies.length - 1)].enemy;
    }

    const closeToFallEnemies = this._findCloseToFallEnemies();

    if (closeToFallEnemies.length) {
      this._enemy = closeToFallEnemies[MathOps.random(0, closeToFallEnemies.length - 1)];
    } else {
      this._enemy = playerEnemies[MathOps.random(0, playerEnemies.length - 1)];
    }
  }

  _findWayToRetreat() {
    let moveDirection;

    const { minX, maxX, minY, maxY } = this._getMovementBoundaries();
    const { offsetX, offsetY } = this._player.getComponent(TRANSFORM_COMPONENT_NAME);

    if (!this._meleeEnemies.length) {
      return;
    }

    const directedEnemies = this._meleeEnemies.map((item) => {
      const { enemy, distance } = item;
      const { offsetX: enemyX, offsetY: enemyY } = enemy.getComponent(TRANSFORM_COMPONENT_NAME);

      return {
        enemy,
        distance,
        direction: MathOps.radToDeg(
          MathOps.getAngleBetweenTwoPoints(offsetX, enemyX, offsetY, enemyY)
        ),
      };
    });

    if (directedEnemies.length === 1) {
      moveDirection = (directedEnemies[0].direction + 180) % 360;
    } else {
      directedEnemies.sort((a, b) => {
        const { direction: aDirection } = a;
        const { direction: bDirection } = b;

        if (aDirection < bDirection) {
          return -1;
        }
        if (aDirection > bDirection) {
          return 1;
        }
        return 0;
      });

      let gates;
      for (let i = 0; i < directedEnemies.length; i++) {
        const left = directedEnemies[i].direction;
        const right = (i + 1 !== directedEnemies.length)
          ? directedEnemies[i + 1].direction
          : directedEnemies[0].direction + 360;
        const width = right - left;

        if (!gates || (width > gates.width)) {
          gates = {
            left,
            right,
            width,
          };
        }
      }
      const { left, width } = gates;
      moveDirection = (left + (width / 2)) % 360;
    }

    const waypoint = MathOps.getLinePoint(moveDirection, offsetX, offsetY, RETREAT_DISTANCE);

    if (waypoint.x > minX && waypoint.x < maxX && waypoint.y > minY && waypoint.y < maxY) {
      return waypoint;
    }
  }

  _updateWaypoint() {
    const { minX, maxX, minY, maxY } = this._getMovementBoundaries();

    const waypoint = this._findWayToRetreat();

    this._waypoint = waypoint || { x: MathOps.random(minX, maxX), y: MathOps.random(minY, maxY) };
  }

  _attack(messageBus) {
    const weapon = this._player.getComponent(WEAPON_COMPONENT_NAME);

    if (weapon.cooldownRemaining > 0 || !this._enemy) {
      return;
    }

    const { offsetX: enemyX, offsetY: enemyY } = this._enemy.getComponent(TRANSFORM_COMPONENT_NAME);

    messageBus.send({
      gameObject: this._player,
      id: this._player.getId(),
      type: SHOT_MSG,
      x: enemyX,
      y: enemyY,
    });
  }

  _move(messageBus) {
    if (!this._waypoint) {
      return;
    }

    const { offsetX, offsetY } = this._player.getComponent(TRANSFORM_COMPONENT_NAME);
    const { x, y } = this._waypoint;

    if (Math.abs(x - offsetX) < WAYPOINT_ERROR && Math.abs(y - offsetY) < WAYPOINT_ERROR) {
      this._waypoint = null;
      return;
    }

    const movementAngle = MathOps.radToDeg(MathOps.getAngleBetweenTwoPoints(
      this._waypoint.x,
      offsetX,
      this._waypoint.y,
      offsetY
    ));

    messageBus.send({
      type: MOVEMENT_MSG,
      gameObject: this._player,
      id: this._player.getId(),
      directionAngle: movementAngle,
    });
  }

  update(messageBus, deltaTime) {
    this._cooldown -= deltaTime;

    if (this._cooldown <= 0) {
      this._updateDistances();
      this._updateMeleeEnemies();
      this._updateTargetEnemy();
      this._updateWaypoint();

      this._cooldown += COOLDOWN;
    }

    this._attack(messageBus);
    this._move(messageBus);
  }
}

export default EasyAIStrategy;
