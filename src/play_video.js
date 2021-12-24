class Chair extends THREE.Group {
  constructor(x, angle) {
    super();

    this.position.set(x, -25, 0);
    this.rotation.y = rad(angle);

    Mannequin.colors[4] = 'darksalmon';

    var seat = new LimbShape(false, [16, 10, 16, 0, 270, 1, 0.2, 0], 20, 20);

    var backrest = new LimbShape(false, [3, 30, 6, -90, 270, 1, 0.5, 0], 50, 10);
    backrest.position.set(-9, 16, 0);
    backrest.rotation.set(0, 0, rad(20));

    var cussion = new THREE.Mesh(
      new THREE.SphereBufferGeometry(6.8, 20, 10, 0, 2 * Math.PI, 0, Math.PI / 2),
      new THREE.MeshPhongMaterial({ color: 'black' }));
    cussion.scale.set(1, 0.25, 1);
    cussion.position.set(0, 4, 0);

    this.add(seat, cussion, backrest);
  }
}

class Violin extends THREE.Group {
  constructor(x, y, angle) {
    super();

    this.position.set(x, y, -5);
    this.rotation.y = rad(angle);
    this.rotation.z = rad(-10);

    let head = new THREE.Mesh( new THREE.CylinderGeometry(0.75, 0.75, 5, 32),
      new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    head.scale.set(1, 0.25, 1); head.rotation.z = rad(90); head.position.set(0, 4, 0);
    head.castShadow = true;

    let fboard = new THREE.Mesh( new THREE.BoxGeometry(7, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x000000 }));
    fboard.scale.set(1, 0.25, 1); fboard.position.set(-4, 4, 0);
    fboard.castShadow = true;

    let body1 = new THREE.Mesh( new THREE.CylinderGeometry(3, 3, 4, 32),
    new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body1.scale.set(1, 0.25, 1); body1.position.set(-7, 3, 0);
    body1.castShadow = true;

    let body2 = new THREE.Mesh( new THREE.CylinderGeometry(4, 4, 4, 32),
    new THREE.MeshLambertMaterial({ color: 0xfb8e00 }));
    body2.scale.set(1, 0.25, 1); body2.position.set(-12, 3, 0);
    body2.castShadow = true;

    let chinrest = new THREE.Mesh( new THREE.CylinderGeometry(1.25, 1.25, 1, 32),
    new THREE.MeshLambertMaterial({ color: 0x0f0f0f }));
    chinrest.scale.set(1, 0.25, 1); chinrest.position.set(-15, 3.5, -1);

    let string1 = new THREE.Mesh( new THREE.CylinderGeometry(0.08, 0.08, 55, 32),
    new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string1.scale.set(1, 0.25, 1); string1.rotation.z = rad(90); string1.position.set(-8, 4.3, 0.2);

    let string2 = new THREE.Mesh( new THREE.CylinderGeometry(0.08, 0.08, 55, 32),
    new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    string2.scale.set(1, 0.25, 1); string2.rotation.z = rad(90); string2.position.set(-8, 4.3, -0.2);

    this.add(head, fboard, body1, body2, chinrest, string1, string2);
  }
}

class Bow extends THREE.Group {
  constructor(x, angle) {
    super();

    this.position.set(-1, 0, 0);
    this.rotation.z = rad(-90);

    let bowwood = new THREE.Mesh( new THREE.BoxGeometry(0.2, 0.2, 30),
      new THREE.MeshLambertMaterial({ color: 0xfa0a0a }));
    bowwood.scale.set(1, 1, 1); bowwood.position.set(0, 0.5, 15);
    bowwood.castShadow = true;
    
    let bowhair = new THREE.Mesh( new THREE.BoxGeometry(0.2, 0.2, 30),
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

class Smartphone extends THREE.Group {
  constructor() {
    super();

    Mannequin.colors[4] = 'dimgray';

    var body = new LimbShape(false, [1 / 2, 3.5, 6, -1, 1, 1, 0.2, 0.001], 8, 8);

    Mannequin.colors[4] = 'white';

    var screen = new LimbShape(false, [0.47, 3, 5.5, -1, 1, 1, 0.2, 0.001], 8, 8);
    screen.position.x = -0.02;

    this.add(body, screen);
  }
}

function createScene2() {
  prevt = 0
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(1200, 750);
  // renderer.domElement.style = 'width:300px; height:300px; position:fixed; top:0; left:0;';
  renderer.shadowMap.enabled = true;
  renderer.setAnimationLoop(drawFrame);
  document.getElementById("x").appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('gainsboro');
  // scene.fog = new THREE.Fog('gainsboro', 100, 600);

  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 150);

  light = new THREE.PointLight('white', 0.7);
  light.position.set(0, 100, 50);
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.castShadow = true;
  scene.add(light, new THREE.AmbientLight('white', 0.5));

  function onWindowResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // renderer.setSize(window.innerWidth, window.innerHeight, true);
  }
  window.addEventListener('resize', onWindowResize, false);
  onWindowResize();

  const texture = new THREE.TextureLoader().load( "/textures/wood_floor.jpg" );
  var ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1000, 1000),
    new THREE.MeshPhongMaterial(
      {
        color: 'antiquewhite',
        shininess: 1,
        map: texture
      })
  );
  ground.receiveShadow = true;
  ground.position.y = -29.5;
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  scene.rotation.x = rad(20)
  controls = new THREE.OrbitControls (camera, renderer.domElement);
  clock = new THREE.Clock();
}

const createPlayer = (instrument, pos, rot) => {
  const player = new Male();
  player.position.set(pos.x, pos.y, pos.z);
  player.rotation.y = rot
  player.turn = 180;
  player.bend = -40;
  player.torso.bend = 30;
  player.torso.turn = 0;
  player.torso.tilt = 0;

  player.l_leg.straddle = 10;
  player.l_leg.raise = 70;
  player.l_knee.bend = 100;
  player.l_ankle.bend = 0;

  player.r_leg.straddle = 10;
  player.r_leg.raise = 65;
  player.r_leg.turn = -25;
  player.r_knee.bend = 100;

  player.r_arm.straddle = 90;
  player.r_arm.raise = -67; // -70
  player.r_arm.tilt = 0;
  player.r_elbow.bend = 0;
  player.r_wrist.tilt = -10;
  player.r_wrist.bend = 0;
  // player.r_wrist.turn = -10;
  // player.r_fingers.bend = 90;
  player.r_fingers[0].bend = 60;
  player.r_fingers[1].bend = 60;
  player.r_fingers[2].bend = 60;
  player.r_fingers[3].bend = 60;
  

  player.l_arm.raise = 35;
  player.l_arm.straddle = 10;
  player.l_arm.turn = -10;
  player.l_elbow.bend = 75;
  player.l_elbow.turn = 0;
  player.l_wrist.tilt = -50;
  player.l_wrist.bend = 0;
  player.l_wrist.turn = 155;
  // player.l_fingers.bend = 40;
  // player.l_fingers.turn = -80;
  player.l_fingers[0].bend = 40;
  player.l_fingers[0].turn = -80;
  player.l_fingers[1].bend = 40;
  player.l_fingers[1].turn = -80;
  player.l_fingers[2].bend = 40;
  player.l_fingers[2].turn = -80;
  player.l_fingers[3].bend = 40;
  player.l_fingers[3].turn = -80;

  return player
}

const renderScene = () => {
  createScene2();
  players = []
  players.push(createPlayer("violin", {x: 25, y: -17, z: 0}, 0))
  players.push(createPlayer("violin", {x: -25, y: -17, z: 0}, Math.PI))
}

const moveBow = (playerIdx, upbow, speed, note, strNum, fingerNum) => {
  let t = -30
  let msecs  = Math.floor(30 * speed)
  let player = players[playerIdx]
  // Put the left finger down
  for( let i = 1; i < 5; i++ ) { // finger numbers
    if ( i == fingerNum ) {
      player.l_fingers[i-1].bend = 60;
      player.l_fingers[i-1].turn = -90;
    } else {
      player.l_fingers[i-1].bend = 40;
      player.l_fingers[i-1].turn = -80;
    }
  }
  if (upbow) {
    // Execute up bow
    player.r_arm.straddle = 90 + strNum * 5 // play on default string
    let intvl = setInterval(() => {
      player.r_elbow.bend = (90 + 30 * sin(2 * 1.7 * t));
      player.r_wrist.tilt = (-28.5 * sin(2 * 1.7 * t));
      if (t >= 30) {
        clearInterval(intvl)
      }
      t += 1
    }, msecs)
  } else {
    // Execute down bow
    player.r_arm.straddle = 90 + strNum * 5 // play on default string
    let intvl = setInterval(() => {
      const tdown = 0 - t
      player.r_elbow.bend = (90 + 30 * sin(2 * 1.7 * tdown));
      player.r_wrist.tilt = (-28.5 * sin(2 * 1.7 * tdown));
      
      if (t >= 30) {
        clearInterval(intvl)
      }
      t += 1
    }, msecs)
  }
}

const loadFaceAndAttach = (loader, modelPath, attachPoint) => {
  let texture = new THREE.TextureLoader().load( modelPath + "/model.png" )
  let material = new THREE.MeshBasicMaterial({ map: texture})
  loader.load(
    modelPath + "/model.obj",
    (object) => {
      object.scale.set(40, 40, 40)
      object.rotation.y = Math.PI/2
      object.position.set(1, 4, 0)
  
      object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.material = material
        }
      });
      attachPoint.attach(object);
    }
  )
}

function animate(t) {
  controls.update();

  /*
  var looking = 15 * sin(t),
    reading = 25 * cos(1.2 * t) * sin(0.7 * t),
    k = Math.min(1.5, Math.pow(sin(0.37 * t) * 0.5016 + 0.5, 300));
  */
  if (t - prevt > 300) {
    // console.log("t =", t, " prevt =", prevt, " sin = ", sin(2 * 1.7 * t))
    // prevt = t
    // moveBow(bowdir, 1)
    // bowdir = !bowdir // reverse bowdir for next note
  }

  /*
  man.head.turn = reading * (1 - k);
  man.head.nod = 15 * (1 - k) - k * looking;

  man.l_ankle.bend = -5 + 10 * Math.pow(sin(t), 34);
  man.r_ankle.bend = -5 + 10 * Math.pow(sin(t + 90), 34);
  */

  /*
  k = Math.min(1.5, Math.pow(sin(0.37 * t + 10) * 0.5016 + 0.5, 100));
  players[0].r_leg.raise = 85 + 0.5 * sin(3.4 * t);
  players[0].r_knee.bend = (80 + 5 * sin(2 * 1.7 * t)) * (1 - k) + k * 45;
  players[0].r_ankle.bend = -20 - 10 * sin(2 * 1.7 * t);
  */

  // play violin
  /*
  players[0].r_elbow.bend = (90 + 30 * sin(2 * 1.7 * t));
  players[0].r_wrist.tilt = (-30 * sin(2 * 1.7 * t)); 
  */
  
  /*
  players[0].head.turn = 25 * cos(0.7 * t);
  players[0].head.nod = 35 + 5 * cos(0.8 * t);
  */

  // scene.rotation.x = t / 1000;
}

renderScene()

scene.add( new Chair(25, 180), new Chair(-25, 0));

players[0].torso.attach(new Violin(17, 7, 20));
players[1].torso.attach(new Violin(17, 7, 20));
players[0].r_fingers[0].attach(new Bow())
players[1].r_fingers[0].attach(new Bow())

const loader = new OBJLoader();
loadFaceAndAttach(loader, "/models/face1", players[0].neck)
loadFaceAndAttach(loader, "/models/brett_face", players[1].neck)

