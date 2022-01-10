import 'bootstrap/dist/css/bootstrap.min.css';

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader'
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader'

import * as utils from './utils';
import * as Catapult from './catapult';
import * as Pig from './pig';

let scene, camera, renderer, meshesWithBody = [], sky, controls;

initThree();
render();

document.addEventListener('keydown', onKeyDown );

function onKeyDown(e){
    if ( e.keyCode == '38' || e.keyCode == '87'){
        camera.position.z -= 1;
    }
    else if ( e.keyCode == '40' || e.keyCode == '83'){
        camera.position.z += 1;
    }
    else if ( e.keyCode == '37' || e.keyCode == '65')
    {
        camera.position.x -= 1;

    }
    else if ( e.keyCode == '39' || e.keyCode == '68'){
        camera.position.x += 1;
    }
}

function initThree(){
    let threeDefaultObjects = utils.initThreeDefault("brick", 10);
    scene = threeDefaultObjects.scene;
    camera = threeDefaultObjects.camera;
    renderer = threeDefaultObjects.renderer;
    meshesWithBody = threeDefaultObjects.meshesWithBody;
    sky = threeDefaultObjects.sky;
    controls = new OrbitControls(camera, renderer.domElement);
    Catapult.init(scene);
    addThreeObjects();
}

window.addEventListener('resize', () =>
{
    utils.resizeWindow(camera, renderer);
})

function render(){
    requestAnimationFrame( render );
    controls.update();
    renderer.render(scene, camera);
}

function addThreeObjects(){
    utils.addObjectThree(
        scene,
        new THREE.SphereGeometry(1, 32, 16),
        new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide}),
        {
            position: new THREE.Vector3(0, 20, -20),
            receiveShadow: true
        }
    )
    const mtlLoader = new MTLLoader();
    mtlLoader.load('models/catapult/catapult.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('models/catapult/catapult.obj', (obj) => {
            obj.position.set(-30, 0, -20);
            obj.rotateY(- Math.PI / 2);
            scene.add(obj);
        });
    });
    mtlLoader.load(`models/nif-nif/nif-nif.mtl`, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(`models/nif-nif/nif-nif.obj`, (obj) => {
          obj.position.set(30, 0, -20);
          scene.add(obj);
        });
    });
    mtlLoader.load(`models/nuf-nuf/nuf-nuf.mtl`, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(`models/nuf-nuf/nuf-nuf.obj`, (obj) => {
          obj.position.set(30, 0, -10);
          scene.add(obj);
        });
    });
    mtlLoader.load(`models/naf-naf/naf-naf.mtl`, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(`models/naf-naf/naf-naf.obj`, (obj) => {
          obj.position.set(30, 0, -30);
          scene.add(obj);
        });
    });
}