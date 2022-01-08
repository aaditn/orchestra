import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Mannequin, Male, rad, sin } from './mannequin'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { VideoActions } from './video_actions'
import { Chair, Violin, Bow } from "./models"

// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
class Event {
  constructor(start, end, actor, data) {
    this.start = start   // duration start
    this.end = end     // duration end
    this.actor = actor
    this.data = data
    this.status = 'ready'
    this.data.t0 = null
  }
}

//-------- START VideoUtil --------//
const VideoUtil = {
  scene: null,
  camera: null,
  renderer: null,
  lights: [],
  clock: null,
  controls: null,
  movie: {},
  players: [],
  all_events: [],
  bows: [],

  mixer: null,
  facecap_mesh: null,
  facecap_action: null,
  testcount: 0,

  // overridden from mannequin.js
  createScene: () => {
    VideoUtil.renderer = new THREE.WebGLRenderer({ antialias: true });
    VideoUtil.renderer.setSize(1200, 750);
    // renderer.domElement.style = 'width:300px; height:300px; position:fixed; top:0; left:0;';
    VideoUtil.renderer.shadowMap.enabled = true;
    VideoUtil.renderer.setAnimationLoop(VideoUtil.drawFrame);
    document.getElementById("three-scene").appendChild(VideoUtil.renderer.domElement);

    VideoUtil.scene = new THREE.Scene();
    VideoUtil.scene.background = new THREE.Color('gainsboro');
    // VideoUtil.scene.fog = new THREE.Fog('gainsboro', 100, 600);

    VideoUtil.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
    VideoUtil.camera.position.set(0, 0, 300);

    const onWindowResize = (event) => {
      VideoUtil.camera.aspect = window.innerWidth / window.innerHeight;
      VideoUtil.camera.updateProjectionMatrix();
      // VideoUtil.renderer.setSize(window.innerWidth, window.innerHeight, true);
    }
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    const texture = new THREE.TextureLoader().load("/textures/wood_floor.jpg");
    var ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1000, 1000),
      new THREE.MeshPhongMaterial({
        color: 'antiquewhite',
        shininess: 1,
        map: texture
      })
    );
    ground.receiveShadow = true;
    ground.position.y = -29.5;
    ground.rotation.x = -Math.PI / 2;
    VideoUtil.scene.add(ground);

    VideoUtil.scene.rotation.x = rad(10)
    VideoUtil.controls = new OrbitControls(VideoUtil.camera, VideoUtil.renderer.domElement);
    VideoUtil.clock = new THREE.Clock();
  },

  processActorData: (actorData) => {
    const actor = new Male()
    actor.head.hide()

    const pos = actorData.position
    const rot = actorData.rotation
    const posture = actorData.posture
    actor.ID = actorData.ID
    if (pos) {
      actor.position.set(pos.x, pos.y, pos.z)
    }
    if (rot) {
      actor.rotation.x = rot.x
      actor.rotation.y = rot.y
      actor.rotation.z = rot.z
    }
    // posture needs to be an array, order of transformations matters
    for (let i in posture) {
      const postureElem = posture[i]
      for (let postureKey in postureElem) {
        if (typeof postureElem[postureKey] == "object") {
          for (let subkey in postureElem[postureKey]) {
            actor[postureKey][subkey] = postureElem[postureKey][subkey]
          }
        } else {
          actor[postureKey] = postureElem[postureKey]
        }
      }
    }
    return actor
  },

  processLightData: (ldata) => {
    let light
    switch (ldata.type) {
      case "PointLight":
        light = new THREE.PointLight(ldata.color, ldata.intensity)
        light.ID = ldata.ID
        if (ldata.position) {
          light.position.set(ldata.position.x, ldata.position.y, ldata.position.z)
        }
        if ("mapSize.width" in ldata) {
          light.shadow.mapSize.width = ldata["mapSize.width"]
        }
        if ("mapSize.height" in ldata) {
          light.shadow.mapSize.height = ldata["mapSize.height"]
        }
        if (ldata.castShadow) {
          light.castShadow = ldata.castShadow
        }
        break
      case "SpotLight":
        light = new THREE.SpotLight(ldata.color, ldata.intensity)
        light.ID = ldata.ID
        if (ldata.position) {
          light.position.set(ldata.position.x, ldata.position.y, ldata.position.z)
        }
        if ("mapSize.width" in ldata) {
          light.shadow.mapSize.width = ldata["mapSize.width"]
        }
        if ("mapSize.height" in ldata) {
          light.shadow.mapSize.height = ldata["mapSize.height"]
        }
        if (ldata.castShadow) light.castShadow = ldata.castShadow
        if (ldata.angle) light.angle = ldata.angle
        if (ldata.target) { // connect light to target if specified
          if (ldata.target.actor == "player") {
            light.target = VideoUtil.players[ldata.target.actor_id]
          }
        }
        break
      case "DirectionalLight":
        light = new THREE.DirectionalLight(ldata.color, ldata.intensity)
        light.ID = ldata.ID
        break
      case "AmbientLight":
        light = new THREE.AmbientLight(ldata.color, ldata.intensity)
        light.ID = ldata.ID
        break
    }
    return light
  },

  processEventData: (evtsData) => {
    // Handle (movie) event data after assets have been loaded
    const eventsData = VideoUtil.movie.events
    let actor
    evtsData.forEach((e) => {
      switch (e.actor_type) {
        case "player":
          actor = VideoUtil.players[e.actor_id]
          break
        case "light":
          actor = VideoUtil.lights[e.actor_id]
          break
        case "influence":
          // actor = VideoUtil.facecap_mesh.getObjectByName('mesh_2')
          break
      }
      if (actor) {
        VideoUtil.all_events.push(new Event(e.start, e.end, actor, e.data))
      }
    })
  },

  processEvent: (t, evt, reset) => {
    const action = evt.data.action // actions are "walk", "sit", "rotate" etc.
    if (action in VideoActions) {
      VideoActions[action](t, evt, reset)
    } else {
      console.log("ACTION not found: ", action)
      // action not found, default
    }
  },

  /*
  // have to figure how to posture fingers in movie file
  // may need a separate posture, rather than current initial posture
  createPlayer: (instrument, pos, rot) => {
    const player = new Male()

    player.r_fingers[0].bend = 60;
    player.r_fingers[1].bend = 60;
    player.r_fingers[2].bend = 60;
    player.r_fingers[3].bend = 60;

    player.l_fingers[0].bend = 40;
    player.l_fingers[0].turn = -80;
    player.l_fingers[1].bend = 40;
    player.l_fingers[1].turn = -80;
    player.l_fingers[2].bend = 40;
    player.l_fingers[2].turn = -80;
    player.l_fingers[3].bend = 40;
    player.l_fingers[3].turn = -80;
    return player
  },
  */

  loadMovieScript: async function (fileUrl) {
    const response = await fetch(fileUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    VideoUtil.movie = await response.json()
  },

  loadAssets: () => {

    // load faces with textures (cannot animate)
    const modelPaths   = ["/models/face1", "/models/brett_face"]
    const attachPoints = [VideoUtil.players[0].neck, VideoUtil.players[1].neck]
    const textures = []
    const promises = []
    const loader   = new OBJLoader()
    modelPaths.forEach((modelPath, i) => {
      textures.push(new THREE.TextureLoader().load(modelPath + "/model.png")) // sync
      promises.push(loader.loadAsync(modelPath + "/model.obj")) // push promise for each model
    })

    // Load animatable face
    /*
    const ktx2Loader =
      new KTX2Loader()
        .setTranscoderPath('../node_modules/three/examples/js/libs/basis/')
        .detectSupport(VideoUtil.renderer)
    promises.push(new GLTFLoader().setKTX2Loader(ktx2Loader)
                      .setMeshoptDecoder(MeshoptDecoder)
                      .loadAsync("/models/facecap.glb")) 
    */
    const ktx2Loader =
    new KTX2Loader()
      .setTranscoderPath('three/examples/js/libs/basis/')
      .detectSupport(VideoUtil.renderer)
    const gltfLoader = new GLTFLoader().setKTX2Loader(ktx2Loader).setMeshoptDecoder(MeshoptDecoder)
    const gltfPromise = gltfLoader.loadAsync("/models/facecap.glb")  
    promises.push(gltfPromise)       

    Promise.all(promises).then((allObjects) => {

      allObjects.forEach((object, i) => {

        if (i == 0 || i == 1) {

          let material = new THREE.MeshBasicMaterial({ map: textures[i] })
          object.scale.set(40, 40, 40)
          object.rotation.y = Math.PI / 2
          object.position.set(1, 4, 0)
          object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
              child.material = material
            }
          });
          attachPoints[i].attach(object)

        } else if (i == 2) { // animatable face
          // Load face with influences
          // from head.morphTargetDIctionary + head.morephTargetInfluences
          VideoUtil.facecap_mesh = object.scene.children[0]
          VideoUtil.facecap_mesh.position.set(2, 2, 0)
          VideoUtil.facecap_mesh.rotation.y = Math.PI / 2
          VideoUtil.facecap_mesh.scale.set(37, 37, 37)

          VideoUtil.scene.add(VideoUtil.facecap_mesh);
          VideoUtil.mixer = new THREE.AnimationMixer(VideoUtil.facecap_mesh)
          // console.log("ANIMATIONS: ", gltf.animations)
          // VideoUtil.facecap_action = VideoUtil.mixer.clipAction(gltf.animations[0])
          let head = VideoUtil.facecap_mesh.getObjectByName('mesh_2');
          const dict = head.morphTargetDictionary
          console.log("HEAD: ", head, " DICT: ", dict)
          // VideoUtil.facecap_action.setLoop(THREE.LoopRepeat, 2)
          // VideoUtil.facecap_action.play()
          VideoUtil.players[2].head.attach(VideoUtil.facecap_mesh)

        }
      }) // close allObjects.forEach
      // Process event data after assets are loaded
      VideoUtil.processEventData(VideoUtil.movie.events)

    }) // end of Promise.all
  },

  initScene: () => {
    VideoUtil.createScene()
    Mannequin.texHead = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAGFBMVEX////Ly8v5+fne3t5GRkby8vK4uLi/v7/GbmKXAAAAZklEQVRIx2MYQUAQHQgQVkBtwEjICkbK3MAkQFABpj+R5ZkJKTAxImCFSSkhBamYVgiQrAADEHQkIW+iqiBCAfXjAkMHpgKqgyHgBiwBRfu4ECScYEZGvkD1JxEKhkA5OVTqi8EOAOyFJCGMDsu4AAAAAElFTkSuQmCC");
    Mannequin.texLimb = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEX////Ly8vsgL9iAAAAHElEQVQoz2OgEPyHAjgDjxoKGWTaRRkYDR/8AAAU9d8hJ6+ZxgAAAABJRU5ErkJggg==");

    VideoUtil.players = []

    // Load movie script
    VideoUtil.loadMovieScript("/data/movie/concert1.json").then(() => {

      // handle actor data
      const actorsData = VideoUtil.movie.actors
      actorsData.forEach((actorData) => {
        const actor = VideoUtil.processActorData(actorData)
        VideoUtil.players.push(actor)
      })
      for (let i = 0; i < 2; i++) { // violin + bow for player[0], player[1]
        const actor = VideoUtil.players[i]
        // actor.torso.attach(new Violin(17, 7, 20))
        actor.neck.attach(new Violin({ x: 17, y: -8, z: -5 }, { x: 0, y: 20, z: -10 }))
        const bow = new Bow()
        actor.r_fingers[0].attach(bow)
        VideoUtil.bows.push(bow)
      }
      VideoUtil.loadAssets()

      VideoUtil.scene.add(new Chair(25, 180), new Chair(-25, 0))

      // handle lights
      const lights = VideoUtil.movie.lights
      lights.forEach((l) => {
        let light = VideoUtil.processLightData(l)
        if (light) {
          VideoUtil.scene.add(light)
          VideoUtil.lights.push(light)
        }
      })

    })

  },

  moveBow: (playerIdx, upbow, speed, note, strNum, fingerNum) => {
    let t = -30
    let msecs = Math.floor(30 * speed)
    let player = VideoUtil.players[playerIdx]
    // Put the left finger down
    for (let i = 1; i < 5; i++) { // finger numbers
      if (i == fingerNum) {
        player.l_fingers[i - 1].bend = 60
        player.l_fingers[i - 1].turn = -90
      } else {
        player.l_fingers[i - 1].bend = 40
        player.l_fingers[i - 1].turn = -80
      }
    }
    if (upbow) {
      // Execute up bow
      player.r_arm.straddle = 90 + strNum * 5 // play on default string
      let intvl = setInterval(() => {
        player.r_elbow.bend = (90 + 30 * sin(2 * 1.7 * t))
        player.r_wrist.tilt = (-28.5 * sin(2 * 1.7 * t))
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
        player.r_elbow.bend = (90 + 30 * sin(2 * 1.7 * tdown))
        player.r_wrist.tilt = (-28.5 * sin(2 * 1.7 * tdown))
        if (t >= 30) {
          clearInterval(intvl)
        }
        t += 1
      }, msecs)
    }
  },

  // refresh rate is every 50ms
  drawFrame: () => {
    VideoUtil.animate(50 * VideoUtil.clock.getElapsedTime());
    VideoUtil.renderer.render(VideoUtil.scene, VideoUtil.camera);
  },

  // animate loop (runs ~50ms right now)
  animate: (t) => {
    // test animation for model from face cap

    VideoUtil.testcount++
    if (VideoUtil.testcount >= 100000) VideoUtil.testcount = 0
    if (VideoUtil.facecap_mesh) {
      const head = VideoUtil.facecap_mesh.getObjectByName('mesh_2')
      const influences = head.morphTargetInfluences
      // VideoUtil.mixer.update(0.015)
      const tval = (VideoUtil.testcount % 200) * 0.01
      const infs = [24, 28]
      if (tval <= 1) {
        for (let i in infs) influences[infs[i]] = tval
      } else {
        for (let i in infs) influences[infs[i]] = 2 - tval
      }
    }

    // cycle through events and process as needed
    VideoUtil.all_events.forEach((evt) => {
      const start = evt.start
      const end = evt.end
      const instant = start >= end
      evt.instant = instant
      switch (evt.status) {
        case 'ready':
          if (evt.instant) { // no duration event, only start time needed
            if (t >= start) {
              evt.status = 'done' // bypass active for instant
              VideoUtil.processEvent(t, evt) // instant
            }
          } else if (t >= start && t <= end) { // default event has duration
            // console.log("EVT active: ", evt)
            evt.status = 'active'
            evt.data.t0 = t
            VideoUtil.processEvent(t, evt) // first time
          }
          break;
        case 'active':
          if (t >= start && t <= end) {
            VideoUtil.processEvent(t, evt, false) // 0 < t < T
          } else {
            evt.status = 'done' // t >= T
            // console.log("EVT done: ", evt)
            // post-process here if needed
            VideoUtil.processEvent(t, evt, true) // reset if appropriate
          }
          break
        case 'done':
          // do nothing
          break
        default:
          break
      }
    })

  },

}

export { VideoUtil }

/*
  browInnerUp: 0
  browDown_L: 1
  browDown_R: 2
  browOuterUp_L: 3
  browOuterUp_R: 4
  eyeLookUp_L: 5
  eyeLookUp_R: 6
  eyeLookDown_L: 7
  eyeLookDown_R: 8
  eyeLookIn_L: 9
  eyeLookIn_R: 10
  eyeLookOut_L: 11
  eyeLookOut_R: 12
  eyeBlink_L: 13
  eyeBlink_R: 14
  eyeSquint_L: 15
  eyeSquint_R: 16
  eyeWide_L: 17
  eyeWide_R: 18
  cheekPuff: 19
  cheekSquint_L: 20
  cheekSquint_R: 21
  noseSneer_L: 22
  noseSneer_R: 23
  jawOpen: 24
  jawForward: 25
  jawLeft: 26
  jawRight: 27
  mouthFunnel: 28
  mouthPucker: 29
  mouthLeft: 30
  mouthRight: 31
  mouthRollUpper: 32
  mouthRollLower: 33
  mouthShrugUpper: 34
  mouthShrugLower: 35
  mouthClose: 36
  mouthSmile_L: 37
  mouthSmile_R: 38
  mouthFrown_L: 39
  mouthFrown_R: 40
  mouthDimple_L: 41
  mouthDimple_R: 42
  mouthUpperUp_L: 43
  mouthUpperUp_R: 44
  mouthLowerDown_L: 45
  mouthLowerDown_R: 46
  mouthPress_L: 47
  mouthPress_R: 48
  mouthStretch_L: 49
  mouthStretch_R: 50
  tongueOut: 51
*/