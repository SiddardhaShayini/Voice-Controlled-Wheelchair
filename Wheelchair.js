import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Wheelchair {
  constructor(model, scene, colliders, camera, scale = 0.4) {
    this.scene = scene;
    this.colliders = colliders;
    this.camera = camera;
    this.model = model ?? this.makePlaceholder();
    this.model.scale.setScalar(scale);
    scene.add(this.model);

    // Add orbit controls
    this.orbitControls = new OrbitControls(camera, document.querySelector('canvas'));
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.1;
    this.orbitControls.minDistance = 10;
    this.orbitControls.maxDistance = 12;

    // --- CHANGE STARTS HERE ---
    // Set initial camera position to view from the back
    camera.position.set(
      this.model.position.x,
      this.model.position.y + 10,  // Keep the desired height
      this.model.position.z - 12   // Change to negative Z to be behind the wheelchair
    );
    // --- CHANGE ENDS HERE ---

    /* ---------- work out ground offset ---------- */
    this.model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(this.model);
    this.groundOffset = -bbox.min.y; // distance from pivot to wheel bottom

    /* collider (swept box) */
    const size = bbox.getSize(new THREE.Vector3()).multiplyScalar(0.6);
    this.half = size; // half-extents for swept AABB
    this.boxNow = new THREE.Box3();
    this.boxSweep = new THREE.Box3();

    /* movement */
    this.speed = 0;
    this.max = 4;
    this.acc = 2.5;
    this.dec = 3;
    this.turn = Math.PI / 2;
    this.move = { f: 0, b: 0, l: 0, r: 0 };
    this.vel = new THREE.Vector3();

    /* raycaster for collision (simple & robust) */
    this.raycaster = new THREE.Raycaster();

    // Define a fixed vertical offset for the OrbitControls target
    this.cameraTargetYOffset = 5; // Adjust this value to control how high the camera looks at the wheelchair
    this.orbitControls.target.set(
      this.model.position.x,
      this.model.position.y + this.cameraTargetYOffset,
      this.model.position.z
    );
  }

  /* -- placeholder omitted for brevity -- */

  setMoveState(k, v) {
    this.move[k] = v;
  }

  update(dt) {
    const prev = this.model.position.clone();
    const prevRot = this.model.rotation.y;

    /* integrate velocity */
    if (this.move.f) this.speed = Math.min(this.max, this.speed + this.acc * dt);
    else if (this.move.b) this.speed = Math.max(-this.max / 2, this.speed - this.acc * dt);
    else this.speed += this.speed > 0 ? -this.dec * dt : this.dec * dt;

    if (this.move.l) this.model.rotation.y += this.turn * dt;
    if (this.move.r) this.model.rotation.y -= this.turn * dt;

    const dir = new THREE.Vector3(Math.sin(this.model.rotation.y), 0,
      Math.cos(this.model.rotation.y)).normalize();
    const step = this.speed * dt;
    const next = prev.clone().addScaledVector(dir, step);

    /* raycast ahead */
    if (Math.abs(step) > 1e-4) {
      this.raycaster.set(prev, dir);
      this.raycaster.far = Math.abs(step) + 0.8;
      const hit = this.raycaster.intersectObjects(this.colliders, true);
      if (hit.length === 0) {
        this.model.position.copy(next);
      } else {
        this.speed = 0; // stop on impact
      }
    }

    /* keep wheels on ground */
    this.model.position.y = this.groundOffset;

    /* camera follow */
    const targetPosition = this.model.position.clone();
    targetPosition.y = this.model.position.y + this.cameraTargetYOffset;
    this.orbitControls.target.lerp(targetPosition, 0.3);
    this.orbitControls.update();
  }
}