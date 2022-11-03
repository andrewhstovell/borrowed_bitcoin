import {textures, fonts} from "./assets.js";

// SET UP THE GAME ENVIRONMENT
const gameContainer = document.getElementById('game');
const canvas = document.getElementById('canvas');

var game = {
  viewPortWidth: gameContainer.clientWidth,
  viewPortHeight: gameContainer.clientHeight,
  worldWidth:  2560,
  worldHeight: 1440,
  delta: 0
};

var HQLocation = {x:game.viewPortWidth/2, y:game.viewPortHeight/2};

// Game State Variables
var state = {
  playerBalance: 0.0001,
  gpuValue: 0.0001,
  gpusAvailable: 4,
  gpuArray: [],
  movementSpeed: 1,
  gpuOnboard: false,
  pickUpRange: 50,
  scanCooldown: 0,
  cooldownRate: 0.01,
  cooldownTime: 3, //sec
  scanDiameter: 400, //px
  upgradeCost: [
    0.0008,
    0.0006,
    0.0004,
    0.0003,
    0.0002
  ]
};

// Create the main rendering view
const renderer = new PIXI.Renderer({
  width: game.viewPortWidth, height: game.viewPortHeight,
  view: canvas,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  backgroundColor: 0x43A080
});

// Create the main game Stage
const stage = new PIXI.Container();

// Allow resizing of window
window.addEventListener('resize', resize);
function resize() {
     renderer.resize(game.viewPortWidth, game.viewPortHeight);
}



// Create Player Balance Text
var balanceText = new PIXI.Text("" + state.playerBalance, fonts.balance);
balanceText.position.set(80, 14);

// CREATE AND CONFIGURE SPRITES
// Drone
const drone = new PIXI.Sprite(textures.drone[0]);
drone.anchor.set(0.5);
drone.position.set(game.viewPortWidth / 2, game.viewPortHeight / 2);
let droneLeft = 0, droneRight = 0, droneUp = 0, droneDown = 0; // current movement
const origDroneWidth = drone.width;
const origDroneHeight = drone.height;
const movementScalar = 0.85; // For scaling the drones texture during movement
const turningRotation = 0.1; // For rotating the drones texture during movement
let droneScalar = 0;

// Out-of-bounds Warning
const warning = new PIXI.Sprite(textures.warning);
warning.anchor.set(0.5);
warning.position.set(game.viewPortWidth / 2, drone.x - 50);
let warningVisable = false;

// Crate (Collected GPU)
const crate = new PIXI.Sprite(textures.crate);
crate.anchor.set(0.5);

// Bitcoin Logo
const bitcoinLogo = new PIXI.Sprite(textures.bitcoinLogo);
bitcoinLogo.position.set(5, 5);

// City
const city = new PIXI.Sprite(textures.city);
city.anchor.set(0.5);
city.position.set(game.viewPortWidth / 2, game.viewPortHeight / 2);

// HQ Highlight Box
const hqHighlight = new PIXI.Sprite(textures.hq_highlighter);
hqHighlight.anchor.set(0.5);
hqHighlight.position.set(city.x, city.y);

// Scanner Pulse
const scanner = new PIXI.Sprite(textures.scanner);
scanner.anchor.set(0.5);
let currentScannerScale = 0;
let scanning = false;

// Tutorial Instructions
const tutorial = new PIXI.Sprite(textures.tutorial);
tutorial.anchor.set(0.5, 1);
tutorial.position.set(game.viewPortWidth / 2, game.viewPortHeight);
let tutorialShowing = true;

// Radar Indicator
const radar = new PIXI.Sprite(textures.radar_ready);
radar.anchor.set(0.5);
radar.position.set(40, game.viewPortHeight - 40);

// SETUP EVENT LISTNERS
// Listen for Key Presses
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    droneUp = -state.movementSpeed;
    drone.height = origDroneHeight * movementScalar;
    return;
  }

  if (event.key === 's') {
    droneDown = state.movementSpeed;
    drone.height = origDroneHeight * movementScalar;
    return;
  }

  if (event.key === 'a') {
    droneLeft = -state.movementSpeed;
    drone.width = origDroneWidth * movementScalar;
    drone.rotation = -turningRotation;
    return;
  }

  if (event.key === 'd') {
    droneRight = state.movementSpeed;
    drone.width = origDroneWidth * movementScalar;
    drone.rotation = turningRotation;
    return;
  }

  if (event.key === 'z') {
    scan();
    return;
  }
}, false);

// Listen for Key Releases
document.addEventListener('keyup', (event) => {
  if (event.key === 'w') {
    droneUp = 0;
    drone.height = origDroneHeight;
    return;
  }

  if (event.key === 's') {
    droneDown = 0;
    drone.height = origDroneHeight;
    return;
  }

  if (event.key === 'a') {
    droneLeft = 0;
    drone.width = origDroneWidth;
    drone.rotation = 0;
    return;
  }

  if (event.key === 'd') {
    droneRight = 0;
    drone.width = origDroneWidth;
    drone.rotation = 0;
    return;
  }

}, false);

const ticker = new PIXI.Ticker();
ticker.add(onUpdate);
ticker.start();

// Add sprites to stage
stage.addChild(city);
stage.addChild(drone);
stage.addChild(tutorial);
stage.addChild(radar);
stage.addChild(bitcoinLogo);
stage.addChild(balanceText);

// Create upgrade buttons
const buttons = [];
const buttonCurrentValueTexts = [
  new PIXI.Text(state.gpusAvailable, fonts.button_current_value),
  new PIXI.Text(state.movementSpeed, fonts.button_current_value),
  new PIXI.Text(state.scanDiameter, fonts.button_current_value),
  new PIXI.Text(state.cooldownTime + 's', fonts.button_current_value),
  new PIXI.Text(state.pickUpRange, fonts.button_current_value)
];

const upgradeCostOriginal = [
  0.0008,
  0.0006,
  0.0004,
  0.0003,
  0.0002
];

const upgradeCostTexts = [
  new PIXI.Text(state.upgradeCost[0] + " BTC", fonts.button_cost),
  new PIXI.Text(state.upgradeCost[1] + " BTC", fonts.button_cost),
  new PIXI.Text(state.upgradeCost[2] + " BTC", fonts.button_cost),
  new PIXI.Text(state.upgradeCost[3] + " BTC", fonts.button_cost),
  new PIXI.Text(state.upgradeCost[4] + " BTC", fonts.button_cost)
];

let buttonDescriptors = [
  "GPU's in world' +1",
  "Drone Speed +0.05",
  "Scan Range +10",
  "Scan Cooldown -0.1s",
  "Pick Up Range +1"
];

for (let i = 0; i < buttonDescriptors.length; i++) {
  const button = new PIXI.Sprite(textures.upgradeButton);

  button.anchor.x = 1;
  button.position.set(game.viewPortWidth, i * 48);

  // make the button interactive
  button.interactive = true;
  button.buttonMode = true;

  button
  .on('mousedown', onButtonDown)
  .on('mouseup', onButtonUp)
  .on('mouseupoutside', onButtonUp)
  .on('mouseover', onButtonOver)
  .on('mouseout', onButtonOut)

  // add it to the stage and array
  stage.addChild(button);
  buttons.push(button);

  // Set upgrade description texts
  var text = new PIXI.Text(buttonDescriptors[i], fonts.button_description);
  text.position.set(game.viewPortWidth - 155, 5 + i * 48);
  stage.addChild(text);

  // Set upgrade current value texts
  buttonCurrentValueTexts[i].position.set(game.viewPortWidth - 155, 22 + i * 48);
  stage.addChild(buttonCurrentValueTexts[i]);

  // Set upgrade cost texts
  upgradeCostTexts[i].anchor.x = 1;
  upgradeCostTexts[i].position.set(game.viewPortWidth - 2, 22 + i * 48);
  stage.addChild(upgradeCostTexts[i]);
}

function onButtonDown() {
  this.isdown = true;
  this.texture = textures.upgradeButton_down;
  this.alpha = 1;
}

function onButtonUp() {
  this.isdown = false;
  if (this.isOver) {
      this.texture = textures.upgradeButton_hover;
      // determine the index of the button pressed
      let buttonID = 0;
      for (let i = 0; i < buttons.length; i++){
        if (this === buttons[i]) {
          buttonID = i;
        }
      }

      if (state.playerBalance >= state.upgradeCost[buttonID]) {
        switch (buttonID) {
          case 0:
            state.gpusAvailable++;
            placeGpu();
            buttonCurrentValueTexts[buttonID].text = state.gpusAvailable;
            break;
          case 1:
            state.movementSpeed += 0.05;
            buttonCurrentValueTexts[buttonID].text = state.movementSpeed.toFixed(2);
            break;
          case 2:
            state.scanDiameter += 10;
            buttonCurrentValueTexts[buttonID].text = state.scanDiameter;
            break;
          case 3:
            state.cooldownTime -= 0.1;
            buttonCurrentValueTexts[buttonID].text = state.cooldownTime.toFixed(1) + 's';
            break;
          case 4:
            state.pickUpRange++;
            buttonCurrentValueTexts[buttonID].text = state.pickUpRange;
            break;
        }
        updateBalance(-state.upgradeCost[buttonID]);
        state.upgradeCost[buttonID] += upgradeCostOriginal[buttonID];
        upgradeCostTexts[buttonID].text = state.upgradeCost[buttonID].toFixed(4) + " BTC";
        
      }
  } else {
      this.texture = textures.upgradeButton;
  }
}

function onButtonOver() {
  this.isOver = true;
  if (this.isdown) {
      return;
  }
  this.texture = textures.upgradeButton_hover;
}

function onButtonOut() {
  this.isOver = false;
  if (this.isdown) {
      return;
  }
  this.texture = textures.upgradeButton;
}

// Place the starter Gpu's
for (let i = 0; i < state.gpusAvailable; i++) {
  placeGpu();
}

function onUpdate() {
    game.delta += 0.1;

    // Ensure that the drone cannot leave the city bounds
    if (drone.x > city.x + city.width / 2 || drone.x < city.x - city.width / 2
      || drone.y > city.y + city.height / 2 || drone.y < city.y - city.height / 2 ) {
        
        warningVisable = true;
        stage.addChild(warning);
        moveTowardCenter(city);
        moveTowardCenter(HQLocation);
        moveTowardCenter(hqHighlight);
        state.gpuArray.forEach(function(gpu) {
          moveTowardCenter(gpu);
        });
    } else {
      updateRelativePosition(city);
      updateRelativePosition(HQLocation);
      updateRelativePosition(hqHighlight);
      state.gpuArray.forEach(function(gpu) {
        updateRelativePosition(gpu);
  
        if (stage.children.includes(gpu)){
          // Animate the gpu bobbing
          gpu.y = gpu.y + Math.sin(game.delta/2) * .3;
  
          if (distanceBetween(gpu, drone) <= state.pickUpRange &&
              state.gpuOnboard == false){
                loadOntoDrone(gpu);
          }
        }
      });

      warningVisable = false;
      stage.removeChild(warning);
    }

    if (state.gpuOnboard){
      crate.x = drone.x;
      crate.y = drone.y;

      if (distanceBetween(drone, HQLocation) < 100){
        offloadFromDrone();
      }
    }

    if (warningVisable == true){
      warning.scale.set(Math.sin(game.delta/2) + 1, Math.sin(game.delta/2) + 1)
    }

    // Animate the drones props
    drone.texture = textures.drone[Math.floor(game.delta * 6) % 4];

    // Animate the drone sway
    drone.x = drone.x + Math.sin(game.delta/3) * 0.25;

    if (tutorialShowing) {
      tutorial.y = game.viewPortHeight - 20 + Math.sin(game.delta) * 10;
    }

    if (droneScalar < 1){
      droneScalar += 0.003;
    } else if (tutorialShowing) {
        tutorialShowing = false;
        stage.removeChild(tutorial);
    }

    if (state.scanCooldown > 0){
      state.scanCooldown -= state.cooldownRate;
    } else {
      radar.texture = textures.radar_ready;
    }

    radar.rotation += .01;

    if (scanning) {
      currentScannerScale += state.cooldownRate + 0.002;
      scanner.scale.set(currentScannerScale, currentScannerScale);
      if (currentScannerScale * scanner.texture.width > state.scanDiameter) {
        scanning = false;
        stage.removeChild(scanner);
      }
    }

    radar.scale.set(1 - (state.scanCooldown/state.cooldownTime), 1 - (state.scanCooldown/state.cooldownTime));
    drone.scale.set(droneScalar, droneScalar);
    hqHighlight.scale.set(Math.sqrt(Math.pow(Math.sin(game.delta/3)/6+1.2,2)), Math.sqrt(Math.pow(Math.sin(game.delta/3)/6+1.2,2)));
    renderer.render(stage);
}

function placeGpu() {
  let buffer = 100;
  let x = getRandomInt(game.worldWidth - buffer);
  let y = getRandomInt(game.worldHeight - buffer - 300); // 300 prevents Gpu's spawning in water

  const gpu = new PIXI.Sprite(textures.gpu);
  gpu.anchor.set(0.5);

  gpu.x = (city.x - game.worldWidth / 2) + (buffer / 2) + x;
  gpu.y = (city.y - game.worldHeight / 2 ) + (buffer / 2) + y;

  state.gpuArray.push(gpu);
}

function scan() {
  if (state.scanCooldown <= 0){
    scanning = true;
    currentScannerScale = 0;
    state.scanCooldown = state.cooldownTime;
    scanner.x = drone.x;
    scanner.y = drone.y;
    stage.addChild(scanner);
    radar.texture = textures.radar_empty;

    // Show Gpu's in range
    state.gpuArray.forEach(function(gpu) {
      if (distanceBetween(gpu, drone) < (state.scanDiameter / 2)){
        stage.addChild(gpu);
      }
    });
  }
}

function loadOntoDrone(gpu){
  state.gpuOnboard = true;
  stage.removeChild(gpu);
  arrayRemove(state.gpuArray, gpu);
  stage.removeChild(drone);
  stage.addChild(crate);
  stage.addChild(drone);
  stage.addChild(hqHighlight);
}

function offloadFromDrone() {
  stage.removeChild(crate);
  stage.removeChild(hqHighlight);
  updateBalance(state.gpuValue);
  placeGpu();
  state.gpuOnboard = false;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function distanceBetween(a, b) { 
  return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

function arrayRemove(array, value) { 
  for (var i = 0; i < array.length; i++){
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
}

function updateRelativePosition(sprite){
  sprite.x -= droneLeft + droneRight;
  sprite.y -= droneUp + droneDown;
}

function moveTowardCenter(sprite){
  if (drone.x > city.x){
    sprite.x += state.movementSpeed;
  }
  if (drone.x < city.x){
    sprite.x -= state.movementSpeed;
  }
  if (drone.y > city.y){
    sprite.y += state.movementSpeed;
  }
  if (drone.y < city.y){
    sprite.y -= state.movementSpeed;
  }
}

function updateBalance(amount) {
  state.playerBalance += amount;
  balanceText.text = "" + state.playerBalance.toFixed(4);
}
