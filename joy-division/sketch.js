/*
zion, ajz317
inspired by the 1979 joy division album
*/

let mic, fft;
const wave = "sine";

function setup() {
  //creating canvas
  createCanvas(400, 400);

  //setting up audio input
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
}

function draw() {
  //background and lines
  background("black");

  //drawing waves
  let spectrum = fft.analyze();
  let waveform = fft.waveform();

  for (y = 120; y < 330; y = y + 5) {
    beginShape();
    for (let i = 0; i < 256; i++) {
      noFill();
      stroke("#eeeeee");
      strokeWeight(1);
      vertex(
        (i * width * 5) / 256 + width/4,
        y - 400 * random(0.1, 1) * waveform[i]
      );
    }
    endShape();
  }
  
  //a rectangle to adjust waves
  push();
  noStroke();
  fill("black");
  rect(300, 0, 400, 400);
  pop();

  //text
  fill("#eeeeee");
  textFont("Helvetica");
  noStroke();
  push();
  //select("canvas").elt.style.letterSpacing = "3.2px";
  textSize(30);
  text("JOY DIVISION", width / 4, 110);
  pop();
  textSize(17.3);
  text("UNKNOWN PLEASURES", width / 4, 346);
}



