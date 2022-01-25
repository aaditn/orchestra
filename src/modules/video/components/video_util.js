import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Mannequin, Male, rad, sin } from './mannequin'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { VideoActions } from './video_actions'
import { Chair, Violin, Bow, Piano } from "./models"

export class Clock {
  constructor() {
    this.t0 = null
    this.startTime = 0
    this.stopTime = 0
    this.activeTime = 0
    this.inactiveTime = 0
  }
  start() {
    this.t0 = performance.now() / 1000.0
    this.startTime = this.t0
    this.stopTime  = this.t0
  }
  getElapsedTime() {
    return (performance.now() / 1000.0 - this.t0 - this.inactiveTime)
  }
}

// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
export class Event {
  constructor(id, start, end, actor, data) {
    this.ID = id
    this.start = start   // duration start
    this.end = end     // duration end
    this.actor = actor
    this.status = 'ready'
    this.iter = 0
    this.data = data || {}
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
  all_events: {},
  bows: [],
  piano: null,

  mixer: null,
  facecap_mesh: null,
  facecap_action: null,
  gameCounter: 0,
  evtCount: 1,

  // overridden from mannequin.js
  createScene: () => {
    VideoUtil.renderer = new THREE.WebGLRenderer({ antialias: true })
    VideoUtil.renderer.setSize(1200, 750)
    VideoUtil.renderer.shadowMap.enabled = true

    VideoUtil.scene = new THREE.Scene()
    VideoUtil.scene.background = new THREE.Color('gainsboro');
    // VideoUtil.scene.fog = new THREE.Fog('gainsboro', 100, 600)

    VideoUtil.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
    VideoUtil.camera.position.set(0, 0, 300)

    const onWindowResize = (event) => {
      VideoUtil.camera.aspect = window.innerWidth / window.innerHeight
      VideoUtil.camera.updateProjectionMatrix()
      // VideoUtil.renderer.setSize(window.innerWidth, window.innerHeight, true)
    }
    window.addEventListener('resize', onWindowResize, false)
    onWindowResize()

    const texture = new THREE.TextureLoader().load("/textures/wood_floor.jpg")
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
    VideoUtil.clock = new Clock()
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
          actor = VideoUtil.facecap_mesh.getObjectByName('mesh_2')
          break
      }
      if (actor && !e.inactive) {
        VideoUtil.all_events[VideoUtil.evtCount] =
          new Event(VideoUtil.evtCount, e.start, e.end, actor, e.data)
        VideoUtil.evtCount++
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

  clearEvents: () => {
    VideoUtil.all_events = {}
  },

  loadMovieScript: async function (fileUrl) {
    const response = await fetch(fileUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    VideoUtil.movie = await response.json()
  },

  loadAssets: (doneCallback, doneVal) => {

    // load faces with textures (cannot animate)
    const modelPaths = ["/models/face1", "/models/brett_face"]
    const attachPoints = [VideoUtil.players[0].neck, VideoUtil.players[1].neck]
    const textures = []
    const promises = []
    const loader = new OBJLoader()
    modelPaths.forEach((modelPath, i) => {
      textures.push(new THREE.TextureLoader().load(modelPath + "/model.png")) // sync
      promises.push(loader.loadAsync(modelPath + "/model.obj")) // push promise for each model
    })

    // Load animatable face
    const ktx2Loader =
      new KTX2Loader()
        .setTranscoderPath('three/examples/js/libs/basis/')
        .detectSupport(VideoUtil.renderer)
    const gltfLoader = new GLTFLoader().setKTX2Loader(ktx2Loader).setMeshoptDecoder(MeshoptDecoder)
    promises.push(gltfLoader.loadAsync("/models/facecap.glb"))

    Promise.all(promises).then((allObjects) => {

      allObjects.forEach((object, i) => {

        if (i == 0 || i == 1) {

          let material = new THREE.MeshBasicMaterial({ map: textures[i] })
          object.scale.set(40, 40, 40)
          object.rotation.y = Math.PI / 2
          object.position.set(1, 4, 0)
          object.traverse(function (child) {
            if (child instanceof THREE.Mesh) child.material = material
          })
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
          // VideoUtil.facecap_action.setLoop(THREE.LoopRepeat, 2)
          // VideoUtil.facecap_action.play()
          VideoUtil.players[2].head.attach(VideoUtil.facecap_mesh)

        }
      }) // close allObjects.forEach
      // Process event data after assets are loaded
      VideoUtil.processEventData(VideoUtil.movie.events)
      VideoUtil.clock.start()

      doneCallback(doneVal) // callback after assets loaded
    }) // end of Promise.all
  },

  initScene: (doneCallback, doneVal) => {
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
        actor.r_finger1.attach(bow)
        VideoUtil.bows.push(bow)
      }
      VideoUtil.loadAssets(doneCallback, doneVal)

      VideoUtil.scene.add(new Chair(25, 180), new Chair(-25, 0))
      VideoUtil.piano = new Piano({x: 0, y:0, z: 30}, {x: 0, y: 0, z: 0})
      VideoUtil.scene.add(VideoUtil.piano)

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


  queueMoveBow: (playerIdx, sched, duration, upbow, strNum, fingerNum) => {
    let player = VideoUtil.players[playerIdx]
    // Put the left finger down

    /*
    for (let i = 1; i < 4; i++) { // finger numbers
      if (i == fingerNum) {
        let pos = {}
        pos['l_finger' + i] = [{bend: [60, 50]}, [{turn: [-90, -90]}]]
        let evt = new Event( VideoUtil.evtCount, sched, sched + duration, player, {
          action: "posture", run_once: true, posture: [pos]
        })
        VideoUtil.all_events[VideoUtil.evtCount++] = evt
        // player['l_finger' + i].bend = 60
        // player['l_finger' + i].turn = -90
      } else {
        let pos = {}
        pos['l_finger' + i] = [{bend: [40, 40]}, [{turn: [-80, -80]}]]
        let evt = new Event( VideoUtil.evtCount, sched, sched + duration, player, {
          action: "posture", run_once: true, posture: [pos]
        })
        VideoUtil.all_events[VideoUtil.evtCount++] = evt
        // player['l_finger' + i].bend = 40
        // player['l_finger' + i].turn = -80
      }
    }
    */

    let evt = new Event( VideoUtil.evtCount, sched, sched + duration, player, {
          action: "posture", run_once: true,
          posture: [{r_arm: [{straddle: [75 + strNum * 5, 75 + strNum * 5]}]}]
    })
    VideoUtil.all_events[VideoUtil.evtCount++] = evt
    if (upbow) { // Execute up bow
      let evt = new Event( VideoUtil.evtCount, sched, sched + duration, player, {
            action: "posture",
            posture: [{r_elbow: [{bend: [75, 135]}]}, {r_wrist: [{tilt: [28.5, -28.5]}]}]
      })
      VideoUtil.all_events[VideoUtil.evtCount++] = evt
    } else { // Execute down bow
      let evt = new Event( VideoUtil.evtCount, sched, sched + duration, player, {
            action: "posture",
            posture: [{r_elbow: [{bend: [135, 75]}]}, {r_wrist: [{tilt: [-28.5, 28.5]}]}]
      })
      VideoUtil.all_events[VideoUtil.evtCount++] = evt
    }
  },

  queuePianoKey: (playerIdx, sched, duration, note) => {
    const keyIdx = VideoUtil.piano.keyMap[note] || 0
    if (keyIdx == 0) {
      console.log("ALERT: ", note)
    }
    const playedKey = VideoUtil.piano.keys[keyIdx]
    let evt = new Event( VideoUtil.evtCount, sched, sched, playedKey, {
      action: "move", run_once: true,
      endPos: {x: playedKey.position.x, y: playedKey.position.y - 0.5, z: playedKey.position.z}
    })
    VideoUtil.all_events[VideoUtil.evtCount++] = evt
    evt = new Event( VideoUtil.evtCount, sched + duration * 0.75, sched + duration * 0.75, playedKey, {
      action: "move", run_once: true,
      endPos: {x: playedKey.position.x, y: playedKey.position.y, z: playedKey.position.z}
    })
    VideoUtil.all_events[VideoUtil.evtCount++] = evt
  },

  drawFrame: () => {
    VideoUtil.animate(VideoUtil.clock.getElapsedTime())
    VideoUtil.renderer.render(VideoUtil.scene, VideoUtil.camera)
  },

  animate: (t) => {
    VideoUtil.gameCounter++
    if (VideoUtil.gameCounter >= 1000000) VideoUtil.gameCounter = 0
    if (VideoUtil.gameCounter % 10 == 0) {
      // console.log("t = ", t, " count = ", VideoUtil.gameCounter)
      // const player = VideoUtil.players[1]
      // console.log("POSTURE l_finger: ", player.l_arm.posture)
    }

    // cycle through events and process as needed
    for (let evtId in VideoUtil.all_events) {
      const evt = VideoUtil.all_events[evtId]
      const start = evt.start
      const end = evt.end
      switch (evt.status) {
        case 'ready':
          if (evt.data.run_once) { // no duration event, only start time needed
            if (t >= start) {
              evt.status = 'done' // bypass active state for run_once
              VideoUtil.processEvent(t, evt)
            }
          } else if (t >= start) { // default event has duration
            evt.status = 'active'
            evt.data.t0 = t
            VideoUtil.processEvent(t, evt) // first time
          }
          break;
        case 'active':
          if (t >= start && t <= end) {
            VideoUtil.processEvent(t, evt, false) // 0 < t < T
          } else { // post-process here if needed
            evt.status = 'done' // t >= T
            VideoUtil.processEvent(t, evt, true) // reset if appropriate
          }
          break
        case 'done':
          // do nothing
          delete VideoUtil.all_events[evtId]
          break
        default:
          break
      }
    }

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
