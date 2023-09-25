let currentBunch = [];
let bunches = [];

let xOff = 0;
let yOff = 1000;

class Letter {
  constructor(letter) {
    this.letter = letter;
    this.x = 0;
    this.y = 0;
    this.speedX = 0.5;
    this.speedY = 0.5;
    this.rotation = 0;
    this.r = random(255);
    this.g = random(255);
    this.b = random(255);
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  calculateNewPosition(nextX, nextY, nextSpeedX, nextSpeedY) {
    this.rotation += noise(this.x * 0.01, this.y * 0.01) * 0.01;

    if (nextSpeedX > 0 && nextSpeedY > 0) {
      this.updatePosition(
        nextX - 20 + noise(xOff) * 20,
        nextY + noise(yOff) * 20
      );
    }

    if (nextSpeedX > 0 && nextSpeedY < 0) {
      this.updatePosition(
        nextX - 20 + noise(xOff) * 5,
        nextY + 20 + noise(yOff) * 5
      );
    }

    if (nextSpeedX < 0 && nextSpeedY < 0) {
      this.updatePosition(
        nextX + 20 + noise(xOff) * 5,
        nextY + 20 + noise(yOff) * 5
      );
    }

    if (nextSpeedX < 0 && nextSpeedY > 0) {
      this.updatePosition(
        nextX + 20 + noise(xOff) * 5,
        nextY - 20 + noise(yOff) * 5
      );
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    fill(this.r, this.g, this.b);
    text(this.letter, 0, 0);
    pop();
  }
}

function setup() {
  createCanvas(400, 400);
  textSize(40);
  currentBunch.push(new Letter(" "));
  currentBunch[0].updatePosition(random(width), random(height));
}

function draw() {
  background(255);
  detectCollision();

  let lastLetter = currentBunch[currentBunch.length - 1];
  lastLetter.updatePosition(
    lastLetter.x + lastLetter.speedX,
    lastLetter.y + lastLetter.speedY,
    lastLetter.speedX,
    lastLetter.speedY
  );

  for (let i = currentBunch.length - 2; i > -1; i--) {
    currentBunch[i].calculateNewPosition(
      currentBunch[i + 1].x,
      currentBunch[i + 1].y,
      currentBunch[i + 1].speedX,
      currentBunch[i + 1].speedY
    );
    currentBunch[i].draw();
  }

  if (bunches.length > 0) {
    for (let i = 0; i < bunches.length; i++) {
      let lastLetter =
        bunches[i].currentBunch[bunches[i].currentBunch.length - 1];
      lastLetter.updatePosition(
        lastLetter.x + lastLetter.speedX,
        lastLetter.y + lastLetter.speedY,
        lastLetter.speedX,
        lastLetter.speedY
      );
    }

    for (let i = 0; i < bunches.length; i++) {
      for (let j = bunches[i].currentBunch.length - 2; j > -1; j--) {
        bunches[i].currentBunch[j].calculateNewPosition(
          bunches[i].currentBunch[j + 1].x,
          bunches[i].currentBunch[j + 1].y,
          bunches[i].currentBunch[j + 1].speedX,
          bunches[i].currentBunch[j + 1].speedY
        );
        bunches[i].currentBunch[j].draw();
      }
    }
  }

  xOff += 0.01;
  yOff += 0.01;
}

function detectCollision() {
  let lastLetter = currentBunch[currentBunch.length - 1];

  if (lastLetter.x > width - 20) {
    lastLetter.speedX *= -1;
    lastLetter.x = width - 20;
  }
  if (lastLetter.x < 20) {
    lastLetter.speedX *= -1;
    lastLetter.x = 20;
  }
  if (lastLetter.y > height - 20) {
    lastLetter.speedY *= -1;
    lastLetter.y = height - 20;
  }
  if (lastLetter.y < 20) {
    lastLetter.speedY *= -1;
    lastLetter.y = 20;
  }

  if (bunches.length > 0) {
    for (let i = 0; i < bunches.length; i++) {
      let lastLetter =
        bunches[i].currentBunch[bunches[i].currentBunch.length - 1];
      if (lastLetter.x > width - 20) {
        lastLetter.speedX *= -1;
        lastLetter.x = width - 20;
      }
      if (lastLetter.x < 20) {
        lastLetter.speedX *= -1;
        lastLetter.x = 20;
      }
      if (lastLetter.y > height - 20) {
        lastLetter.speedY *= -1;
        lastLetter.y = height - 20;
      }
      if (lastLetter.y < 20) {
        lastLetter.speedY *= -1;
        lastLetter.y = 20;
      }
    }
  }
}

function keyPressed() {
  if (key != " " && key.length == 1) {
    let tempTail = currentBunch.pop();
    currentBunch.push(new Letter(key));
    currentBunch.push(tempTail);
  }

  if (key == " ") {
    bunches.push({ currentBunch });
    currentBunch = [];
    currentBunch.push(new Letter(" "));
    currentBunch[0].updatePosition(random(width), random(height));
  }
}
