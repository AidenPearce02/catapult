import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import * as Catapult from './catapult';

const timeStep = 1 / 144;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

export function addObjectThree(scene, geometry, material, options){
    let mesh = new THREE.Mesh( geometry, material);
    if( options.position )
      mesh.position.copy(options.position);
    if( options.rotation )
      mesh.rotation.copy(options.rotation);
    if ( options.receiveShadow )
      mesh.receiveShadow = options.receiveShadow;
    if ( options.body ){
      let meshesWithBody = options.body.meshesWithBody;
      let mass = options.body.mass; 
      if (mass) meshesWithBody.push({mesh: mesh, body: null, mass: mass});
      else meshesWithBody.push({mesh: mesh, body: null});
    }    
    scene.add(mesh);
    return mesh;
}

export function initThreeDefault(materialStr, materialMass){
    // Camera
    let camera = new THREE.PerspectiveCamera( 90, sizes.width / sizes.height, 0.01, 2000 );
    camera.position.setZ(30);
    camera.position.setY(18);

    // Scene
    let scene = new THREE.Scene();

    // Renderer
    let renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    renderer.setSize(sizes.width, sizes.height);

    // Shadow
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add renderer to html
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight( 0x404040 ));

    // Light
    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 128, 128, 0 );
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    scene.add( light );
    let defaultObjects = addThreeDefaultObjects(scene, materialStr, materialMass);
    let meshesWithBody = defaultObjects.meshesWithBody;
    let sky = defaultObjects.sky;
    return {camera, scene, renderer, meshesWithBody, sky};
}

function addThreeDefaultObjects(scene, materialStr, materialMass){
    let meshesWithBody = [];
    // sky
    let sky = addObjectThree(
        scene,
        new THREE.SphereGeometry( 1024, 1024, 1024 ),
        new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('textures/sky.jpg'), transparent: true, side: THREE.DoubleSide} ),
        {
            position: new THREE.Vector3(0, 0, 0)
        }
    )

    // map 
    addObjectThree(
        scene,
        new THREE.PlaneGeometry( 2048, 2048, 2048, 2048 ),
        new THREE.MeshStandardMaterial( {map: new THREE.TextureLoader().load('textures/water.jpg'), side: THREE.DoubleSide} ),
        {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            receiveShadow: true
        }
    )

    addObjectThree(
        scene,
        new THREE.PlaneGeometry( 128, 128, 128, 128 ),
        new THREE.MeshStandardMaterial( {map: new THREE.TextureLoader().load('textures/grass.jpg'), side: THREE.DoubleSide} ),
        {
            position: new THREE.Vector3(0, 0.1, -64),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            receiveShadow: true
        }
    )

    addObjectThree(
        scene,
        new THREE.PlaneGeometry( 256, 256, 256, 256 ),
        new THREE.MeshStandardMaterial( {map: new THREE.TextureLoader().load('textures/grass.jpg'), side: THREE.DoubleSide} ),
        {
            position: new THREE.Vector3(0, 0.1, 192),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            receiveShadow: true
        }
    )

    // material
    let material = new THREE.MeshStandardMaterial( {map: new THREE.TextureLoader().load(`textures/${materialStr}.jpg`), side: THREE.DoubleSide} );
    
    // supports
    let supportsGeometry = new THREE.BoxGeometry(5, 15, 5);
    for(let i = 0; i < 2; i++){
        for(let j = 0; j < 2; j++){
        addObjectThree(
            scene,
            supportsGeometry,
            material,
            {
                position: new THREE.Vector3(-12.5 + 25 * i, 9, -62.5 + 25 * j),
                receiveShadow: true,
                body: {
                    meshesWithBody: meshesWithBody,
                    mass: materialMass
                }          
            }
        );
        }
    }

    let sideGeometry = new THREE.BoxGeometry(7.5, 10, 5)
    // side door
    for(let i=0; i < 2; i++){
        addObjectThree(
            scene,
            sideGeometry,
            material,
            {
                position: new THREE.Vector3(-6.2+12.4*i, 6.5, -37.5),  
                receiveShadow: true,
                body: {
                meshesWithBody: meshesWithBody,
                mass: materialMass
                }
            }
        )
    }
    
    addObjectThree(
        scene,
        new THREE.BoxGeometry(19.9, 4.9, 5),
        material,
        {
            position: new THREE.Vector3(0, 14, -37.7),
            receiveShadow: true,
            body: {
                meshesWithBody: meshesWithBody,
                mass: materialMass
            }
        }  
    )

    // side wall
    let wallGeometry = new THREE.BoxGeometry(5, 15, 20);

    for(let i = 0; i < 2; i++){
        addObjectThree(
            scene,
            wallGeometry,
            material,
            {
                position: new THREE.Vector3(-12.5+25*i, 9, -50),
                receiveShadow: true,
                body: {
                meshesWithBody: meshesWithBody,
                mass: materialMass
                }
            }
        )
    }

    // back wall
    addObjectThree(
        scene,
        wallGeometry,
        material,
        {
            position: new THREE.Vector3(0,9,-62.5),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            receiveShadow: true,
            body: {
                meshesWithBody: meshesWithBody,
                mass: materialMass
            }
        }
    )

    // roof
    addObjectThree(
        scene,
        new THREE.BoxGeometry(30, 5, 30),
        material,
        {
            position: new THREE.Vector3(0, 19, -50),
            receiveShadow: true,
            body: {
                meshesWithBody: meshesWithBody,
                mass: materialMass
            }
        }
    )

    // floor
    addObjectThree(
        scene,
        new THREE.BoxGeometry(30, 1, 30),
        material,
        {
            position: new THREE.Vector3(0, 1, -50),
            receiveShadow: true,
            body: {
                meshesWithBody: meshesWithBody,
                mass: 0
            }
        }
    )

    const mtlLoader = new MTLLoader();
    mtlLoader.load('models/woodDoor/model.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('models/woodDoor/model.obj', (obj) => {
            obj.position.set(-2,6.4, -35.5);
            obj.rotateY(Math.PI / 2);
            scene.add(obj);
        });
    });  
    mtlLoader.load('models/pineTree/materials.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('models/pineTree/model.obj', (obj) => {
            for(let i = 0; i < 22; i++){
                let tree = obj.clone();
                tree.position.set(-126 + 12 * i, 16, 318);
                scene.add(tree);
            }
            for(let i = 0; i < 21; i++){
                let tree = obj.clone();
                tree.position.set(-126, 16, 306 - 12*i);
                scene.add(tree);
            }
            for(let i = 0; i < 21; i++){
                let tree = obj.clone();
                tree.position.set(126, 16, 306 - 12*i);
                scene.add(tree);
            }
        });
    });
    return {meshesWithBody, sky}
}

export function resizeWindow(camera, renderer){
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
}

export function initHTMLDefault(){
    let counter = document.createElement("H5");
    counter.id = "counter";
    counter.innerText = "Attempts: 0";
    document.body.appendChild(counter);

    let backButton = document.createElement('div');
    backButton.id = "back";

    let link = document.createElement('a');
    link.href = "/";  
    let img = document.createElement('img');
    img.src = 'back.svg';
    img.width = 32;
    img.height = 32;
    img.alt = "Back";
    img.style = "filter: invert(19%) sepia(34%) saturate(4872%) hue-rotate(258deg) brightness(90%) contrast(85%);";

    link.appendChild(img)  

    backButton.appendChild(link);

    document.body.appendChild(backButton);

    let winDiv = document.createElement('div');
    winDiv.id = "win";

    let title = document.createElement('h1');
    title.innerText = "You win!!!";
    winDiv.appendChild(title)

    title = document.createElement('h2');
    title.innerText = "Attempts: 0";
    title.id = "attempts";
    winDiv.appendChild(title)

    link = document.createElement('a');
    link.href = "/";
    link.id = "backW"; 
    link.innerText = "Main Menu";
    winDiv.append(link);

    document.body.appendChild(winDiv)

    let sliderContainer = document.createElement('div');
    sliderContainer.id = "sliderContainer";

    let row = document.createElement('div');
    row.classList.add("row");
    
    var h = document.createElement("H5");
    title = document.createTextNode('Mass: ');
    h.classList.add("col")
    h.appendChild(title);
    row.appendChild(h);
    
    let inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.id = 'massText';
    inputText.value = Catapult.getMassBullet();
    inputText.classList.add('col');
    inputText.classList.add('text');
    row.appendChild(inputText);
    
    let slider = document.createElement('input');
    slider.id = "massSlider";
    slider.type = 'range';
    slider.min = 1;
    slider.max = 50;
    slider.value = Catapult.getMassBullet();
    slider.step = 0.5;
    slider.classList.add("col");
    row.appendChild(slider);
    
    sliderContainer.appendChild(row);
    
    row = document.createElement('div');
    row.classList.add("row");
    
    var h = document.createElement("H5");
    title = document.createTextNode('Force: ');
    h.classList.add("col")
    h.appendChild(title);
    row.appendChild(h);
    
    inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.id = 'forceText';
    inputText.value = Catapult.getForceBullet();
    inputText.classList.add('col');
    inputText.classList.add('text');
    row.appendChild(inputText);
    
    slider = document.createElement('input');
    slider.id = "forceSlider";
    slider.type = 'range';
    slider.min = 20;
    slider.max = 1000;
    slider.value = Catapult.getForceBullet();
    slider.step = 20;
    row.appendChild(slider)
    
    sliderContainer.appendChild(row);
    
    document.body.appendChild(sliderContainer);
    
    let massSlider = document.getElementById("massSlider");
    massSlider.addEventListener("input", changeMass);
    massSlider.anotherInput = "massText";
    let massText = document.getElementById("massText");
    massText.addEventListener("input", changeMass);
    massText.anotherInput = "massSlider";
    let forceSlider = document.getElementById("forceSlider");
    forceSlider.addEventListener("input", changeForce);
    forceSlider.anotherInput = "forceText";
    let forceText = document.getElementById("forceText");
    forceText.addEventListener("input", changeMass);
    forceText.anotherInput = "forceSlider";
} 

function changeMass(e){
    let target = (e.target) ? e.target : e.srcElement;
    let textInput = document.getElementById(e.currentTarget.anotherInput);
    textInput.value = target.value;
    Catapult.setMassBullet(parseInt(target.value));
}

function changeForce(e){
    let target = (e.target) ? e.target : e.srcElement;
    let anotherInput = document.getElementById(e.currentTarget.anotherInput);
    anotherInput.value = target.value;
    Catapult.setForceBullet(parseInt(target.value));
}

export function initCANNONDefault(meshesWithBody, material){
    //World
    let world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    addCANNONDefaultObjects(world, meshesWithBody, material);
    return world;
}

function addCANNONDefaultObjects(world, meshesWithBody, mainMaterial){
    let planeMaterial = new CANNON.Material("ground");
    let planeShape = new CANNON.Box(new CANNON.Vec3(2048, 2048, 1));
    let planeBody = new CANNON.Body({mass: 0, shape: planeShape, material: planeMaterial});
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(planeBody);

    let treeWallShape = new CANNON.Box(new CANNON.Vec3(256, 0.1, 20));
    let treeWallBody = new CANNON.Body({mass: 0, shape: treeWallShape, material: new CANNON.Material("treeWallBack")});
    treeWallBody.position.set(-126, 0, 312)
    world.addBody(treeWallBody);
    treeWallBody = new CANNON.Body({mass: 0, shape: treeWallShape, material: new CANNON.Material("treeWallFront")});
    treeWallBody.position.set(-126, 0, 64)
    world.addBody(treeWallBody);
    treeWallShape = new CANNON.Box(new CANNON.Vec3(20, 0.1, 256));
    treeWallBody = new CANNON.Body({mass: 0, shape: treeWallShape, material: new CANNON.Material("treeWallLeft")});
    treeWallBody.position.set(-126, 0, 128)
    world.addBody(treeWallBody)
    treeWallBody = new CANNON.Body({mass: 0, shape: treeWallShape, material: new CANNON.Material("treeWallRight")});
    treeWallBody.position.set(126, 0, 128)
    world.addBody(treeWallBody)
    let material = new CANNON.Material(mainMaterial);
    meshesWithBody.forEach(object => { 
        let parameters = object.mesh.geometry.parameters;
        let cubeShape = new CANNON.Box(new CANNON.Vec3(parameters.width / 2 , parameters.height / 2 , parameters.depth / 2));
        let cubeBody = new CANNON.Body({mass:object.mass, shape: cubeShape, material:material});
        cubeBody.position.copy(object.mesh.position)
        cubeBody.quaternion.copy(object.mesh.quaternion) 
        world.addBody(cubeBody);
        object.body = cubeBody;
        
    })
}

export function renderMeshesWithBody(meshesWithBody){
    meshesWithBody.forEach(object => {
        if(object!=undefined){
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        }
    })
}

export function worldStepDefault(world, lastCallTime){
    const time = performance.now() / 1000
    if (!lastCallTime) {
        world.step(timeStep)
    } else {
        const dt = time - lastCallTime
        world.step(timeStep, dt)
    }
    lastCallTime = time
}