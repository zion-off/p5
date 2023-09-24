let textArray = [];
let snake = [];

// noise
let xOff = 0;
let yOff = 1000;

class Letter {
  constructor(letter) {
    this.letter = letter;
    this.xPos = 0;
    this.yPos = 0;
    this.speedX = 1;
    this.speedY = 1;
    this.r = random(255);
    this.g = random(255);
    this.b = random(255);
  }

  updatePosition(x, y) {
    this.xPos = x;
    this.yPos = y;
  }

  calculateVector(headX, headY, headvX, headvY) {
    if (headvX > 0 && headvY > 0) {
      this.updatePosition(
        headX - 20 + noise(xOff) * 5,
        headY - 20 + noise(yOff) * 5
      );
    }

    if (headvX > 0 && headvY < 0) {
      this.updatePosition(
        headX - 20 + noise(xOff) * 5,
        headY + 20 + noise(yOff) * 5
      );
    }

    if (headvX < 0 && headvY < 0) {
      this.updatePosition(
        headX + 20 + noise(xOff) * 5,
        headY + 20 + noise(yOff) * 5
      );
    }

    if (headvX < 0 && headvY > 0) {
      this.updatePosition(headX + 20  + noise(xOff) * 5, headY - 20 + noise(yOff) * 5);
    }
  }

  draw() {
    this.speedvX = snake[textArray.length-1].speedvX;
    this.speedvY = snake[textArray.length-1].speedvY;
    fill(this.r, this.g, this.b);
    text(this.letter, this.xPos, this.yPos);
  }
}

function setup() {
  createCanvas(400, 400);
  textSize(40);
  snake.push(new Letter(" "));
  snake[0].updatePosition(random(300), random(300));
}

function draw() {
  background(100);

  detectCollision();

  snake[0].updatePosition(
    snake[0].xPos + snake[0].speedX,
    snake[0].yPos + snake[0].speedY
  );

  for (let i = 1; i < snake.length; i++) {
    snake[i].calculateVector(
      snake[i - 1].xPos,
      snake[i - 1].yPos,
      snake[i - 1].speedX,
      snake[i - 1].speedY
    );
    snake[i].draw();
  }

  xOff += 0.01;
  yOff += 0.01;
}

function detectCollision() {
  if (snake[0].xPos > width - 20) {
    snake[0].speedX *= -1;
    snake[0].xPos = width - 20;
  }
  if (snake[0].xPos < 0) {
    snake[0].speedX *= -1;
    snake[0].xPos = 0;
  }
  if (snake[0].yPos > height - 20) {
    snake[0].speedY *= -1;
    snake[0].yPos = height - 20;
  }
  if (snake[0].yPos < 0) {
    snake[0].speedY *= -1;
    snake[0].yPos = 0;
  }
}

function keyPressed() {
  // Add the pressed key to the textArray
  if (key.length === 1) {
    textArray.push(key);
    snake.push(new Letter(key));
  }
}
