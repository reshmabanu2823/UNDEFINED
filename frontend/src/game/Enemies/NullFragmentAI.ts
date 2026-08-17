import * as THREE from 'three';
import { EnemyState, EnemyConfig, DEFAULT_NULL_FRAGMENT_CONFIG } from './types';
import { useWorldStore } from '../../stores/worldStore';

export class NullFragmentAI {
  public state: EnemyState = 'IDLE';
  public config: EnemyConfig;
  public position: THREE.Vector3;
  public rotationY: number = 0;

  private stateTimer: number = 0;
  private lastAttackTime: number = 0;
  private spawnOrigin: THREE.Vector3;

  constructor(
    initialPosition: [number, number, number] = [0, 1.2, -6.5],
    config: EnemyConfig = DEFAULT_NULL_FRAGMENT_CONFIG
  ) {
    this.config = config;
    this.position = new THREE.Vector3(...initialPosition);
    this.spawnOrigin = this.position.clone();
  }

  public update(
    delta: number,
    playerPos: { x: number; y: number; z: number }
  ): {
    state: EnemyState;
    position: THREE.Vector3;
    rotationY: number;
    isAttacking: boolean;
    distanceToPlayer: number;
  } {
    this.stateTimer += delta;

    const playerVec = new THREE.Vector3(playerPos.x, 1.2, playerPos.z);
    const distanceToPlayer = this.position.distanceTo(playerVec);
    let isAttacking = false;

    // 1. STATE TRANSITIONS
    switch (this.state) {
      case 'IDLE': {
        // Check if player entered detection range
        if (distanceToPlayer <= this.config.detectDistance) {
          this.transitionTo('DETECT');
        }
        break;
      }

      case 'DETECT': {
        // Briefly lock on to player before chasing (~0.4s)
        if (this.stateTimer >= 0.4) {
          this.transitionTo('CHASE');
        }
        break;
      }

      case 'CHASE': {
        // If close enough, attack
        if (distanceToPlayer <= this.config.attackDistance) {
          this.transitionTo('ATTACK');
        } else if (distanceToPlayer > this.config.lostDistance) {
          this.transitionTo('LOST');
        }
        break;
      }

      case 'ATTACK': {
        // If player moved away, resume chase
        if (distanceToPlayer > this.config.attackDistance * 1.3) {
          this.transitionTo('CHASE');
        }
        break;
      }

      case 'LOST': {
        // Search in place for 1.5s then return to idle
        if (distanceToPlayer <= this.config.detectDistance) {
          this.transitionTo('DETECT');
        } else if (this.stateTimer >= 1.5) {
          this.transitionTo('IDLE');
        }
        break;
      }
    }

    // 2. STATE EXECUTION
    const dirToPlayer = new THREE.Vector3().subVectors(playerVec, this.position);
    dirToPlayer.y = 0; // Keep horizontal

    if (dirToPlayer.lengthSq() > 0.001) {
      this.rotationY = Math.atan2(dirToPlayer.x, dirToPlayer.z);
    }

    if (this.state === 'CHASE') {
      // Move towards player
      dirToPlayer.normalize();
      this.position.addScaledVector(dirToPlayer, this.config.speed * delta);

      // Environment collision bounding
      this.clampPosition();
    } else if (this.state === 'ATTACK') {
      // Execute attack if cooldown elapsed
      const now = performance.now();
      if (now - this.lastAttackTime >= this.config.attackCooldownMs) {
        this.lastAttackTime = now;
        isAttacking = true;
        useWorldStore.getState().damagePlayer(this.config.attackDamage);
      }
    }

    // Sync state to world store
    useWorldStore.getState().setEnemyState(this.state, Number(distanceToPlayer.toFixed(1)));

    return {
      state: this.state,
      position: this.position,
      rotationY: this.rotationY,
      isAttacking,
      distanceToPlayer,
    };
  }

  private transitionTo(newState: EnemyState) {
    this.state = newState;
    this.stateTimer = 0;
  }

  private clampPosition() {
    // Keep enemy inside sector bounds
    if (this.position.z > -2.0) {
      this.position.x = Math.max(-5.0, Math.min(5.0, this.position.x));
      this.position.z = Math.max(-2.0, Math.min(8.0, this.position.z));
    } else {
      this.position.x = Math.max(-1.5, Math.min(1.5, this.position.x));
      this.position.z = Math.max(-11.0, Math.min(-2.0, this.position.z));
    }
  }

  public reset(position?: [number, number, number]) {
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.lastAttackTime = 0;
    if (position) {
      this.position.set(...position);
    } else {
      this.position.copy(this.spawnOrigin);
    }
  }
}
