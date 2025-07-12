import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class City {
  constructor(scene, onReady = () => { }) {
    this.scene = scene;
    this.collidables = [];               // ← here we store actual meshes
    this.loader = new GLTFLoader().setPath(
      "https://raw.githubusercontent.com/SidduEarth/WheelchairProject/refs/heads/main/assets/"
    );
    this.build(onReady);
  }

  /* cache loader */
  async load(name) {
    if (!this.cache) this.cache = {};
    if (!this.cache[name]) {
      const gltf = await this.loader.loadAsync(`${name}.gltf`);
      this.cache[name] = gltf.scene;
    }
    return this.cache[name];
  }

  async build(done) {
    /* roads – exactly like your very first working version */
    const roadW = 10, block = 30, grid = 10;
    const matRoad = new THREE.MeshStandardMaterial({ color: 0x444444 });
    for (let i = -grid / 2; i <= grid / 2; i++) {
      const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(roadW, grid * block), matRoad);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(i * block - roadW / 2, 0.01, 0);
      roadZ.receiveShadow = true; this.scene.add(roadZ);

      const roadX = new THREE.Mesh(new THREE.PlaneGeometry(grid * block, roadW), matRoad);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.01, i * block - roadW / 2);
      roadX.receiveShadow = true; this.scene.add(roadX);
    }

    /* load one of every asset once */
    const bNames = [
      "building_A", "building_B", "building_C", "building_D",
      "building_E", "building_F", "building_G", "building_H"
    ];
    const bushName = "bush";
    await Promise.all([...bNames, bushName].map(n => this.load(n)));

    /* populate grid */
    const B_SCALE = 4.5;         // buildings
    const S_SCALE = 2.2;         // shrub/bush

    for (let i = -5; i < 5; i++) {
      for (let j = -5; j < 5; j++) {
        /* random building */
        const bMesh = (await this.load(bNames[Math.random() * bNames.length | 0])).clone(true);
        bMesh.scale.setScalar(B_SCALE);
        bMesh.position.set(i * block + block / 2 - roadW / 2, 0, j * block + block / 2 - roadW / 2);
        this.addCollidable(bMesh);

        /* decorative bush */
        const shrub = (await this.load(bushName)).clone(true);
        shrub.scale.setScalar(S_SCALE);
        shrub.position.copy(bMesh.position).add(new THREE.Vector3(-7, 0, 7));
        this.addCollidable(shrub);
      }
    }
    done();
  }

  /** adds mesh to scene & collidables */
  addCollidable(mesh) {
    mesh.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
    this.scene.add(mesh);
    this.collidables.push(mesh);
  }

  getCollidables() { return this.collidables; }
}
