/**
 * الأستاذ مرشدي — شخصية ثلاثية الأبعاد مرسومة بـThree.js:
 * جلباب أخضر مطرز بالذهبي، طربوش أحمر، لحية خفيفة، تعابير وجه متحركة،
 * إيماءات يد، وتزامن فتح الفم مع الكلام.
 */
import * as THREE from "three";

export type AvatarMood = "happy" | "explain" | "thinking" | "listening";

export interface TeacherAvatar {
  setMood(mood: AvatarMood): void;
  setSpeaking(on: boolean): void;
  wave(): void;
  dispose(): void;
}

const SKIN = 0xe7b28c;
const SKIN_DARK = 0xd79a74;
const ROBE = 0x144f49;
const ROBE_DARK = 0x0e3b36;
const GOLD = 0xc9a452;
const HAIR = 0x2d211d;
const FEZ = 0x8f2230;
const WHITE = 0xf7f3ea;
const BROWN = 0x5a3b23;
const BLACK = 0x1a1513;
const SLIPPER = 0xd9b26a;

function mesh(
  geo: THREE.BufferGeometry,
  color: number,
  opts: { rough?: number; metal?: number } = {},
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.72,
    metalness: opts.metal ?? 0.02,
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function sphere(r: number, color: number, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const m = mesh(new THREE.SphereGeometry(r, 32, 24), color);
  m.scale.set(sx, sy, sz);
  return m;
}

function cyl(rt: number, rb: number, h: number, color: number, seg = 24): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color);
}

function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  return mesh(new THREE.BoxGeometry(w, h, d), color);
}

export function createTeacherAvatar(host: HTMLElement): TeacherAvatar {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.5, 6.15);
  camera.lookAt(0, 1.22, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "avatar-canvas";
  host.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf2fffb, 0x14302c, 2.1));
  const key = new THREE.DirectionalLight(0xfff4e2, 2.4);
  key.position.set(2.4, 4.6, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  key.shadow.bias = -0.0012;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x64e3cf, 1.15);
  rim.position.set(-3.2, 2.6, -2.4);
  scene.add(rim);

  /* ------------------------------ المنصة ------------------------------ */
  const platform = cyl(1.02, 1.08, 0.08, 0x0b332f, 64);
  platform.position.y = 0.04;
  platform.receiveShadow = true;
  scene.add(platform);
  const ring = mesh(new THREE.TorusGeometry(1.02, 0.018, 12, 96), GOLD, { metal: 0.55, rough: 0.35 });
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.085;
  scene.add(ring);

  /* ------------------------------ الشخصية ------------------------------ */
  const root = new THREE.Group();
  scene.add(root);

  // جلباب بقَصّة طويلة ضيقة عند الصدر وواسعة عند الأسفل
  const profile = [
    [0.46, 0.25],
    [0.435, 0.4],
    [0.4, 0.62],
    [0.355, 0.95],
    [0.34, 1.25],
    [0.375, 1.5],
    [0.395, 1.64],
    [0.355, 1.71],
    [0.0, 1.72],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const robe = mesh(new THREE.LatheGeometry(profile, 48), ROBE);
  root.add(robe);

  const hem = mesh(new THREE.TorusGeometry(0.462, 0.018, 10, 64), GOLD, { metal: 0.5, rough: 0.4 });
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.255;
  root.add(hem);

  const chest = sphere(0.39, ROBE, 1.04, 0.78, 0.86);
  chest.position.y = 1.62;
  root.add(chest);

  const trim = box(0.07, 1.24, 0.02, GOLD);
  trim.position.set(0, 1.02, 0.352);
  trim.rotation.x = 0.1;
  root.add(trim);
  const trimGlow = box(0.022, 1.2, 0.021, 0xe6cf8f);
  trimGlow.position.set(0, 1.02, 0.358);
  trimGlow.rotation.x = 0.1;
  root.add(trimGlow);

  const collarL = box(0.05, 0.4, 0.025, GOLD);
  collarL.position.set(-0.09, 1.56, 0.335);
  collarL.rotation.z = 0.62;
  root.add(collarL);
  const collarR = collarL.clone();
  collarR.position.x = 0.09;
  collarR.rotation.z = -0.62;
  root.add(collarR);

  const neck = cyl(0.115, 0.135, 0.22, SKIN, 24);
  neck.position.y = 1.8;
  root.add(neck);
  const collarGold = mesh(new THREE.TorusGeometry(0.13, 0.014, 8, 28), GOLD, { metal: 0.5, rough: 0.4 });
  collarGold.rotation.x = Math.PI / 2;
  collarGold.position.y = 1.74;
  root.add(collarGold);

  /* --- الرأس --- */
  const head = new THREE.Group();
  head.position.y = 2.1;
  root.add(head);

  const skull = sphere(0.315, SKIN, 1, 1.08, 0.96);
  head.add(skull);

  const ears = new THREE.Group();
  for (const s of [-1, 1]) {
    const ear = sphere(0.075, SKIN_DARK, 0.55, 1, 0.8);
    ear.position.set(0.325 * s, 0.01, 0.02);
    ears.add(ear);
  }
  head.add(ears);

  const nose = mesh(new THREE.ConeGeometry(0.042, 0.11, 20), SKIN_DARK);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.035, 0.31);
  head.add(nose);

  const eyes: THREE.Group[] = [];
  const pupils: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(0.122 * s, 0.075, 0.262);
    const white = sphere(0.064, WHITE, 1, 1, 0.5);
    eye.add(white);
    const iris = sphere(0.031, BROWN, 1, 1, 0.5);
    iris.position.z = 0.033;
    eye.add(iris);
    const pupil = sphere(0.016, BLACK, 1, 1, 0.5);
    pupil.position.z = 0.057;
    eye.add(pupil);
    pupils.push(pupil);
    const shine = sphere(0.008, 0xffffff, 1, 1, 0.5);
    shine.position.set(0.01, 0.012, 0.066);
    eye.add(shine);
    eyes.push(eye);
    head.add(eye);
  }

  const brows: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const b = box(0.12, 0.026, 0.03, HAIR);
    b.position.set(0.128 * s, 0.185, 0.276);
    b.rotation.z = -0.13 * s;
    brows.push(b);
    head.add(b);
  }

  const beard = sphere(0.215, HAIR, 1.04, 0.58, 0.5);
  beard.position.set(0, -0.255, 0.115);
  head.add(beard);

  for (const s of [-1, 1]) {
    const stache = box(0.075, 0.024, 0.028, HAIR);
    stache.position.set(0.045 * s, -0.118, 0.29);
    stache.rotation.z = 0.18 * s;
    head.add(stache);
    const side = box(0.03, 0.17, 0.075, HAIR);
    side.position.set(0.282 * s, -0.01, 0.09);
    side.rotation.z = 0.06 * s;
    head.add(side);
  }

  const mouth = new THREE.Group();
  mouth.position.set(0, -0.155, 0.288);
  head.add(mouth);
  const smile = mesh(new THREE.TorusGeometry(0.055, 0.0075, 10, 28, Math.PI), 0x7d3a34, {
    rough: 0.6,
  });
  smile.rotation.z = Math.PI;
  mouth.add(smile);
  const openMouth = sphere(0.064, 0x4a1f1c, 1, 0.42, 0.35);
  openMouth.position.z = 0.005;
  openMouth.visible = false;
  mouth.add(openMouth);

  const fez = cyl(0.165, 0.184, 0.22, FEZ, 32);
  fez.position.set(0, 0.375, 0.008);
  head.add(fez);
  const fezTop = cyl(0.166, 0.166, 0.02, 0x741824, 32);
  fezTop.position.set(0, 0.485, 0.008);
  head.add(fezTop);
  const tassel = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), 0x201416);
  tassel.position.set(0.13, 0.49, 0.05);
  tassel.rotation.z = -0.5;
  head.add(tassel);
  const tasselEnd = sphere(0.025, 0x201416);
  tasselEnd.position.set(0.16, 0.44, 0.05);
  head.add(tasselEnd);

  /* --- الذراعان --- */
  function makeArm(side: 1 | -1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.4 * side, 1.64, 0.02);
    shoulder.rotation.z = 0.3 * side;
    shoulder.rotation.x = -0.04;

    const upper = cyl(0.083, 0.073, 0.5, ROBE, 20);
    upper.position.y = -0.25;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.5;
    shoulder.add(elbow);

    const fore = cyl(0.073, 0.062, 0.44, ROBE, 20);
    fore.position.y = -0.22;
    elbow.add(fore);

    const cuff = cyl(0.066, 0.066, 0.04, GOLD, 20);
    cuff.position.y = -0.43;
    elbow.add(cuff);

    const hand = sphere(0.085, SKIN, 0.9, 1.15, 0.8);
    hand.position.y = -0.5;
    elbow.add(hand);
    const thumb = sphere(0.035, SKIN, 0.8, 1.2, 0.8);
    thumb.position.set(0.055 * side, -0.47, 0.04);
    elbow.add(thumb);

    root.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  for (const s of [-1, 1]) {
    const slipper = box(0.17, 0.08, 0.34, SLIPPER);
    slipper.position.set(0.16 * s, 0.1, 0.17);
    slipper.rotation.y = 0.05 * s;
    root.add(slipper);
    const tip = sphere(0.085, SLIPPER, 1, 0.62, 1.35);
    tip.position.set(0.16 * s, 0.11, 0.33);
    root.add(tip);
  }

  /* ------------------------------ الحركة ------------------------------ */
  const clock = new THREE.Clock();
  let mood: AvatarMood = "happy";
  let speaking = false;
  let waveUntil = 0;
  let blinkAt = 1.8;
  let blinkStart = -1;
  let targetYaw = 0;
  let targetPitch = 0;
  let raf = 0;
  let disposed = false;

  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
    const y = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
    targetYaw = THREE.MathUtils.clamp(x * 0.75, -0.4, 0.4);
    targetPitch = THREE.MathUtils.clamp(y * 0.4, -0.16, 0.2);
  };
  const onLeave = () => {
    targetYaw = 0;
    targetPitch = 0;
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);

  const resize = () => {
    const w = Math.max(240, host.clientWidth);
    const h = Math.max(280, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 38 : 32;
    camera.position.z = w / h < 0.8 ? 6.9 : 6.15;
    camera.position.y = w / h < 0.8 ? 1.58 : 1.5;
    camera.lookAt(0, 1.22, 0);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const animate = () => {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, clock.getDelta());

    root.position.y = Math.sin(t * 1.15) * 0.012;
    chest.scale.y = 0.82 + Math.sin(t * 1.7) * 0.012;
    chest.scale.x = 1.12 + Math.sin(t * 1.7) * 0.006;

    const tilt = mood === "thinking" ? 0.1 : mood === "listening" ? 0.03 : 0;
    head.rotation.y += (targetYaw + Math.sin(t * 0.55) * 0.05 - head.rotation.y) * 0.08;
    head.rotation.x += (targetPitch + Math.sin(t * 0.8) * 0.02 - head.rotation.x) * 0.08;
    head.rotation.z += (tilt + Math.sin(t * 0.4) * 0.012 - head.rotation.z) * 0.06;

    // رمش
    if (t > blinkAt && blinkStart < 0) {
      blinkStart = t;
      blinkAt = t + 2.4 + Math.random() * 3.4;
    }
    let lid = 1;
    if (blinkStart >= 0) {
      const k = (t - blinkStart) / 0.16;
      if (k >= 1) blinkStart = -1;
      else lid = Math.max(0.08, 1 - Math.sin(k * Math.PI));
    }
    for (const eye of eyes) eye.scale.y = lid;

    // الحواجب والتعابير
    const browLift = mood === "listening" ? 0.022 : mood === "thinking" ? 0.018 : 0;
    brows[0].position.y = 0.19 + browLift + Math.sin(t * 1.1) * 0.004;
    brows[1].position.y = 0.19 + browLift * 0.7;
    brows[0].rotation.z = mood === "thinking" ? 0.05 : -0.13;
    brows[1].rotation.z = 0.13;

    const smileTarget = mood === "happy" ? 1 : mood === "explain" ? 0.7 : mood === "listening" ? 0.85 : 0.25;
    smile.scale.x += (smileTarget - smile.scale.x) * 0.08;
    smile.scale.y += (smileTarget - smile.scale.y) * 0.08;

    // فتح الفم أثناء الكلام
    if (speaking) {
      const open = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 12.5)) * (0.6 + 0.4 * Math.sin(t * 5.1));
      openMouth.visible = true;
      smile.visible = false;
      openMouth.scale.set(0.95, 0.35 + open * 1.15, 0.4);
    } else {
      openMouth.visible = false;
      smile.visible = true;
    }

    // نظرة العينين نحو المؤشر
    for (const p of pupils) {
      p.position.x += (targetYaw * 0.035 - p.position.x) * 0.1;
      p.position.y += (-targetPitch * 0.03 - p.position.y) * 0.1;
    }

    // تلويح
    const waving = t < waveUntil;
    const armTarget = waving ? 2.35 + Math.sin(t * 11) * 0.18 : 0.3;
    armR.shoulder.rotation.z += (armTarget - armR.shoulder.rotation.z) * 0.12;
    const elbowTarget = waving ? -0.2 + Math.sin(t * 11) * 0.14 : -0.18;
    armR.elbow.rotation.z += (elbowTarget - armR.elbow.rotation.z) * 0.12;
    armL.shoulder.rotation.z += (-0.3 - armL.shoulder.rotation.z) * 0.12;
    armL.elbow.rotation.z += (0.18 - armL.elbow.rotation.z) * 0.1;

    // إيماءة ترحيب دورية خفيفة
    if (mood === "happy" && !waving) {
      armR.shoulder.rotation.z += Math.sin(t * 0.9) * 0.002;
    }

    renderer.render(scene, camera);
    void dt;
  };
  animate();

  return {
    setMood(m) {
      mood = m;
    },
    setSpeaking(on) {
      speaking = on;
    },
    wave() {
      waveUntil = clock.getElapsedTime() + 2.6;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
