// Set up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 2, 2);
scene.add(light);

// Fetch and load GLB model
const loader = new THREE.GLTFLoader();
fetch('brain.glb')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.arrayBuffer();
  })
  .then(data => {
    console.log("GLB File Loaded Successfully, Size:", data.byteLength);
    const blob = new Blob([data], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    
    loader.load(url, 
      (gltf) => {
        console.log("GLB Parsed Successfully", gltf);
        const brain = gltf.scene;
        brain.scale.set(0.2, 0.2, 0.2); // Reduce brain size further
        brain.position.set(0, 0, 0); // Center the model
        scene.add(brain);
      },
      (xhr) => console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`),
      (error) => console.error("Error parsing GLB:", error)
    );
  })
  .catch(error => console.error("Error fetching GLB:", error));

// Define brain region markers
const brainRegions = {
  "Broca’s Area": { position: [-0.5, 1.0, 0.3], techniques: ["fMRI", "MEG", "ECoG"] },
  "Wernicke’s Area": { position: [0.7, 0.8, -0.4], techniques: ["TMS", "EEG"] },
  "Motor Cortex": { position: [-0.3, 1.5, 0.2], techniques: ["Cortical Stimulation", "DTI"] },
};

// Add invisible click markers
Object.entries(brainRegions).forEach(([name, { position, techniques }]) => {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: 0.0 })
  );
  marker.position.set(...position);
  marker.userData = { name, techniques };
  scene.add(marker);
});

// Handle click interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  for (const i of intersects) {
    if (i.object.userData.name) {
      const { name, techniques } = i.object.userData;
      const box = document.getElementById('info-box');
      box.innerHTML = `<strong>${name}</strong><br>${techniques.join(', ')}`;
      box.style.display = 'block';
      return;
    }
  }
}

// Add event listener for clicking markers
window.addEventListener('click', onMouseClick);

// Adjust camera for a better view
camera.position.set(0, 0, 10); // Zoom out more to fit the entire model
new THREE.OrbitControls(camera, renderer.domElement);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle light and brightness controls
const lightSlider = document.getElementById('lightSlider');
const brightnessSlider = document.getElementById('brightnessSlider');

lightSlider.addEventListener('input', () => {
  light.intensity = parseFloat(lightSlider.value);
});

brightnessSlider.addEventListener('input', () => {
  renderer.toneMappingExposure = parseFloat(brightnessSlider.value);
});
