import * as THREE from 'three';

// ==========================================
// ULTIMATE PENALTY
// Ayanfe Innovation Labs Limited
// ==========================================

const $ = id => document.getElementById(id);

const container = $('game-container');
const startScreen = $('start-screen');
const gameScreen = $('game-screen');
const resultScreen = $('result-screen');

const startBtn = $('start-btn');
const shootBtn = $('shoot-btn');
const restartBtn = $('restart-btn');

const scoreText = $('score');
const attemptsText = $('attempts');
const bestText = $('best-score');
const powerControl = $('power-control');
const powerValue = $('power-value');
const aimLabel = $('aim-label');

let scene, camera, renderer;
let ball, goalkeeper;
let keeperArms = [];

let score = 0;
let attempts = 5;
let aim = 'center';
let power = 60;
let busy = false;
let gameStarted = false;
let bestScore = Number(
localStorage.getItem('ultimatePenaltyBest') || 0
);

let gesture = null;
let shotAnimation = null;

bestText.textContent = bestScore;

// ==========================================
// MATERIALS
// ==========================================

function mat(color, options = {}) {
return new THREE.MeshStandardMaterial({
color,
roughness: 0.8,
...options
});
}

// ==========================================
// INITIALIZE GAME
// ==========================================

function createScene() {
scene = new THREE.Scene();
scene.background = new THREE.Color(0x09140e);
scene.fog = new THREE.Fog(0x09140e, 25, 65);

camera = new THREE.PerspectiveCamera(
48,
container.clientWidth / container.clientHeight,
0.1,
100
);

camera.position.set(0, 5.5, 15);
camera.lookAt(0, 2, -2);

renderer = new THREE.WebGLRenderer({
antialias: true,
powerPreference: 'high-performance'
});

renderer.setPixelRatio(
Math.min(window.devicePixelRatio, 1.5)
);

renderer.setSize(
container.clientWidth,
container.clientHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(
0xffffff,
0x1a3320,
2
);

scene.add(ambient);

const mainLight = new THREE.DirectionalLight(
0xffffff,
2.5
);

mainLight.position.set(-5, 12, 8);
mainLight.castShadow = true;
scene.add(mainLight);

const stadiumLight = new THREE.PointLight(
0xe8f4e8,
80,
35
);

stadiumLight.position.set(0, 10, -5);
scene.add(stadiumLight);

createStadium();
createPitch();
createGoal();
createGoalkeeper();
createBall();

$('loading-message').style.display = 'none';

setupGestures();
animate();
}

// ==========================================
// STADIUM
// ==========================================

function createStadium() {
const stand = new THREE.Mesh(
new THREE.BoxGeometry(30, 5, 5),
mat(0x17251c)
);

stand.position.set(0, 3, -12);
scene.add(stand);

for (let row = 0; row < 5; row++) {
for (let i = 0; i < 35; i++) {
const seat = new THREE.Mesh(
new THREE.BoxGeometry(0.55, 0.35, 0.5),
mat(i % 3 === 0 ? 0x526455 : 0x283a2e)
);

  seat.position.set(
    -9.5 + i * 0.57,
    1.2 + row * 0.7,
    -9.2 - row * 0.55
  );

  scene.add(seat);
}

}

[-12, 12].forEach(x => {
const pole = new THREE.Mesh(
new THREE.CylinderGeometry(0.12, 0.18, 10, 8),
mat(0x535c55)
);

pole.position.set(x, 5, -7);
scene.add(pole);

const lamp = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.5, 0.4),
  new THREE.MeshBasicMaterial({
    color: 0xffffff
  })
);

lamp.position.set(x, 10, -7);
scene.add(lamp);

});
}

// ==========================================
// PITCH
// ==========================================

function createPitch() {
const pitch = new THREE.Mesh(
new THREE.PlaneGeometry(32, 35),
mat(0x245234)
);

pitch.rotation.x = -Math.PI / 2;
pitch.position.set(0, 0, -2);
pitch.receiveShadow = true;

scene.add(pitch);

for (let i = 0; i < 8; i++) {
const stripe = new THREE.Mesh(
new THREE.PlaneGeometry(32, 2.2),
mat(i % 2 === 0 ? 0x285b36 : 0x214b2e)
);

stripe.rotation.x = -Math.PI / 2;
stripe.position.set(0, 0.01, 13 - i * 4.3);

scene.add(stripe);

}

addLine(-6, 0.025, -1, 6, 0.025, -1);
addLine(-6, 0.025, -1, -6, 0.025, -9);
addLine(6, 0.025, -1, 6, 0.025, -9);
addLine(-6, 0.025, -9, 6, 0.025, -9);

const spot = new THREE.Mesh(
new THREE.CircleGeometry(0.09, 20),
new THREE.MeshBasicMaterial({ color: 0xffffff })
);

spot.rotation.x = -Math.PI / 2;
spot.position.set(0, 0.035, 7);

scene.add(spot);
}

function addLine(x1, y1, z1, x2, y2, z2) {
const geometry = new THREE.BufferGeometry().setFromPoints([
new THREE.Vector3(x1, y1, z1),
new THREE.Vector3(x2, y2, z2)
]);

scene.add(
new THREE.Line(
geometry,
new THREE.LineBasicMaterial({ color: 0xffffff })
)
);
}

// ==========================================
// GOAL
// ==========================================

function createGoal() {
const white = mat(0xe8e8df, {
metalness: 0.25,
roughness: 0.35
});

const left = new THREE.Mesh(
new THREE.CylinderGeometry(0.09, 0.09, 3.5, 12),
white
);

left.position.set(-3.7, 1.75, -5);
scene.add(left);

const right = left.clone();
right.position.x = 3.7;
scene.add(right);

const crossbar = new THREE.Mesh(
new THREE.BoxGeometry(7.4, 0.16, 0.16),
white
);

crossbar.position.set(0, 3.5, -5);
scene.add(crossbar);

const netMaterial = new THREE.LineBasicMaterial({
color: 0xbac6bc,
transparent: true,
opacity: 0.35
});

for (let x = -3.6; x <= 3.6; x += 0.4) {
addNetLine(x, 0.1, -5, x, 3.4, -5, netMaterial);
addNetLine(x, 3.4, -5, x, 3.4, -7, netMaterial);
addNetLine(x, 0.1, -5, x, 0.1, -7, netMaterial);
}

for (let y = 0.3; y <= 3.4; y += 0.4) {
addNetLine(-3.6, y, -5, 3.6, y, -5, netMaterial);
addNetLine(-3.6, y, -5, -3.6, y, -7, netMaterial);
addNetLine(3.6, y, -5, 3.6, y, -7, netMaterial);
}
}

function addNetLine(x1, y1, z1, x2, y2, z2, material) {
const geometry = new THREE.BufferGeometry().setFromPoints([
new THREE.Vector3(x1, y1, z1),
new THREE.Vector3(x2, y2, z2)
]);

scene.add(new THREE.Line(geometry, material));
}

// ==========================================
// GOALKEEPER
// ==========================================

function createGoalkeeper() {
goalkeeper = new THREE.Group();

const shirt = mat(0x263e58);
const shorts = mat(0x182b45);
const skin = mat(0xb98769);
const gloves = mat(0xe9e7dd);

const body = new THREE.Mesh(
new THREE.BoxGeometry(0.9, 1.25, 0.45),
shirt
);

body.position.y = 1.75;
goalkeeper.add(body);

const head = new THREE.Mesh(
new THREE.SphereGeometry(0.27, 20, 20),
skin
);

head.position.y = 2.55;
goalkeeper.add(head);

const shortsMesh = new THREE.Mesh(
new THREE.BoxGeometry(0.85, 0.4, 0.42),
shorts
);

shortsMesh.position.y = 0.95;
goalkeeper.add(shortsMesh);

keeperArms = [];

[-1, 1].forEach(side => {
const arm = new THREE.Mesh(
new THREE.BoxGeometry(0.24, 1.1, 0.25),
shirt
);

arm.position.set(side * 0.65, 1.85, 0);
arm.rotation.z = side * -0.25;

goalkeeper.add(arm);
keeperArms.push(arm);

const glove = new THREE.Mesh(
  new THREE.SphereGeometry(0.19, 16, 16),
  gloves
);

glove.position.set(side * 0.83, 1.35, 0);
goalkeeper.add(glove);

});

[-1, 1].forEach(side => {
const leg = new THREE.Mesh(
new THREE.BoxGeometry(0.28, 0.85, 0.32),
shorts
);

leg.position.set(side * 0.23, 0.4, 0);
goalkeeper.add(leg);

});

goalkeeper.position.set(0, 0, -4.35);

goalkeeper.traverse(object => {
if (object.isMesh) object.castShadow = true;
});

scene.add(goalkeeper);
}

// ==========================================
// FOOTBALL
// ==========================================

function createBall() {
const ballGroup = new THREE.Group();

const ballMesh = new THREE.Mesh(
new THREE.SphereGeometry(0.28, 32, 32),
mat(0xf2f1e9, { roughness: 0.65 })
);

ballGroup.add(ballMesh);

// Football panel markings

for (let i = 0; i < 5; i++) {
const marking = new THREE.Mesh(
new THREE.CircleGeometry(0.07, 5),
mat(0x171717)
);

const angle = i * Math.PI * 2 / 5;

marking.position.set(
  Math.cos(angle) * 0.12,
  Math.sin(angle) * 0.12,
  0.255
);

ballGroup.add(marking);

}

ball = ballGroup;
ball.position.set(0, 0.28, 7);

ball.traverse(object => {
if (object.isMesh) object.castShadow = true;
});

scene.add(ball);
}

// ==========================================
// GESTURE CONTROLS
// ==========================================

function setupGestures() {
const canvas = renderer.domElement;

canvas.addEventListener('pointerdown', event => {
if (busy || !gameStarted) return;

const rect = canvas.getBoundingClientRect();

const ballScreen = ball.position.clone();
ballScreen.project(camera);

const ballX = rect.left + (ballScreen.x + 1) * rect.width / 2;
const ballY = rect.top + (1 - ballScreen.y) * rect.height / 2;

const distance = Math.hypot(
  event.clientX - ballX,
  event.clientY - ballY
);

// Touch near the football to begin.

if (distance > 85) return;

gesture = {
  startX: event.clientX,
  startY: event.clientY,
  currentX: event.clientX,
  currentY: event.clientY,
  moved: false
};

canvas.setPointerCapture(event.pointerId);

event.preventDefault();

});

canvas.addEventListener('pointermove', event => {
if (!gesture) return;

gesture.currentX = event.clientX;
gesture.currentY = event.clientY;

const dx = gesture.currentX - gesture.startX;
const dy = gesture.startY - gesture.currentY;

gesture.moved = true;

// Horizontal gesture selects direction.

if (dx < -20) aim = 'left';
else if (dx > 20) aim = 'right';
else aim = 'center';

// Upward gesture controls power.

power = Math.max(
  10,
  Math.min(100, 45 + dy * 0.8)
);

aimLabel.textContent = aim.toUpperCase();
powerValue.textContent = Math.round(power) + '%';

powerControl.value = Math.round(power);

});

canvas.addEventListener('pointerup', () => {
if (!gesture) return;

const dx = gesture.currentX - gesture.startX;
const dy = gesture.startY - gesture.currentY;

const moved = gesture.moved;

gesture = null;

if (moved && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
  shootBall(dx, dy);
}

});

canvas.addEventListener('pointercancel', () => {
gesture = null;
});
}

// ==========================================
// AIM BUTTONS
// ==========================================

document.querySelectorAll('.aim-btn').forEach(button => {
button.addEventListener('click', () => {
if (busy || !gameStarted) return;

document.querySelectorAll('.aim-btn').forEach(btn => {
  btn.classList.remove('active');
});

button.classList.add('active');

aim = button.dataset.aim;
aimLabel.textContent = aim.toUpperCase();

});
});

powerControl.addEventListener('input', () => {
power = Number(powerControl.value);
powerValue.textContent = power + '%';
});

// ==========================================
// START GAME
// ==========================================

startBtn.addEventListener('click', () => {
startScreen.classList.add('hidden');
gameScreen.classList.remove('hidden');

if (!renderer) {
createScene();
}

resetGame();
});

function resetGame() {
score = 0;
attempts = 5;
busy = false;
gameStarted = true;

aim = 'center';
power = 60;

scoreText.textContent = score;
attemptsText.textContent = attempts;

powerControl.value = 60;
powerValue.textContent = '60%';
aimLabel.textContent = 'CENTRE';

document.querySelectorAll('.aim-btn').forEach(btn => {
btn.classList.toggle(
'active',
btn.dataset.aim === 'center'
);
});

updateIndicators();

ball.position.set(0, 0.28, 7);
ball.rotation.set(0, 0, 0);

goalkeeper.position.set(0, 0, -4.35);
goalkeeper.rotation.set(0, 0, 0);

shootBtn.disabled = false;
shootBtn.style.opacity = '1';
}

// ==========================================
// SHOOTING
// ==========================================

shootBtn.addEventListener('click', () => {
if (busy || !gameStarted) return;

let dx = aim === 'left' ? -100 :
aim === 'right' ? 100 : 0;

let dy = (power - 45) / 0.8;

shootBall(dx, dy);
});

function shootBall(dx = 0, dy = 20) {
if (busy || attempts <= 0 || !gameStarted) return;

busy = true;

shootBtn.disabled = true;
shootBtn.style.opacity = '0.5';

const targetX = Math.max(
-3.25,
Math.min(3.25, dx / 100 * 3.25)
);

const targetY = Math.max(
0.3,
Math.min(3.25, 0.6 + power / 100 * 2.6)
);

// Goalkeeper reaction.

const keeperDirection = Math.random() < 0.5 ? -1 : 1;

const keeperTarget = Math.random() < 0.65
? targetX
: keeperDirection * 2.5;

const keeperCanReach =
Math.abs(keeperTarget - targetX) < 1.1 &&
targetY < 2.8;

const scored = !keeperCanReach;

const startPosition = ball.position.clone();

const endPosition = new THREE.Vector3(
targetX,
targetY,
-5.1
);

const duration = Math.max(
550,
1150 - power * 5
);

const startTime = performance.now();

function animateShot(now) {
const progress = Math.min(
(now - startTime) / duration,
1
);

const eased = progress * progress * (3 - 2 * progress);

ball.position.lerpVectors(
  startPosition,
  endPosition,
  eased
);

ball.position.y += Math.sin(progress * Math.PI) * 0.7;

ball.rotation.x += 0.18;
ball.rotation.z += 0.12;

// Goalkeeper dives.

goalkeeper.position.x = THREE.MathUtils.lerp(
  0,
  keeperTarget,
  Math.min(progress * 1.7, 1)
);

goalkeeper.rotation.z = THREE.MathUtils.lerp(
  0,
  keeperTarget > 0 ? -0.5 : 0.5,
  Math.min(progress * 1.5, 1)
);

keeperArms.forEach((arm, index) => {
  arm.rotation.z = THREE.MathUtils.lerp(
    index === 0 ? 0.25 : -0.25,
    keeperTarget > 0 ? -1.2 : 1.2,
    Math.min(progress * 1.5, 1)
  );
});

if (progress < 1) {
  requestAnimationFrame(animateShot);
} else {
  finishShot(scored);
}

}

requestAnimationFrame(animateShot);
}

// ==========================================
// FINISH SHOT
// ==========================================

function finishShot(scored) {
if (scored) {
score++;
scoreText.textContent = score;
}

attempts--;
attemptsText.textContent = attempts;

updateIndicators();

setTimeout(() => {
ball.position.set(0, 0.28, 7);
ball.rotation.set(0, 0, 0);

goalkeeper.position.set(0, 0, -4.35);
goalkeeper.rotation.set(0, 0, 0);

keeperArms.forEach((arm, index) => {
  arm.rotation.z = index === 0 ? 0.25 : -0.25;
});

if (attempts <= 0) {
  showResults();
} else {
  busy = false;
  shootBtn.disabled = false;
  shootBtn.style.opacity = '1';
}

}, 500);
}

// ==========================================
// SHOT INDICATORS
// ==========================================

function updateIndicators() {
const indicators = document.querySelectorAll(
'#shot-indicators span'
);

indicators.forEach((indicator, index) => {
indicator.className = '';

if (index < 5 - attempts) {
  indicator.classList.add(
    index < score ? 'scored' : 'missed'
  );
}

});
}

// ==========================================
// RESULTS
// ==========================================

function showResults() {
gameStarted = false;

gameScreen.classList.add('hidden');
resultScreen.classList.remove('hidden');

$('final-score').textContent = score + ' / 5';

if (score === 5) {
$('result-title').textContent = 'LEGENDARY!';
$('result-message').textContent =
'Perfect performance! You are a penalty champion.';
} else if (score >= 3) {
$('result-title').textContent = 'GREAT JOB!';
$('result-message').textContent =
'Excellent performance. Keep improving!';
} else {
$('result-title').textContent = 'KEEP TRAINING!';
$('result-message').textContent =
'Every champion starts somewhere. Try again!';
}

if (score > bestScore) {
bestScore = score;

localStorage.setItem(
  'ultimatePenaltyBest',
  bestScore
);

bestText.textContent = bestScore;

}
}

// ==========================================
// RESTART
// ==========================================

restartBtn.addEventListener('click', () => {
resultScreen.classList.add('hidden');
gameScreen.classList.remove('hidden');

resetGame();
});

// ==========================================
// RESIZE
// ==========================================

window.addEventListener('resize', () => {
if (!renderer || !camera) return;

camera.aspect =
container.clientWidth / container.clientHeight;

camera.updateProjectionMatrix();

renderer.setSize(
container.clientWidth,
container.clientHeight
);
});

// ==========================================
// RENDER LOOP
// ==========================================

function animate() {
requestAnimationFrame(animate);

if (ball && !busy) {
ball.rotation.y += 0.003;
}

renderer.render(scene, camera);
           }
