import { Thermostat } from '@mui/icons-material';
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

    let head = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    head.scale.set(1, 0.25, 1); head.rotation.z = rad(90); head.position.set(2, 4, 0);
    head.castShadow = true;

    let fboard = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x000000 }));
    fboard.scale.set(1, 0.25, 1); fboard.position.set(-4, 4, 0);
    fboard.castShadow = true;

    let body1 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 4, 24),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body1.scale.set(1, 0.25, 1); body1.position.set(-7, 3, 0);
    body1.castShadow = true;

    let body2 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 24),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body2.scale.set(1, 0.25, 1); body2.position.set(-12, 3, 0);
    body2.castShadow = true;

    /*
    let chinrest = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1, 32),
      new THREE.MeshLambertMaterial({ color: 0x0f0f0f }));
    chinrest.scale.set(1, 0.25, 1); chinrest.position.set(-15, 3.5, -1);
    */

    let string1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 70, 4),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string1.scale.set(1, 0.25, 1); string1.rotation.z = rad(90); string1.position.set(-6, 4.3, 0.2);

    let string2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 70, 4),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string2.scale.set(1, 0.25, 1); string2.rotation.z = rad(90); string2.position.set(-6, 4.3, -0.2);

    this.add(head, fboard, body1, body2, string1, string2) // chinrest)
  }
}


export class Cello extends Violin {
  constructor(pos, rot) {
    super(pos, rot)
    this.scale.set(2.5, 2.5, 2.5)
    /*
    this.position.set(pos.x, pos.y, pos.z)
    this.rotation.x = rad(rot.x)
    this.rotation.y = rad(rot.y)
    this.rotation.z = rad(rot.z)

    let head = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 5, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }))
    head.scale.set(1, 0.25, 1); head.rotation.z = rad(90); head.position.set(2, 4, 0);
    head.castShadow = true

    let fboard = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x000000 }))
    fboard.scale.set(1, 0.25, 1); fboard.position.set(-4, 4, 0);
    fboard.castShadow = true

    let body1 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 4, 24),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }))
    body1.scale.set(1, 0.25, 1); body1.position.set(-7, 3, 0);
    body1.castShadow = true

    let body2 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }))
    body2.scale.set(1, 0.25, 1); body2.position.set(-12, 3, 0);
    body2.castShadow = true

    let chinrest = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1, 32),
      new THREE.MeshLambertMaterial({ color: 0x0f0f0f }));
    chinrest.scale.set(1, 0.25, 1); chinrest.position.set(-15, 3.5, -1);

    let string1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 70, 32),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }))
    string1.scale.set(1, 0.25, 1); string1.rotation.z = rad(90); string1.position.set(-6, 4.3, 0.2)

    let string2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 70, 32),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string2.scale.set(1, 0.25, 1); string2.rotation.z = rad(90); string2.position.set(-6, 4.3, -0.2);

    this.add(head, fboard, body1, body2, chinrest, string1, string2)
    */
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

export class Piano extends THREE.Group {
  constructor(pos, rot) {
    super();
    this.keys = []
    this.keyMap = {}
    this.position.set(pos.x, pos.y, pos.z)
    this.rotation.x = rot.x
    this.rotation.y = rot.y
    this.rotation.z = rot.z

    const BASELEN = 50
    const pianoMaterial = new THREE.MeshLambertMaterial({ color: 0xa48444 })
    let base = new THREE.Mesh(new THREE.BoxGeometry(BASELEN, 1, 6), pianoMaterial)
    base.position.set(0, -9, 0); // base.castShadow = true

    let back = new THREE.Mesh(new THREE.BoxGeometry(BASELEN, 30, 1), pianoMaterial)
    back.position.set(0, -12, -4); base.add(back)

    // 84 keys on the keyboard: C1 .. B7
    let keyCount  = 0
    let note      = null
    const noteMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    for (let octave = 0; octave < 7; octave++) {
      for (let i = 0; i < 7; i++) {
        const wmaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee })
        let whitekey = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 5), wmaterial)
        whitekey.position.set(i + octave * 7 - BASELEN/2 + 1, 1.2, 0)
        this.keys.push(whitekey)
        note = noteMap[i] + (octave + 1)
        this.keyMap[note] = keyCount; keyCount++


        if (i != 2 && i != 6) {
          const bmaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })
          let blackkey = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 3), bmaterial)
          blackkey.position.set(i + octave * 7 - BASELEN/2 + 1.5, 1.75, -0.5)
          this.keys.push(blackkey)
          note = noteMap[i] + "#" + (octave + 1) // sharp of same key
          this.keyMap[note] = keyCount
          note = noteMap[(i+1)%7] + "b" + (octave + 1) // flat of next note
          this.keyMap[note] = keyCount
          keyCount++
        }
      }
    }
    this.keys.forEach(key => {
      base.add(key) // ; key.castShadow = true
    })

    this.add(base)
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