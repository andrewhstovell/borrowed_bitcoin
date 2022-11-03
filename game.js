import {textures, fonts, ui, drone, initializeView} from "./game/assets.js";
import {player, scanner, world} from "./game/state.js";

// SET UP THE GAME ENVIRONMENT
const canvas = document.getElementById('canvas');

var HQLocation = {x: world.viewport.width/2, y: world.viewport.height/2};
let tutorialShowing = true;
var player_out_of_bounds = false;

var upgradeCosts = [];
var upgradeCostOriginal = [];

let cost = 0.0010;
for (var t = 0; t < 5; t++) {
  upgradeCosts.push(cost);
  upgradeCostOriginal.push(cost);
  cost -= 0.0002;
}

// Create the main rendering view
const renderer = new PIXI.Renderer({
  width: world.viewport.width, height: world.viewport.width,
  view: canvas,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  backgroundColor: 0x43A080
});

// Create the main game Stage
const stage = new PIXI.Container();

initializeView(world.viewport.width, world.viewport.height);

// Allow resizing of window
window.addEventListener('resize', resize);
function resize() {
     renderer.resize(world.viewport.width, world.viewport.height);
}

resize();

// Create Player Balance Text
var balanceText = new PIXI.Text("" + player.balance, fonts.balance);
balanceText.position.set(80, 14);

// Listen for Key Presses
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    drone.heading.up = -player.speed;
    drone.sprite.height = drone.originalHeight * drone.movementScalar;
    return;
  }

  if (event.key === 's') {
    drone.heading.down = player.speed;
    drone.sprite.height = drone.originalHeight * drone.movementScalar;
    return;
  }

  if (event.key === 'a') {
    drone.heading.left = -player.speed;
    drone.sprite.width = drone.originalWidth * drone.movementScalar;
    drone.sprite.rotation = -drone.turningRotation;
    return;
  }

  if (event.key === 'd') {
    drone.heading.right = player.speed;
    drone.sprite.width = drone.originalWidth * drone.movementScalar;
    drone.sprite.rotation = drone.turningRotation;
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
    drone.heading.up = 0;
    drone.sprite.height = drone.originalHeight;
    return;
  }

  if (event.key === 's') {
    drone.heading.down = 0;
    drone.sprite.height = drone.originalHeight;
    return;
  }

  if (event.key === 'a') {
    drone.heading.left = 0;
    drone.sprite.width = drone.originalWidth;
    drone.sprite.rotation = 0;
    return;
  }

  if (event.key === 'd') {
    drone.heading.right = 0;
    drone.sprite.width = drone.originalWidth;
    drone.sprite.rotation = 0;
    return;
  }
}, false);

const ticker = new PIXI.Ticker();
ticker.add(onUpdate);
ticker.start();

// Add sprites to stage
stage.addChild(ui.city);
stage.addChild(drone.sprite);
stage.addChild(ui.scanner_state_indicator);
stage.addChild(ui.tutorial);
stage.addChild(ui.bitcoinLogo);
stage.addChild(balanceText);

// Create upgrade buttons
const buttons = [];
const buttonCurrentValueTexts = [
  new PIXI.Text(world.gpuQuantity, fonts.button_current_value),
  new PIXI.Text(player.speed, fonts.button_current_value),
  new PIXI.Text(scanner.diameter, fonts.button_current_value),
  new PIXI.Text(scanner.cooldownTime + 's', fonts.button_current_value),
  new PIXI.Text(player.pickUpRange, fonts.button_current_value)
];

const upgradeCostTexts = [];
for (var u = 0; u < upgradeCosts.length; u++) {
  upgradeCostTexts.push(new PIXI.Text(upgradeCosts[u].toFixed(4) + " BTC", fonts.button_cost));
}

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
  button.position.set(world.viewport.width, i * 48);

  // make the button interactive
  button.interactive = true;
  button.buttonMode = true;

  button
  .on('mousedown', onButtonDown)
  .on('mouseup', onButtonUp)
  .on('mouseover', onButtonOver)
  .on('mouseout', onButtonOut)

  // add it to the stage and array
  stage.addChild(button);
  buttons.push(button);

  // Set upgrade description texts
  var text = new PIXI.Text(buttonDescriptors[i], fonts.button_description);
  text.position.set(world.viewport.width - 155, 5 + i * 48);
  stage.addChild(text);

  // Set upgrade current value texts
  buttonCurrentValueTexts[i].position.set(world.viewport.width - 155, 22 + i * 48);
  stage.addChild(buttonCurrentValueTexts[i]);

  // Set upgrade cost texts
  upgradeCostTexts[i].anchor.x = 1;
  upgradeCostTexts[i].position.set(world.viewport.width - 2, 22 + i * 48);
  stage.addChild(upgradeCostTexts[i]);
}

function onButtonDown() {
  this.isDown = true;
  this.texture = textures.upgradeButton_down;
  this.alpha = 1;
}

function onButtonUp() {
  this.isDown = false;
  if (this.isOver) {
      this.texture = textures.upgradeButton_hover;
      // determine the index of the button pressed
      let buttonID = 0;
      for (let i = 0; i < buttons.length; i++){
        if (this === buttons[i]) {
          buttonID = i;
        }
      }

      if (player.balance >= upgradeCosts[buttonID]) {
        switch (buttonID) {
          case 0:
            world.gpuQuantity++;
            placeGpu();
            buttonCurrentValueTexts[buttonID].text = world.gpuQuantity;
            break;
          case 1:
            player.speed += 0.05;
            buttonCurrentValueTexts[buttonID].text = player.speed.toFixed(2);
            break;
          case 2:
            scanner.diameter += 10;
            buttonCurrentValueTexts[buttonID].text = scanner.diameter;
            break;
          case 3:
            scanner.cooldownTime -= 0.1;
            buttonCurrentValueTexts[buttonID].text = scanner.cooldownTime.toFixed(1) + 's';
            break;
          case 4:
            player.pickUpRange++;
            buttonCurrentValueTexts[buttonID].text = player.pickUpRange;
            break;
        }
        updateBalance(-upgradeCosts[buttonID]);
        upgradeCosts[buttonID] += upgradeCostOriginal[buttonID];
        upgradeCostTexts[buttonID].text = upgradeCosts[buttonID].toFixed(4) + " BTC";
        
      }
  } else {
      this.texture = textures.upgradeButton;
  }
}

function onButtonOver() {
  this.isOver = true;
  if (this.isDown) {
      return;
  }
  this.texture = textures.upgradeButton_hover;
}

function onButtonOut() {
  this.isOver = false;
  if (this.isDown) {
      return;
  }
  this.texture = textures.upgradeButton;
}

// Place the starter Gpu's
for (let i = 0; i < world.gpuQuantity; i++) {
  placeGpu();
}

function onUpdate() {
    world.delta += 0.1;

    // Ensure that the drone cannot leave the city bounds
    if (drone.sprite.x > ui.city.x + ui.city.width / 2 || drone.sprite.x < ui.city.x - ui.city.width / 2
      || drone.sprite.y > ui.city.y + ui.city.height / 2 || drone.sprite.y < ui.city.y - ui.city.height / 2 ) {
        
        player_out_of_bounds = true;
        stage.addChild(ui.oob_warning);
        moveTowardCenter(ui.city);
        moveTowardCenter(HQLocation);
        moveTowardCenter(ui.hq_highlighter);
        world.gpus.forEach(function(gpu) {
          moveTowardCenter(gpu);
        });
    } else {
      updateRelativePosition(ui.city);
      updateRelativePosition(HQLocation);
      updateRelativePosition(ui.hq_highlighter);
      world.gpus.forEach(function(gpu) {
        updateRelativePosition(gpu);
  
        if (stage.children.includes(gpu)){
          // Animate the gpu bobbing
          gpu.y = gpu.y + Math.sin(world.delta/2) * .3;
  
          if (distanceBetween(gpu, drone.sprite) <= player.pickUpRange &&
              player.gpuOnboard == false){
                loadOntoDrone(gpu);
          }
        }
      });

      player_out_of_bounds = false;
      stage.removeChild(ui.oob_warning);
    }

    if (player.gpuOnboard){
      ui.crate.x = drone.sprite.x;
      ui.crate.y = drone.sprite.y;

      if (distanceBetween(drone.sprite, HQLocation) < 100){
        offloadFromDrone();
      }
    }

    if (player_out_of_bounds == true){
      ui.oob_warning.scale.set(Math.sin(world.delta/2) + 1, Math.sin(world.delta/2) + 1)
    }

    // Animate the drones props
    drone.sprite.texture = textures.drone[Math.floor(world.delta * 6) % 4];

    // Animate the drone sway
    drone.sprite.x = drone.sprite.x + Math.sin(world.delta/3) * 0.25;

    if (tutorialShowing) {
      ui.tutorial.y = world.viewport.height - 20 + Math.sin(world.delta) * 10;
    }

    if (drone.scale < 1){
      drone.scale += 0.003;
    } else if (tutorialShowing) {
        tutorialShowing = false;
        stage.removeChild(ui.tutorial);
    }

    if (scanner.cooldown > 0){
      scanner.cooldown -= scanner.cooldownRate;
    } else {
      ui.scanner_state_indicator.texture = textures.radar_ready;
    }

    ui.scanner_state_indicator.rotation += .01;

    if (scanner.scanning) {
      scanner.scale += scanner.cooldownRate + 0.002;
      ui.scanner.scale.set(scanner.scale, scanner.scale);
      if (scanner.scale * ui.scanner.texture.width > scanner.diameter) {
        scanner.scanning = false;
        stage.removeChild(ui.scanner);
      }
    }

    ui.scanner_state_indicator.scale.set(1 - (scanner.cooldown/scanner.cooldownTime), 1 - (scanner.cooldown/scanner.cooldownTime));
    drone.sprite.scale.set(drone.scale, drone.scale);
    ui.hq_highlighter.scale.set(Math.sqrt(Math.pow(Math.sin(world.delta/3)/6+1.2,2)), Math.sqrt(Math.pow(Math.sin(world.delta/3)/6+1.2,2)));
    renderer.render(stage);
}

function placeGpu() {
  let buffer = 100;
  let x = getRandomInt(world.dimensions.width - buffer);
  let y = getRandomInt(world.dimensions.height - buffer - 300); // 300 prevents Gpu's spawning in water

  const gpu = new PIXI.Sprite(textures.gpu);
  gpu.anchor.set(0.5);

  gpu.x = (ui.city.x - world.dimensions.width / 2) + (buffer / 2) + x;
  gpu.y = (ui.city.y - world.dimensions.height / 2 ) + (buffer / 2) + y;

  world.gpus.push(gpu);
}

function scan() {
  if (scanner.cooldown <= 0){
    scanner.scanning = true;
    scanner.scale = 0;
    scanner.cooldown = scanner.cooldownTime;
    ui.scanner.x = drone.sprite.x;
    ui.scanner.y = drone.sprite.y;
    stage.addChild(ui.scanner);
    ui.scanner_state_indicator.texture = textures.radar_empty;

    // Show Gpu's in range
    world.gpus.forEach(function(gpu) {
      if (distanceBetween(gpu, drone.sprite) < (scanner.diameter / 2)){
        stage.addChild(gpu);
      }
    });
  }
}

function loadOntoDrone(gpu){
  player.gpuOnboard = true;
  stage.removeChild(gpu);
  arrayRemove(world.gpus, gpu);
  stage.removeChild(drone.sprite);
  stage.addChild(ui.crate);
  stage.addChild(drone.sprite);
  stage.addChild(ui.hq_highlighter);
}

function offloadFromDrone() {
  stage.removeChild(ui.crate);
  stage.removeChild(ui.hq_highlighter);
  updateBalance(world.gpuValue);
  placeGpu();
  player.gpuOnboard = false;
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
  sprite.x -= drone.heading.left + drone.heading.right;
  sprite.y -= drone.heading.up + drone.heading.down;
}

function moveTowardCenter(sprite){
  if (drone.sprite.x > ui.city.x){
    sprite.x += player.speed;
  }
  if (drone.sprite.x < ui.city.x){
    sprite.x -= player.speed;
  }
  if (drone.sprite.y > ui.city.y){
    sprite.y += player.speed;
  }
  if (drone.sprite.y < ui.city.y){
    sprite.y -= player.speed;
  }
}

function updateBalance(amount) {
  player.balance += amount;
  balanceText.text = "" + player.balance.toFixed(4);
}
