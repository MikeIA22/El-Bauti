import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  LANES,
  BASE_SPEED,
  MAX_SPEED,
  ACCELERATION,
  JUMP_VELOCITY,
  SUPER_JUMP_VELOCITY,
  GRAVITY,
  SLIDE_DURATION,
  LaneIndex,
  PowerUpType,
  PowerUpState,
  GameStats,
} from './constants';
import { BautiCharacter, BautiAnimationState } from './character';
import { CalleLaurelStreet } from './street';
import { audioManager } from '../audio/AudioManager';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onPowerUpUpdate: (activePowerUps: PowerUpState[]) => void;
  onStateChange: (state: GameState) => void;
  onCoinCollected: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;

  private character: BautiCharacter;
  private street: CalleLaurelStreet;
  private callbacks: GameEngineCallbacks;

  // Game Loop & State
  private gameState: GameState = 'MENU';
  private frameId: number = 0;
  private lastTime: number = 0;
  private isSoftwareGl: boolean = false;

  // Player Physics & Kinematics
  private currentLane: LaneIndex = 1; // Center lane
  private targetX: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerZ: number = 0;
  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private currentSpeed: number = BASE_SPEED;
  private difficultyMultiplier: number = 1.0;

  // Active Power-ups
  private activePowerUps: Map<PowerUpType, PowerUpState> = new Map();

  // Night Sky (Moon & Stars)
  private moonGroup!: THREE.Group;
  private starPoints!: THREE.Points;

  // Particle System
  private particleGroup: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Stats
  private score: number = 0;
  private distance: number = 0;
  private coins: number = 0;
  private tapas: number = 0;
  private wineGlasses: number = 0;
  private highScore: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load high score
    const savedHighScore = localStorage.getItem('elbauti_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    // Software WebGL Detection (per Three.js Guidelines)
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0A0F1D'); // Saturday night tapas sky in Logroño
    this.scene.fog = new THREE.FogExp2('#0A0F1D', 0.012); // Atmospheric evening haze

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      140
    );

    // Studio Environment (per Three.js guidelines)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lighting Rig (Key Warm Street Light + Cool Fill + Moon Light)
    const keyLight = new THREE.DirectionalLight('#FEF3C7', 1.6);
    keyLight.position.set(6, 14, -8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight('#FEF08A', '#0A0F1D', 0.65);
    this.scene.add(hemiLight);

    // Night Sky Rig (Luminous Full Moon & Starfield)
    this.createNightSky();

    // Particle Group
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Initialize Calle Laurel Street & Bauti Character
    this.street = new CalleLaurelStreet(this.scene);
    this.character = new BautiCharacter();
    this.scene.add(this.character.group);

    // Initial Street Layout
    this.street.reset();

    // Setup Window Resize Handler
    window.addEventListener('resize', this.onResize);

    // Pre-warm renderer
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Start in MENU mode
    this.setMenuPose();
    this.startLoop();
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;

    // Mobile portrait mode: widen FOV so all 3 lanes and taverns fit comfortably
    if (aspect < 1.0) {
      this.camera.fov = 72;
    } else {
      this.camera.fov = 60;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private createNightSky() {
    // 1. Luminous Full Moon
    this.moonGroup = new THREE.Group();

    // Procedural lunar texture canvas
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 256;
    moonCanvas.height = 256;
    const mctx = moonCanvas.getContext('2d')!;

    // Silvery pearlescent base
    mctx.fillStyle = '#F8F6F0';
    mctx.fillRect(0, 0, 256, 256);

    // Lunar maria & crater textures
    const craters = [
      { x: 90, y: 80, r: 35, a: 0.16 },
      { x: 155, y: 110, r: 42, a: 0.20 },
      { x: 80, y: 160, r: 38, a: 0.18 },
      { x: 170, y: 175, r: 28, a: 0.14 },
      { x: 125, y: 135, r: 25, a: 0.22 },
      { x: 130, y: 65, r: 18, a: 0.14 },
    ];
    craters.forEach((c) => {
      const grad = mctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
      grad.addColorStop(0, `rgba(165, 175, 190, ${c.a})`);
      grad.addColorStop(1, 'rgba(248, 246, 240, 0)');
      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      mctx.fill();
    });

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.colorSpace = THREE.SRGBColorSpace;

    const moonGeom = new THREE.SphereGeometry(3.8, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      color: 0xFFFDF2,
    });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.moonGroup.add(moonMesh);

    // Moon Atmospheric Glow Halo
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gctx = glowCanvas.getContext('2d')!;
    const glowGrad = gctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    glowGrad.addColorStop(0, 'rgba(255, 250, 220, 0.75)');
    glowGrad.addColorStop(0.35, 'rgba(180, 215, 255, 0.25)');
    glowGrad.addColorStop(1, 'rgba(10, 15, 29, 0)');
    gctx.fillStyle = glowGrad;
    gctx.fillRect(0, 0, 128, 128);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), glowMat);
    glowMesh.position.z = -0.1;
    this.moonGroup.add(glowMesh);

    this.moonGroup.position.set(5, 26, 85);
    this.scene.add(this.moonGroup);

    // Soft silvery moonlight directional light
    const moonLight = new THREE.DirectionalLight('#DDE5FF', 0.6);
    moonLight.position.set(5, 28, 85);
    this.scene.add(moonLight);

    // 2. Twinkling Starfield across the night sky
    const starCount = 550;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 90;
      starPositions[i * 3 + 1] = 15 + Math.random() * 38;
      starPositions[i * 3 + 2] = (Math.random() - 0.2) * 140;

      const roll = Math.random();
      if (roll < 0.6) {
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      } else if (roll < 0.85) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.92;
        starColors[i * 3 + 2] = 0.75;
      } else {
        starColors[i * 3] = 0.78;
        starColors[i * 3 + 1] = 0.88;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.38,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.starPoints = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starPoints);
  }

  private setMenuPose() {
    this.gameState = 'MENU';
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.currentLane = 1;
    this.targetX = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.character.group.position.set(0, 0, 0);
    this.character.group.rotation.set(0, 0, 0);

    if (this.moonGroup) {
      this.moonGroup.position.set(4, 25, 75);
    }
    if (this.starPoints) {
      this.starPoints.position.set(0, 0, 0);
    }

    // Menu camera: slightly low-angle cinematic framing on Bauti with his thumbs up!
    this.camera.position.set(0, 1.4, -2.8);
    this.camera.lookAt(0, 1.15, 0);
  }

  public goToMenu() {
    this.gameState = 'MENU';
    this.callbacks.onStateChange('MENU');
    audioManager.stopMusic();
    this.street.reset();
    this.activePowerUps.clear();
    this.callbacks.onPowerUpUpdate([]);

    // Clear particles
    for (const p of this.particles) {
      this.particleGroup.remove(p.mesh);
    }
    this.particles = [];

    this.setMenuPose();
    this.callbacks.onStatsUpdate({
      score: 0,
      distance: 0,
      coins: this.coins,
      tapas: this.tapas,
      wineGlasses: this.wineGlasses,
      highScore: this.highScore,
      multiplier: 1,
    });
  }

  public setDifficulty(mode: 'easy' | 'normal' | 'hard') {
    if (mode === 'easy') this.difficultyMultiplier = 0.85;
    else if (mode === 'normal') this.difficultyMultiplier = 1.0;
    else if (mode === 'hard') this.difficultyMultiplier = 1.25;
  }

  public startGame() {
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');

    // Reset game variables
    this.currentLane = 1;
    this.targetX = LANES[this.currentLane];
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.velocityY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.currentSpeed = BASE_SPEED * this.difficultyMultiplier;
    this.activePowerUps.clear();
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.tapas = 0;
    this.wineGlasses = 0;

    this.street.reset();
    audioManager.startMusic();
    audioManager.playPowerup();
  }

  public pauseGame() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.callbacks.onStateChange('PAUSED');
      audioManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.callbacks.onStateChange('PLAYING');
      this.lastTime = performance.now();
      audioManager.startMusic();
    }
  }

  // --- Input Actions ---

  public moveLeft() {
    if (this.gameState !== 'PLAYING') return;
    if (this.currentLane > 0) {
      this.currentLane = (this.currentLane - 1) as LaneIndex;
      this.targetX = LANES[this.currentLane];
      audioManager.playLaneChange();
    }
  }

  public moveRight() {
    if (this.gameState !== 'PLAYING') return;
    if (this.currentLane < 2) {
      this.currentLane = (this.currentLane + 1) as LaneIndex;
      this.targetX = LANES[this.currentLane];
      audioManager.playLaneChange();
    }
  }

  public jump() {
    if (this.gameState !== 'PLAYING') return;
    if (this.isGrounded) {
      const hasSuperJump = this.activePowerUps.has('champi');
      this.velocityY = hasSuperJump ? SUPER_JUMP_VELOCITY : JUMP_VELOCITY;
      this.isGrounded = false;
      this.isSliding = false; // Cancel slide on jump
      audioManager.playJump();

      // Jump dust particle effect
      this.spawnDustPuff(this.playerX, 0, this.playerZ, 0x10B981);
    }
  }

  public slide() {
    if (this.gameState !== 'PLAYING') return;
    if (!this.isGrounded) {
      // Fast fall when pressing down in air
      this.velocityY = -22;
    }
    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    audioManager.playSlide();

    // Slide smoke / sparks
    this.spawnDustPuff(this.playerX, 0.1, this.playerZ, 0xF59E0B);
  }

  // --- Main Tick Loop ---

  private startLoop() {
    this.lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.update(delta);
      this.renderer.render(this.scene, this.camera);

      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private update(delta: number) {
    if (this.gameState === 'MENU') {
      // Gentle menu animation
      const animState: BautiAnimationState = {
        isRunning: false,
        isJumping: false,
        isSliding: false,
        isDead: false,
        speed: 0,
        laneOffset: 0,
        hasShield: false,
        hasSuperJump: false,
        hasMagnet: false,
      };
      this.character.update(delta, animState, 0);
      return;
    }

    if (this.gameState === 'PAUSED') return;

    if (this.gameState === 'GAMEOVER') {
      // Crash animation
      const animState: BautiAnimationState = {
        isRunning: false,
        isJumping: false,
        isSliding: false,
        isDead: true,
        speed: 0,
        laneOffset: 0,
        hasShield: false,
        hasSuperJump: false,
        hasMagnet: false,
      };
      this.character.update(delta, animState, 0);
      return;
    }

    // --- Active Playing Physics & Street Progression ---

    // 1. Advance Speed and Distance along Calle Laurel
    this.currentSpeed = Math.min(
      MAX_SPEED,
      (BASE_SPEED + (this.distance / 100) * ACCELERATION) * this.difficultyMultiplier
    );
    const forwardStep = this.currentSpeed * delta;
    this.playerZ += forwardStep;
    this.distance += forwardStep;

    // Multiplier calculation (base 1 + pincho powerup bonus)
    const multiplier = (this.activePowerUps.has('pincho') ? 2 : 1) * Math.floor(1 + this.distance / 250);
    this.score += Math.floor(forwardStep * 4 * multiplier);

    // 2. Lateral Movement (Lane Switching with smooth spring damping)
    const prevX = this.playerX;
    this.playerX = THREE.MathUtils.damp(this.playerX, this.targetX, 16, delta);
    const laneOffset = (this.playerX - prevX) / (delta * 12);

    // 3. Vertical Physics (Jumping & Gravity)
    if (!this.isGrounded) {
      this.playerY += this.velocityY * delta;
      this.velocityY -= GRAVITY * delta;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 5. Update Active Power-ups Countdown
    const powerUpsToNotify: PowerUpState[] = [];
    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.remainingTime -= delta;
      if (powerUp.remainingTime <= 0) {
        this.activePowerUps.delete(type);
      } else {
        powerUpsToNotify.push(powerUp);
      }
    });
    this.callbacks.onPowerUpUpdate(powerUpsToNotify);

    // 6. Update Bauti Character Position & Kinematics
    this.character.group.position.set(this.playerX, this.playerY, this.playerZ);

    const animState: BautiAnimationState = {
      isRunning: true,
      isJumping: !this.isGrounded,
      isSliding: this.isSliding,
      isDead: false,
      speed: this.currentSpeed,
      laneOffset: THREE.MathUtils.clamp(laneOffset, -1, 1),
      hasShield: this.activePowerUps.has('rioja'),
      hasSuperJump: this.activePowerUps.has('champi'),
      hasMagnet: this.activePowerUps.has('pincho'),
    };
    this.character.update(delta, animState, this.playerY);

    // 7. Update Third-Person Chase Camera behind Bauti
    // Smooth camera follow with dynamic mobile portrait framing
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const isPortrait = aspect < 1.0;
    const targetCamX = this.playerX * 0.45;
    const targetCamY = (isPortrait ? 2.85 : 2.4) + (this.playerY * 0.35);
    const targetCamZ = this.playerZ - (isPortrait ? 5.4 : 4.6);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 14, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 14, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 20, delta);

    // Look slightly ahead of Bauti down Calle Laurel
    this.camera.lookAt(this.playerX * 0.2, this.playerY * 0.5 + (isPortrait ? 1.35 : 1.2), this.playerZ + 8);

    // Night Sky (Moon and Starfield move along with player to remain high in the sky)
    if (this.moonGroup) {
      this.moonGroup.position.z = this.playerZ + 85;
      this.moonGroup.position.x = 5 + (this.playerX * 0.1);
    }
    if (this.starPoints) {
      this.starPoints.position.z = this.playerZ;
    }

    // 8. Update Street Generation & Collectibles
    this.street.update(
      this.playerZ,
      delta,
      this.activePowerUps.has('pincho'),
      this.playerX,
      this.playerY
    );

    // 9. Collision Checks (Obstacles & Collectibles)
    this.checkCollisions();

    // 10. Update Particles
    this.updateParticles(delta);

    // 11. Broadcast Stats
    this.callbacks.onStatsUpdate({
      score: this.score,
      distance: Math.floor(this.distance),
      coins: this.coins,
      tapas: this.tapas,
      wineGlasses: this.wineGlasses,
      highScore: Math.max(this.score, this.highScore),
      multiplier,
    });
  }

  // --- Collision Detection ---

  private checkCollisions() {
    const pBox = this.character.collisionBox;

    // Check Collectibles
    for (let i = 0; i < this.street.collectibles.length; i++) {
      const col = this.street.collectibles[i];
      if (col.collected) continue;

      // Distance check
      const colX = LANES[col.lane];
      const distZ = Math.abs(col.z - this.playerZ);
      const distX = Math.abs(colX - this.playerX);
      const distY = Math.abs(col.y - this.playerY);

      if (distZ < 1.1 && distX < 1.0 && distY < 1.8) {
        this.street.removeCollectible(col.id);

        if (col.type === 'coin') {
          this.coins++;
          this.score += 50 * (this.activePowerUps.has('pincho') ? 2 : 1);
          audioManager.playCoin();
          this.callbacks.onCoinCollected();
          this.spawnCoinSparkles(colX, col.y, col.z);
        } else if (col.type === 'champi') {
          // Bar Soriano Champiñón Super Jump
          this.tapas++;
          this.score += 500;
          this.activePowerUps.set('champi', { type: 'champi', duration: 10, remainingTime: 10 });
          audioManager.playPowerup();
          this.spawnDustPuff(colX, col.y, col.z, 0x10B981);
        } else if (col.type === 'rioja') {
          // Copa de Rioja Invincibility Shield
          this.wineGlasses++;
          this.score += 500;
          this.activePowerUps.set('rioja', { type: 'rioja', duration: 8, remainingTime: 8 });
          audioManager.playPowerup();
          this.spawnDustPuff(colX, col.y, col.z, 0xDC2626);
        } else if (col.type === 'pincho') {
          // Pincho Moruno Magnet & x2 multiplier
          this.tapas++;
          this.score += 500;
          this.activePowerUps.set('pincho', { type: 'pincho', duration: 10, remainingTime: 10 });
          audioManager.playPowerup();
          this.spawnDustPuff(colX, col.y, col.z, 0xF59E0B);
        }
      }
    }

    // Check Obstacles
    for (let i = 0; i < this.street.obstacles.length; i++) {
      const obs = this.street.obstacles[i];
      const hb = obs.hitbox;

      // Fast AABB intersection
      const intersects =
        pBox.max.x >= hb.minX &&
        pBox.min.x <= hb.maxX &&
        pBox.max.y >= hb.minY &&
        pBox.min.y <= hb.maxY &&
        pBox.max.z >= hb.minZ &&
        pBox.min.z <= hb.maxZ;

      if (intersects) {
        // Overhead obstacle (LIDL sign or tavern awning): if Bauti is rolling/sliding near the pavement, pass safely under!
        if ((obs.type === 'LIDL_SIGN' || obs.type === 'BAR_AWNING') && this.isSliding && this.playerY < 0.45) {
          continue;
        }

        // If Rioja shield is active, smash through obstacle!
        if (this.activePowerUps.has('rioja')) {
          this.street.removeObstacle(obs.id);
          this.activePowerUps.delete('rioja'); // Consume shield
          audioManager.playShieldHit();
          this.spawnWineSmash(this.playerX, 1.0, this.playerZ);
          this.score += 250;
          return;
        }

        // Crash & Game Over!
        this.triggerGameOver();
        return;
      }
    }
  }

  private triggerGameOver() {
    this.gameState = 'GAMEOVER';
    this.callbacks.onStateChange('GAMEOVER');

    audioManager.stopMusic();
    audioManager.playCrash();

    // Save high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('elbauti_highscore', String(this.highScore));
    }

    // Camera pullback on crash
    this.camera.position.set(this.playerX + 1.2, 2.8, this.playerZ - 4.2);
    this.camera.lookAt(this.playerX, 0.6, this.playerZ);
  }

  // --- Visual Particle Effects ---

  private spawnDustPuff(x: number, y: number, z: number, color: number) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
    const geom = new THREE.SphereGeometry(0.12, 6, 6);

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y + 0.1, z);
      this.particleGroup.add(mesh);

      const angle = (i / 8) * Math.PI * 2;
      const speed = 1.8 + Math.random() * 1.5;
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 0.8 + Math.random() * 1.5, Math.sin(angle) * speed),
        life: 0.45,
        maxLife: 0.45,
      });
    }
  }

  private spawnCoinSparkles(x: number, y: number, z: number) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xFBBF24, transparent: true, opacity: 0.9 });
    const geom = new THREE.BoxGeometry(0.08, 0.08, 0.08);

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          2.5 + Math.random() * 2,
          (Math.random() - 0.5) * 3
        ),
        life: 0.4,
        maxLife: 0.4,
      });
    }
  }

  private spawnWineSmash(x: number, y: number, z: number) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x991B1B, transparent: true, opacity: 0.85 });
    const geom = new THREE.SphereGeometry(0.18, 6, 6);

    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6
        ),
        life: 0.6,
        maxLife: 0.6,
      });
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 12 * delta; // Gravity on particles

      const progress = p.life / p.maxLife;
      p.mesh.scale.set(progress, progress, progress);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = progress;
    }
  }

  // --- Cleanup ---

  public dispose() {
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frameId);
    audioManager.stopMusic();

    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
