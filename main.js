import * as THREE from "three";
import { City } from "./City.js";
import { Wheelchair } from "./Wheelchair.js";
import { Controls } from "./Controls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const WHEELCHAIR_SCALE = 0.4;   // 40 % of original

let scene, camera, renderer;
let city, wheelchair, controls;
let collidables;                // NOTE: will point to the city’s array
const clock = new THREE.Clock();

function init() {
  /* ---------- Scene ---------- */
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

  /* ---------- Camera ---------- */
  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 5, 10);

  /* ---------- Renderer ---------- */
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.85);
  dir.position.set(50, 60, 40);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = dir.shadow.camera.bottom = -120;
  dir.shadow.camera.right = dir.shadow.camera.top = 120;
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 300;
  scene.add(dir);

  /* ---------- Ground ---------- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshStandardMaterial({ color: 0x777777, side: THREE.DoubleSide })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---------- City ---------- */
  city = new City(scene, () => {
    console.log("City ready");
    collidables = city.getCollidables();   // ← live reference

    /* ---------- Wheelchair (only after city is ready) ---------- */
    new GLTFLoader().load(
      "https://raw.githubusercontent.com/SidduEarth/WheelchairProject/main/wheelchair-steve.glb",
      (gltf) => {
        gltf.scene.scale.setScalar(WHEELCHAIR_SCALE);
        wheelchair = new Wheelchair(
          gltf.scene, scene, collidables, camera, WHEELCHAIR_SCALE
        );
        controls = new Controls(wheelchair);
      },
      undefined,
      (err) => console.error("Wheelchair load error:", err)
    );
  });

  window.addEventListener("resize", onResize);
  animate();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (wheelchair) wheelchair.update(dt);
  renderer.render(scene, camera);
}

/* ---------- Kick things off ---------- */
init();
