import * as THREE from 'three'
import { Mannequin, LimbShape, rad } from './mannequin'

export class Chair extends THREE.Group {
  constructor(x, angle) {
    super();
    this.position.set(x, -25, 0);
    this.rotation.y = rad(angle);
    Mannequin.colors[4] = 'darksalmon';
    let seat = new LimbShape(false, [16, 10, 16, 0, 270, 1, 0.2, 0], 20, 20);
    let backrest = new LimbShape(false, [3, 30, 6, -90, 270, 1, 0.5, 0], 50, 10);
    backrest.position.set(-9, 16, 0);
    backrest.rotation.set(0, 0, rad(20));

    let cussion = new THREE.Mesh(
      new THREE.SphereBufferGeometry(6.8, 20, 10, 0, 2 * Math.PI, 0, Math.PI / 2),
      new THREE.MeshPhongMaterial({ color: 'black' })
    );
    cussion.scale.set(1, 0.25, 1);
    cussion.position.set(0, 4, 0);
    this.add(seat, cussion, backrest);
  }
}

export class Violin extends THREE.Group {
  constructor(pos, rot) {
    super();
    this.position.set(pos.x, pos.y, pos.z)
    this.rotation.x = rad(rot.x);
    this.rotation.y = rad(rot.y);
    this.rotation.z = rad(rot.z);

    let head = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 5, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    head.scale.set(1, 0.25, 1); head.rotation.z = rad(90); head.position.set(0, 4, 0);
    head.castShadow = true;

    let fboard = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x000000 }));
    fboard.scale.set(1, 0.25, 1); fboard.position.set(-4, 4, 0);
    fboard.castShadow = true;

    let body1 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body1.scale.set(1, 0.25, 1); body1.position.set(-7, 3, 0);
    body1.castShadow = true;

    let body2 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 4, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body2.scale.set(1, 0.25, 1); body2.position.set(-12, 3, 0);
    body2.castShadow = true;

    let chinrest = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1, 32),
      new THREE.MeshLambertMaterial({ color: 0x0f0f0f }));
    chinrest.scale.set(1, 0.25, 1); chinrest.position.set(-15, 3.5, -1);

    let string1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 55, 32),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string1.scale.set(1, 0.25, 1); string1.rotation.z = rad(90); string1.position.set(-8, 4.3, 0.2);

    let string2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 55, 32),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string2.scale.set(1, 0.25, 1); string2.rotation.z = rad(90); string2.position.set(-8, 4.3, -0.2);

    this.add(head, fboard, body1, body2, chinrest, string1, string2);
  }
}

export class Bow extends THREE.Group {
  constructor(x, angle) {
    super();
    this.position.set(-1, 0, 0);
    this.rotation.z = rad(-90);
    let bowwood = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 30),
      new THREE.MeshLambertMaterial({ color: 0xfa0a0a }));
    bowwood.scale.set(1, 1, 1); bowwood.position.set(0, 0.5, 15);
    bowwood.castShadow = true;
    let bowhair = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 30),
      new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }));
    bowhair.scale.set(1, 1, 1); bowhair.position.set(0, 0, 15);
    bowwood.castShadow = true;
    this.add(bowwood, bowhair);
  }
}

class Mask extends THREE.Group {
  constructor(zScale = 1, color = 'lightgray') {
    super();

    var geometry, material, mask, thread;

    geometry = new THREE.CylinderBufferGeometry(3, 3, 2.4, 6, 1, true, rad(45), rad(90));
    material = new THREE.MeshBasicMaterial({ color: color });
    mask = new THREE.Mesh(geometry, material);

    mask.scale.x = 1.25;
    mask.scale.z = 0.85;
    mask.position.x = -0.5;
    mask.position.y = 2;
    mask.rotation.z = rad(-25);

    geometry = new THREE.CylinderBufferGeometry(3, 3, 0.1, 26, 1, true);
    thread = new THREE.Mesh(geometry, material);
    thread.scale.x = 0.65;
    thread.scale.z = 1.1 * zScale;
    thread.position.x = (3 - 3 * thread.scale.x) / 2;
    thread.position.y = -1.2;
    mask.add(thread);

    thread = new THREE.Mesh(geometry, material);
    thread.scale.x = 0.9;
    thread.scale.z = 1.2;
    thread.position.x = (3 - 3 * thread.scale.x) / 2;
    thread.position.y = 1.2;
    mask.add(thread);

    this.add(mask);
  }
}