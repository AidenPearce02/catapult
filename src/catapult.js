import * as THREE from 'three';

import * as CANNON from 'cannon-es';

import * as utils from './utils';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

let mesh, goal, cup, arm, main, body, wheels = [];
let ammoMesh, ammoBody, isFiring = false, isFlying = false, isAddedToWorld = false, mass = 1, force = 20;

export function init(scene){
    const mtlLoader = new MTLLoader();
    mtlLoader.load('models/catapult/catapult.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        let backRope = null;
        objLoader.load('models/catapult/catapult.obj', (obj) => {
            mesh = obj;
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    if(child.name.includes('Wheel')){
                        let center = new THREE.Vector3();
                        child.geometry.computeBoundingBox();
                        child.geometry.boundingBox.getCenter(center);
                        child.geometry.center();
                        child.position.copy(center);
                        wheels.push(child);
                    }
                    else if(child.name.includes('Cup')){
                        let center = new THREE.Vector3();
                        child.geometry.computeBoundingBox();
                        child.geometry.boundingBox.getCenter(center);
                        child.geometry.center();
                        child.position.copy(center); 
                        cup = child;
                    }
                    else if(child.name.includes('Arm_Catapult')){
                        arm = child;
                    }
                    else if(child.name.includes("Rope_Catapult")){
                        backRope = child;
                    }
                    else if(child.name.includes("MainBody")){
                        let center = new THREE.Vector3();
                        child.geometry.computeBoundingBox();
                        child.geometry.boundingBox.getCenter(center);
                        child.geometry.center();
                        child.position.copy(center);
                        main = child;
                    }
                }
            });
            // goal for camera
            goal = new THREE.Object3D;
            mesh.add(goal);
            arm.add(backRope);
            arm.add(cup);
            arm.rotation.x = 0.3;
            goal.position.set(0, 18, 30);    
            mesh.position.set(0, 0, 256);
            scene.add(mesh);
            let material = new CANNON.Material("catapult");
            let shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
            body = new CANNON.Body({mass:5, shape: shape, material:material});
            body.position.copy(mesh.position);
            body.addEventListener("collide", (e) => {
                let name = e.body.material.name
                if(name.includes("tree")){
                    if(name.includes("Back")){
                        mesh.position.z -= 0.8;
                    }
                    else if(name.includes("Left")){
                        mesh.position.x += 0.8;
                    }
                    else if(name.includes("Front")){
                        mesh.position.z += 0.8;
                    }
                    else if(name.includes("Right")){
                        mesh.position.x -= 0.8;
                    }
                }
            })
        });
    });
}

// move forward/back
export function moveFB(moveDistance){
    if(mesh){
        mesh.translateZ(moveDistance);
        for(let i = 0; i < wheels.length; i++){
            wheels[i].rotation.x -= moveDistance;
        }
    }
}

// move left/right
export function moveLR(rotateAngle){
    if(mesh){
        mesh.rotateY(rotateAngle);
    }
} 

export function setMassBullet(newMass){
    mass = newMass;
}

export function getMassBullet(){
    return mass;
}

export function setForceBullet(newForce){
    force = newForce;
}

export function getForceBullet(){
    return force;
}

export function getFlying(){
    return isFlying;
}

export function fire(scene, world){
    isFiring = true;
    addBullet(scene, world);
}

function addBullet(scene, world){
    removeBullet(scene, world);
    
    // ammo mesh
    let position = new THREE.Vector3;
    cup.getWorldPosition(position);
    ammoMesh = utils.addObjectThree(
        scene,
        new THREE.SphereGeometry(1, 32, 16),
        new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide}),
        {
            position: position,
            receiveShadow: true
        }
    )

    // ammo body
    const ammoMaterial = new CANNON.Material("ammo");
    const sphereShape = new CANNON.Sphere( 0.5 );
    ammoBody = new CANNON.Body({ mass: mass, shape: sphereShape, material: ammoMaterial });
    ammoBody.position.copy(ammoMesh.position);
    world.addBody(ammoBody);
    ammoBody.addEventListener("collide", (e) => {
        setTimeout(function() {
            removeBullet(scene, world);
        }, 0);
    });

}

export function removeBullet(scene, world){
    isFlying = false;
    if(ammoMesh != undefined){
        scene.remove(ammoMesh);
        ammoMesh=null;
    }
    if(ammoBody != undefined){
        world.removeBody(ammoBody);
        ammoBody = null;
    }
        
}

let prevMZ = 0;

export function render(scene, sky, world, camera){
    if(!isAddedToWorld && body != undefined){
        world.addBody(body);
        isAddedToWorld = true;
    }
    if(mesh != undefined && mesh != null && body != undefined && body != null){
        
        body.position.copy(mesh.position);
        body.quaternion.copy(mesh.quaternion);
        
    }
    if(ammoMesh != undefined && ammoMesh != null && ammoBody != undefined && ammoBody != null){
        if(ammoMesh.position.distanceTo(sky.position) > 1020){
            removeBullet(scene, world);
        }
        else{
            if(isFiring){
                let position = new THREE.Vector3;
                cup.getWorldPosition(position);
                ammoBody.position.copy(position);
            }
            ammoMesh.position.copy(ammoBody.position);
            ammoMesh.quaternion.copy(ammoBody.quaternion);
        }
    }
    if(isFiring){
        if(arm != undefined){
            if(arm.rotation.x >= 0) {
                arm.rotation.x -= 0.01
            }
            else{
                let rotationMatrix = new THREE.Matrix4();
                rotationMatrix.extractRotation(mesh.matrix);
                let forceVector = new THREE.Vector3(0, force, -force).applyMatrix4(rotationMatrix);
                let cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
                ammoBody.applyImpulse(
                    cannonVector,
                    new CANNON.Vec3().copy(ammoBody.position)
                    )
                isFlying = true;
                isFiring = false;
            }
        }
    }
    else{
        if(arm != undefined){
            if(arm.rotation.x < 0.3) arm.rotation.x += 0.01
        }
    }
    if(isFlying){
        let rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(mesh.matrix);
        const cameraOffset = new THREE.Vector3(0.0, 18.0, 30.0).applyMatrix4(rotationMatrix);
        const objectPosition = new THREE.Vector3();
        ammoMesh.getWorldPosition(objectPosition);
        camera.position.copy(objectPosition).add(cameraOffset);
    }
    else{
        if(goal != undefined){
            let temp = new THREE.Vector3;
            temp.setFromMatrixPosition(goal.matrixWorld);
            camera.position.lerp(temp, 0.2);
            camera.lookAt( mesh.position );
        }
    }
}