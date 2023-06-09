function initModal() {
  // Get the modal
  var modal = document.getElementById('settingsModal');

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName('close')[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
      modal.style.display = 'none';
      loop();
  };

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
      if (event.target == modal) {
          modal.style.display = 'none';
          loop();
      }
  };
}

// When the user clicks on the button, open the modal
function openModal() {
  var modal = document.getElementById('settingsModal');
  modal.style.display = 'block';
  noLoop();
}

function isModalShown() {
  var modal = document.getElementById('settingsModal');
  return modal.style.display && modal.style.display !== 'none';
}

const D = 100;
let grid;
let scale;
let nbAnts = 200;
let ants = [];
let appSettings = {
    showWalking: false,
    showExploredCells: true,
    showTargetQuantity: false,
    showFPS: true,
    waitForSolution: true, // If true new target is regenerate only when a stable solution is found
    antPerceptionRadius: 2,
    antTTL: 150,
    // These two constants are used to weight the desirability and pheromones in totalAttraction of cells
    desirabilityFactor: 1,
    pheromonesFactor: 5,
    minNbTargets: 1, // minimum nb of target cells to have constantly on the grid
    targetMaxDesirability: 1000,
    startFromLastTarget: false // if true: when a target is finished use its position as the new starting point
};
let startingPoint = new p5.Vector(parseInt(D / 2), parseInt(D / 2));
let settingsBtn;

function keyToVec(s) {
    const [x, y] = s.split(':').map(Number);
    return new p5.Vector(x, y);
}
function vecKey(v) {
    return xyKey(v.x, v.y);
}
function xyKey(x, y) {
    return `${x}:${y}`;
}

function customResizeCanvas() {
    const minD = Math.min(windowWidth, windowHeight);
    resizeCanvas(minD * 0.98, minD * 0.98);
}

function windowResized() {
    customResizeCanvas();
}

function setup() {
    const myCanvas = createCanvas(800, 800);
    customResizeCanvas();
    myCanvas.parent('canvasDiv');

    app = new Vue({
        el: '#settingsModal',
        data: appSettings
    });
    settingsBtn = createButton('Settings');
    settingsBtn.position(1300, 40);
    settingsBtn.mousePressed(openModal);

    initModal();

    grid = new Grid(D, 1);
    grid.createTargets();
    // grid.createObstacles();
    grid.createObstaclesRandom();
    grid.createCellsGraph();

    for (let _ = 0; _ < nbAnts; _++) {
        ants.push(new Ant());
    }
    walkingAnts = ants.length;
}

let walkingAnts;
function draw() {
    // frameRate(5);
    background(30, 50, 30);
    scale = width / grid.D;
    grid.draw();

    walkingAnts = walkAnts();
    if (!appSettings.showWalking) {
        while (walkingAnts) {
            walkingAnts = walkAnts();
        }
    }

    // All the ants either found a target or expired their ttl
    if (!walkingAnts) {
        grid.updatePheromones(ants);
        ants.forEach((a) => a.reset());
    }

    if (keyIsDown(CONTROL) && isMouseInScreen()) {
        const {x, y} = mouseToXY();
        grid.createObstacle(x, y);
    }

    // Show text if we found a solution
    if (appSettings.isAntPathStabilized) {
        fill(200);
        stroke(200);
        text('Found solution', 30, 30);
    }

    // Show FPS
    if (appSettings.showFPS) {
        fill(200);
        stroke(200);
        text(`FPS: ${parseInt(frameRate())}`, 30, height - 30);
    }
}

// Return the number of ants still walking
function walkAnts() {
    let walkingAnts = 0;
    ants.forEach((ant) => {
        ant.walk();
        if (appSettings.showWalking) {
            ant.draw();
        }

        if (ant.ttl > 0) {
            walkingAnts++;
        }
    });
    return walkingAnts;
}
document
function mousePressed() {
    if (!isMouseInScreen()) {
        return;
    }
    // Get the mouse position in the grid
    const {x, y} = mouseToXY();
    const c = grid.cells[y][x];
    if (c.desirability < grid.maxDesirability && !c.isObstacle) {
        // Create a new target if an empty cell is clicked
        grid.createTarget(x, y);
    } else if (c.desirability === grid.maxDesirability && !c.isObstacle) {
        // Replace a target by an obstacle if it is clicked on
        grid.removeTarget(x, y);
        grid.createObstacle(x, y);
    } else if (c.isObstacle) {
        // Remove an obstacle if it is clicked on
        grid.removeObstacle(x, y);
    }
}

function isMouseInScreen() {
    return !(mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) && !isModalShown();
}

function mouseToXY() {
    const mousePosition = new p5.Vector(mouseX, mouseY);
    const inGridPosition = mousePosition.div(scale);
    const x = parseInt(inGridPosition.x);
    const y = parseInt(inGridPosition.y);
    return new p5.Vector(x, y);
}
