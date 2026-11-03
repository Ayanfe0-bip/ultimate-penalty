import * as THREE from 'three';

// =====================================
// ULTIMATE PENALTY
// Created by Ayanfe Innovation Labs Ltd.
// =====================================

const container = document.getElementById('game-container');

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const shootBtn = document.getElementById('shoot-btn');
const restartBtn = document.getElementById('restart-btn');

const scoreText = document.getElementById('score');
const attemptsText = document.getElementById('attempts');
const bestText = document.getElementById('best-score');
const powerControl = document.getElementById('power-control');
const powerValue = document.getElementById('power-value');
const aimLabel = document.getElementById('aim-label');

let scene;
let camera;
let renderer;
let ball;
let goalkeeper;
let keeperBody;
let keeperArms = [];
let keeperLegs = [];

let score = 0;
let attempts = 5;
let aim = 'center';
let power = 60;
let busy = false;
let gameStarted = false;
let animationId = null;

let bestScore = Number(localStorage.getItem('ultimatePenaltyBest') || 0);

bestText.textContent = bestScore;

// =====================================
// COLORS
// =====================================

const green = 0xb7ff35;
const darkGreen = 0x174b2b;
const white = 0xffffff;

// =====================================
// MATERIAL HELPER
// =====================================

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    ...options
  });
}

// =====================================
// CREATE SCENE
// =====================================

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07130d);
  scene.fog = new THREE.Fog(0x07130d, 22, 65);

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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
    0x17351f,
    2
  );

  scene.add(ambient);

  const stadiumLight = new THREE.DirectionalLight(
    0xffffff,
    2.5
  );

  stadiumLight.position.set(-5, 12, 8);
  stadiumLight.castShadow = true;
  scene.add(stadiumLight);

  const secondLight = new THREE.PointLight(
    0xcaffd4,
    70,
    35
  );

  secondLight.position.set(0, 9, -5);
  scene.add(secondLight);

  createStadium();
  createPitch();
  createGoal();
  createGoalkeeper();
  createBall();

  document.getElementById('loading-message').style.display = 'none';

  animate();
}

// =====================================
// STADIUM
// =====================================

function createStadium() {
  const standMaterial = material(0x14271c);

  const stand = new THREE.Mesh(
    new THREE.BoxGeometry(30, 5, 5),
    standMaterial
  );

  stand.position.set(0, 3, -12);
  scene.add(stand);

  for (let row = 0; row < 5; row++) {
    for (let i = 0; i < 35; i++) {
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.35, 0.5),
        material(
          i % 3 === 0 ? 0x54705a : 0x263e30
        )
      );

      seat.position.set(
        -9.5 + i * 0.57,
        1.2 + row * 0.7,
        -9.2 - row * 0.55
      );

      scene.add(seat);
    }
  }

  // Stadium floodlights

  [-12, 12].forEach(x => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 10, 8),
      material(0x4a554e)
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

// =====================================
// FOOTBALL PITCH
// =====================================

function createPitch() {
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 35),
    material(0x17652e)
  );

  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(0, 0, -2);
  pitch.receiveShadow = true;
  scene.add(pitch);

  // Grass stripes

  for (let i = 0; i < 8; i++) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 2.2),
      material(i % 2 === 0 ? 0x1a7034 : 0x155c2b)
    );

    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(
      0,
      0.01,
      13 - i * 4.3
    );

    scene.add(stripe);
  }

  // Penalty box line

  addLine(-6, 0.025, -1, 6, 0.025, -1);
  addLine(-6, 0.025, -1, -6, 0.025, -9);
  addLine(6, 0.025, -1, 6, 0.025, -9);
  addLine(-6, 0.025, -9, 6, 0.025, -9);

  // Penalty spot

  const spot = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 20),
    new THREE.MeshBasicMaterial({ color: white })
  );

  spot.rotation.x = -Math.PI / 2;
  spot.position.set(0, 0.035, 7);
  scene.add(spot);
}

function addLine(x1, y1, z1, x2, y2, z2) {
  const points = [
    new THREE.Vector3(x1, y1, z1),
    new THREE.Vector3(x2, y2, z2)
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: white })
  );

  scene.add(line);
}

// =====================================
// GOALPOST AND NET
// =====================================

function createGoal() {
  const postMaterial = material(0xffffff, {
    metalness: 0.35,
    roughness: 0.3
  });

  const postPositions = [
    [-3.7, 1.75, -5],
    [3.7, 1.75, -5],
    [0, 3.5, -5]
  ];

  postPositions.forEach((position, index) => {
    const geometry = index === 2
      ? new THREE.BoxGeometry(7.4, 0.16, 0.16)
      : new THREE.CylinderGeometry(0.09, 0.09, 3.5, 12);

    const post = new THREE.Mesh(geometry, postMaterial);

    post.position.set(...position);

    if (index === 2) {
      post.rotation.z = 0;
    }

    post.castShadow = true;
    scene.add(post);
  });

  // Goal net

  const netMaterial = new THREE.LineBasicMaterial({
    color: 0xb7c9bb,
    transparent: true,
    opacity: 0.35
  });

  for (let x = -3.6; x <= 3.61; x += 0.45) {
    const points = [
      new THREE.Vector3(x, 0.1, -5),
      new THREE.Vector3(x, 3.4, -5),
      new THREE.Vector3(x, 3.4, -7),
      new THREE.Vector3(x, 0.1, -7)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(new THREE.Line(geometry, netMaterial));
  }

  for (let y = 0.3; y <= 3.4; y += 0.45) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.6, y, -5),
      new THREE.Vector3(3.6, y, -5),
      new THREE.Vector3(3.6, y, -7)
    ]);

    scene.add(new THREE.Line(geometry, netMaterial));
  }
}

// =====================================
// GOALKEEPER
// =====================================

function createGoalkeeper() {
  goalkeeper = new THREE.Group();

  const shirt = material(0xffa600);
  const shorts = material(0x182b52);
  const skin = material(0xc68a62);
  const gloves = material(0xffffff);

  keeperBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.25, 0.45),
    shirt
  );

  keeperBody.position.y = 1.75;
  goalkeeper.add(keeperBody);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 16),
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
      new THREE.SphereGeometry(0.19, 12, 12),
      gloves
    );

    glove.position.set(side * 0.83, 1.35, 0);
    goalkeeper.add(glove);
  });

  keeperLegs = [];

  [-1, 1].forEach(side => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.85, 0.32),
      shorts
    );

    leg.position.set(side * 0.23, 0.4, 0);
    goalkeeper.add(leg);
    keeperLegs.push(leg);
  });

  goalkeeper.position.set(0, 0, -4.35);

  goalkeeper.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
    }
  });

  scene.add(goalkeeper);
}

// =====================================
// FOOTBALL
// =====================================

function createBall() {
  const geometry = new THREE.SphereGeometry(0.28, 24, 24);

  const ballMaterial = material(0xffffff, {
    roughness: 0.5
  });

  ball = new THREE.Mesh(geometry, ballMaterial);

  ball.position.set(0, 0.28, 7);
  ball.castShadow = true;

  scene.add(ball);

  // Black football markings

  const marking = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 6),
    material(0x111111)
  );

  marking.position.set(0, 0.28, 6.72);
  marking.rotation.x = -0.5;

  scene.add(marking);
}

// =====================================
// GAME CONTROLS
// =====================================

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

// =====================================
// START GAME
// =====================================

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

  scoreText.textContent = score;
  attemptsText.textContent = attempts;

  updateIndicators();

  ball.position.set(0, 0.28, 7);
  goalkeeper.position.set(0, 0, -4.35);

  shootBtn.disabled = false;
  shootBtn.style.opacity = '1';
}

// =====================================
// SHOOTING SYSTEM
// =====================================

shootBtn.addEventListener('click', shootBall);

function shootBall() {
  if (busy || attempts <= 0 || !gameStarted) return;

  busy = true;
  shootBtn.disabled = true;
  shootBtn.style.opacity = '0.5';

  const targetX = aim === 'left'
    ? -2.5
    : aim === 'right'
      ? 2.5
      : 0;

  const targetY = 0.35 + (power / 100) * 2.3;

  // Goalkeeper chooses a direction

  const keeperChoice = Math.floor(Math.random() * 3);

  const keeperTarget = [-2.5, 0, 2.5][keeperChoice];

  const saveChance =
    Math.abs(keeperTarget - targetX) < 0.5 &&
    targetY < 2.8;

  const scored = !saveChance;

  goalkeeper.position.x = keeperTarget;

  if (saveChance) {
    goalkeeper.rotation.z = keeperTarget > 0 ? -0.5 : 0.5;
  }

  const startPosition = ball.position.clone();

  const endPosition = new THREE.Vector3(
    targetX,
    targetY,
    -5.1
  );

  const duration = 1000;
  const startTime = performance.now();

  function animateShot(now) {
    const progress = Math.min(
      (now - startTime) / duration,
      1
    );

    ball.position.lerpVectors(
      startPosition,
      endPosition,
      progress
    );

    ball.position.y += Math.sin(progress * Math.PI) * 0.8;

    ball.rotation.x += 0.15;
    ball.rotation.z += 0.1;

    if (progress < 1) {
      requestAnimationFrame(animateShot);
    } else {
      finishShot(scored);
    }
  }

  requestAnimationFrame(animateShot);
}

// =====================================
// FINISH SHOT
// =====================================

function finishShot(scored) {
  if (scored) {
    score++;
    scoreText.textContent = score;
  }

  attempts--;

  attemptsText.textContent = attempts;

  updateIndicators();

  ball.position.set(0, 0.28, 7);

  goalkeeper.position.set(0, 0, -4.35);
  goalkeeper.rotation.set(0, 0, 0);

  if (attempts <= 0) {
    setTimeout(showResults, 700);
  } else {
    busy = false;
    shootBtn.disabled = false;
    shootBtn.style.opacity = '1';
  }
}

// =====================================
// SHOT INDICATORS
// =====================================

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

// =====================================
// RESULTS
// =====================================

function showResults() {
  gameStarted = false;

  gameScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  document.getElementById('final-score').textContent =
    score + ' / 5';

  const title = document.getElementById('result-title');
  const message = document.getElementById('result-message');

  if (score === 5) {
    title.textContent = 'LEGENDARY!';
    message.textContent = 'Perfect performance! You are a penalty champion.';
  } else if (score >= 3) {
    title.textContent = 'GREAT JOB!';
    message.textContent = 'Excellent performance. Keep improving!';
  } else {
    title.textContent = 'KEEP TRAINING!';
    message.textContent = 'Every champion starts somewhere. Try again!';
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

// =====================================
// RESTART
// =====================================

restartBtn.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  resetGame();
});

// =====================================
// RESPONSIVE DISPLAY
// =====================================

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

// =====================================
// RENDER LOOP
// =====================================

function animate() {
  animationId = requestAnimationFrame(animate);

  if (ball && !busy) {
    ball.rotation.y += 0.003;
  }

  renderer.render(scene, camera);
  }
