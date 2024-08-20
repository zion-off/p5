// there are three arrays to carry Letter objects, currentBunch, bunches and floatingLetters
// currentBunch is the array that holds the letters that are being typed
let currentBunch = [];
// bunches is the array that holds the bunches of letters that have been typed
let bunches = [];
// floatingLetters is the array that holds the letters that have been detached from the bunches
let floatingLetters = [];

let xOff = 0;
let yOff = 1000;

// Letter class
class Letter {
  constructor(letter) {
    this.letter = letter;
    this.x = 0;
    this.y = 0;
    this.speedX = 0.5;
    this.speedY = 0.5;
    this.rotation = 0;
    this.tail = true;
  }

  // updatePosition method simply updates the position of the Letter
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  // calculateNewPosition method calculates the new position of the letter based on the position of the next Letter in the array
  calculateNewPosition(nextX, nextY, nextSpeedX, nextSpeedY) {
    // adding a random rotation to simulate the floating effect
    this.rotation += noise(this.x * 0.01, this.y * 0.01) * 0.01;

    // before the user scrambles the letters with the mouse,
    // the letters need to be moving in a readable sequence
    // we check the velocity of the next Letter in the array and determine the direction the bunch is moving in
    // and then update the position of the current Letter accordingly

    // the bunch is moving right and down
    if (nextSpeedX > 0 && nextSpeedY > 0) {
      this.updatePosition(
        nextX - 30 + noise(xOff) * 20,
        nextY + noise(yOff) * 20
      );
    }

    // the bunch is moving right and up
    if (nextSpeedX > 0 && nextSpeedY < 0) {
      this.updatePosition(
        nextX - 30 + noise(xOff) * 5,
        nextY + 30 + noise(yOff) * 5
      );
    }

    // the bunch is moving left and up
    if (nextSpeedX < 0 && nextSpeedY < 0) {
      this.updatePosition(
        nextX + 30 + noise(xOff) * 5,
        nextY + 30 + noise(yOff) * 5
      );
    }

    // the bunch is moving left and down
    if (nextSpeedX < 0 && nextSpeedY > 0) {
      this.updatePosition(
        nextX + 30 + noise(xOff) * 5,
        nextY - 30 + noise(yOff) * 5
      );
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    fill(245, 158, 66);
    text(this.letter, 0, 0);
    pop();
  }
}

function preload() {
  font = loadFont("font.ttf");
  img = loadImage('spoon.png');
}

function setup() {
  noCursor();
  createCanvas(400, 400);
  // adding a shadow to the text
  let shadowColor = color(214, 124, 28);
  drawingContext.shadowOffsetX = 2;
  drawingContext.shadowOffsetY = -2;
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = shadowColor;
  textSize(40);
  textFont(font);
  // initalising the currentBunch with a 'tail' that subsequent letters can follow
  currentBunch.push(new Letter(" "));
  currentBunch[0].tail = true;
  currentBunch[0].updatePosition(random(width), random(height));
}

function draw() {
  background(252, 65, 3);
  detectCollision();

  // in the draw function, we have to take care of Letters in all three arrays separately

  // first, we draw the letters that have already been detached
  // since they are not in a bunch, their position is random
  // if the mouse is near, we also speed them up a bit
  for (let i = 0; i < floatingLetters.length; i++) {
    if (dist(floatingLetters[i].x, floatingLetters[i].y, mouseX, mouseY) < 10) {
      floatingLetters[i].speedX = random(-5, 5);
      floatingLetters[i].speedY = random(-5, 5);
    } else if (
      dist(floatingLetters[i].x, floatingLetters[i].y, mouseX, mouseY) > 10
    ) {
      if (floatingLetters[i].speedX >= 1) floatingLetters[i].speedX = 1;
      else if (floatingLetters[i].speedX <= -1) floatingLetters[i].speedX = -1;
      if (floatingLetters[i].speedY >= 1) floatingLetters[i].speedY = 1;
      else if (floatingLetters[i].speedY <= -1) floatingLetters[i].speedY = -1;
    }
    floatingLetters[i].updatePosition(
      floatingLetters[i].x + floatingLetters[i].speedX,
      floatingLetters[i].y + floatingLetters[i].speedY
    );
    floatingLetters[i].draw();
  }

  // next, we draw the bunch that the user is typing into at the moment
  // get the "tail" of the current bunch and make it move
  let lastLetter = currentBunch[currentBunch.length - 1];
  lastLetter.updatePosition(
    lastLetter.x + lastLetter.speedX,
    lastLetter.y + lastLetter.speedY
  );
  // everything else in the array simply follows the next Letter in the array
  for (let i = currentBunch.length - 2; i > -1; i--) {
    // but if the mouse is near, detach the Letter from this bunch and add it to the floatingLetters array
    if (dist(currentBunch[i].x, currentBunch[i].y, mouseX, mouseY) < 10) {
      let floatingElement = currentBunch.splice(i, 1);
      floatingLetters.push(floatingElement[0]);
    } else {
      currentBunch[i].calculateNewPosition(
        currentBunch[i + 1].x,
        currentBunch[i + 1].y,
        currentBunch[i + 1].speedX,
        currentBunch[i + 1].speedY
      );
      currentBunch[i].draw();
    }
  }

  // finally, we draw the bunches that have already been typed
  // only do this if there are bunches in the array
  if (bunches.length > 0) {
    // update the tail of each bunch
    for (let i = 0; i < bunches.length; i++) {
      let lastLetter =
        bunches[i].currentBunch[bunches[i].currentBunch.length - 1];
      lastLetter.updatePosition(
        lastLetter.x + lastLetter.speedX,
        lastLetter.y + lastLetter.speedY
      );
    }
    // update the rest of the letters in each bunch
    for (let i = 0; i < bunches.length; i++) {
      for (let j = bunches[i].currentBunch.length - 2; j > -1; j--) {
        // if the mouse is near, detach the Letter from this bunch and add it to the floatingLetters array
        if (
          dist(
            bunches[i].currentBunch[j].x,
            bunches[i].currentBunch[j].y,
            mouseX,
            mouseY
          ) < 10
        ) {
          let floatingElement = bunches[i].currentBunch.splice(j, 1);
          floatingLetters.push(floatingElement[0]);
        } else {
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
  }

  // update the noise values
  xOff += 0.01;
  yOff += 0.01;

  image(img, mouseX-30, mouseY-60, 100, 100);
}

// function to keep the Letters bouncing off the edges of the canvas
// here too, the three arrays have to be dealth with separately
function detectCollision() {
  // get the tail of the current bunch
  let lastLetter = currentBunch[currentBunch.length - 1];
  // if the tail is at the edge of the canvas, reverse the direction of the tail
  if (lastLetter.tail && lastLetter.x > width) {
    lastLetter.speedX *= -1;
    lastLetter.x = width;
  }
  if (lastLetter.tail && lastLetter.x < 0) {
    lastLetter.speedX *= -1;
    lastLetter.x = 0;
  }
  if (lastLetter.tail && lastLetter.y > height) {
    lastLetter.speedY *= -1;
    lastLetter.y = height;
  }
  if (lastLetter.tail && lastLetter.y < 0) {
    lastLetter.speedY *= -1;
    lastLetter.y = 0;
  }

  // only do this if there are complete bunches
  if (bunches.length > 0) {
    // get the tail of each bunch and check if it is at the edge of the canvas
    // if yes, reverse the direction of the tail
    for (let i = 0; i < bunches.length; i++) {
      let lastLetter =
        bunches[i].currentBunch[bunches[i].currentBunch.length - 1];
      if (lastLetter.tail && lastLetter.x > width) {
        lastLetter.speedX *= -1;
        lastLetter.x = width;
      }
      if (lastLetter.tail && lastLetter.x < 0) {
        lastLetter.speedX *= -1;
        lastLetter.x = 0;
      }
      if (lastLetter.tail && lastLetter.y > height) {
        lastLetter.speedY *= -1;
        lastLetter.y = height;
      }
      if (lastLetter.tail && lastLetter.y < 0) {
        lastLetter.speedY *= -1;
        lastLetter.y = 0;
      }
    }
  }

  // now check each Letter in the floatingLetters array
  // if one is at the edge, reverse its direction
  if (floatingLetters.length > 0) {
    for (let i = 0; i < floatingLetters.length; i++) {
      if (floatingLetters[i].x > width) {
        floatingLetters[i].speedX *= -1;
        floatingLetters[i].x = width;
      }
      if (floatingLetters[i].x < 0) {
        floatingLetters[i].speedX *= -1;
        floatingLetters[i].x = 0;
      }
      if (floatingLetters[i].y > height) {
        floatingLetters[i].speedY *= -1;
        floatingLetters[i].y = height;
      }
      if (floatingLetters[i].y < 0) {
        floatingLetters[i].speedY *= -1;
        floatingLetters[i].y = 0;
      }
    }
  }
}

function keyPressed() {
  // when the user presses a key, it is added to the current bunch array
  if (key != " " && key.length == 1) {
    // first we temporarily remove the tail
    let tempTail = currentBunch.pop();
    // add the newly pressed key to the array
    currentBunch.push(new Letter(key));
    // add the tail back
    currentBunch.push(tempTail);
  }

  // if the user presses space, the current bunch is compeleted and a new bunch is started
  if (key == " ") {
    // add the current bunch to the bunches array
    bunches.push({ currentBunch });
    // empty the current bunch
    currentBunch = [];
    // add a new tail to the current bunch
    currentBunch.push(new Letter(" "));
    currentBunch[0].tail = true;
    // draw the tail randomly on the screen
    currentBunch[0].updatePosition(random(width), random(height));
  }
}
