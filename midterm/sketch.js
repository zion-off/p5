// game state
// 0 = welcome page
// 1 = game play
let gameState = 0;
// store location of pointer fingers
// when dragging balls, this is where the ball will be anchored
let leftPointer = { x: 0, y: 0 };
let rightPointer = { x: 0, y: 0 };
// landmark indexes for fingertips [pointer, middle, ring, pinky]
// these are the same for both hands
let fingertips = [8, 12, 16, 20];
let eye;
let bg;
let font;
let count;
let backgroundMusic;
let countMusic;
let countForMusic = 0;
let clickMusic;

function preload() {
  eye = loadImage("eye.png");
  bg = loadImage("bg.jpg");
  font = loadFont("font.ttf");
  font2 = loadFont("minecrafter.ttf");
  backgroundMusic = loadSound("chmamepepee.mp3");
  countMusic = loadSound("drop.mp3");
  clickMusic = loadSound("click.wav");
}

// hold juggling ball objects
let balls = [];
// check which ball is being dragged
// when a ball is being dragged, draggingBall is set to the ball's index position in the array
// else draggingBall = -1
let leftHandDraggingBall = -1;
let rightHandDraggingBall = -1;

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
    this.x += elapsedTime / 1;
    this.y += -3 * map(quadraticValue, 0, 6, 1, 5);
    // this.x += elapsedTime / 3;
    // this.y += -1 * map(quadraticValue, 0, 6, 1, 5);
    // rotate object
    this.rotation += 2;
  }

  draw() {
    // push/pop needed to isolate the transformation
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    image(eye, 0, 0, 80, 80);
    pop();
  }
}

function setup() {
  sketch = createCanvas(windowWidth, windowHeight);

  backgroundMusic.loop();

  // colors for drawing each fingertip
  colorMap = [
    // left fingertips
    [
      color(0, 0, 0),
      color(255, 0, 255),
      color(0, 0, 255),
      color(255, 255, 255),
    ],
    // Right fingertips
    [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255), color(255, 255, 0)],
  ];

  // turn on some models (hand tracking)
  handsfree = new Handsfree({
    hands: true,
  });
  handsfree.enablePlugins("browser");
  handsfree.plugin.pinchScroll.disable();

  // add a gesture to add a ball
  // the model was trained on this gesture using https://handsfreejs.netlify.app/gesture/
  handsfree.useGesture({
    name: "addBall",
    algorithm: "fingerpose",
    models: "hands",
    confidence: "9",
    description: [
      ["addCurl", "Thumb", "HalfCurl", 1],
      ["addDirection", "Thumb", "DiagonalUpRight", 1],
      ["addDirection", "Thumb", "VerticalUp", 0.19047619047619047],
      ["addCurl", "Index", "NoCurl", 1],
      ["addDirection", "Index", "VerticalUp", 0.3888888888888889],
      ["addDirection", "Index", "DiagonalUpLeft", 1],
      ["addCurl", "Middle", "FullCurl", 1],
      ["addDirection", "Middle", "VerticalUp", 1],
      ["addDirection", "Middle", "DiagonalUpLeft", 0.47058823529411764],
      ["addCurl", "Ring", "FullCurl", 1],
      ["addDirection", "Ring", "VerticalUp", 1],
      ["addDirection", "Ring", "DiagonalUpRight", 0.041666666666666664],
      ["addCurl", "Pinky", "NoCurl", 1],
      ["addDirection", "Pinky", "DiagonalUpRight", 1],
      ["addDirection", "Pinky", "VerticalUp", 0.9230769230769231],
    ],
  });

  // game setup
  angleMode(DEGREES);
  imageMode(CENTER);
  textAlign(CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// program is controlled by two auxiliary functions
// draw() just calls them based on the program state
function draw() {
  if (gameState == 0) {
    welcomePage();
  }
  if (gameState == 1) {
    gamePlay();
  }
}

// this is the page the user is shown when they first open the game
function welcomePage() {
  background(220);

  // code for maintaining aspect ratio of background image
  let wRatio = width / bg.width;
  let w = bg.width * wRatio;
  let h = bg.height * wRatio;
  image(bg, width / 2, height / 2, w, h);

  textSize(150);
  fill("white");
  textFont(font);
  text("morbid juggler", width / 2, height / 2);

  textSize(50);
  text("there are no rules. you are already dead.", width / 2, height / 2 + 60);

  rectMode(CENTER);
  rect(width / 2, height / 2 + 140, 200, 50, 20);
  textFont(font2);
  textSize(20);
  fill("black");
  text("start game", width / 2, height / 2 + 150);
}

// play a sound when a ball is dropped
function countMusicPlay(count) {
  // this if condition makes sure the sound is not played multiple times for the same ball
  if (count > countForMusic) {
    countMusic.play();
    countForMusic = count;
  }
}

// this is the main game loop
function gamePlay() {
  background(220);
  // code for maintaining aspect ratio of background image
  let wRatio = width / bg.width;
  let w = bg.width * wRatio;
  let h = bg.height * wRatio;
  image(bg, width / 2, height / 2, w, h);
  count = 0;

  // draw balls
  for (let i = 0; i < balls.length; i++) {
    balls[i].move();
    balls[i].draw();
    if (balls[i].x > width || balls[i].y > height) {
      count++;
      countMusicPlay(count);
    }
  }

  // if the user has pinched a ball
  // change ball's position with the pointer finger

  // if (rightHandDraggingBall !== -1) {
  //   balls[rightHandDraggingBall].x = rightPointer.x;
  //   balls[rightHandDraggingBall].y = rightPointer.y;
  // }
  // if (leftHandDraggingBall !== -1) {
  //   balls[leftHandDraggingBall].x = leftPointer.x;
  //   balls[leftHandDraggingBall].y = leftPointer.y;
  // }

  // this is smoother
  if (rightHandDraggingBall !== -1) {
    balls[rightHandDraggingBall].x = lerp(balls[rightHandDraggingBall].x, rightPointer.x, 0.2); 
    balls[rightHandDraggingBall].y = lerp(balls[rightHandDraggingBall].y, rightPointer.y, 0.2);
  }
  if (leftHandDraggingBall !== -1) {
    balls[leftHandDraggingBall].x = lerp(balls[leftHandDraggingBall].x, leftPointer.x, 0.2);;
    balls[leftHandDraggingBall].y = lerp(balls[leftHandDraggingBall].y, leftPointer.y, 0.2);
  }

  // drop count and stop button
  rectMode(CENTER);
  fill("white");
  rect(width / 10, height - 110, 200, 50, 20);
  rect(width / 10, height - 50, 200, 50, 20);
  textSize(20);
  textAlign(CENTER);
  fill("black");
  textFont(font2);
  fill("black");
  text("stop game", width / 10, height - 45);
  text("dropped " + count, width / 10, height - 100);

  trackHands();
  drawHands();

  // add a ball if the user makes the addBall gesture
  if (canAddBall) addBall();
}

// flag to check if a ball can be added
// if a new ball was added less than 1 second ago then this is false
// this is to avoid adding multiple balls at once
let canAddBall = true;

function addBall() {
  const hands = handsfree.data?.hands;
  if (hands?.gesture) {
    if (hands.gesture[0]?.name == "addBall") {
      let x = sketch.width - hands.landmarks[0][9].x * sketch.width;
      let y = hands.landmarks[0][9].y * sketch.height;
      console.log(x, y);
      balls.push(new Ball(x, y));
      canAddBall = false;
      // go to sleep for a second
      setTimeout(() => {
        canAddBall = true;
      }, 1000);
    }
  }
}

// function to track position of hands
// hand[0] is the left hand, hand[1] is the right hand
// handsfree.data returns 20 landmarks for each hand
// https://handsfreejs.netlify.app/ref/model/hands.html#with-config
// pinchState checks if the finger is pinched
function trackHands() {
  const hands = handsfree.data?.hands;
  // chec if hands are being tracked, then chceck for pinches
  if (hands?.pinchState) {
    // loop through each hand
    hands.pinchState.forEach((hand, handIndex) => {
      // ;oop through each finger
      hand.forEach((state, finger) => {
        if (hands.landmarks?.[handIndex]?.[fingertips[finger]]) {
          // landmarks are in percentage, so we scale up to the canvas size
          let x =
            sketch.width -
            hands.landmarks[handIndex][fingertips[finger]].x * sketch.width;
          let y =
            hands.landmarks[handIndex][fingertips[finger]].y * sketch.height;

          // if the finger is pinched, check if it is touching a ball
          if (state === "start") {
            for (let i = 0; i < balls.length; i++) {
              let d = dist(x, y, balls[i].x, balls[i].y);
              if (d < 80) {
                if (handIndex == 0) leftHandDraggingBall = i;
                else if (handIndex == 1) rightHandDraggingBall = i;
                // set ball's position to pointer finger's tip
                // break oout of the for loop immediately, otherwise a different ball might be selected
                break;
              }
            }
          }
          // if the finger is released, release the ball
          else if (state === "released") {
            // left hand
            if (handIndex == 0) {
              if (leftHandDraggingBall > -1) {
                // this makes timeElapsed since ball was created = 0, so that when the ball is released, it will restart its parabolic motion
                balls[leftHandDraggingBall].contactTime = millis();
                leftHandDraggingBall = -1;
              }
            }
            if (handIndex == 1) {
              // right hand
              if (rightHandDraggingBall > -1) {
                // this makes timeElapsed since ball was created = 0, so that when the ball is released, it will restart its parabolic motion
                balls[rightHandDraggingBall].contactTime = millis();
                rightHandDraggingBall = -1;
              }
            }
          }
        }
      });
    });
  }
}

// draw hands on the p5 canvas
// code taken from https://editor.p5js.org/GoingHandsfree/sketches/Oq_q3wxHM
function drawHands() {
  const hands = handsfree.data?.hands;

  // Bail if we don't have anything to draw
  if (!hands?.landmarks) return;

  // draw keypoints
  hands.landmarks.forEach((hand, handIndex) => {
    hand.forEach((landmark, landmarkIndex) => {
      if (colorMap[handIndex]) {
        switch (landmarkIndex) {
          case 8:
            fill(colorMap[handIndex][0]);
            if (handIndex == 0)
              leftPointer = {
                x: sketch.width - landmark.x * sketch.width,
                y: landmark.y * sketch.height,
              };
            if (handIndex == 1)
              rightPointer = {
                x: sketch.width - landmark.x * sketch.width,
                y: landmark.y * sketch.height,
              };
            break;
          case 12:
            fill(colorMap[handIndex][1]);
            break;
          case 16:
            fill(colorMap[handIndex][2]);
            break;
          case 20:
            fill(colorMap[handIndex][3]);
            break;
          default:
            fill(color(255, 255, 255));
        }
      }
      stroke(color(0, 0, 0));
      strokeWeight(0);
      circleSize = 10;

      circle(
        sketch.width - landmark.x * sketch.width,
        landmark.y * sketch.height,
        circleSize
      );
    });
  });
}

// for debugging: press shift to create a new ball
function keyPressed() {
  if (keyCode == SHIFT) {
    balls.push(new Ball(mouseX, mouseY));
  }
}

// function to check for button clicks
function mouseClicked() {
  if (
    mouseX > width / 2 - 100 &&
    mouseX < width / 2 + 100 &&
    mouseY > height / 2 + 140 - 25 &&
    mouseY < height / 2 + 140 + 25 &&
    gameState == 0
  ) {
    clickMusic.play();
    handsfree.start();
    gameState = 1;
  }

  if (
    mouseX > width / 10 - 100 &&
    mouseX < width / 10 + 100 &&
    mouseY > height - 75 &&
    mouseY < height - 25 &&
    gameState == 1
  ) {
    clickMusic.play();
    handsfree.stop();
    setTimeout(() => {
      gameState = 0;
    }, 1000);
  }
}
