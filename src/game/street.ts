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
  private coinItemCounter: number = 0;

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
      { name: 'LA TABERNA DEL BAUTI', tapas: 'Especialidad de la Casa' },
      { name: 'BAR EL CHIQUITO', tapas: 'Vinos de Rioja y Cazuelitas' },
      { name: 'BODEGA LA LAUREL', tapas: 'Crianza, Reserva y Tapas' },
      { name: 'EL RINCÓN DE LA GAMBA', tapas: 'Champiñones y Pinchos' },
      { name: 'MESÓN DEL TEMPRANILLO', tapas: 'Tablas de Jamón Ibérico' },
      { name: 'BAR EL POTEO RIOJANO', tapas: 'Poteo de Sábado Noche' },
    ];

    bars.forEach((b) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d')!;

      // Dark matte tavern wood board
      ctx.fillStyle = '#100B06';
      ctx.fillRect(0, 0, 512, 140);

      // 3D Relief carved gold border
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, 500, 128);
      ctx.strokeStyle = '#5B2909';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, 488, 116);

      // Bar name with 3D relief shadow (readable from 50m)
      ctx.font = '900 44px "Outfit", sans-serif';
      ctx.textAlign = 'center';

      // Deep 3D drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.fillText(b.name, 259, 66);
      ctx.fillText(b.name, 258, 65);

      // Main high-contrast bright cream text
      ctx.fillStyle = '#FFFDF5';
      ctx.fillText(b.name, 256, 62);

      // Tapas specialty
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(b.tapas, 257, 107);
      ctx.fillStyle = '#FBBF24';
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

    // 2. Panoramic Glass Storefront & Bar Entrance (Doors are of transparent glass)
    const doorWidth = 4.8;
    const doorHeight = 3.8;

    // Sleek black architectural frame
    const frameGeom = new THREE.BoxGeometry(0.5, doorHeight + 0.2, doorWidth + 0.4);
    const doorFrame = new THREE.Mesh(frameGeom, this.ironMat);
    doorFrame.position.set(posX, (doorHeight + 0.2) / 2, posZ);
    bar.add(doorFrame);

    // Large Double Glass Doors (Transparent glass panes with subtle blue-white tint)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xEDF7FF,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.15,
    });
    const glassPaneGeom = new THREE.BoxGeometry(0.08, doorHeight - 0.2, doorWidth - 0.2);
    const glassDoors = new THREE.Mesh(glassPaneGeom, glassMat);
    glassDoors.position.set(posX, doorHeight / 2, posZ);
    bar.add(glassDoors);

    // Central door mullion divider
    const mullionGeom = new THREE.BoxGeometry(0.14, doorHeight, 0.12);
    const mullion = new THREE.Mesh(mullionGeom, this.ironMat);
    mullion.position.set(posX - sideSign * 0.05, doorHeight / 2, posZ);
    bar.add(mullion);

    // Polished Brass Vertical Door Handles (Tiradores dorados de cristalera)
    const handleGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
    const leftHandle = new THREE.Mesh(handleGeom, this.goldMat);
    leftHandle.position.set(posX - sideSign * 0.12, 1.8, posZ - 0.25);
    const rightHandle = new THREE.Mesh(handleGeom, this.goldMat);
    rightHandle.position.set(posX - sideSign * 0.12, 1.8, posZ + 0.25);
    bar.add(leftHandle, rightHandle);

    // Warm tavern interior visible directly through the glass doors
    const interiorGeom = new THREE.PlaneGeometry(doorWidth, doorHeight);
    interiorGeom.rotateY(-sideSign * Math.PI / 2);
    const interior = new THREE.Mesh(interiorGeom, this.tavernInteriorMat);
    interior.position.set(posX + sideSign * 0.4, doorHeight / 2, posZ);
    bar.add(interior);

    // Bar counter visible through the glass
    const counterGeom = new THREE.BoxGeometry(0.8, 1.1, doorWidth * 0.85);
    const barCounter = new THREE.Mesh(counterGeom, this.darkWoodMat);
    barCounter.position.set(posX + sideSign * 0.2, 0.55, posZ);
    bar.add(barCounter);

    // 3. Wooden Awning with 3D Relief Anti-Glare Bar Sign
    // Slanted tavern awning (toldo)
    const awningGeom = new THREE.BoxGeometry(1.4, 0.12, doorWidth + 1.2);
    awningGeom.rotateZ(sideSign * 0.25);
    const awning = new THREE.Mesh(awningGeom, awningMat);
    awning.position.set(posX - sideSign * 0.55, doorHeight + 0.6, posZ);
    bar.add(awning);

    // 3D Relief Bar Signboard:
    // Anti-glare matte finish (roughness: 1.0, zero metalness) with warm emissive self-illumination
    // Angled slightly downwards (8 deg) so overhead street lights reflect away from camera
    const signGroup = new THREE.Group();
    signGroup.position.set(posX - sideSign * 0.25, doorHeight + 1.35, posZ);

    // Outer 3D wooden carved frame projecting forward
    const signFrameGeom = new THREE.BoxGeometry(0.22, 1.45, doorWidth + 0.2);
    const signFrame = new THREE.Mesh(signFrameGeom, this.darkWoodMat);
    signGroup.add(signFrame);

    // Raised 3D sign plate with zero specular glare
    const signGeom = new THREE.BoxGeometry(0.16, 1.32, doorWidth);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 1.0,     // Absolutely zero specular reflections/glare
      metalness: 0.0,
      emissive: 0x3A2412, // Subtle warm self-illumination for crisp contrast from afar
      emissiveIntensity: 0.4,
    });
    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.x = -sideSign * 0.04; // Extrude forward in relief
    signGroup.add(signMesh);

    // Subtle downward tilt to steer specular reflection down to pavement
    signGroup.rotation.z = sideSign * 0.14;
    bar.add(signGroup);

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

    // Decorative sidewalk barrels removed to avoid any confusion with lane obstacles

    return bar;
  }

  // --- Realistic Obstacles (Barricas de Roble & Mesas de Terraza) ---

  /**
   * Builds an instantly recognizable authentic Oak Wine Barrel (Barrica de Rioja)
   * with a wooden tapas board and two glasses of Rioja red wine on top
   */
  public createRealisticOakBarrel(): THREE.Group {
    const barrel = new THREE.Group();

    // Curved bulging wooden barrel body
    const bodyGeom = new THREE.CylinderGeometry(0.48, 0.48, 1.15, 16);
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

    // Stenciled RIOJA Label plaque on the barrel
    const labelGeom = new THREE.PlaneGeometry(0.42, 0.22);
    const labelMat = new THREE.MeshStandardMaterial({
      map: this.barrelLabelTexture,
      roughness: 0.5,
    });
    const labelMesh = new THREE.Mesh(labelGeom, labelMat);
    labelMesh.position.set(0, 0.85, 0.54);
    barrel.add(labelMesh);

    // Tapas Board on top of the barrel (Plato de pinchos)
    const boardGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.035, 14);
    const boardMesh = new THREE.Mesh(boardGeom, this.darkWoodMat);
    boardMesh.position.set(0, 1.165, 0);
    barrel.add(boardMesh);

    // 2 Pinchos / Tapas on the board
    const pincho1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xB91C1C }) // Paprika chorizo / pincho
    );
    pincho1.position.set(-0.1, 1.21, 0.05);

    const pincho2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xF59E0B }) // Tortilla / queso
    );
    pincho2.position.set(0.1, 1.21, 0.05);

    // Toothpicks in pinchos
    const stickGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.14, 4);
    const stick1 = new THREE.Mesh(stickGeom, new THREE.MeshBasicMaterial({ color: 0xD7B899 }));
    stick1.position.set(-0.1, 1.28, 0.05);
    const stick2 = new THREE.Mesh(stickGeom, new THREE.MeshBasicMaterial({ color: 0xD7B899 }));
    stick2.position.set(0.1, 1.28, 0.05);

    // 2 Copas de Vino de Rioja on top of the barrel
    const glass1 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.16, 8), this.wineRedMat);
    glass1.position.set(-0.14, 1.24, -0.16);

    const glass2 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.16, 8), this.wineRedMat);
    glass2.position.set(0.14, 1.24, -0.16);

    barrel.add(pincho1, pincho2, stick1, stick2, glass1, glass2);

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
   * Builds the hanging LIDL obstacle:
   * Clean bright yellow board with physical 3D navy blue block letters spelling "LIDL".
   * Requires Bauti to roll/slide underneath.
   */
  public createLidlSignObstacle(): THREE.Group {
    const group = new THREE.Group();

    // Overhead steel mounting beam spanning across the lane
    const beamGeom = new THREE.BoxGeometry(2.3, 0.16, 0.16);
    const beam = new THREE.Mesh(beamGeom, this.steelMat);
    beam.position.y = 2.52;
    group.add(beam);

    // Hanging steel chains
    const chainGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.58, 4);
    const leftChain = new THREE.Mesh(chainGeom, this.ironMat);
    leftChain.position.set(-0.7, 2.18, 0);
    const rightChain = new THREE.Mesh(chainGeom, this.ironMat);
    rightChain.position.set(0.7, 2.18, 0);
    group.add(leftChain, rightChain);

    // LIDL Sign Board Group centered at Y = 1.72 (bottom edge at Y = 1.11m)
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 1.72, 0);

    // Outer Navy Blue Frame / Border
    const frameGeom = new THREE.BoxGeometry(1.92, 1.22, 0.09);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x001B44,
      roughness: 0.5,
      metalness: 0.1,
    });
    const frameMesh = new THREE.Mesh(frameGeom, frameMat);
    signGroup.add(frameMesh);

    // Clean Bright Yellow Board
    const yellowBoardGeom = new THREE.BoxGeometry(1.82, 1.12, 0.12);
    const yellowBoardMat = new THREE.MeshStandardMaterial({
      color: 0xFFD200,
      roughness: 0.35,
      metalness: 0.05,
    });
    const yellowBoard = new THREE.Mesh(yellowBoardGeom, yellowBoardMat);
    signGroup.add(yellowBoard);

    // Top mounting eye-bolts connecting chains to the yellow board
    const eyeGeom = new THREE.TorusGeometry(0.05, 0.015, 6, 12);
    [-0.7, 0.7].forEach((hx) => {
      const eye = new THREE.Mesh(eyeGeom, this.ironMat);
      eye.position.set(hx, 0.59, 0);
      signGroup.add(eye);
    });

    // 3D Navy Blue Relief Block Letters: L I D L
    // Material: Solid navy blue with crisp specular highlights
    const letterMat = new THREE.MeshStandardMaterial({
      color: 0x002868,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Helper to generate physical 3D block letters
    // isFront: facing approaching player (looking from -Z to +Z)
    const addLidlLetters = (zOffset: number, isFront: boolean) => {
      const textGroup = new THREE.Group();
      textGroup.position.z = zOffset;

      // Coordinate multiplier: when facing -Z, +X is visual screen left
      // When facing +Z, -X is visual screen left
      const dir = isFront ? 1 : -1;
      const letterZ = 0.06; // letter extrusion depth

      // --- Letter 1: 'L' (Screen Left) ---
      const l1X = 0.52 * dir;
      // Vertical spine
      const l1Spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.60, letterZ), letterMat);
      l1Spine.position.set(l1X + 0.07 * dir, 0, 0);
      // Horizontal bottom foot extending inward
      const l1Foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, letterZ), letterMat);
      l1Foot.position.set(l1X - 0.01 * dir, -0.24, 0);
      textGroup.add(l1Spine, l1Foot);

      // --- Letter 2: 'I' ---
      const iX = 0.17 * dir;
      const iBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.60, letterZ), letterMat);
      iBar.position.set(iX, 0, 0);
      textGroup.add(iBar);

      // --- Letter 3: 'D' ---
      const dX = -0.17 * dir;
      // Left vertical straight bar
      const dSpine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.60, letterZ), letterMat);
      dSpine.position.set(dX + 0.09 * dir, 0, 0);
      // Top horizontal bar
      const dTop = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.11, letterZ), letterMat);
      dTop.position.set(dX - 0.01 * dir, 0.245, 0);
      // Bottom horizontal bar
      const dBottom = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.11, letterZ), letterMat);
      dBottom.position.set(dX - 0.01 * dir, -0.245, 0);
      // Right vertical upright
      const dRight = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.44, letterZ), letterMat);
      dRight.position.set(dX - 0.11 * dir, 0, 0);
      textGroup.add(dSpine, dTop, dBottom, dRight);

      // --- Letter 4: 'L' (Screen Right) ---
      const l2X = -0.52 * dir;
      // Vertical spine
      const l2Spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.60, letterZ), letterMat);
      l2Spine.position.set(l2X + 0.07 * dir, 0, 0);
      // Horizontal bottom foot extending inward
      const l2Foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, letterZ), letterMat);
      l2Foot.position.set(l2X - 0.01 * dir, -0.24, 0);
      textGroup.add(l2Spine, l2Foot);

      signGroup.add(textGroup);
    };

    // Add 3D letters to both front face (approaching player) and back face
    addLidlLetters(-0.065, true);  // Facing player (-Z)
    addLidlLetters(0.065, false);  // Facing away (+Z)

    group.add(signGroup);
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
        'LIDL_SIGN',
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

      case 'LIDL_SIGN':
      case 'BAR_AWNING': {
        group = this.createLidlSignObstacle();
        group.position.set(laneX, 0, z);
        halfW = 1.05;
        minY = 1.05; // Elevated clearance: Standing (1.8m) hits, but sliding (0.55m) passes under!
        maxY = 2.35;
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
        // Alternating rows: Pincho de Champiñones vs Copa de Vino Tinto de Rioja
        const isWine = (this.coinItemCounter++ % 2 === 1);

        if (isWine) {
          // Copa de Vino Tinto de Rioja
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.28, 10), this.wineRedMat);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), this.glassMat);
          stem.position.y = -0.22;
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 8), this.glassMat);
          foot.position.y = -0.32;
          group.add(bowl, stem, foot);
        } else {
          // Pincho de Champiñones a la Plancha de Calle Laurel
          const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.58, 6),
            new THREE.MeshStandardMaterial({ color: 0xD7B899 })
          );
          group.add(stick);

          for (let i = 0; i < 3; i++) {
            const cap = new THREE.Mesh(
              new THREE.SphereGeometry(0.16 - i * 0.015, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
              new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.5 })
            );
            cap.position.y = -0.12 + i * 0.13;
            group.add(cap);
          }

          // Green garlic-parsley herb sprinkle
          const herb = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.02, 0.08),
            new THREE.MeshBasicMaterial({ color: 0x16A34A })
          );
          herb.position.y = 0.22;
          group.add(herb);
        }
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
