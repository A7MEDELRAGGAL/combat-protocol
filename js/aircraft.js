import * as THREE from "../vendor/three.module.js";

/**
 * Tactical Cargo Transport Aircraft (C-130 Hercules style) and Parachute System.
 * Pure Three.js procedural geometry — 0 external textures or runtime dependencies.
 */

function makeMaterial(color, roughness = 0.65, metalness = 0.25) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

export function createCargoPlane() {
  const group = new THREE.Group();
  group.name = "cargo-aircraft";

  const fuselageMat = makeMaterial(0x283029, 0.7, 0.2); // Military olive-slate
  const bellyMat = makeMaterial(0x1d221e, 0.75, 0.15); // Underside dark coat
  const wingMat = makeMaterial(0x2f3730, 0.65, 0.25); // Wings and stabilizers
  const trimMat = makeMaterial(0x141715, 0.5, 0.4); // Panel lines and accents
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x224455,
    roughness: 0.15,
    metalness: 0.85,
    transparent: true,
    opacity: 0.8,
  });
  const hazardMat = makeMaterial(0xd9a84e, 0.6, 0.1); // Hazard yellow
  const engineMat = makeMaterial(0x1a1e1b, 0.55, 0.45);
  const propMat = makeMaterial(0x0e110f, 0.4, 0.6);

  // Main fuselage body (Length: 26m, Width: 4.8m, Height: 4.2m)
  const bodyGeo = new THREE.BoxGeometry(4.8, 4.2, 24);
  const bodyMesh = new THREE.Mesh(bodyGeo, fuselageMat);
  bodyMesh.position.set(0, 0, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Fuselage lower belly
  const bellyGeo = new THREE.BoxGeometry(4.4, 1.2, 22);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -2.1, -1);
  group.add(bellyMesh);

  // Aerodynamic nose cone and cockpit
  const noseGeo = new THREE.ConeGeometry(2.4, 5.5, 8);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, fuselageMat);
  noseMesh.position.set(0, -0.2, 14.2);
  group.add(noseMesh);

  // Cockpit glass canopy
  const cockpitGeo = new THREE.BoxGeometry(3.2, 1.4, 3.2);
  const cockpitMesh = new THREE.Mesh(cockpitGeo, glassMat);
  cockpitMesh.position.set(0, 1.3, 11.8);
  group.add(cockpitMesh);

  // Main wings (Wingspan: 36m, Chord: 4.2m, Thickness: 0.4m)
  const wingGeo = new THREE.BoxGeometry(36, 0.45, 4.4);
  const wingMesh = new THREE.Mesh(wingGeo, wingMat);
  wingMesh.position.set(0, 2.1, 1.2);
  wingMesh.castShadow = true;
  group.add(wingMesh);

  // Wingtip navigation lights
  const redNavLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  );
  redNavLight.position.set(-18.1, 2.1, 1.2);
  group.add(redNavLight);

  const greenNavLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x22ff44 }),
  );
  greenNavLight.position.set(18.1, 2.1, 1.2);
  group.add(greenNavLight);

  // 4 Turboprop Engine Nacelles and spinning Propellers
  const propGroups = [];
  const enginePositions = [-12.5, -6.2, 6.2, 12.5];
  for (const engX of enginePositions) {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.85, 4.6, 10), engineMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(engX, 1.2, 2.2);
    nacelle.castShadow = true;
    group.add(nacelle);

    // Propeller assembly (4 blades)
    const propGroup = new THREE.Group();
    propGroup.position.set(engX, 1.2, 4.6);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 8), trimMat);
    spinner.rotation.x = Math.PI / 2;
    propGroup.add(spinner);

    for (let b = 0; b < 4; b += 1) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 0.04), propMat);
      blade.position.y = 1.05;
      blade.rotation.z = (b * Math.PI) / 2;
      propGroup.add(blade);
    }
    group.add(propGroup);
    propGroups.push(propGroup);
  }

  // Tail assembly: Vertical fin & rudder
  const finGeo = new THREE.BoxGeometry(0.5, 6.8, 5.2);
  const finMesh = new THREE.Mesh(finGeo, wingMat);
  finMesh.position.set(0, 4.6, -10.5);
  finMesh.castShadow = true;
  group.add(finMesh);

  // Horizontal tailplanes (Elevators)
  const tailplaneGeo = new THREE.BoxGeometry(13.5, 0.35, 3.2);
  const tailplaneMesh = new THREE.Mesh(tailplaneGeo, wingMat);
  tailplaneMesh.position.set(0, 6.2, -11.2);
  group.add(tailplaneMesh);

  // Open Rear Cargo Ramp: angled down at ~30 degrees for airborne insertion
  const rampGroup = new THREE.Group();
  rampGroup.position.set(0, -1.8, -12);
  rampGroup.rotation.x = 0.52; // Angled down
  const rampGeo = new THREE.BoxGeometry(4.0, 0.22, 5.4);
  const rampMesh = new THREE.Mesh(rampGeo, trimMat);
  rampMesh.position.set(0, 0, -2.5);
  rampGroup.add(rampMesh);

  // Hazard striped warning border on ramp edge
  const hazardStripe = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 0.4), hazardMat);
  hazardStripe.position.set(0, 0.02, -5.1);
  rampGroup.add(hazardStripe);
  group.add(rampGroup);

  // Interior Jump Indicator Lights (Red standby, Green go)
  const jumpLightRed = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff1111 }),
  );
  jumpLightRed.position.set(-1.8, 1.2, -10.8);
  group.add(jumpLightRed);

  const jumpLightGreen = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x11ff22 }),
  );
  jumpLightGreen.position.set(1.8, 1.2, -10.8);
  group.add(jumpLightGreen);

  return {
    group,
    propGroups,
    jumpLightRed,
    jumpLightGreen,
    update(dt) {
      const rot = dt * 28;
      for (const prop of propGroups) {
        prop.rotation.z += rot;
      }
    },
    setJumpReady(ready) {
      jumpLightGreen.visible = ready;
      jumpLightRed.visible = !ready;
    },
  };
}

/**
 * Creates a tactical military parachute canopy.
 */
export function createParachuteModel() {
  const group = new THREE.Group();
  group.name = "tactical-parachute";

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xd88235, // High-vis tactical orange
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const darkPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1f2320, // Stealth charcoal
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  const cordMat = new THREE.LineBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.75,
  });

  // Domed canopy (Radius: 3.4m, segmented dome)
  const canopyGeo = new THREE.SphereGeometry(3.6, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48);
  const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
  canopyMesh.position.y = 5.2;
  canopyMesh.scale.set(1.2, 0.7, 1.2);
  group.add(canopyMesh);

  // Contrast dark central ring
  const ringGeo = new THREE.TorusGeometry(3.5, 0.12, 6, 24);
  ringGeo.rotateX(Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, darkPanelMat);
  ringMesh.position.y = 5.1;
  ringMesh.scale.set(1.2, 1, 1.2);
  group.add(ringMesh);

  // Suspension cords (8 rigging lines from canopy edge to player harness)
  const linePositions = [];
  const segments = 8;
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const topX = Math.cos(angle) * 4.1;
    const topZ = Math.sin(angle) * 4.1;
    const topY = 5.0;

    // Connects to harness point at y = 1.2
    linePositions.push(topX, topY, topZ, 0, 1.2, 0);
  }
  const linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const linesMesh = new THREE.LineSegments(linesGeo, cordMat);
  group.add(linesMesh);

  return {
    group,
    update(dt, velocity = 6) {
      // Gentle sway based on descent
      group.rotation.z = Math.sin(performance.now() * 0.003) * 0.04;
      group.rotation.x = Math.cos(performance.now() * 0.0025) * 0.03;
    },
  };
}
