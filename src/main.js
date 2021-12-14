import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

let scene, camera, renderer, world, clock = new THREE.Clock(), timeStep = 1 / 144, catapult, cup, goal;
let mass = 1, force = 20, delta, lastCallTime, isFlying = false, temp = new THREE.Vector3, counter = 0;
let ammoMesh, ammoBody, pig, pigBody;
let wheels = [], meshesWithBody = [];

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

initThree();
initHTML();
initCannon();
render();

document.addEventListener('keydown', onKeyDown );


function initThree(){
  // Camera
  camera = new THREE.PerspectiveCamera( 70, sizes.width / sizes.height, 0.01, 1000 );
  camera.position.setZ(30);
  camera.position.setY(18);

  // Scene
  scene = new THREE.Scene();

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(sizes.width, sizes.height);

  // Shadow
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Add renderer to html
  document.body.appendChild(renderer.domElement);

  // Light
  const light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 128, 128, 0 );
  light.castShadow = true;
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 500;
  scene.add( light );

  addObjectsThree();
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
})

function initHTML(){
  let sliderContainer = document.createElement('div');
  sliderContainer.id = "sliderContainer";

  let row = document.createElement('div');
  row.classList.add("row");
  
  var h = document.createElement("H5");
  let title = document.createTextNode('Mass: ');
  h.classList.add("col")
  h.appendChild(title);
  row.appendChild(h);
  
  let inputText = document.createElement('input');
  inputText.type = 'text';
  inputText.id = 'massText';
  inputText.value = mass;
  inputText.classList.add('col');
  inputText.classList.add('text');
  row.appendChild(inputText);
  
  let slider = document.createElement('input');
  slider.id = "massSlider";
  slider.type = 'range';
  slider.min = 0.5;
  slider.max = 50;
  slider.value = 1;
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
  inputText.value = force;
  inputText.classList.add('col');
  inputText.classList.add('text');
  row.appendChild(inputText);
  
  slider = document.createElement('input');
  slider.id = "forceSlider";
  slider.type = 'range';
  slider.min = 20;
  slider.max = 1000;
  slider.value = 20;
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
  var target = (e.target) ? e.target : e.srcElement;
  let textInput = document.getElementById(e.currentTarget.anotherInput);
  textInput.value = target.value;
  mass = parseInt(target.value);
}

function changeForce(e){
  var target = (e.target) ? e.target : e.srcElement;
  let anotherInput = document.getElementById(e.currentTarget.anotherInput);
  anotherInput.value = target.value;
  force = parseInt(target.value);
}

function initCannon(){
  // World
  world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  // Add objects to world
  addObjectsCannon();
}


function fire(){
  if(ammoMesh != undefined)
    scene.remove(ammoMesh)
  if(ammoBody != undefined)
    world.removeBody(ammoBody);
  // ammo mesh
  let position = new THREE.Vector3;
  cup.getWorldPosition(position);
  ammoMesh = addObjectThree(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide}),
    {
      position: position,
      receiveShadow: true
    }
  )

  // ammo body
  const ammoMaterial = new CANNON.Material("ammo");
  const sphereShape = new CANNON.Sphere( 0.5 )
  ammoBody = new CANNON.Body({ mass: mass, shape: sphereShape, material: ammoMaterial })
  ammoBody.position.copy(ammoMesh.position);
  world.addBody(ammoBody);
  ammoBody.addEventListener("collide", (e) => {
    setTimeout(function() {
      isFlying = false;
      if(ammoMesh != undefined)
        scene.remove(ammoMesh)
      if(ammoBody != undefined)
        world.removeBody(ammoBody);
    }, 0);

  });
}

function onKeyDown(e){// seconds.
  var moveDistance = 2 * delta * 20;
  var rotateAngle = Math.PI / 2 * delta * 8;
  // reset shooting
  if(e.keyCode == '82'){
    isFlying = false;
    if(ammoMesh != undefined)
      scene.remove(ammoMesh)
    if(ammoBody != undefined)
      world.removeBody(ammoBody);
  }
  if(!isFlying){
    // move forwards/backwards/left/right
    if ( e.keyCode == '38' || e.keyCode == '87'){
      catapult.translateZ( -moveDistance );
      for(let i = 0; i < wheels.length; i++){
        wheels[i].rotation.x += moveDistance;
      }
    }
    else if ( e.keyCode == '40' || e.keyCode == '83'){
      catapult.translateZ( moveDistance );
      for(let i = 0; i < wheels.length; i++){
        wheels[i].rotation.x -= moveDistance;
      }
    }
    else if ( e.keyCode == '37' || e.keyCode == '65')
    {
      catapult.rotateY(rotateAngle);
    }
    else if ( e.keyCode == '39' || e.keyCode == '68'){
      catapult.rotateY(-rotateAngle);
    }
    // fire
    else if (e.keyCode == '32'){
      fire();
      var rotationMatrix = new THREE.Matrix4();
      rotationMatrix.extractRotation(catapult.matrix);
      var forceVector = new THREE.Vector3(0, force, -force).applyMatrix4(rotationMatrix);
      var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
      ammoBody.applyImpulse(
        cannonVector,
        new CANNON.Vec3().copy(ammoBody.position)
        )
      isFlying = true;
    }
  }
}

function worldStep(){
  const time = performance.now() / 1000
  if (!lastCallTime) {
    world.step(timeStep)
  } else {
    const dt = time - lastCallTime
    world.step(timeStep, dt)
  }
  lastCallTime = time
}

function render(){
  requestAnimationFrame( render );
  
  
  delta = clock.getDelta(); 

  if(ammoMesh != undefined && ammoMesh != null && ammoBody != undefined && ammoBody != null){
    ammoMesh.position.copy(ammoBody.position);
    ammoMesh.quaternion.copy(ammoBody.quaternion);
  }
  
  meshesWithBody.forEach(object => {
    if(object!=undefined){
      object.mesh.position.copy(object.body.position);
      object.mesh.quaternion.copy(object.body.quaternion);
    }
  })

  if(pig != undefined && pig != null && pigBody != undefined && pigBody != null){
    pig.position.copy(pigBody.position);
    pig.quaternion.copy(pigBody.quaternion);
  }
  if(!isFlying)
  {
    if(goal != undefined){
      temp.setFromMatrixPosition(goal.matrixWorld);
      camera.position.lerp(temp, 0.2);
      camera.lookAt( catapult.position );
    }
  }
  else{
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.extractRotation(catapult.matrix);
    const cameraOffset = new THREE.Vector3(0.0, 18.0, 30.0).applyMatrix4(rotationMatrix);
    const objectPosition = new THREE.Vector3();
    ammoMesh.getWorldPosition(objectPosition);
    camera.position.copy(objectPosition).add(cameraOffset);
  }
  worldStep();
  renderer.render(scene, camera)
  
  
}

function addObjectsCannon(){
  let planeMaterial = new CANNON.Material("ground");
  let planeShape = new CANNON.Box(new CANNON.Vec3(256, 256, 1));
  let planeBody = new CANNON.Body({mass: 0, shape: planeShape, material: planeMaterial});
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(planeBody);

  let cubeMaterial = new CANNON.Material("woodBox");
  meshesWithBody.forEach(object => { 
    let parameters = object.mesh.geometry.parameters;
    let cubeShape = new CANNON.Box(new CANNON.Vec3(parameters.width / 2 , parameters.height / 2 , parameters.depth / 2));
    let cubeBody = new CANNON.Body({mass:5, shape: cubeShape, material:cubeMaterial});
    cubeBody.position.copy(object.mesh.position) 
    world.addBody(cubeBody);
    object.body = cubeBody;
  })

  let physicsContactMaterial = new CANNON.ContactMaterial(
    planeMaterial,      // Material #1
    cubeMaterial,      // Material #2
    {
      friction: 1,
      restitution: 0
    }
  );   
  world.addContactMaterial(physicsContactMaterial); 

  let pigMaterial = new CANNON.Material("pig");
  let pigShape = new CANNON.Sphere(4 );
  pigBody = new CANNON.Body({mass:4, shape: pigShape, material:pigMaterial});
  pigBody.position.copy(pig.position);
  world.addBody(pigBody);
  pigBody.addEventListener("collide", (e) => {
    let name = e.body.material.name
    if(name.includes("wood") || name.includes("ammo"))
      console.log("U win")
  })
}

function addObjectThree(geometry, material, options){
  let mesh = new THREE.Mesh( geometry, material);
  if( options.position )
    mesh.position.copy(options.position);
  if( options.rotation )
    mesh.rotation.copy(options.rotation);
  if ( options.receiveShadow )
    mesh.receiveShadow = options.receiveShadow;
  if ( options.hasBody )
    meshesWithBody.push({mesh: mesh, body: null});
  scene.add(mesh);
  return mesh;
}

function addObjectsThree(){
  // sky
  addObjectThree(
    new THREE.SphereGeometry( 256, 256, 256 ),
    new THREE.MeshBasicMaterial( {map: new THREE.TextureLoader().load('textures/sky.jpg'), transparent: true, side: THREE.DoubleSide} ),
    {
      position: new THREE.Vector3(0, 0, 0)
    }
  )

  // map 
  addObjectThree(
    new THREE.PlaneGeometry( 256, 256, 4, 4 ),
    new THREE.MeshStandardMaterial( {color: 0x747570, side: THREE.DoubleSide} ),
    {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      receiveShadow: true
    }
  )

  // wood material
  let woodTexture = new THREE.TextureLoader().load('textures/wood.jpg');
  let woodMaterial = new THREE.MeshStandardMaterial( {map: woodTexture, side: THREE.DoubleSide} );
  
  // wood walls
  let wallWoodGeometry = new THREE.BoxGeometry(5, 20, 5);
  for(let i = 0; i < 2; i++){
    for(let j = 0; j < 2; j++){
      addObjectThree(
        wallWoodGeometry,
        woodMaterial,
        {
          position: new THREE.Vector3(-10 + 20 * i, 11, -60 + 20 * j),
          receiveShadow: true,
          hasBody: true
        }
      );
    }
  }

  // wood roof
  addObjectThree(
    new THREE.BoxGeometry(25, 5, 25),
    woodMaterial,
    {
      position: new THREE.Vector3(0, 25, -50),
      receiveShadow: true,
      hasBody: true
    }
  )

  // pig
  pig = addObjectThree(
    new THREE.SphereGeometry(5, 32, 16),
    new THREE.MeshStandardMaterial( {color: 0xFFB6C1, side: THREE.DoubleSide} ),
    {
      position: new THREE.Vector3(0, 5, -50),
      receiveShadow: true
    }
  )
  
  //catapult
  const mtlLoader = new MTLLoader();
  mtlLoader.load('models/test/catapult.mtl', (mtl) => {
    mtl.preload();
    const objLoader = new OBJLoader();
    objLoader.setMaterials(mtl);
    objLoader.load('models/test/catapult.obj', (obj) => {
      catapult = obj;
      obj.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          if(child.name.includes('Wheel')){
            var center = new THREE.Vector3();
            child.geometry.computeBoundingBox();
            child.geometry.boundingBox.getCenter(center);
            child.geometry.center();
            child.position.copy(center);
            wheels.push(child);
          }
          else if(child.name.includes('Cup')){
            var center = new THREE.Vector3();
            child.geometry.computeBoundingBox();
            child.geometry.boundingBox.getCenter(center);
            child.geometry.center();
            child.position.copy(center); 
            cup = child;
          }
        }
      });
      // goal for camera
      goal = new THREE.Object3D;
      catapult.add(goal);
      scene.add(catapult);
      goal.position.set(0, 18, 30);    
    });
  });
  // mtlLoader.load('models/pig/pig.mtl', (mtl) => {
  //   mtl.preload();
  //   const objLoader = new OBJLoader();
  //   objLoader.setMaterials(mtl);
  //   objLoader.load('models/pig/pig.obj', (obj) => {
  //     pig = obj;
  //     obj.traverse(function (child) {
  //       if(child instanceof THREE.Mesh){
  //         var center = new THREE.Vector3();
  //         child.geometry.computeBoundingBox();
  //         child.geometry.boundingBox.getCenter(center);
  //         console.log(child.geometry.boundingSphere)
  //         child.geometry.center();
  //         child.position.copy(center);
  //       }
  //     });
  //     pig.scale.set(0.25, 0.25, 0.25);
  //     pig.position.set(0, 50, -50);
  //     scene.add(pig);
  //     console.log(pig);
  //     let pigMaterial = new CANNON.Material("pig");
  //     let pigShape = new CANNON.Box(new CANNON.Vec3(2,2,2))
  //     pigBody = new CANNON.Body({mass:5, shape: pigShape, material:pigMaterial});
  //     pigBody.position.copy(pig.position);
  //     world.addBody(pigBody);
  //   });
  // });
}




