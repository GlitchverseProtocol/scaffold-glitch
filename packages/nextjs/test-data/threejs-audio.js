import * as THREE from "three";

var camera, scene, renderer;
var raycaster = new THREE.Raycaster(); // for click detection
var mouse = new THREE.Vector2(); // to store the mouse position

let sounds = [];
let shapes = []; // to store the shapes
let lines = [];

let velocityScale = 0.05;

// init
function init() {
  // scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x01131e, 0.025);

  var light = new THREE.PointLight(0xffffff, 1, 100);
  // Add an AmbientLight to the scene
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Move the PointLight to a different position
  light.position.set(10, 10, 10);
  scene.add(light);

  var audioLoader = new THREE.AudioLoader();
  var listener = new THREE.AudioListener();

  var textureLoader = new THREE.TextureLoader();

  for (let i = 0; i < tokenData.length; i++) {
    if (tokenData[i].dataType === "image/png") {
      console.log("image");
      // IMAGE
      var texture = textureLoader.load(tokenData[i].data);
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({ map: texture });
      var cube = new THREE.Mesh(geometry, material);
      cube.userData = {
        hasSound: false,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * velocityScale,
          (Math.random() - 0.5) * velocityScale,
          (Math.random() - 0.5) * velocityScale,
        ),
      };

      cube.position.x = i * 2 - tokenData.length; // subtract half of the total width
      shapes.push(cube);
      scene.add(cube);
    } else if (tokenData[i].dataType === "audio/ogg") {
      console.log("audio/ogg");
      // AUDIO
      var audio = new THREE.Audio(listener);
      if (!tokenData[i].data) {
        console.warn("No data for audio");
        continue
      }
      audioLoader.load(tokenData[i].data, function (buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        sounds.push(audio);
        console.log("loaded");
        console.log(sounds);

        // Create a sphere for each audio
        var geometry = new THREE.SphereGeometry(0.5, 32, 32);
        var material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff }); // Use MeshPhongMaterial
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = i * 2 - tokenData.length; // subtract half of the total width
        sphere.userData = { soundIndex: sounds.length - 1 }; // store the index of the sound associated with this sphere
        sphere.userData = {
          soundIndex: sounds.length - 1,
          hasSound: true,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * velocityScale,
            (Math.random() - 0.5) * velocityScale,
            (Math.random() - 0.5) * velocityScale,
          ),
        };
        shapes.push(sphere);
        scene.add(sphere);

        for (let i = 0; i < shapes.length - 1; i++) {
          for (let j = i + 1; j < shapes.length; j++) {
            var material = new THREE.LineBasicMaterial({ color: 0xffffff });
            var geometry = new THREE.BufferGeometry().setFromPoints([shapes[i].position, shapes[j].position]);
            var line = new THREE.Line(geometry, material);
            line.userData = { indices: [i, j] }; // Store the indices of the associated shapes
            scene.add(line);
            lines.push(line);
          }
        }
      });
    }
  }

  // camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000);
  camera.position.set(0, 0, 10); // move the camera back
  camera.lookAt(scene.position); // make the camera look at the scene

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor("#01131E");
  document.body.appendChild(renderer.domElement);

  // Add event listener for mouse click
  window.addEventListener("click", onDocumentMouseDown, false);
}

function animate() {
  requestAnimationFrame(animate);

  // Update shape positions
  shapes.forEach((shape, index) => {
    shape.rotation.x += 0.01;
    shape.rotation.y += 0.01;
    shape.position.add(shape.userData.velocity);
    if (shape.position.x < -5 || shape.position.x > 5) shape.userData.velocity.x = -shape.userData.velocity.x;
    if (shape.position.y < -5 || shape.position.y > 5) shape.userData.velocity.y = -shape.userData.velocity.y;
    if (shape.position.z < -5 || shape.position.z > 5) shape.userData.velocity.z = -shape.userData.velocity.z;
  });

  // Update line vertices
  lines.forEach(line => {
    var indices = line.userData.indices;
    var geometry = new THREE.BufferGeometry().setFromPoints([shapes[indices[0]].position, shapes[indices[1]].position]);
    line.geometry = geometry;
  });

  render();
}

// render
function render() {
  renderer.render(scene, camera);
}

// Event handler for mouse click
function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(shapes);

  if (intersects.length > 0) {
    var intersectedObject = intersects[0].object;
    if (intersectedObject.userData.hasSound) {
      var soundIndex = intersectedObject.userData.soundIndex;
      if (sounds[soundIndex]) {
        console.log("soundIndex", soundIndex);
        if (sounds[soundIndex].isPlaying) {
          console.log("stop");
          sounds[soundIndex].stop();
        } else {
          console.log("play");
          sounds[soundIndex].play();
        }
      } else {
        console.log("Audio is not loaded yet");
      }
    }
  }
}

init();
animate();
