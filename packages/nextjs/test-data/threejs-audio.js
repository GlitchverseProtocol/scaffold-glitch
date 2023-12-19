import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

var camera, scene, renderer, labelRenderer;
var raycaster = new THREE.Raycaster(); // for click detection
var mouse = new THREE.Vector2(); // to store the mouse position

let sounds = [];
let shapes = []; // to store the shapes
let lines = [];
let labels = [];

let velocityScale = 0.05;
let pulsatingSpeed = 0.005;
let pulsatationAmplitude = 0.15;
let shapeColors = [0x00ffff, 0xff00ff, 0xffff00, 0x0000ff, 0x800080, 0x008000];

// init
function init() {
  // scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.025);

  var light = new THREE.PointLight(0xff00ff, 1, 100);
  light.position.set(-10, -10, -10);
  scene.add(light);

  // Add an AmbientLight to the scene
  var ambientLight = new THREE.AmbientLight(0x00ffff, 0.2);
  scene.add(ambientLight);

  // Labels
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

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
      if (!tokenData[i].data) {
        console.warn("No data for audio");
        continue;
      }
      // Create a closure to capture the current value of i
      (function (i) {
        var audio = new THREE.Audio(listener);
        var contractAddress = tokenData[i].contract;
        audioLoader.load(tokenData[i].data, function (buffer) {
          audio.setBuffer(buffer);
          audio.setLoop(true);
          sounds.push(audio);
          console.log("loaded");
          console.log(sounds);

          // Create a sphere for each audio
          // Create a sphere for each audio
          var geometry = new THREE.SphereGeometry(0.5, 32, 32);
          var wireframe = new THREE.WireframeGeometry(geometry); // Create a wireframe geometry from the sphere geometry

          var material = new THREE.LineBasicMaterial({
            color: shapeColors[Math.floor(Math.random() * shapeColors.length)],
          });
          var sphere = new THREE.LineSegments(wireframe, material); // Create a LineSegments object instead of a Mesh

          // If tokenData.isPrimary is true, create an outer sphere
          if (tokenData[i].isPrimary) {
            console.log("isPrimary", i);
            var outerGeometry = new THREE.SphereGeometry(0.6, 32, 32); // slightly larger than the inner sphere
            var outerMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ff00,
              transparent: true,
              opacity: 0.5,
            });
            var outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
            outerSphere.add(sphere); // add the inner sphere to the outer sphere
            sphere = outerSphere; // now the sphere variable refers to the outer sphere
          }

          sphere.position.x = i * 2 - tokenData.length; // subtract half of the total width
          sphere.userData = {
            soundIndex: sounds.length - 1,
            hasSound: true,
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * velocityScale,
              (Math.random() - 0.5) * velocityScale,
              (Math.random() - 0.5) * velocityScale,
            ),
          };

          var div = document.createElement("div");
          div.className = "label";
          div.textContent = contractAddress;
          div.style.marginTop = "-1em";
          div.style.fontFamily = "Courier New, monospace"; // set the font to a monospace font
          div.style.color = "#00ff00"; // set the color to green
          var label = new CSS2DObject(div);
          label.userData = { sphere: sphere };
          label.position.y = 0.6; // adjust this value to position the label above the sphere
          labels.push(label);
          scene.add(label);

          shapes.push(sphere);
          scene.add(sphere);
          for (let k = 0; k < shapes.length - 1; k++) {
            for (let j = k + 1; j < shapes.length; j++) {
              var material = new THREE.LineBasicMaterial({ color: 0x00ffff });
              var geometry = new THREE.BufferGeometry().setFromPoints([shapes[k].position, shapes[j].position]);
              var line = new THREE.Line(geometry, material);
              line.userData = { indices: [k, j] }; // Store the indices of the associated shapes
              scene.add(line);
              lines.push(line);
            }
          }
        });
      })(i);
    }
  }

  // camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000);
  camera.position.set(0, 0, 10); // move the camera back
  camera.lookAt(scene.position); // make the camera look at the scene

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor("#000000");
  document.body.appendChild(renderer.domElement);

  // Add event listener for mouse click
  window.addEventListener("click", onDocumentMouseDown, false);
}

let frameCount = 0;

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

    // If the shape has sound, check if it's playing and update isPlaying
    if (shape.userData.hasSound) {
      shape.userData.isPlaying = sounds[shape.userData.soundIndex].isPlaying;

      // If the sound is playing, make it pulsate
      if (shape.userData.isPlaying) {
        var scale = Math.sin(Date.now() * pulsatingSpeed) * pulsatationAmplitude + 1; // Change 0.001 to adjust the speed, 0.1 to adjust the amplitude
        shape.scale.set(scale, scale, scale);
      } else {
        shape.scale.set(1, 1, 1); // Reset the scale when the sound is not playing
      }
    }
  });

  // Update line vertices
  lines.forEach(line => {
    var indices = line.userData.indices;
    var geometry = new THREE.BufferGeometry().setFromPoints([shapes[indices[0]].position, shapes[indices[1]].position]);
    line.geometry = geometry;
  });

  if (frameCount % 2 === 0) {
    labels.forEach(label => {
      label.position.copy(label.userData.sphere.position);
    });
  }

  frameCount++;

  render();
}

// render
function render() {
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
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
        if (intersectedObject.userData.isPlaying) {
          console.log("stop");
          sounds[soundIndex].stop();
          intersectedObject.userData.isPlaying = false; // Set isPlaying to false when the sound is stopped
        } else {
          console.log("play");
          sounds[soundIndex].play();
          intersectedObject.userData.isPlaying = true; // Set isPlaying to true when the sound is played
        }
      } else {
        console.log("Audio is not loaded yet");
      }
    }
  }
}

init();
animate();
