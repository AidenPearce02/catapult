import * as THREE from 'three';

let scene,camera, renderer;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

init();
render();

function init(){
    // Camera
    camera = new THREE.PerspectiveCamera( 70, sizes.width / sizes.height, 0.01, 1000 );
    camera.position.setZ(5);
    camera.position.setY(5);

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({
    antialias: true
    })
    
    renderer.setSize(sizes.width, sizes.height);

    // Add renderer to html
    document.body.appendChild(renderer.domElement);
};

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


function render(){
    requestAnimationFrame( render );
    renderer.render(scene, camera)
}