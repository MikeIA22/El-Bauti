import * as THREE from 'three';

export interface BautiAnimationState {
  isRunning: boolean;
  isJumping: boolean;
  isSliding: boolean;
  isDead: boolean;
  speed: number;
  laneOffset: number; // For leaning into lane turns (-1 to 1)
  hasShield: boolean;
  hasSuperJump: boolean;
  hasMagnet: boolean;
}

export class BautiCharacter {
  public group: THREE.Group;
  public collisionBox: THREE.Box3;

  // Body parts for kinematics
  private torso: THREE.Group;
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftLowerLeg: THREE.Group;
  private rightLowerLeg: THREE.Group;
  private leftForearm: THREE.Group;
  private rightForearm: THREE.Group;
  private shadowMesh: THREE.Mesh;

  // Powerup visuals
  private shieldMesh: THREE.Mesh;
  private magnetRing: THREE.Mesh;
  private jumpAura: THREE.Group;

  private animTimer: number = 0;
  private baseHeight: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.collisionBox = new THREE.Box3();

    // Palette calibrated directly to the reference photo
    const sweaterColor = new THREE.Color('#D1D5DB'); // Light heather grey
    const pantsColor = new THREE.Color('#1E293B');   // Deep navy chinos
    const skinColor = new THREE.Color('#E3B896');    // Warm Mediterranean skin
    const hairColor = new THREE.Color('#2C1810');    // Dark espresso brown
    const shoeColor = new THREE.Color('#FFFFFF');    // Clean white sneakers
    const sockColor = new THREE.Color('#0F172A');    // Black socks

    // Materials
    const sweaterMat = new THREE.MeshStandardMaterial({
      color: sweaterColor,
      roughness: 0.85,
      metalness: 0.05,
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColor,
      roughness: 0.75,
      metalness: 0.1,
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.6,
      metalness: 0.0,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.9,
      metalness: 0.05,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: shoeColor,
      roughness: 0.4,
      metalness: 0.1,
    });

    const sockMat = new THREE.MeshStandardMaterial({
      color: sockColor,
      roughness: 0.8,
    });

    // --- Face Texture from Reference Photo ---
    const faceTexture = this.createFaceCanvasTexture();
    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.6,
    });

    // --- Build Character Rig ---
    // 1. Torso & Jumper
    this.torso = new THREE.Group();
    this.torso.position.y = 1.05;

    // Jumper body
    const torsoGeom = new THREE.CylinderGeometry(0.32, 0.28, 0.65, 12);
    torsoGeom.scale(1.15, 1, 0.85); // Oval chest
    const torsoMesh = new THREE.Mesh(torsoGeom, sweaterMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torso.add(torsoMesh);

    // Ribbed collar
    const collarGeom = new THREE.TorusGeometry(0.18, 0.045, 8, 16);
    collarGeom.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeom, sweaterMat);
    collarMesh.position.y = 0.33;
    this.torso.add(collarMesh);

    // Ribbed waistband
    const waistGeom = new THREE.CylinderGeometry(0.29, 0.29, 0.08, 12);
    waistGeom.scale(1.12, 1, 0.85);
    const waistMesh = new THREE.Mesh(waistGeom, sweaterMat);
    waistMesh.position.y = -0.32;
    this.torso.add(waistMesh);

    // 2. Head & Neck
    this.head = new THREE.Group();
    this.head.position.y = 0.52;

    const neckGeom = new THREE.CylinderGeometry(0.12, 0.13, 0.18, 8);
    const neckMesh = new THREE.Mesh(neckGeom, skinMat);
    neckMesh.position.y = -0.09;
    this.head.add(neckMesh);

    // Head base (slightly rounded box for cartoon character style)
    const headGeom = new THREE.BoxGeometry(0.36, 0.42, 0.38);
    // Multi-material for head: Front face has Bauti's photo texture
    const headMaterials = [
      skinMat, // right
      skinMat, // left
      hairMat, // top
      skinMat, // bottom
      faceMat, // front (Bauti's face!)
      hairMat, // back
    ];
    const headMesh = new THREE.Mesh(headGeom, headMaterials);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Sculpted hair volume on top & back
    const hairTopGeom = new THREE.BoxGeometry(0.38, 0.14, 0.40);
    const hairTop = new THREE.Mesh(hairTopGeom, hairMat);
    hairTop.position.set(0, 0.20, -0.01);
    this.head.add(hairTop);

    // Fringe / front hairline sweep
    const fringeGeom = new THREE.BoxGeometry(0.36, 0.08, 0.12);
    const fringe = new THREE.Mesh(fringeGeom, hairMat);
    fringe.position.set(0, 0.18, 0.17);
    this.head.add(fringe);

    // Ears
    const earGeom = new THREE.BoxGeometry(0.06, 0.10, 0.08);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(-0.20, 0, 0);
    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(0.20, 0, 0);
    this.head.add(leftEar, rightEar);

    this.torso.add(this.head);

    // 3. Arms
    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 0.22, 0);
    const upperArmGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.34, 8);
    upperArmGeom.translate(0, -0.17, 0);
    const leftUpperArm = new THREE.Mesh(upperArmGeom, sweaterMat);
    leftUpperArm.castShadow = true;
    this.leftArm.add(leftUpperArm);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.34, 0);
    const forearmGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8);
    forearmGeom.translate(0, -0.16, 0);
    const leftForearmMesh = new THREE.Mesh(forearmGeom, sweaterMat);
    this.leftForearm.add(leftForearmMesh);

    // Hand with thumbs up
    const handGeom = new THREE.BoxGeometry(0.10, 0.12, 0.10);
    handGeom.translate(0, -0.06, 0);
    const leftHand = new THREE.Mesh(handGeom, skinMat);
    leftHand.position.y = -0.32;
    this.leftForearm.add(leftHand);

    // Thumb
    const thumbGeom = new THREE.BoxGeometry(0.05, 0.10, 0.05);
    thumbGeom.translate(0, 0.04, 0.03);
    const leftThumb = new THREE.Mesh(thumbGeom, skinMat);
    leftThumb.position.set(0.06, -0.34, 0);
    this.leftForearm.add(leftThumb);

    this.leftArm.add(this.leftForearm);
    this.torso.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 0.22, 0);
    const rightUpperArm = new THREE.Mesh(upperArmGeom, sweaterMat);
    rightUpperArm.castShadow = true;
    this.rightArm.add(rightUpperArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.34, 0);
    const rightForearmMesh = new THREE.Mesh(forearmGeom, sweaterMat);
    this.rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Mesh(handGeom, skinMat);
    rightHand.position.y = -0.32;
    this.rightForearm.add(rightHand);

    const rightThumb = new THREE.Mesh(thumbGeom, skinMat);
    rightThumb.position.set(-0.06, -0.34, 0);
    this.rightForearm.add(rightThumb);

    this.rightArm.add(this.rightForearm);
    this.torso.add(this.rightArm);

    // 4. Legs
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, -0.32, 0);
    const thighGeom = new THREE.CylinderGeometry(0.12, 0.10, 0.44, 8);
    thighGeom.translate(0, -0.22, 0);
    const leftThigh = new THREE.Mesh(thighGeom, pantsMat);
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    this.leftLowerLeg = new THREE.Group();
    this.leftLowerLeg.position.set(0, -0.44, 0);
    const calfGeom = new THREE.CylinderGeometry(0.10, 0.085, 0.42, 8);
    calfGeom.translate(0, -0.21, 0);
    const leftCalf = new THREE.Mesh(calfGeom, pantsMat);
    leftCalf.castShadow = true;
    this.leftLowerLeg.add(leftCalf);

    // Sock
    const sockGeom = new THREE.CylinderGeometry(0.086, 0.086, 0.08, 8);
    sockGeom.translate(0, -0.38, 0);
    const leftSock = new THREE.Mesh(sockGeom, sockMat);
    this.leftLowerLeg.add(leftSock);

    // Sneaker
    const shoeGroup = this.createSneaker(shoeMat);
    shoeGroup.position.set(0, -0.42, 0.06);
    this.leftLowerLeg.add(shoeGroup);

    this.leftLeg.add(this.leftLowerLeg);
    this.torso.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, -0.32, 0);
    const rightThigh = new THREE.Mesh(thighGeom, pantsMat);
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    this.rightLowerLeg = new THREE.Group();
    this.rightLowerLeg.position.set(0, -0.44, 0);
    const rightCalf = new THREE.Mesh(calfGeom, pantsMat);
    rightCalf.castShadow = true;
    this.rightLowerLeg.add(rightCalf);

    const rightSock = new THREE.Mesh(sockGeom, sockMat);
    this.rightLowerLeg.add(rightSock);

    const rightShoeGroup = this.createSneaker(shoeMat);
    rightShoeGroup.position.set(0, -0.42, 0.06);
    this.rightLowerLeg.add(rightShoeGroup);

    this.rightLeg.add(this.rightLowerLeg);
    this.torso.add(this.rightLeg);

    this.group.add(this.torso);

    // 5. Contact Shadow
    const shadowGeom = new THREE.PlaneGeometry(1.2, 1.4);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);

    // 6. Power-Up Meshes
    // Rioja Shield
    const shieldGeom = new THREE.SphereGeometry(1.15, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x991B1B, // Wine red
      emissive: 0xDC2626,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.position.y = 1.05;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    // Pincho Magnet Ring
    const magnetGeom = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
    magnetGeom.rotateX(Math.PI / 2);
    const magnetMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B, // Golden amber
      emissive: 0xD97706,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    this.magnetRing = new THREE.Mesh(magnetGeom, magnetMat);
    this.magnetRing.position.y = 0.9;
    this.magnetRing.visible = false;
    this.group.add(this.magnetRing);

    // Super Jump Mushroom Aura
    this.jumpAura = new THREE.Group();
    const auraGeom = new THREE.ConeGeometry(0.35, 0.6, 6);
    auraGeom.rotateX(Math.PI);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0.6,
    });
    const leftAura = new THREE.Mesh(auraGeom, auraMat);
    leftAura.position.set(-0.25, 0.1, -0.2);
    const rightAura = new THREE.Mesh(auraGeom, auraMat);
    rightAura.position.set(0.25, 0.1, -0.2);
    this.jumpAura.add(leftAura, rightAura);
    this.jumpAura.visible = false;
    this.group.add(this.jumpAura);

    this.updateHitbox(0, 0);
  }

  /**
   * Generates a high quality procedural canvas texture for Bauti's face
   * matching his photo reference: warm skin tone, dark eyes, friendly smile,
   * trimmed beard & mustache, defined eyebrows, and forehead hairline.
   */
  private createFaceCanvasTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // 1. Base skin
    ctx.fillStyle = '#E4B795';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle skin shading / cheeks
    const radial = ctx.createRadialGradient(128, 140, 20, 128, 140, 120);
    radial.addColorStop(0, '#EABFA0');
    radial.addColorStop(1, '#DCAC88');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 256, 256);

    // 2. Forehead shadow & Hairline
    ctx.fillStyle = '#2C1810';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(236, 0);
    ctx.lineTo(236, 45);
    ctx.quadraticCurveTo(180, 50, 128, 42);
    ctx.quadraticCurveTo(76, 50, 20, 45);
    ctx.closePath();
    ctx.fill();

    // 3. Eyebrows (dark brown, natural shape)
    ctx.fillStyle = '#24140E';
    // Left eyebrow
    ctx.beginPath();
    ctx.roundRect(46, 80, 60, 14, [4, 8, 2, 6]);
    ctx.fill();
    // Right eyebrow
    ctx.beginPath();
    ctx.roundRect(150, 80, 60, 14, [8, 4, 6, 2]);
    ctx.fill();

    // 4. Eyes (warm dark brown, kind expression)
    // Sclera
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(75, 108, 18, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(181, 108, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (dark brown)
    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.arc(75, 108, 9, 0, Math.PI * 2);
    ctx.arc(181, 108, 9, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#110C0A';
    ctx.beginPath();
    ctx.arc(75, 108, 4.5, 0, Math.PI * 2);
    ctx.arc(181, 108, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights (sparkle)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(72, 105, 2.5, 0, Math.PI * 2);
    ctx.arc(178, 105, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyelids / lashes
    ctx.strokeStyle = '#2A160F';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(75, 108, 18, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(181, 108, 18, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // 5. Nose
    ctx.fillStyle = '#D69E77';
    ctx.beginPath();
    ctx.moveTo(128, 100);
    ctx.lineTo(122, 148);
    ctx.quadraticCurveTo(128, 154, 134, 148);
    ctx.closePath();
    ctx.fill();

    // Nostrils
    ctx.fillStyle = '#B8825E';
    ctx.beginPath();
    ctx.ellipse(120, 148, 4, 3, 0.2, 0, Math.PI * 2);
    ctx.ellipse(136, 148, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Signature Beard & Stubble (neatly trimmed around jaw, chin, cheeks)
    ctx.fillStyle = 'rgba(44, 24, 16, 0.85)';
    ctx.beginPath();
    // Mustache
    ctx.moveTo(100, 162);
    ctx.quadraticCurveTo(128, 156, 156, 162);
    ctx.quadraticCurveTo(128, 172, 100, 162);
    ctx.fill();

    // Jawline and chin beard
    ctx.beginPath();
    ctx.moveTo(35, 145);
    ctx.quadraticCurveTo(50, 195, 90, 225);
    ctx.quadraticCurveTo(128, 240, 166, 225);
    ctx.quadraticCurveTo(206, 195, 221, 145);
    ctx.lineTo(205, 148);
    ctx.quadraticCurveTo(190, 190, 160, 212);
    ctx.quadraticCurveTo(128, 220, 96, 212);
    ctx.quadraticCurveTo(66, 190, 51, 148);
    ctx.closePath();
    ctx.fill();

    // Soul patch under lip
    ctx.beginPath();
    ctx.roundRect(123, 188, 10, 14, 4);
    ctx.fill();

    // 7. Cheerful Spanish Smile
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.arc(128, 172, 18, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();

    // White teeth
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(128, 172, 15, 0.2, Math.PI - 0.2);
    ctx.lineTo(128, 174);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createSneaker(shoeMat: THREE.Material): THREE.Group {
    const sneaker = new THREE.Group();

    // Shoe sole
    const soleGeom = new THREE.BoxGeometry(0.18, 0.06, 0.36);
    soleGeom.translate(0, 0.03, 0);
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.5,
    });
    const sole = new THREE.Mesh(soleGeom, soleMat);
    sneaker.add(sole);

    // Shoe upper
    const upperGeom = new THREE.BoxGeometry(0.17, 0.12, 0.34);
    upperGeom.translate(0, 0.11, -0.01);
    const upper = new THREE.Mesh(upperGeom, shoeMat);
    sneaker.add(upper);

    // Shoe toe cap (rounded)
    const toeGeom = new THREE.CylinderGeometry(0.085, 0.085, 0.10, 8);
    toeGeom.rotateX(Math.PI / 2);
    toeGeom.translate(0, 0.09, 0.12);
    const toe = new THREE.Mesh(toeGeom, shoeMat);
    sneaker.add(toe);

    return sneaker;
  }

  public update(delta: number, state: BautiAnimationState, posY: number) {
    this.animTimer += delta * (state.speed * 0.7);

    // Power-up visibility & rotation
    this.shieldMesh.visible = state.hasShield;
    if (state.hasShield) {
      this.shieldMesh.rotation.y += delta * 2;
    }

    this.magnetRing.visible = state.hasMagnet;
    if (state.hasMagnet) {
      this.magnetRing.rotation.z += delta * 4;
    }

    this.jumpAura.visible = state.hasSuperJump;
    if (state.hasSuperJump) {
      this.jumpAura.rotation.y += delta * 6;
    }

    // Leaning naturally into lane turns
    const targetRoll = state.laneOffset * 0.20;
    this.torso.rotation.z = THREE.MathUtils.damp(this.torso.rotation.z, targetRoll, 12, delta);

    // Handle Animation States
    if (state.isDead) {
      // Crash / stumble back
      this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, 0.4, 8, delta);
      this.torso.rotation.x = THREE.MathUtils.damp(this.torso.rotation.x, -Math.PI / 3, 8, delta);
      this.leftArm.rotation.x = Math.PI / 2;
      this.rightArm.rotation.x = Math.PI / 2;
      this.leftLeg.rotation.x = -Math.PI / 4;
      this.rightLeg.rotation.x = Math.PI / 5;
    } else if (state.isSliding) {
      // Crouch and slide low to the ground
      this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, 0.38, 25, delta);
      this.torso.rotation.x = THREE.MathUtils.damp(this.torso.rotation.x, 1.25, 25, delta);
      this.head.rotation.x = -0.7; // Keep looking forward while sliding

      // Arms back for balance
      this.leftArm.rotation.x = -0.8;
      this.rightArm.rotation.x = -0.8;
      this.leftForearm.rotation.x = -0.4;
      this.rightForearm.rotation.x = -0.4;

      // Legs forward in slide
      this.leftLeg.rotation.x = 1.2;
      this.rightLeg.rotation.x = 0.9;
      this.leftLowerLeg.rotation.x = -0.8;
      this.rightLowerLeg.rotation.x = -0.6;
    } else if (state.isJumping) {
      // Jump pose
      this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, 1.05, 12, delta);
      this.torso.rotation.x = THREE.MathUtils.damp(this.torso.rotation.x, 0.1, 12, delta);
      this.head.rotation.x = 0;

      // Arms out for air balance
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -0.6, 12, delta);
      this.leftArm.rotation.z = THREE.MathUtils.damp(this.leftArm.rotation.z, -0.4, 12, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -0.6, 12, delta);
      this.rightArm.rotation.z = THREE.MathUtils.damp(this.rightArm.rotation.z, 0.4, 12, delta);

      // Legs tucked up
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, -0.5, 12, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0.4, 12, delta);
      this.leftLowerLeg.rotation.x = 0.9;
      this.rightLowerLeg.rotation.x = 0.7;
    } else if (state.isRunning) {
      // Natural running gait
      const stride = Math.sin(this.animTimer);
      const bob = Math.abs(Math.sin(this.animTimer * 2)) * 0.08;

      this.torso.position.y = 1.05 + bob;
      this.torso.rotation.x = 0.15; // Running forward pitch
      this.head.rotation.x = -0.10;

      // Arm swing (opposite to legs)
      this.leftArm.rotation.x = -stride * 0.9;
      this.leftArm.rotation.z = -0.15;
      this.leftForearm.rotation.x = -0.6 - Math.max(0, -stride) * 0.4;

      this.rightArm.rotation.x = stride * 0.9;
      this.rightArm.rotation.z = 0.15;
      this.rightForearm.rotation.x = -0.6 - Math.max(0, stride) * 0.4;

      // Leg stride
      this.leftLeg.rotation.x = stride * 0.95;
      this.rightLeg.rotation.x = -stride * 0.95;

      // Knee bending during backswing
      this.leftLowerLeg.rotation.x = Math.max(0, -stride * 1.2);
      this.rightLowerLeg.rotation.x = Math.max(0, stride * 1.2);
    } else {
      // Idle Menu Pose: Bauti's signature Two Thumbs Up!
      const breath = Math.sin(this.animTimer * 0.3) * 0.02;
      this.torso.position.y = 1.05 + breath;
      this.torso.rotation.set(0, 0, 0);
      this.head.rotation.set(0, 0, 0);

      // Both arms raised with thumbs up pointing up
      this.leftArm.rotation.set(-0.7, -0.2, -0.3);
      this.leftForearm.rotation.set(-1.1, 0, 0);

      this.rightArm.rotation.set(-0.7, 0.2, 0.3);
      this.rightForearm.rotation.set(-1.1, 0, 0);

      this.leftLeg.rotation.set(0, 0, -0.05);
      this.rightLeg.rotation.set(0, 0, 0.05);
      this.leftLowerLeg.rotation.set(0, 0, 0);
      this.rightLowerLeg.rotation.set(0, 0, 0);
    }

    // Shadow scale & opacity decreases with jump height
    const shadowScale = Math.max(0.3, 1 - (posY / 5));
    this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.08, 0.35 - (posY * 0.05));

    this.updateHitbox(this.group.position.x, this.group.position.y + posY, state.isSliding);
  }

  public updateHitbox(posX: number, posY: number, isSliding: boolean = false) {
    const sliding = isSliding || this.torso.rotation.x > 0.6;
    const height = sliding ? 0.52 : 1.80;
    const halfWidth = 0.40;
    const halfDepth = 0.40;

    this.collisionBox.min.set(posX - halfWidth, posY, this.group.position.z - halfDepth);
    this.collisionBox.max.set(posX + halfWidth, posY + height, this.group.position.z + halfDepth);
  }
}
