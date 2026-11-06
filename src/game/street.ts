import * as THREE from 'three';
import { LANES, CHUNK_LENGTH, ObstacleType, ObstacleInstance, CollectibleItem, LaneIndex } from './constants';

export class CalleLaurelStreet {
  public scene: THREE.Scene;
  public chunks: THREE.Group[] = [];
  public obstacles: ObstacleInstance[] = [];
  public obstacleMeshes: Map<string, THREE.Group> = new Map();
  public collectibles: CollectibleItem[] = [];
  public collectibleMeshes: Map<string, THREE.Group> = new Map();

  // Materials & Textures
  private cobblestoneMat: THREE.MeshStandardMaterial;
  private brickWallMat: THREE.MeshStandardMaterial;
  private stuccoWallMat: THREE.MeshStandardMaterial;
  private darkWoodMat: THREE.MeshStandardMaterial;
  private oakWoodMat: THREE.MeshStandardMaterial;
  private ironMat: THREE.MeshStandardMaterial;
  private steelMat: THREE.MeshStandardMaterial;
  private roofMat: THREE.MeshStandardMaterial;
  private goldMat: THREE.MeshStandardMaterial;
  private wineRedMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private tavernInteriorMat: THREE.MeshBasicMaterial;
  private awningMat1: THREE.MeshStandardMaterial;
  private awningMat2: THREE.MeshStandardMaterial;

  // Authentic Bar Sign Textures
  private barSignTextures: THREE.CanvasTexture[] = [];
  private barrelLabelTexture: THREE.CanvasTexture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.createBarSignTextures();
    this.barrelLabelTexture = this.createBarrelLabelTexture();
    const cobblestoneTex = this.createCobblestoneTexture();
    const brickTex = this.createBrickTexture();

    // Materials
    this.cobblestoneMat = new THREE.MeshStandardMaterial({
      map: cobblestoneTex,
      roughness: 0.75,
      metalness: 0.15,
    });

    this.brickWallMat = new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.9,
      color: 0xE8D5C4,
    });

    this.stuccoWallMat = new THREE.MeshStandardMaterial({
      color: 0xC49A76,
      roughness: 0.85,
    });

    this.darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x3E2723,
      roughness: 0.7,
      metalness: 0.1,
    });

    this.oakWoodMat = new THREE.MeshStandardMaterial({
      color: 0x6D4C41,
      roughness: 0.65,
      metalness: 0.05,
    });

    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.5,
      metalness: 0.8,
    });

    this.steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.85,
    });

    this.roofMat = new THREE.MeshStandardMaterial({
      color: 0xA14316,
      roughness: 0.8,
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xFBBF24,
      emissive: 0xB45309,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.2,
    });

    this.wineRedMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0x4C0519,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.8,
    });

    // Warm tavern interior glow
    this.tavernInteriorMat = new THREE.MeshBasicMaterial({
      color: 0xFDE68A, // Warm amber light from inside bars
    });

    // Striped bar awnings (Red/Beige and Green/Beige)
    this.awningMat1 = new THREE.MeshStandardMaterial({
      color: 0x991B1B, // Classic tavern burgundy
      roughness: 0.7,
    });

    this.awningMat2 = new THREE.MeshStandardMaterial({
      color: 0x065F46, // Classic green tavern canvas
      roughness: 0.7,
    });
  }

  private createBarSignTextures() {
    const bars = [
      { name: 'BAR SORIANO', tapas: 'Especialidad Champiñones' },
      { name: 'BAR LORENZO', tapas: 'Pinchos Morunos & Tío Agus' },
      { name: 'BAR JUBERA', tapas: 'Patatas Bravas Riojanas' },
      { name: 'TABERNA LAUREL', tapas: 'Vinos de Rioja y Tapas' },
      { name: 'EL RINCÓN DEL VINO', tapas: 'Chiquitos & Cazuelitas' },
      { name: 'BODEGA LOGROÑO', tapas: 'Crianza & Reserva' },
    ];

    bars.forEach((b) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d')!;

      // Dark tavern wood board
      ctx.fillStyle = '#1A120B';
      ctx.fillRect(0, 0, 512, 140);

      // Gold ornate border
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 128);
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, 484, 112);

      // Bar name
      ctx.font = 'bold 38px "Outfit", sans-serif';
      ctx.fillStyle = '#FEF3C7';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, 256, 62);

      // Specialty
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(b.tapas, 256, 105);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.barSignTextures.push(tex);
    });
  }

  private createBarrelLabelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5A3D28';
    ctx.fillRect(0, 0, 256, 128);

    // Stenciled text on wine barrel
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 240, 112);

    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.fillStyle = '#E2BA98';
    ctx.textAlign = 'center';
    ctx.fillText('RIOJA', 128, 55);

    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#C29878';
    ctx.fillText('DOCa · 2020', 128, 92);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createCobblestoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2C3539';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 12;
    const bh = 512 / rows;
    const bw = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (bw / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + offset;
        const y = r * bh;
        const val = Math.floor(75 + Math.random() * 40);
        ctx.fillStyle = `rgb(${val + 10}, ${val + 5}, ${val})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, bw - 4, bh - 4, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#B0A89C';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 14;
    const cols = 6;
    const bh = 256 / rows;
    const bw = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (bw / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + offset;
        const y = r * bh;
        const tone = Math.floor(180 + Math.random() * 35);
        ctx.fillStyle = `rgb(${tone + 20}, ${tone - 10}, ${tone - 25})`;
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 8);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Spawns a 36m long street chunk composed of authentic Calle Laurel bars
   */
  public createChunk(chunkZ: number, isInitial = false): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = chunkZ;

    const streetWidth = 7.6; // Width of the corridor

    // 1. Cobblestone street ground
    const streetGeom = new THREE.PlaneGeometry(streetWidth, CHUNK_LENGTH);
    streetGeom.rotateX(-Math.PI / 2);
    const streetMesh = new THREE.Mesh(streetGeom, this.cobblestoneMat);
    streetMesh.receiveShadow = true;
    chunk.add(streetMesh);

    // Sidewalk curbs with granite edging
    const curbGeom = new THREE.BoxGeometry(0.55, 0.16, CHUNK_LENGTH);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x7E8B9B, roughness: 0.8 });
    const leftCurb = new THREE.Mesh(curbGeom, curbMat);
    leftCurb.position.set(streetWidth / 2 - 0.27, 0.08, 0); // Visual left
    const rightCurb = new THREE.Mesh(curbGeom, curbMat);
    rightCurb.position.set(-streetWidth / 2 + 0.27, 0.08, 0); // Visual right
    chunk.add(leftCurb, rightCurb);

    // 2. Build Authentic Calle Laurel Bars along both sides (2 bars per side per chunk)
    const barSpacing = CHUNK_LENGTH / 2; // 18m per bar storefront

    for (let i = 0; i < 2; i++) {
      const zOffset = -CHUNK_LENGTH / 2 + (i * barSpacing) + barSpacing / 2;

      // Left Side Bar (+X)
      const leftBar = this.createTavernStorefront(
        streetWidth / 2,
        zOffset,
        1, // left side
        this.barSignTextures[(i * 2) % this.barSignTextures.length],
        i % 2 === 0 ? this.awningMat1 : this.awningMat2
      );
      chunk.add(leftBar);

      // Right Side Bar (-X)
      const rightBar = this.createTavernStorefront(
        -streetWidth / 2,
        zOffset,
        -1, // right side
        this.barSignTextures[(i * 2 + 1) % this.barSignTextures.length],
        i % 2 === 0 ? this.awningMat2 : this.awningMat1
      );
      chunk.add(rightBar);
    }

    // 3. Festive Overhead String Lights with warm bulb lanterns
    const wireGeom = new THREE.CylinderGeometry(0.02, 0.02, streetWidth, 6);
    wireGeom.rotateZ(Math.PI / 2);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFDE68A });

    [-10, 8].forEach((wz) => {
      const wire = new THREE.Mesh(wireGeom, wireMat);
      wire.position.set(0, 5.8, wz);
      chunk.add(wire);

      LANES.forEach((laneX) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4), wireMat);
        pole.position.set(laneX, 5.55, wz);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
        bulb.position.set(laneX, 5.25, wz);
        chunk.add(pole, bulb);
      });
    });

    this.scene.add(chunk);
    this.chunks.push(chunk);

    if (!isInitial) {
      this.populateChunkGameplay(chunkZ);
    }

    return chunk;
  }

  /**
   * Constructs an authentic Calle Laurel tapas bar storefront
   */
  private createTavernStorefront(
    posX: number,
    posZ: number,
    sideSign: number, // 1 for left (+X), -1 for right (-X)
    signTex: THREE.CanvasTexture,
    awningMat: THREE.MeshStandardMaterial
  ): THREE.Group {
    const bar = new THREE.Group();
    const barWidth = 17.5;
    const barHeight = 11.5;
    const wallThickness = 3.5;

    // 1. Upper Brick / Sandstone Wall Facade
    const wallGeom = new THREE.BoxGeometry(wallThickness, barHeight, barWidth);
    const wallMesh = new THREE.Mesh(wallGeom, this.brickWallMat);
    wallMesh.position.set(posX + sideSign * (wallThickness / 2), barHeight / 2, posZ);
    wallMesh.receiveShadow = true;
    bar.add(wallMesh);

    // 2. Open Bar Entrance (Recessed illuminated tavern interior)
    const doorWidth = 4.8;
    const doorHeight = 3.8;

    // Wooden doorframe
    const frameGeom = new THREE.BoxGeometry(0.5, doorHeight + 0.2, doorWidth + 0.4);
    const doorFrame = new THREE.Mesh(frameGeom, this.darkWoodMat);
    doorFrame.position.set(posX, (doorHeight + 0.2) / 2, posZ);
    bar.add(doorFrame);

    // Glowing bar interior (lit back room with bottles)
    const interiorGeom = new THREE.PlaneGeometry(doorWidth, doorHeight);
    interiorGeom.rotateY(-sideSign * Math.PI / 2);
    const interior = new THREE.Mesh(interiorGeom, this.tavernInteriorMat);
    interior.position.set(posX + sideSign * 0.25, doorHeight / 2, posZ);
    bar.add(interior);

    // Wooden bar counter visible at the entrance
    const counterGeom = new THREE.BoxGeometry(0.8, 1.1, doorWidth * 0.85);
    const barCounter = new THREE.Mesh(counterGeom, this.darkWoodMat);
    barCounter.position.set(posX + sideSign * 0.1, 0.55, posZ);
    bar.add(barCounter);

    // 3. Wooden Awning with Tavern Sign
    // Slanted tavern awning (toldo)
    const awningGeom = new THREE.BoxGeometry(1.4, 0.12, doorWidth + 1.2);
    awningGeom.rotateZ(sideSign * 0.25);
    const awning = new THREE.Mesh(awningGeom, awningMat);
    awning.position.set(posX - sideSign * 0.55, doorHeight + 0.6, posZ);
    bar.add(awning);

    // Tavern Signboard
    const signGeom = new THREE.BoxGeometry(0.12, 1.3, doorWidth);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(posX - sideSign * 0.15, doorHeight + 1.3, posZ);
    bar.add(signMesh);

    // 4. Balconies with Geraniums on upper floors
    const balconyGeom = new THREE.BoxGeometry(1.0, 0.9, 3.2);
    const balcony = new THREE.Mesh(balconyGeom, this.ironMat);
    balcony.position.set(posX - sideSign * 0.45, 6.8, posZ);
    bar.add(balcony);

    const flowersGeom = new THREE.BoxGeometry(0.35, 0.28, 3.0);
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xDC2626 });
    const flowers = new THREE.Mesh(flowersGeom, flowerMat);
    flowers.position.set(posX - sideSign * 0.75, 7.3, posZ);
    bar.add(flowers);

    // 5. Tavern Lantern mounted on the bar entrance
    const lanternGeom = new THREE.BoxGeometry(0.3, 0.55, 0.3);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xFDE68A });
    const lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(posX - sideSign * 0.25, doorHeight + 0.3, posZ + doorWidth / 2 + 0.4);
    bar.add(lantern);

    // 6. Barrels parked on the sidewalk outside the bar
    const sidewalkBarrel = this.createRealisticOakBarrel();
    sidewalkBarrel.position.set(posX - sideSign * 0.7, 0, posZ - doorWidth / 2 - 0.7);
    bar.add(sidewalkBarrel);

    return bar;
  }

  // --- Realistic Obstacles (Barricas de Roble & Mesas de Terraza) ---

  /**
   * Builds an instantly recognizable authentic Oak Wine Barrel (Barrica de Rioja)
   */
  public createRealisticOakBarrel(): THREE.Group {
    const barrel = new THREE.Group();

    // Curved bulging wooden barrel body
    // Using a cylinder with middle bulge
    const bodyGeom = new THREE.CylinderGeometry(0.48, 0.48, 1.15, 16);
    // Expand middle vertices slightly for authentic barrel bulge
    const pos = bodyGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const factor = 1 + (0.16 * (1 - Math.abs(y) / 0.575));
      pos.setX(i, pos.getX(i) * factor);
      pos.setZ(i, pos.getZ(i) * factor);
    }
    bodyGeom.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeom, this.oakWoodMat);
    bodyMesh.position.y = 0.575;
    bodyMesh.castShadow = true;
    barrel.add(bodyMesh);

    // Iron Hoops (4 steel bands around the barrel)
    const hoopYPositions = [0.22, 0.42, 0.73, 0.93];
    hoopYPositions.forEach((hy) => {
      const distFromCenter = Math.abs(hy - 0.575);
      const radius = 0.51 + (0.07 * (1 - distFromCenter / 0.575));
      const hoopGeom = new THREE.TorusGeometry(radius, 0.028, 6, 20);
      hoopGeom.rotateX(Math.PI / 2);
      const hoop = new THREE.Mesh(hoopGeom, this.steelMat);
      hoop.position.y = hy;
      barrel.add(hoop);
    });

    // Wooden Bung / Tap (espita de madera)
    const tapGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.22, 8);
    tapGeom.rotateX(Math.PI / 2);
    const tap = new THREE.Mesh(tapGeom, this.darkWoodMat);
    tap.position.set(0, 0.58, 0.58);
    barrel.add(tap);

    // Stenciled RIOJA Label plaque on the barrel top
    const labelGeom = new THREE.PlaneGeometry(0.42, 0.22);
    const labelMat = new THREE.MeshStandardMaterial({
      map: this.barrelLabelTexture,
      roughness: 0.5,
    });
    const labelMesh = new THREE.Mesh(labelGeom, labelMat);
    labelMesh.position.set(0, 0.85, 0.54);
    barrel.add(labelMesh);

    return barrel;
  }

  /**
   * Builds an instantly recognizable Terrace Table with 2 Bar Stools & Wine Bottle
   */
  public createRealisticTerraceTable(): THREE.Group {
    const tableGroup = new THREE.Group();

    // 1. High Round Bar Table
    // Dark oak wooden tabletop
    const topGeom = new THREE.CylinderGeometry(0.68, 0.68, 0.08, 16);
    const tableTop = new THREE.Mesh(topGeom, this.darkWoodMat);
    tableTop.position.y = 1.35;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    // Heavy iron central pillar & base
    const pillarGeom = new THREE.CylinderGeometry(0.07, 0.07, 1.35, 8);
    const pillar = new THREE.Mesh(pillarGeom, this.ironMat);
    pillar.position.y = 0.675;

    const baseGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.06, 14);
    const base = new THREE.Mesh(baseGeom, this.ironMat);
    base.position.y = 0.03;
    tableGroup.add(pillar, base);

    // 2. Bottle of Rioja wine on the table
    const bottleGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.32, 8);
    const bottle = new THREE.Mesh(
      bottleGeom,
      new THREE.MeshStandardMaterial({ color: 0x14532D, roughness: 0.2 }) // Dark green glass
    );
    bottle.position.set(0.12, 1.55, 0);

    const waxCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.08, 6),
      new THREE.MeshStandardMaterial({ color: 0xDC2626 }) // Red wax cap
    );
    waxCap.position.set(0.12, 1.74, 0);

    // 2 Wine Glasses with red Rioja wine
    const glass1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.15, 8), this.wineRedMat);
    glass1.position.set(-0.16, 1.46, 0.12);
    const glass2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.15, 8), this.wineRedMat);
    glass2.position.set(-0.16, 1.46, -0.12);

    tableGroup.add(bottle, waxCap, glass1, glass2);

    // 3. Two Tall Wooden Bar Stools flanking the table
    [-0.75, 0.75].forEach((stoolZ) => {
      const stool = new THREE.Group();
      stool.position.set(0, 0, stoolZ);

      // Round wooden seat
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12), this.oakWoodMat);
      seat.position.y = 0.95;
      stool.add(seat);

      // 4 stool legs
      const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6);
      [
        [-0.12, -0.12],
        [0.12, -0.12],
        [-0.12, 0.12],
        [0.12, 0.12],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeom, this.darkWoodMat);
        leg.position.set(lx, 0.475, lz);
        stool.add(leg);
      });

      // Round footrest ring
      const ringGeom = new THREE.TorusGeometry(0.16, 0.02, 6, 12);
      ringGeom.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, this.ironMat);
      ring.position.y = 0.35;
      stool.add(ring);

      tableGroup.add(stool);
    });

    return tableGroup;
  }

  /**
   * Builds a Low Tavern Awning / Sign with hanging cured hams (requires slide under)
   */
  public createBarAwningObstacle(): THREE.Group {
    const group = new THREE.Group();

    // Wooden crossbeam across the lane
    const beamGeom = new THREE.BoxGeometry(2.2, 0.22, 0.28);
    const beam = new THREE.Mesh(beamGeom, this.darkWoodMat);
    beam.position.y = 1.65;
    group.add(beam);

    // Hanging chalkboard sign
    const signBoardGeom = new THREE.BoxGeometry(1.6, 0.65, 0.08);
    const signBoard = new THREE.Mesh(
      signBoardGeom,
      new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.6 })
    );
    signBoard.position.set(0, 1.35, 0);
    group.add(signBoard);

    // Hanging chains from top
    const chainGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
    const leftChain = new THREE.Mesh(chainGeom, this.ironMat);
    leftChain.position.set(-0.7, 2.05, 0);
    const rightChain = new THREE.Mesh(chainGeom, this.ironMat);
    rightChain.position.set(0.7, 2.05, 0);
    group.add(leftChain, rightChain);

    // Hanging Jamón Serrano on the side
    const jamonGeom = new THREE.CylinderGeometry(0.07, 0.14, 0.6, 8);
    const jamon = new THREE.Mesh(
      jamonGeom,
      new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 })
    );
    jamon.position.set(0.65, 0.95, 0);
    group.add(jamon);

    return group;
  }

  // --- Obstacle Population ---

  private populateChunkGameplay(chunkZ: number) {
    const zSections = [-12, -2, 8];

    zSections.forEach((relZ) => {
      const absoluteZ = chunkZ + relZ;

      const obstacleChoices: ObstacleType[] = [
        'OAK_BARREL',
        'TERRACE_TABLE',
        'OAK_BARREL',
        'TERRACE_TABLE',
        'BAR_AWNING',
        'DOUBLE_BARRELS',
      ];

      // Pick 1 lane to block with high visibility
      const blockedLaneIndices = this.pickRandomLanes(1);
      const chosenType = obstacleChoices[Math.floor(Math.random() * obstacleChoices.length)];

      blockedLaneIndices.forEach((laneIdx) => {
        this.spawnObstacle(chosenType, laneIdx, absoluteZ);
      });

      // Spawn Coins & Tapas in the remaining open lanes
      const availableLanes = ([0, 1, 2] as LaneIndex[]).filter((l) => !blockedLaneIndices.includes(l));
      if (availableLanes.length > 0) {
        const coinLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const powerupRoll = Math.random();

        if (powerupRoll < 0.05) {
          this.spawnCollectible('champi', coinLane, absoluteZ, 1.2);
        } else if (powerupRoll < 0.10) {
          this.spawnCollectible('rioja', coinLane, absoluteZ, 1.2);
        } else if (powerupRoll < 0.15) {
          this.spawnCollectible('pincho', coinLane, absoluteZ, 1.2);
        } else {
          [-2, 0, 2].forEach((offsetZ) => {
            this.spawnCollectible('coin', coinLane, absoluteZ + offsetZ, 0.9);
          });
        }
      }
    });
  }

  private pickRandomLanes(count: number): LaneIndex[] {
    const lanes: LaneIndex[] = [0, 1, 2];
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    return lanes.slice(0, count);
  }

  private spawnObstacle(type: ObstacleType, lane: LaneIndex, z: number) {
    const id = `obs_${Math.random().toString(36).substring(2, 9)}`;
    const laneX = LANES[lane];
    let group: THREE.Group;

    let halfW = 0.65;
    let minY = 0;
    let maxY = 1.15;
    let halfD = 0.65;

    switch (type) {
      case 'OAK_BARREL': {
        group = this.createRealisticOakBarrel();
        group.position.set(laneX, 0, z);
        halfW = 0.55;
        maxY = 1.15;
        halfD = 0.55;
        break;
      }

      case 'TERRACE_TABLE': {
        group = this.createRealisticTerraceTable();
        group.position.set(laneX, 0, z);
        halfW = 0.8;
        maxY = 1.8;
        halfD = 0.8;
        break;
      }

      case 'DOUBLE_BARRELS': {
        group = new THREE.Group();
        const b1 = this.createRealisticOakBarrel();
        b1.position.set(0.38, 0, 0);
        const b2 = this.createRealisticOakBarrel();
        b2.position.set(-0.38, 0, 0);
        group.add(b1, b2);
        group.position.set(laneX, 0, z);
        halfW = 0.85;
        maxY = 1.15;
        halfD = 0.6;
        break;
      }

      case 'BAR_AWNING': {
        group = this.createBarAwningObstacle();
        group.position.set(laneX, 0, z);
        halfW = 1.05;
        minY = 0.85; // Can roll under!
        maxY = 2.1;
        halfD = 0.35;
        break;
      }
    }

    const hitbox = {
      minX: Math.min(laneX - halfW, laneX + halfW),
      maxX: Math.max(laneX - halfW, laneX + halfW),
      minY,
      maxY,
      minZ: z - halfD,
      maxZ: z + halfD,
    };

    this.scene.add(group);
    this.obstacleMeshes.set(id, group);
    this.obstacles.push({ id, type, lane, z, hitbox });
  }

  // --- Collectibles ---

  private spawnCollectible(type: 'coin' | 'champi' | 'rioja' | 'pincho', lane: LaneIndex, z: number, y: number) {
    const id = `col_${Math.random().toString(36).substring(2, 9)}`;
    const laneX = LANES[lane];
    const group = new THREE.Group();
    group.position.set(laneX, y, z);

    switch (type) {
      case 'coin': {
        const coinGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
        coinGeom.rotateX(Math.PI / 2);
        const coin = new THREE.Mesh(coinGeom, this.goldMat);
        group.add(coin);
        break;
      }

      case 'champi': {
        // Bar Soriano stacked mushrooms with shrimp
        const skewer = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6),
          new THREE.MeshStandardMaterial({ color: 0xD7B899 })
        );
        group.add(skewer);

        for (let i = 0; i < 3; i++) {
          const cap = new THREE.Mesh(
            new THREE.SphereGeometry(0.24 - i * 0.02, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 })
          );
          cap.position.y = -0.15 + i * 0.16;
          group.add(cap);
        }

        const shrimp = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.04, 6, 8, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0xF97316 })
        );
        shrimp.position.y = 0.32;
        group.add(shrimp);

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.03, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0x10B981 })
        );
        halo.rotateX(Math.PI / 2);
        group.add(halo);
        break;
      }

      case 'rioja': {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.12, 0.35, 12), this.wineRedMat);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), this.glassMat);
        stem.position.y = -0.28;
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 10), this.glassMat);
        foot.position.y = -0.4;
        group.add(bowl, stem, foot);

        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xDC2626, transparent: true, opacity: 0.35 })
        );
        group.add(glow);
        break;
      }

      case 'pincho': {
        const stick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6),
          new THREE.MeshStandardMaterial({ color: 0x92400E })
        );
        group.add(stick);

        for (let i = 0; i < 4; i++) {
          const meat = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.14, 0.18),
            new THREE.MeshStandardMaterial({ color: 0xB91C1C, roughness: 0.6 })
          );
          meat.position.y = -0.2 + i * 0.15;
          group.add(meat);
        }

        const spark = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.03, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xF59E0B })
        );
        spark.rotateX(Math.PI / 2);
        group.add(spark);
        break;
      }
    }

    this.scene.add(group);
    this.collectibleMeshes.set(id, group);
    this.collectibles.push({ id, type, lane, z, y, collected: false });
  }

  // --- Dynamic Street Recycling Loop ---

  public update(playerZ: number, delta: number, hasMagnet: boolean, playerX: number, playerY: number) {
    this.collectibleMeshes.forEach((mesh) => {
      mesh.rotation.y += delta * 2.5;

      if (hasMagnet) {
        const distZ = mesh.position.z - playerZ;
        if (distZ > 0 && distZ < 18) {
          mesh.position.x = THREE.MathUtils.damp(mesh.position.x, playerX, 10, delta);
          mesh.position.y = THREE.MathUtils.damp(mesh.position.y, playerY + 0.8, 10, delta);
        }
      }
    });

    const recycleThresholdZ = playerZ - CHUNK_LENGTH;
    if (this.chunks.length > 0 && this.chunks[0].position.z < recycleThresholdZ) {
      const oldChunk = this.chunks.shift()!;
      this.scene.remove(oldChunk);

      const lastChunk = this.chunks[this.chunks.length - 1];
      const nextZ = lastChunk ? lastChunk.position.z + CHUNK_LENGTH : playerZ + CHUNK_LENGTH;
      this.createChunk(nextZ);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z < playerZ - 10) {
        const mesh = this.obstacleMeshes.get(obs.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.obstacleMeshes.delete(obs.id);
        }
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      if (col.z < playerZ - 8 || col.collected) {
        const mesh = this.collectibleMeshes.get(col.id);
        if (mesh) {
          this.scene.remove(mesh);
          this.collectibleMeshes.delete(col.id);
        }
        this.collectibles.splice(i, 1);
      }
    }
  }

  public removeObstacle(id: string) {
    const mesh = this.obstacleMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.obstacleMeshes.delete(id);
    }
    const idx = this.obstacles.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.obstacles.splice(idx, 1);
    }
  }

  public removeCollectible(id: string) {
    const mesh = this.collectibleMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.collectibleMeshes.delete(id);
    }
    const item = this.collectibles.find((c) => c.id === id);
    if (item) {
      item.collected = true;
    }
  }

  public reset() {
    this.chunks.forEach((c) => this.scene.remove(c));
    this.chunks = [];

    this.obstacleMeshes.forEach((m) => this.scene.remove(m));
    this.obstacleMeshes.clear();
    this.obstacles = [];

    this.collectibleMeshes.forEach((m) => this.scene.remove(m));
    this.collectibleMeshes.clear();
    this.collectibles = [];

    for (let i = -1; i < 4; i++) {
      this.createChunk(i * CHUNK_LENGTH, i <= 0);
    }
  }
}
