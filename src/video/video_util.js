import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Mannequin, Male, LimbShape, rad, sin } from '../../libs/mannequin'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { VideoActions } from './video_actions'

class Chair extends THREE.Group {
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

class Violin extends THREE.Group {
    constructor(pos, rot) {
		super();
		this.position.set(pos.x, pos.y, pos.z)
		this.rotation.x = rad(rot.x);
		this.rotation.y = rad(rot.y);
		this.rotation.z = rad(rot.z);
		
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

// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
class Event {
    constructor(start, end, actor, data) {
		this.start   = start   // duration start
		this.end     = end     // duration end
		this.actor   = actor
		this.data    = data
		this.status  = 'ready'
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
	prevt: 0,

	// overridden from mannequin.js
    createScene: () => {
		// prevt = 0
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

		const texture = new THREE.TextureLoader().load( "/textures/wood_floor.jpg" );
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
		const actor   = new Male()
		const pos     = actorData.position
		const rot     = actorData.rotation
		const posture = actorData.posture
		actor.ID      = actorData.ID
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
		switch(ldata.type) {
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

	processEvent: (t, evt, reset) => {
		const action = evt.data.action // actions are "walk", "sit", "rotate" etc.
		if (action in VideoActions) {
			VideoActions[action](t, evt, reset)
		} else {
			// action not found, default
		}
	},

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

	loadMovieScript: async function(fileUrl) {
		const response = await fetch(fileUrl ,{
			headers : { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		})
		VideoUtil.movie = await response.json()
	},

	initScene: () => {
		VideoUtil.createScene();
		VideoUtil.players = []

		// Load movie script
		VideoUtil.loadMovieScript("/data/movie/concert1.json").then(() => {
			// handle actor data
			const actorsData = VideoUtil.movie.actors
			actorsData.forEach((actorData) => {
				const actor = VideoUtil.processActorData(actorData)
				VideoUtil.players.push(actor)
			})
			for( let i = 0; i < 2; i++) { // violin + bow for player[0], player[1]
				const actor = VideoUtil.players[i]
				// actor.torso.attach(new Violin(17, 7, 20))
				actor.neck.attach(new Violin({x: 17, y: -5, z: -5}, {x: 0, y: 20, z: -10}))
				const bow = new Bow()
				actor.r_fingers[0].attach(bow)
				VideoUtil.bows.push(bow)
			}
			const loader = new OBJLoader();
			VideoUtil.loadFaceAndAttach(loader, "/models/face1", VideoUtil.players[0].neck)
			VideoUtil.loadFaceAndAttach(loader, "/models/brett_face", VideoUtil.players[1].neck)

			VideoUtil.scene.add( new Chair(25, 180), new Chair(-25, 0))

			// handle lights
			const lights = VideoUtil.movie.lights
			lights.forEach((l) => {
				let light = VideoUtil.processLightData(l)
				if (light) { 
					VideoUtil.scene.add(light)
					VideoUtil.lights.push(light)
				}
			})

			// handle event data
			const eventsData  = VideoUtil.movie.events
			let actor
			eventsData.forEach((e) => {
				switch(e.actor_type) {
					case "player":
						actor = VideoUtil.players[e.actor_id]
						break
					case "light":
						actor = VideoUtil.lights[e.actor_id]
						break
				}
				if (actor) {
					VideoUtil.all_events.push(new Event(e.start, e.end, actor, e.data))
				}
			})
		})

		// Load facecap model
		const ktx2Loader = 
			new KTX2Loader()
                .setTranscoderPath( '../node_modules/three/examples/js/libs/basis/' )
                .detectSupport( VideoUtil.renderer );
		new GLTFLoader()
			.setKTX2Loader( ktx2Loader )
			.setMeshoptDecoder( MeshoptDecoder )
			.load( '/models/facecap.glb', ( gltf ) => {
				const mesh = gltf.scene.children[ 0 ]
				mesh.position.set(0, 0, 15)
				mesh.scale.set(30, 30, 30)
				console.log("GLTF: ", gltf, " MESH: ", mesh)
				VideoUtil.scene.add( mesh );
				VideoUtil.mixer = new THREE.AnimationMixer( mesh );
				VideoUtil.mixer.clipAction( gltf.animations[ 0 ] ).play();
				// GUI                                                                  
				const head = mesh.getObjectByName( 'mesh_2' );
				const influences = head.morphTargetInfluences;
			})
	},

    moveBow: (playerIdx, upbow, speed, note, strNum, fingerNum) => {
		let t = -30
		let msecs  = Math.floor(30 * speed)
		let player = VideoUtil.players[playerIdx]
		// Put the left finger down
		for( let i = 1; i < 5; i++ ) { // finger numbers
			if ( i == fingerNum ) {
				player.l_fingers[i-1].bend = 60
				player.l_fingers[i-1].turn = -90
			} else {
				player.l_fingers[i-1].bend = 40
				player.l_fingers[i-1].turn = -80
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

    loadFaceAndAttach: (loader, modelPath, attachPoint) => {
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
    },

	// refresh rate is every 50ms
	drawFrame: () => {
		VideoUtil.animate( 50 * VideoUtil.clock.getElapsedTime() );
		VideoUtil.renderer.render(VideoUtil.scene, VideoUtil.camera);
	},

	// animate loop (runs ~50ms right now)
    animate: (t) => {
		// test animation for model from face cap
		const delta = t - VideoUtil.prevt
        if ( VideoUtil.mixer ) {
            VideoUtil.mixer.update( delta * 0.02 );
        }
		VideoUtil.prevt = t

		// cycle through events and process as needed
		VideoUtil.all_events.forEach((evt) => {
			const start   = evt.start
			const end     = evt.end
			const instant = start >= end
			switch(evt.status) {
				case 'ready':
					if (instant) { // no duration event, only start time needed
						if (t >= start) {
							evt.status = 'done' // bypass active for instant
							VideoUtil.processEvent(t, evt) // instant
						}
					} else if (t >= start && t <= end) { // default event has duration
						// console.log("EVT active: ", evt)
						evt.status = 'active'
						evt.data.t0     = t
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
