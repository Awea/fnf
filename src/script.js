import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLOBAL VARIABLES
let camera, controls, scene;
let plane;
let pointer, raycaster, isShiftDown = false, isBuilding = false, isPainting = false;
let color1, color2, color3, color4, color0;

let rollOverMesh, rollOverMaterial;
let cubeGeo, sphereGeo, pyramidGeo, circleGeo;
let primitiveMaterial, plywood;
let renderer;

var objects = [];
var primitives = [];
var colors = [];
var primitiveMaterials = [];
var colorValue = 0;
var CubeCounter = objects.length;
var TotalCost;
var CubeValue = 10;
var primitiveValue = 0;

//Referenced UI
const landing = document.getElementById("landing");
const sectionOne = document.getElementById("section-one");
const sectionTwo = document.getElementById("section-two");
const sectionThree = document.getElementById("section-three");
const sectionFour = document.getElementById("section-four");
const rightnav = document.getElementById("myRightnav");


init();
render();


function init() {
    // Canvas
    const canvas = document.querySelector('canvas.webgl')

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color("rgb(255,192,203)");
    // Materials            

    const material = new THREE.MeshBasicMaterial()
    material.color = new THREE.Color(0xff0000)


    // Lights
    const light = new THREE.AmbientLight(0x404040, 3); // soft white light
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1*50, 0.75*50, 0.5*50).normalize();
    scene.add(directionalLight);

    plywood = new THREE.TextureLoader().load('/plywood.jpg');

    const box = new THREE.Box3();

    // roll-over helpers

    const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
    rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true, wireframe: true });
    rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
    scene.add(rollOverMesh);

    // Primitives
    cubeGeo = new THREE.BoxGeometry(50, 50, 50);
    sphereGeo = new THREE.SphereBufferGeometry(50, 20, 20);
    pyramidGeo = new THREE.ConeBufferGeometry(50, 50, 10);
    circleGeo = new THREE.TorusBufferGeometry(25, 25, 50, 50);

    primitives.push(cubeGeo);
    primitives.push(sphereGeo);
    primitives.push(pyramidGeo);
    primitives.push(circleGeo);

    // Colors
    color0 = new THREE.Color(0xfffff0);
    color1 = new THREE.Color("rgba(246, 255, 141, 1)");
    color2 = new THREE.Color("rgba(159, 238, 255, 1)");
    color3 = new THREE.Color("rgba(199, 255, 205, 1)");
    color4 = new THREE.Color("rgba(255, 157, 216, 1)");

    colors.push(color1);
    colors.push(color2);
    colors.push(color3);
    colors.push(color4);
    colors.push(color0);
    // grid

    // Show Landing
    landing.style.display = "block";

    // const gridHelper = new THREE.GridHelper(1000, 20);
    // scene.add(gridHelper);

    //starting position
    primitiveMaterial = new THREE.MeshLambertMaterial({ color: 0xfffff0, map: plywood });
    const voxel = new THREE.Mesh(primitives[primitiveValue], primitiveMaterial);
    voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
    scene.add(voxel);
    objects.push(voxel);

    // potentially a way of calculating parametrically the boudning box of objects so we can always look at the geometry in the center.

    // const mesh = new THREE.Mesh(objects);
    // const bounding = mesh.geometry.computeBoundingBox();
    // target = boudning.center;


    // const geometry = new THREE.PlaneGeometry(500, 500);
    // geometry.rotateX(- Math.PI / 2);

    // plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
    // scene.add(plane);

    // objects.push(plane);

    // Raycaster
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);
    document.addEventListener('keydown', exportGLTfevent);

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    window.addEventListener('resize', () => {
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

    // Base camera

    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
    //  camera = new THREE.OrthographicCamera( sizes.width  / - 2, sizes.width  / 2, sizes.height / 2, sizes.height / - 2, 1, 1000 );
    camera.lookAt(0, 0, 0)
    camera.position.x = 250
    camera.position.y = 250
    camera.position.z = 250
    scene.add(camera)

    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 500;

    //Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    animate();
}

function animate() {
    window.requestAnimationFrame(animate)
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera)
}

// MAIN VOXEL FUNCTIONS
function onPointerMove(event) {

    pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {

        const intersect = intersects[0];

        rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

        render();

    }

}

function onPointerDown(event) {

    if (isPainting == true) {
        pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);

        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects(objects, false);

        if (intersects.length > 0) {

            const intersect = intersects[0];

            intersect.currentHex = 0xbcbcbc;
            intersect.object.material.color.set(colors[colorValue]);

        }

    }

    if (isBuilding == true) {
        pointer.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);

        raycaster.setFromCamera(pointer, camera);

        const intersects = raycaster.intersectObjects(objects, false);

        if (intersects.length > 0) {

            const intersect = intersects[0];

            // delete cube

            if (isShiftDown) {

                if (intersect.object) {

                    scene.remove(intersect.object);

                    objects.splice(objects.indexOf(intersect.object), 1);
                    CubeCounter = objects.length;
                    TotalCost = CubeCounter * CubeValue;
                    console.log(TotalCost + 'tezos');
                    console.log(CubeCounter + 'after cull');
                }

                // create cube

            } else if (CubeCounter < 15) {

                primitiveMaterial = new THREE.MeshLambertMaterial({ color: 0xfffff0, map: plywood });
                primitiveMaterials.push(primitiveMaterial);
                const voxel = new THREE.Mesh(primitives[primitiveValue], primitiveMaterial);
                voxel.position.copy(intersect.point).add(intersect.face.normal);
                voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                scene.add(voxel);

                objects.push(voxel);
                CubeCounter = objects.length;
                console.log(CubeCounter + "HOW LONG CUBE LENGTH");
                TotalCost = CubeCounter * CubeValue;
                console.log(TotalCost + 'tezos');

            }
            // This isn't ideal (can fix later) this could be done better with booleans
            if (objects.length >= 8) {
                NextStep();
            }
            else if (objects.length <= 14) {
                rightnav.style.display = "none";
            }

            render();

        }

    }
}

function onDocumentKeyDown(event) {

    switch (event.keyCode) {

        case 16: isShiftDown = true;
            break;

    }

}

function onDocumentKeyUp(event) {

    switch (event.keyCode) {

        case 16: isShiftDown = false;
            break;

    }

}


function exportGLTfevent(event) {

    switch (event.keyCode) {

        case 32:

            exportGLTF(scene);

            break;

    }
}

function exportGLTF(input) {

    const gltfExporter = new GLTFExporter();

    const options = {
        //          onlyVisible: document.getElementById('option_visible').checked
    };
    gltfExporter.parse(
        input,
        function (result) {

            if (result instanceof ArrayBuffer) {

                saveArrayBuffer(result, 'scene.glb');
                console.log("exported");

            } else {

                const output = JSON.stringify(result, null, 2);
                console.log("this is the fucking output");
                saveString(output, 'scene.gltf');

            }

        },
        function (error) {

            console.log('An error happened during parsing', error);
            console.log("not exported");
        },
        options
    );

}

const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link); // Firefox workaround, see #6594


function save(blob, filename) {

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    //  sendFileToBackend(blob, filename);
    // URL.revokeObjectURL( url ); breaks Firefox...

}

function saveString(text, filename) {

    save(new Blob([text], { type: 'text/plain' }), filename);

}


function saveArrayBuffer(buffer, filename) {

    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);

}

function NextStep(boolean) {
    rightnav.style.display = "block";
}

// UI Functions 

window.sync = function () {
    sectionOne.style.display = "block";
    landing.style.display = "none";
    isBuilding = true;
}

window.painting = function () {
    sectionOne.style.display = "none";
    sectionTwo.style.display = "block";
    sectionThree.style.display = "none";
    isBuilding = false;
    isPainting = true;
}

window.building = function () {
    sectionOne.style.display = "block";
    sectionTwo.style.display = "none";
    isBuilding = true;
    isPainting = false;
}

window.mintPage = function () {
    sectionOne.style.display = "none";
    sectionTwo.style.display = "none";
    sectionThree.style.display = "block";
    isPainting = false;
    isBuilding = false;
}

window.minting = function () {
    sectionThree.style.display = "none";
    sectionFour.style.display = "block";
    scene.remove(rollOverMesh);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 450;
    controls.enabled = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
}

//Primitives Values
window.cube = function () {
    primitiveValue = 0;
    isShiftDown = false;
}
window.sphere = function () {
    primitiveValue = 1;
    isShiftDown = false;
}
window.pyramid = function () {
    primitiveValue = 2;
    isShiftDown = false;
}
window.circle = function () {
    primitiveValue = 3;
    isShiftDown = false;
}
window.erase = function () {
    isShiftDown = true;
}

window.color0 = function () {
    colorValue = 4;
    isPainting = true;
}
// Color Values
window.color1 = function () {
    colorValue = 0;
    isPainting = true;
}
window.color2 = function () {
    colorValue = 1;
    isPainting = true;
}
window.color3 = function () {
    colorValue = 2;
    isPainting = true;
}
window.color4 = function () {
    colorValue = 3;
    isPainting = true;
}
