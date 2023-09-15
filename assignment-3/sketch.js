let eye;
let bg;
let font;
let count;
function preload() {
  eye = loadImage("eye.png");
  bg = loadImage("bg.jpg");
  font = loadFont("font.ttf");
}

// hold juggling ball objects
let balls = [];
// check which ball is being dragged
// when a ball is being dragged, draggingBall is set to the ball's index position in the array
// else draggingBall = -1
let draggingBall = -1;
// for measuring how far the cursor is from the ball
let offsetX, offsetY;

// Ball class
class Ball {
  constructor(x = 10, y = 10) {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    // initially this stores the time when the ball was created
    // when the ball is dragged and released, this stores the time of release
    this.contactTime = millis();
  }

  // the quadratic equation for a ball's motion: (0.4x)(2-x)
  // we take the time since the ball was intialised, and map the values from seconds to x values for the quadratic equation
  // the y (vertical velocity) values plotted against x give a parabola
  // so the vertical velocity is a function of time
  // and the horizontal velocity is constant
  move() {
    let elapsedTime = (millis() - this.contactTime) / 1000;
    let quadraticValue = 0.4 * elapsedTime * (2 - elapsedTime);
    this.x += elapsedTime / 3;
    this.y += -1 * map(quadraticValue, 0, 6, 1, 5);
    // rotate eyeball
    this.rotation += 0.5;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    image(eye, 0, 0, 30, 30);
    pop();
  }
}

function setup() {
  createCanvas(500, 500);
  angleMode(DEGREES);
  imageMode(CENTER);
  textAlign(CENTER);
  textFont(font);
}

function draw() {
  background(220);
  image(bg, 250, 250, 500, 500);
  count = 0;

  for (let i = 0; i < balls.length; i++) {
    balls[i].move();
    balls[i].draw();
    if (balls[i].x > width || balls[i].y > height) {
      count++;
    }
  }

  // if the user has selected a ball
  // change ball's position with the mouse
  if (draggingBall !== -1) {
    balls[draggingBall].x = mouseX + offsetX;
    balls[draggingBall].y = mouseY + offsetY;
  }

  // text
  textSize(50);
  fill("black");
  text("morbid juggler", 250, 50);
  textSize(30);
  fill("white");
  text('dropped '+count, 70, 470);
}

// detect when a user is dragging a ball
function mousePressed() {
  for (let i = 0; i < balls.length; i++) {
    let d = dist(mouseX, mouseY, balls[i].x, balls[i].y);
    if (d < 20) {
      draggingBall = i;
      offsetX = balls[i].x - mouseX;
      offsetY = balls[i].y - mouseY;
      // break oout of the for loop immediately, otherwise a different ball might be selected
      break;
    }
  }
}

function mouseReleased() {
  if (draggingBall > -1) {
    // this makes timeElapsed since ball was created = 0, so that when the ball is released, it will restart its parabolic motion
    balls[draggingBall].contactTime = millis();
  }
  // no balls are being dragged at the moment
  draggingBall = -1;
}

// press shift to create a new ball
function keyPressed() {
  if (keyCode == SHIFT) {
    balls.push(new Ball(mouseX, mouseY));
  }
}
