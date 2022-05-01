import * as THREE from 'three'
import * as Tone from 'tone'
import PubSub from 'pubsub-js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Mannequin, Male, rad} from './mannequin'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { VideoActions } from './video_actions'
import { Chair, Violin, Cello, Bow, Piano } from "./models"
import { Clock, Event, EventStream } from "../../event/event_util"
import { ThirtyFpsSharp } from '@mui/icons-material'

//-------- START VideoUtil --------//
const VideoUtil = {
  scene: null,
  camera: null,
  renderer: null,
  lights: [],
  clock: null,
  movie: {},
  sceneSpec: {},
  players: {},
  eventStream: null,
  posAudio: null,
  startTime: 0,
  running: false,

  facecap_mesh: null,
  facecap_action: null,
  gameCounter: 0,

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
    // const listener = new THREE.AudioListener()
    // VideoUtil.camera.add( listener )
    // const posAudio = new THREE.PositionalAudio( listener )

    const onWindowResize = (event) => {
      VideoUtil.camera.aspect = window.innerWidth / window.innerHeight
      VideoUtil.camera.updateProjectionMatrix()
      // VideoUtil.renderer.setSize(window.innerWidth, window.innerHeight, true)
    }
    window.addEventListener('resize', onWindowResize, false)
    onWindowResize()

    const floorTexture = new THREE.TextureLoader().load("/textures/wood_floor.jpg")
    const ground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1000, 1000),
      new THREE.MeshPhongMaterial({
        color: 'antiquewhite', side: THREE.DoubleSide,
        shininess: 1, map: floorTexture })
    )
    ground.receiveShadow = true
    ground.position.y = -29.5
    ground.rotation.x = -Math.PI/2
    VideoUtil.scene.add(ground)

    // Dome
    const points = []
    for ( let i = 0; i < 20; i ++ ) {
	    points.push( new THREE.Vector2( Math.cos( i/20 * Math.PI/2 ) * 10 , i * 0.5 ))
    }
    const wallTexture = new THREE.TextureLoader().load("/textures/wall.jpg")
    const dome = new THREE.Mesh(
      new THREE.LatheGeometry( points, 12, 0.0 * Math.PI, 2 * Math.PI ),
      new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: wallTexture })
    )
    dome.receiveShadow = true
    dome.scale.set(40, 40, 40)
    dome.position.y = ground.position.y
    VideoUtil.scene.add(dome)


    VideoUtil.scene.rotation.x = rad(10)
    const controls = new OrbitControls(VideoUtil.camera, VideoUtil.renderer.domElement);
    VideoUtil.clock = new Clock()
  },

  getPlayerPlacement: () => {
    return { 
      violin: [
        {position: {x: -40, y: 3, z: 0}, rotation: {x: 0, y: Math.PI/2, z: 0}},
        {position: {x: -25, y: 3, z: -25}, rotation: {x: 0, y: Math.PI/4, z: 0}},
        {position: {x: -70, y: 3, z: 0}, rotation: {x: 0, y: Math.PI/2, z: 0}},
        {position: {x: -50, y: 3, z: -50}, rotation: {x: 0, y: Math.PI/4, z: 0}},
        {position: {x: -100, y: 3, z: 0}, rotation: {x: 0, y: Math.PI/2, z: 0}},
        {position: {x: -75, y: 3, z: -75}, rotation: {x: 0, y: Math.PI/4, z: 0}},
        {position: {x: -130, y: 3, z: 0}, rotation: {x: 0, y: Math.PI/2, z: 0}},
        {position: {x: -100, y: 3, z: -100}, rotation: {x: 0, y: Math.PI/4, z: 0}},
      ],
      cello: [
        {position: {x: 40, y: -11, z: 0}, rotation: {x: 0, y: -Math.PI/2, z: 0}},
        {position: {x: 25, y: -11, z: -25}, rotation: {x: 0, y: -Math.PI/4, z: 0}},
        {position: {x: 70, y: -11, z: 0}, rotation: {x: 0, y: -Math.PI/2, z: 0}},
        {position: {x: 50, y: 11, z: -50}, rotation: {x: 0, y: -Math.PI/4, z: 0}},
      ],
      piano: [
        // {position: {x: 0, y: -10, z: -80}, rotation: {x: 0, y: -1/6 * Math.PI, z: 0}},
        // {position: {x: 75, y: -10, z: -75}, rotation: {x: 0, y: -1.25 * Math.PI, z: 0}},
        {position: {x: -30, y: -10, z: 50}, rotation: {x: 0, y: -1.125 * Math.PI, z: 0}},
        {position: {x: 30, y: -10, z: 50}, rotation: {x: 0, y: -0.875 * Math.PI, z: 0}},

      ]
    }
  },

  // Remove children of scene
  clearScene: () => {
    let i = VideoUtil.scene.children.length
    while (i--) {
      const child = VideoUtil.scene.children[i]
      if (
        child instanceof Male || child instanceof Chair || child instanceof Piano ||
        child instanceof THREE.SpotLight ||
        child instanceof THREE.AmbientLight || child instanceof THREE.PointLight) {
        VideoUtil.scene.children.splice(i, 1)
      }
    }
  },

  // layout scene triggered by choice of song, done dynamically
  // sceneSpec specifies how many players (position) and what type
  layoutScene: () => {
    VideoUtil.eventStream = new EventStream()
    VideoUtil.players = {}
    VideoUtil.lights  = []

    // handle actor data
    const playerArr = VideoUtil.sceneSpec.players
    if (playerArr) {
      playerArr.forEach((playerSpec) => {
        let bow, evt
        const now = Tone.now()
        const player = VideoUtil.processPlayerSpec(playerSpec)
        player.instrumentType = playerSpec.instrumentType
        VideoUtil.players[player.ID] = player
        switch (playerSpec.instrumentType) {
          case "violin":
          case "viola":
            evt = new Event( VideoUtil.eventStream, now, now, player, {
              action: "posture", run_once: true,
              posture: [
                {l_arm: [{raise: [0,45]}, {straddle: [0,0]}, {turn: [0,-5]}]},
                {l_elbow: [{bend: [0,75]}, {turn: [0,0]}]},
                {l_wrist: [{tilt: [0,-60]}, {bend: [0,-10]}, {turn: [0,170]}]},
              ]
            })
            VideoUtil.eventStream.addEvent(evt)
            const violin = new Violin({ x: 17, y: -7, z: -5 }, { x: 0, y: 10, z: -5 })
            player.neck.attach(violin)
            bow = new Bow()
            player.r_finger1.attach(bow)
            player.instrument = violin
            break;
          case "cello":

            evt = new Event( VideoUtil.eventStream, now, now, player, {
              action: "posture", run_once: true,
              posture: [
                {l_leg: [{raise: [0,90]}, {straddle: [0, 45]}]}, {l_knee: [{bend: [0,100]}]},
                {r_leg: [{raise: [0,90]}, {straddle: [0, 45]}]}, {r_knee: [{bend: [0,100]}]},
                {l_arm: [{raise: [0,45]}, {straddle: [0,10]}, {turn: [0,-25]}]},
                {l_elbow: [{bend: [0,110]}, {turn: [0,10]}]},
                {l_wrist: [{tilt: [0,40]}, {bend: [0,-10]}, {turn: [0,0]}]},
              ]
            })
            VideoUtil.eventStream.addEvent(evt)
            const cello = new Cello({ x: 3, y: 0, z: 0 }, { x: 0, y: 180, z: 80 })
            player.neck.attach(cello)
            bow = new Bow()
            player.r_finger1.attach(bow)
            player.instrument = cello
            break
          case "piano":
            evt = new Event( VideoUtil.eventStream, now, now, player, {
              action: "posture", run_once: true,
              posture: [
                {torso: [{bend: [0,0]}]},
                {l_leg: [{raise: [0,90]}]}, {l_knee: [{bend: [0,100]}]},
                {r_leg: [{raise: [0,90]}]}, {r_knee: [{"bend": [0,100]}]},
                {l_arm: [{straddle: [0,0]}]},
                {l_elbow: [{bend: [0,90]}, {turn: [0,0]}]},
                {l_wrist: [{tilt: [0,0]}, {turn: [0,90]}]},
                {r_arm: [{straddle: [0,0]}]},
                {r_elbow: [{bend: [0,90]}, {turn: [0,0]}]},
                {r_wrist: [{tilt: [0,0]}, {turn: [0,90]}]}
              ]
            })
            VideoUtil.eventStream.addEvent(evt)
            /*
            {l_arm: [{straddle: [0,0]}]}, // paramt = 1 (middle of keyboard)
            {l_elbow: [{bend: [0,90]}, {turn: [0,0]}]},
            {l_wrist: [{tilt: [0,10]}, {turn: [0,90]}]}

            {l_arm: [{straddle: [0,50]}]}, // paramt = 0 (lowest note)
            {l_elbow: [{bend: [0,45]}]},
            {l_wrist: [{tilt: [0,-40]}, {turn: [0,150]}]}
            */

            const p = player.position; const r = player.rotation
            const piano = new Piano(
              {x: p.x + 12 * Math.sin(r.y), y: p.y + 13, z: p.z + 12 * Math.cos(r.y)},
              {x: r.x, y: r.y + 1 * Math.PI, z: r.z}
            )
            player.instrument = piano
            VideoUtil.scene.add(piano)
            break;
        }
        if (playerSpec.light) {
          playerSpec.light.target = {actor: "player", actor_id: player.ID}
          const light = VideoUtil.processLightData(playerSpec.light)
          if (light) {
            VideoUtil.scene.add(light)
            VideoUtil.lights.push(light)
          }
        }
      }) // forEach((playerSpec)
      // cache these one-off events and playback in event loop
      const now = VideoUtil.clock.getElapsedTime()
      VideoUtil.eventStream.setSortedEvents()
      VideoUtil.eventStream.computeCurrPtr(now)
      VideoUtil.eventStream.cacheActive(0, now + 5)
    } // if (playerArr)

    // handle independent lights (not tied to actors)
    const lightsArr = VideoUtil.sceneSpec.lights
    if (lightsArr) {
      lightsArr.forEach((lightSpec) => {
        const light = VideoUtil.processLightData(lightSpec)
        if (light) {
          VideoUtil.scene.add(light)
          VideoUtil.lights.push(light)
        }
      })
    }
  },

  initScene: (doneCallback = null, doneVal) => {
    VideoUtil.createScene()
    Mannequin.texHead = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAGFBMVEX////Ly8v5+fne3t5GRkby8vK4uLi/v7/GbmKXAAAAZklEQVRIx2MYQUAQHQgQVkBtwEjICkbK3MAkQFABpj+R5ZkJKTAxImCFSSkhBamYVgiQrAADEHQkIW+iqiBCAfXjAkMHpgKqgyHgBiwBRfu4ECScYEZGvkD1JxEKhkA5OVTqi8EOAOyFJCGMDsu4AAAAAElFTkSuQmCC");
    Mannequin.texLimb = new THREE.TextureLoader().load("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAQMAAACQp+OdAAAABlBMVEX////Ly8vsgL9iAAAAHElEQVQoz2OgEPyHAjgDjxoKGWTaRRkYDR/8AAAU9d8hJ6+ZxgAAAABJRU5ErkJggg==");

    VideoUtil.players = {}
    VideoUtil.sceneSpec = { players: [], lights: [] }
    VideoUtil.layoutScene()
    VideoUtil.loadAssets(doneCallback, doneVal)

    // Load movie script
    /*
    VideoUtil.loadMovieScript("/data/movie/concert1.json").then(() => {

      // handle actor data
      const actorsData = VideoUtil.movie.actors
      actorsData.forEach((actorData) => {
        const actor = VideoUtil.processPlayerSpec(actorData)
        actor.instrumentType = actorSpec.instrumentType
        VideoUtil.players[actor.ID] = actor
        VideoUtil.players.push(actor)
      })
      for (let i = 0; i < 2; i++) { // violin + bow for player[0], player[1]
        const actor = VideoUtil.players[i]
        // actor.torso.attach(new Violin(17, 7, 20))
        actor.neck.attach(new Violin({ x: 17, y: -8, z: -5 }, { x: 0, y: 20, z: -10 }))
        const bow = new Bow()
        actor.r_finger1.attach(bow)
      }
      VideoUtil.loadAssets(doneCallback, doneVal)

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
    */
  },

  attachRendererToDOM: () => {
    document.getElementById("three-scene").appendChild(VideoUtil.renderer.domElement)
  },

  // Move to general util file
  makeId: (len) => {
    let res      = ''
    const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charsLen = chars.length
    for ( var i = 0; i < len; i++ ) {
      res += chars.charAt(Math.floor(Math.random() * charsLen))
    }
    return res
  },

  processPlayerSpec: (actorData) => {
    const actor = new Male()
    actor.ID  = VideoUtil.makeId(4)
    // actor.head.hide()

    const pos = actorData.position
    const rot = actorData.rotation
    if (pos) {
      actor.position.set(pos.x, pos.y, pos.z)
    }
    if (rot) {
      actor.rotation.x = rot.x
      actor.rotation.y = rot.y
      actor.rotation.z = rot.z
    }
    return actor
  },

  processLightData: (ldata) => {
    let light
    if (ldata.inactive) {
      return null
    }
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
    let actor
    if (evtsData) {
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
          VideoUtil.eventStream.addEvent(
            new Event(VideoUtil.eventStream, e.start, e.end, actor, e.data)
          )
        }
      })
    }
  },

  processEvent: (t, evt, reset) => {
    const action = evt.data.action // actions are "walk", "sit", "rotate" etc.
    if (action in VideoActions) {
      // console.log("EVENT: ", evt)
      VideoActions[action](t, evt, reset)
    } else {
      console.log("ACTION not found: ", action)
      // action not found, default
    }
  },

  clearEvents: () => {
    VideoUtil.eventStream.all = {}
    VideoUtil.eventStream.active = {}
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
    const attachPoints = [] // = [VideoUtil.players[0].neck, VideoUtil.players[1].neck]
    for (let actor_id in VideoUtil.players) {
      const actor = VideoUtil.players[actor_id]
      attachPoints.push(actor.neck)
    }
    
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

          /*
          let material = new THREE.MeshBasicMaterial({ map: textures[i] })
          object.scale.set(40, 40, 40)
          object.rotation.y = Math.PI / 2
          object.position.set(1, 4, 0)
          object.traverse(function (child) {
            if (child instanceof THREE.Mesh) child.material = material
          })
          attachPoints[i].attach(object)
          */

        } else if (i == 2) { // animatable face
          // Load face with influences
          // from head.morphTargetDIctionary + head.morephTargetInfluences
          /*
          VideoUtil.facecap_mesh = object.scene.children[0]
          VideoUtil.facecap_mesh.position.set(2, 2, 0)
          VideoUtil.facecap_mesh.rotation.y = Math.PI / 2
          VideoUtil.facecap_mesh.scale.set(37, 37, 37)

          VideoUtil.scene.add(VideoUtil.facecap_mesh);
          const mixer = new THREE.AnimationMixer(VideoUtil.facecap_mesh)
          VideoUtil.players[2].head.attach(VideoUtil.facecap_mesh)
          */

        }
      }) // close allObjects.forEach
      // Process event data after assets are loaded
      /*
      VideoUtil.processEventData(VideoUtil.movie.events)
      */
      VideoUtil.clock.start()

      if (doneCallback) {
        doneCallback(doneVal) // callback after assets loaded
      }
    }) // end of Promise.all
  },

  // instrumentType in ['violin', 'cello']
  queueMoveBow: (player, instrumentType, sched, duration, upbow, strNum, fingerNum) => {
    let evt
    // left-hand fingers
    for (let i = 1; i <= 4; i++) { // finger numbers
      if (i == fingerNum) {
        let pos = {}
        pos['l_finger' + i] = [{bend: [60, 60]}]
        evt = new Event( VideoUtil.eventStream, sched, sched, player, {
          action: "posture", run_once: true, posture: [pos]
        })
        VideoUtil.eventStream.addEvent(evt)
      } else {
        let pos = {}
        pos['l_finger' + i] = [{bend: [40, 40]}]
        evt = new Event( VideoUtil.eventStream, sched, sched, player, {
          action: "posture", run_once: true, posture: [pos]
        })
        VideoUtil.eventStream.addEvent(evt)
      }
    }

    // right arm for the right string
    switch (instrumentType) {
      case "violin":
        evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
              action: "posture", run_once: true,
              posture: [{r_arm: [{straddle: [65 + strNum * 5, 65 + strNum * 5]}]}]
        })
        VideoUtil.eventStream.addEvent(evt)

        // up-bow or down-bow
        if (upbow) { // Execute up bow
          evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
                action: "posture",
                posture: [
                  {r_elbow: [{bend: [75, 135]}]},
                  {r_wrist: [{tilt: [30, -30]}, {turn: [0,-5]}]}
                ]
          })
          VideoUtil.eventStream.addEvent(evt)
        } else { // Execute down bow
          evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
                action: "posture",
                posture: [
                  {r_elbow: [{bend: [135, 75]}]},
                  {r_wrist: [{tilt: [-30, 30]},  {turn: [-5,0]}]
                }]
          })
          VideoUtil.eventStream.addEvent(evt)
        }
        break
      case "cello":
        evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
          action: "posture", run_once: true,
          posture: [{r_arm: [
            {straddle: [50 + strNum * 0, 50 + strNum * 0]},
            {raise: [40, 40]},
            {bend: [50, 50]}
          ]}]
        })
        VideoUtil.eventStream.addEvent(evt)

        // up-bow or down-bow
        if (upbow) { // Execute up bow
          evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
                action: "posture",
                posture: [
                  {r_elbow: [{bend: [-10, 50]}]},
                  {r_wrist: [{tilt: [25, -25]}, {turn: [-50,-50]}, {bend: [40, 60]}]}
                ]
          })
          VideoUtil.eventStream.addEvent(evt)
        } else { // Execute down bow
          evt = new Event( VideoUtil.eventStream, sched, sched + duration, player, {
                action: "posture",
                posture: [
                  {r_elbow: [{bend: [50, -10]}]},
                  {r_wrist: [{tilt: [-25, 25]},  {turn: [-50,-50]}, {bend: [60, 40]}]
                }]
          })
          VideoUtil.eventStream.addEvent(evt)
        }
        break;
      }
  },

  queuePianoKey: (player, sched, duration, note) => {
    if (player && player.instrument) {
      const piano = player.instrument
      const keyIdx = piano.keyMap[note] || 0
      if (keyIdx == 0) {
        console.log("ALERT: ", note)
      }
      // total of 84 keys, 0 - 41 on left, 42 - 83 on right
      let paramt = null
      if (keyIdx < 42) {
        paramt = keyIdx / 42.0
        evt = new Event( VideoUtil.eventStream, sched, sched, player, {
          action: "posture", run_once: true,
          posture: [
            {l_arm: [{straddle: [0,50-50*paramt]}]}, 
            {l_elbow: [{bend: [0,45+45*paramt]}, {turn: [0,0]}]},
            {l_wrist: [{tilt: [0,-40+50*paramt]}, {turn: [0,150-60*paramt]}]}
          ]
        })
        VideoUtil.eventStream.addEvent(evt)
      } else {
        paramt = (keyIdx - 42) / 42.0
        evt = new Event( VideoUtil.eventStream, sched, sched, player, {
          action: "posture", run_once: true,
          posture: [
            {r_arm: [{straddle: [0,0+50*paramt]}]}, 
            {r_elbow: [{bend: [0,90-45*paramt]}]},
            {r_wrist: [{tilt: [0,10+40*paramt]}, {turn: [0,90+60*paramt]}]}
          ]
          /*
          {l_arm: [{straddle: [0,0]}]}, // paramt = 1 (middle of keyboard)
          {l_elbow: [{bend: [0,90]}]},
          {l_wrist: [{tilt: [0,10]}, {turn: [0,90]}]}

          {l_arm: [{straddle: [0,50]}]}, // paramt = 0 (lowest note)
          {l_elbow: [{bend: [0,45]}]},
          {l_wrist: [{tilt: [0,-40]}, {turn: [0,150]}]}

          {r_arm: [{straddle: [0,50]}]}, // paramt = 0 (lowest note)
          {r_elbow: [{bend: [0,45]}]},
          {r_wrist: [{tilt: [0,50]}, {turn: [0,150]}]}
          */
        })
        VideoUtil.eventStream.addEvent(evt)
      }
      const playedKey = piano.keys[keyIdx]
      let evt = new Event( VideoUtil.eventStream, sched, sched, playedKey, {
        action: "move", run_once: true,
        endPos: {x: playedKey.position.x, y: playedKey.position.y - 0.5, z: playedKey.position.z}
      })
      VideoUtil.eventStream.addEvent(evt)
      evt = new Event( VideoUtil.eventStream, sched + duration * 0.75, sched + duration * 0.75, playedKey, {
        action: "move", run_once: true,
        endPos: {x: playedKey.position.x, y: playedKey.position.y, z: playedKey.position.z}
      })
      VideoUtil.eventStream.addEvent(evt)
    }
  },

  drawFrame: () => {
    VideoUtil.animate(VideoUtil.clock.getElapsedTime())
    VideoUtil.renderer.render(VideoUtil.scene, VideoUtil.camera)
  },

  animate: (t) => {
    const evtStream = VideoUtil.eventStream
    if (VideoUtil.gameCounter % 100 == 0) {
      evtStream.computeCurrPtr(t)
      evtStream.cacheActive(t - 2, t + 5)
      // console.log("Animate heartbeat: t =", t.toFixed(3), " gameCounter =", VideoUtil.gameCounter, " currPtr =", evtStream.currPtr," active =", Object.keys(evtStream.active).length)
    }
    if (VideoUtil.running && VideoUtil.gameCounter % 50 == 0) { // approx once/sec
      PubSub.publish('POSITION', {position: t - VideoUtil.startTime})
    }
    VideoUtil.gameCounter++
    if (VideoUtil.gameCounter >= 1000000) VideoUtil.gameCounter = 0

    for (let evtId in evtStream.active) {
      const evt = evtStream.active[evtId]
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
          // console.log("Deleted:", t, evt.ID, evt.data.action)
          // evtStream.deleteEvent(evtId)
          evtStream.deleteActiveEvent(evtId)
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
