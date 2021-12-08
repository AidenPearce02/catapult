import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'

let scene, camera, renderer, controls, world;
let wheelMesh, wheelBody, wheelMaterial, planeMaterial, oldObjectPosition;
let ammoMesh, ammoBody, delta;
let lastCallTime;
const timeStep = 1 / 60;
const clock = new THREE.Clock();
let wheels = [];
let wheelsMeshT = [];
let catapult, frontAxel, cup, goal, temp=new THREE.Vector3;

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

initThree();
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

  // World
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setPixelRatio(window.devicePixelRatio, 2);
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
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableKeys = false;
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
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

function initCannon(){
  

  // Add objects to world
  addObjectsCannon();
}


function fire(){
  if(ammoMesh != undefined)
  scene.remove(ammoMesh)
  // ammo
  var ammoGeometry = new THREE.SphereGeometry(1, 32, 16);
  var ammoMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide});
  ammoMesh = new THREE.Mesh( ammoGeometry, ammoMaterial);
  cup.getWorldPosition(ammoMesh.position); 
  scene.add(ammoMesh);

  //ammo physics
  const radius = 1;
  const sphereShape = new CANNON.Sphere(radius)
  ammoBody = new CANNON.Body({ mass: 1, shape: sphereShape })
  ammoBody.position.copy(ammoMesh.position);
  world.addBody(ammoBody)
}

function onKeyDown(e){// seconds.
  var moveDistance = 2 * delta * 20;
  var rotateAngle = Math.PI / 2 * delta * 8;
  // move forwards/backwards/left/right
  if ( e.keyCode == '38' || e.keyCode == '87'){
    // wheelBody.applyTorque(new CANNON.Vec3(0,0,20));
    // for(let i = 0; i< wheels.length; i++){
    //   if(wheels[i] !== undefined){
    //     console.log("hello")
    //     // wheels[i].wheelBody.applyTorque(new CANNON.Vec3(0,0,20));
    //   }
    // }
    //wheelBody.applyTorque(new CANNON.Vec3(0,0,20));
    catapult.translateZ( -moveDistance );
    for(let i = 0; i < wheelsMeshT.length; i++){
      wheelsMeshT[i].rotation.x -= moveDistance;
    }
  }
  else if ( e.keyCode == '40' || e.keyCode == '83'){
    //wheelBody.applyTorque(new CANNON.Vec3(0,0,-20));
    catapult.translateZ( moveDistance );
    for(let i = 0; i < wheelsMeshT.length; i++){
      wheelsMeshT[i].rotation.x += moveDistance;
    }
  }
  else if ( e.keyCode == '37' || e.keyCode == '65')
  {
    catapult.rotateY(rotateAngle);
  }
  else if ( e.keyCode == '39' || e.keyCode == '68'){
    catapult.rotateY(-rotateAngle);
  }
  else if (e.keyCode == '32'){
    fire();
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.extractRotation(catapult.matrix);
    var forceVector = new THREE.Vector3(0, 20, -20).applyMatrix4(rotationMatrix);
    var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
    ammoBody.applyImpulse(
      cannonVector,
      ammoBody.position
      )
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
  worldStep();
  
  delta = clock.getDelta(); 

  if(ammoMesh != undefined && ammoBody != undefined){
    ammoMesh.position.copy(ammoBody.position);
    ammoMesh.quaternion.copy(ammoBody.quaternion);
  }

  // for(let i = 0; i< wheels.length; i++){
  //   if(wheels[i] !== undefined){
  //     wheels[i].wheelMesh.position.copy(wheels[i].wheelBody.position)
  //     wheels[i].wheelMesh.quaternion.copy(wheels[i].wheelBody.quaternion)
  //   }
  // }
  if(goal != undefined){
    temp.setFromMatrixPosition(goal.matrixWorld);
    camera.position.lerp(temp, 0.2);
    camera.lookAt( catapult.position );
  }
  //controls.update();
  renderer.render(scene, camera)
}

function addObjectsCannon(){
  var planeShape = new CANNON.Box(new CANNON.Vec3(256, 256, 0.1));
  var planeBody = new CANNON.Body({mass: 0});
  planeBody.addShape(planeShape);
  planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(planeBody);

  // wheel physics
  // const wheelShape = new CANNON.Cylinder(1.2,1.2,1,8);
  // wheelBody  = new CANNON.Body({
  //   mass: 1,
  // });
  // var axis = new CANNON.Vec3(0,1,0);
  // var angle = -Math.PI / 2;
  // wheelBody.quaternion.setFromAxisAngle(axis, angle);
  // wheelBody.addShape(wheelShape);
  // wheelBody.position.y = 1;
  // world.addBody(wheelBody);

  // const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, planeMaterial, {
  //   friction: 0.3,
  //   restitution: 0,
  //   contactEquationStiffness: 1000,
  // })
  // world.addContactMaterial(wheel_ground)

  
}

function addObjectsThree(){
  //sky
  var geometrySphere = new THREE.SphereGeometry( 256, 256, 256 );
  var cubeTexture = new THREE.TextureLoader().load('textures/sky.jpg');
  var materialSphere = new THREE.MeshBasicMaterial( {map: cubeTexture, transparent: true, side: THREE.DoubleSide} );
  const sphere = new THREE.Mesh( geometrySphere, materialSphere );
  sphere.position.set(0, 0, 0);
  scene.add( sphere );
  //map 
  var planeGeometry = new THREE.PlaneGeometry( 256, 256, 4, 4 );
  planeMaterial = new THREE.MeshStandardMaterial( {color: 0x747570, side: THREE.DoubleSide} );
  const planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
  planeMesh.position.set(0, 0, 0);
  planeMesh.rotation.x = Math.PI / 2;
  planeMesh.receiveShadow = true;
  scene.add( planeMesh );
  // wheel
  // var wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
  // wheelGeometry.rotateX(Math.PI/2);
  // wheelMaterial = new THREE.MeshStandardMaterial({color: 0x4E3524});
  // wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  // scene.add(wheelMesh);
  
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
              // obj.removeFromParent(child);
              var center = new THREE.Vector3();
              child.geometry.computeBoundingBox();
              child.geometry.boundingBox.getCenter(center);
              child.geometry.center();
              child.position.copy(center);
              wheelsMeshT.push(child);
            }
            else if(child.name.includes('FrontAxel')){
              var center = new THREE.Vector3();
              child.geometry.computeBoundingBox();
              child.geometry.boundingBox.getCenter(center);
              child.geometry.center();
              child.position.copy(center);
              frontAxel = child;
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
        // for(let i=0; i<1; i++){
        //   var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
        //   wheelGeometry.rotateX(Math.PI/2);
        //   wheelMaterial = new THREE.MeshStandardMaterial({color: 0x4E3524});
        //   wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        //   //wheelMesh.position.x = wheelsMeshT[i].position.x;
        //   // wheelMesh.position.y = wheelsMeshT[i].position.y;
        //   //wheelMesh.position.z = wheelsMeshT[i].position.z;
        //   // wheelMesh.rotateX(THREE.Math.PI/2);
        //   scene.add(wheelMesh);
        //   //wwwwwwwwwwwwwwwwwwcatapult.add(wheelMesh);
        //   // wheelsMeshT[i].removeFromParent();
        //   // const wheelShape = new CANNON.Cylinder(1.4,1.4,0.5,8);
        //   // const wheelBody  = new CANNON.Body({
        //   //   mass: 0,
        //   // });
        //   // var axis = new CANNON.Vec3(0,1,0);
        //   // var angle = -Math.PI / 2;
        //   // wheelBody.quaternion.setFromAxisAngle(axis, angle);
        //   // wheelBody.addShape(wheelShape);
        //   // wheelBody.position.y = 20;
        //   // world.addBody(wheelBody);
        //   wheels.push({wheelMesh,wheelBody});
        // }
        //console.log(wheels)
        goal = new THREE.Object3D;
        catapult.add(goal);
        scene.add(catapult);
        goal.position.set(0, 18, 30);    
      });
    });
    
}




