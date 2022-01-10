import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

let mesh, body, initPos = new THREE.Vector3, isGoingLeft = true, isAddedToWorld = false, isDead = false;

export function isAlive(){
    return !isDead;
}

export function init(scene, pigName){
    const mtlLoader = new MTLLoader();
    mtlLoader.load(`models/${pigName}/${pigName}.mtl`, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(`models/${pigName}/${pigName}.obj`, (obj) => {
          mesh = obj;
          mesh.position.set(0, 4, -50);
          scene.add(mesh);
          let material = new CANNON.Material("pig");
          let shape = new CANNON.Box(new CANNON.Vec3(2,2,2))
          body = new CANNON.Body({mass:5, shape: shape, material:material});
          body.position.copy(mesh.position);
          initPos.copy(mesh.position);
          body.addEventListener("collide", (e) => {
            let name = e.body.material.name
            if((name.includes("wood") || name.includes("straw") || name.includes("brcik") || name.includes("ammo")) && e.body.mass != 0)
              isDead = true;
            })
        });
    });
}

export function render(world){
    if(!isAddedToWorld && body != undefined){
        world.addBody(body);
        isAddedToWorld = true;
    }
    if(mesh != undefined && mesh != null && body != undefined && body != null){
        if(isGoingLeft){
            if(body.position.x > initPos.x - 7){
                body.position.x -= 0.2;
            }
            else {
                isGoingLeft = false;
                let axis = new CANNON.Vec3(0,1,0);
                let angle = Math.PI;
                body.quaternion.setFromAxisAngle(axis, angle);
            }
        }
        else{
            if(body.position.x < initPos.x + 7){
                body.position.x += 0.2;
            }
            else{
                isGoingLeft = true;
                var axis = new CANNON.Vec3(0,1,0);
                var angle = Math.PI*2;
                body.quaternion.setFromAxisAngle(axis, angle);
            }
        }
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }
}