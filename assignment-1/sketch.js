let isInside, outside, inside;
let fog = 0;
let fogChangeTo = 0.9;
let isAnimating = false;

function preload() {
  inside = loadImage("inside.jpg");
  outside = loadImage("outside.jpg");
}

function setup() {
  createCanvas(400, 400);
  isInside = true;
}

function draw() {
  // background
  image(isInside ? inside : outside, 0, 0);

  // face
  fill(190, 158, 115);
  noStroke();
  rect(125, 50, 155, 165, 30);

  // hair
  fill(0, 0, 0);
  rect(115, 40, 95, 50, 10, 0, 20, 0);
  rect(210, 40, 85, 50, 0, 10, 0, 20);

  // eyes
  fill(255, 255, 255);
  ellipse(170, 120, 35, 25);
  ellipse(240, 120, 35, 25);
  fill(0, 0, 0);
  ellipse(170, 120, 5, 5);
  ellipse(240, 120, 5, 5);

  // glasses
  if (isAnimating) {
    fog += (fogChangeTo - fog) * 0.01;
    if (abs(fog - fogChangeTo) < 0.01) {
      fog = fogChangeTo;
      isAnimating = false;
    }
  }
  fill(`rgba(255, 255, 255, ${fog})`);
  stroke(0, 0, 0);
  strokeWeight(2);
  rect(145, 105, 50, 35, 0, 0, 10, 10);
  rect(215, 105, 50, 35, 0, 0, 10, 10);
  fill(0, 0, 0);
  rect(195, 110, 20, 3);

  // nose hoop
  noFill();
  stroke(222, 222, 222);
  arc(215, 160, 10, 10, 4.5, 3.1);

  // mouth
  fill(54, 9, 0);
  noStroke();
  ellipseMode(CENTER);
  rectMode(CORNER);
  if(isAnimating) {
    ellipse(205, 190, 30, 30*fog);
  } else {
    rect(190, 190, 30, 5)
  }
  

  // body
  fill(175, 134, 80);
  noStroke();
  rect(185, 215, 40, 30);
  fill(0, 128, 0);
  rect(110, 245, 190, 155, 30, 30, 0, 0);

  // sign
  fill(255, 255, 255);
  stroke(0, 153, 204);
  rect(85, 255, 240, 105);
  fill(0, 102, 153);
  noStroke();
  text(
    isInside ? "click to make me go outside" : "click to make me go inside",
    130,
    310
  );

  // hands
  fill(175, 134, 80);
  noStroke();
  rect(80, 275, 10, 10, 0, 10, 10, 0);
  rect(80, 285, 10, 10, 0, 10, 10, 0);
  rect(80, 295, 10, 10, 0, 10, 10, 0);
  rect(80, 305, 10, 10, 0, 10, 10, 0);
  rect(320, 275, 10, 10, 10, 0, 0, 10);
  rect(320, 285, 10, 10, 10, 0, 0, 10);
  rect(320, 295, 10, 10, 10, 0, 0, 10);
  rect(320, 305, 10, 10, 10, 0, 0, 10);
}

function mouseClicked() {
  isInside = !isInside;
  isAnimating = !isAnimating;

  if (isAnimating) {
    fogChangeTo = 0.8;
  } else {
    fogChangeTo = 0;
    fog = 0;
  }
}
