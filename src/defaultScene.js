import 'bootstrap/dist/css/bootstrap.min.css';

import * as THREE from 'three';

import * as utils from './utils';
import * as Catapult from './catapult';
import * as Pig from './pig';

let scene, camera, renderer, world, sky;
let clock = new THREE.Clock();
let delta, lastCallTime,  counter = 0;
let meshesWithBody = [];

document.addEventListener('keydown', onKeyDown );

export function init(pigName){
    initThree(pigName);
    initHTML();
    initCannon(pigName);
    render();
}

function initThree(pigName){
    let material, mass;
    if(pigName === 'nif-nif'){
        material = "straw";
        mass = 1;
    }
    else if(pigName === 'nuf-nuf'){
        material = "wood";
        mass = 5;
    }
    else if(pigName === 'naf-naf'){
        material = "brick";
        mass = 10;
    }
    let threeDefaultObjects = utils.initThreeDefault(material, mass);
    scene = threeDefaultObjects.scene;
    camera = threeDefaultObjects.camera;
    renderer = threeDefaultObjects.renderer;
    meshesWithBody = threeDefaultObjects.meshesWithBody;
    sky = threeDefaultObjects.sky;
    addObjectsThree(pigName);
}

window.addEventListener('resize', () =>
{
    utils.resizeWindow(camera, renderer);
})

function initHTML(){
    utils.initHTMLDefault();
}

function initCannon(pigName){
    // World
    let material;
    if(pigName === 'nif-nif'){
        material = "straw";
    }
    else if(pigName === 'nuf-nuf'){
        material = "wood";
    }
    else if(pigName === 'naf-naf'){
        material = "brick";
    }
    world = utils.initCANNONDefault(meshesWithBody, material);
}

function onKeyDown(e){
    //20
    var moveDistance = 2 * delta * 80;
    var rotateAngle = Math.PI / 2 * delta * 8;
    // reset shooting
    if(e.keyCode == '82'){
        Catapult.removeBullet(scene, world);
    }
    if(!Catapult.getFlying()){
        // move forwards/backwards/left/right
        if ( e.keyCode == '38' || e.keyCode == '87'){
            Catapult.moveFB(-moveDistance);
        }
        else if ( e.keyCode == '40' || e.keyCode == '83'){
            Catapult.moveFB(moveDistance);
        }
        else if ( e.keyCode == '37' || e.keyCode == '65')
        {
            Catapult.moveLR(rotateAngle);
        }
        else if ( e.keyCode == '39' || e.keyCode == '68'){
            Catapult.moveLR(-rotateAngle);
        }
        // fire
        else if (e.keyCode == '32'){
            Catapult.fire(scene, world);
            changeCounter(1);
        }
    }
}

function changeCounter(value){
    counter += value
    let counterE = document.getElementById('counter');
    counterE.innerText = `Attempts: ${counter}`;
    let attempts = document.getElementById('attempts');
    attempts.innerText = `Attempts: ${counter}`
}

function worldStep(){
    utils.worldStepDefault(world, lastCallTime);
}

function render(){
    if(Pig.isAlive()){
        requestAnimationFrame( render );
        delta = clock.getDelta(); 
        utils.renderMeshesWithBody(meshesWithBody);
        Pig.render(world);
        Catapult.render(scene, sky, world, camera);
        worldStep();
        renderer.render(scene, camera);
    }
    else{
        document.getElementById('win').style = "display: flex";
        document.getElementById('back').style = "display: none";
        document.getElementById('counter').style = "display: none";
        document.getElementById('sliderContainer').style = "display: none";
    }
}

function addObjectsThree(pigName){

    Catapult.init(scene);
    Pig.init(scene, pigName);
}