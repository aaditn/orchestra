import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Male, Torso, HeadShape, rad } from '../libs/mannequin'
import { AudioUtil } from './audio/audio_util'
import { VideoUtil } from './video/video_util'
import './style.css'

global.scene // want scene to be global
let camera, renderer
let clock, light, controls


const handleClickPlay = () => {
    // get initial voice data
    // AudioUtil.handlePlayAudio("/data/flight_of_the_bumble_bee.json")
    // AudioUtil.handlePlayAudio("/data/fugue_sonata1_bach.json")
    AudioUtil.handlePlayAudio("/data/bach_double_vivace.json")
}

function animate(t) {
    // empty for now
}

const drawFrame = () => {
    if (clock) {
	animate(50 * clock.getElapsedTime());
	renderer.render(global.scene, camera);
    }
}

const createScene = () => {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1200, 750);
    // renderer.domElement.style = 'width:300px; height:300px; position:fixed; top:0; left:0;';
    renderer.shadowMap.enabled = true;
    renderer.setAnimationLoop(drawFrame);
    document.getElementById("three-scene").appendChild(renderer.domElement);

    global.scene = new THREE.Scene();
    global.scene.background = new THREE.Color('gainsboro');
    // global.scene.fog = new THREE.Fog('gainsboro', 100, 600);

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 150);

    let light = new THREE.PointLight('white', 0.7);
    light.position.set(0, 100, 50);
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.castShadow = true;
    global.scene.add(light, new THREE.AmbientLight('white', 0.5));

    function onWindowResize(event) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	// renderer.setSize(window.innerWidth, window.innerHeight, true);
    }
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    const texture = new THREE.TextureLoader().load( "/textures/wood_floor.jpg" );
    let ground = new THREE.Mesh(
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
    global.scene.add(ground);

    const player = new Male();
    global.scene.add(player)
    
    global.scene.rotation.x = rad(20)
    controls = new OrbitControls (camera, renderer.domElement);
    clock = new THREE.Clock();
}

const renderScene = () => {
    createScene();
}


//------------- MAIN ---------------//

document.querySelector("button").addEventListener("click", () => {
    handleClickPlay()
});

VideoUtil.renderScene();
