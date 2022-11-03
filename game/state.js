const gameDiv = document.getElementById('game');

export var world = {
    viewport: { width: gameDiv.clientWidth, height: gameDiv.clientHeight },
    dimensions: { width: 2560, height: 1440 },
    delta: 0,
    gpus: [],
    gpuQuantity: 4,
    gpuValue: 0.0001
};

export var player = {
    balance: 0.0008,
    speed: 1,
    gpuOnboard: false,
    pickUpRange: 50,
};

export var scanner = {
    cooldown: 0,
    cooldownRate: 0.01,
    cooldownTime: 3, //sec
    diameter: 400, //px
    scanning: false,
    scale: 0
}

