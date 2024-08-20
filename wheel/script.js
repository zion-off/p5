// text
const text = `The Lord then said to Noah, “Go into the ark, you and your whole family, because I have found you righteous in this generation." And Noah did all that the Lord commanded him.`;

let counter = 0;
let canWrite = true;
let canRemove = true;
const textArray = text.split("");
const topText = document.querySelector("#top");
const bottomText = document.querySelector("#bottom");

const writeText = function () {
  if (counter < 129) {
    if (canWrite && counter < textArray.length) {
      topText.innerHTML += textArray[counter];
      if (counter < textArray.length) {
        counter++;
      }
      canWrite = false;
      setTimeout(() => {
        canWrite = true;
      }, 50);
    }
  } else {
    if (canWrite && counter < textArray.length) {
      bottomText.innerHTML += textArray[counter];
      if (counter < textArray.length) {
        counter++;
      }
      canWrite = false;
      setTimeout(() => {
        canWrite = true;
      }, 50);
    }
  }
};

const removeText = function () {
    if (counter > 129) {
        if (canRemove && counter > 0) {
            bottomText.innerHTML = bottomText.innerHTML.slice(0, -1);
            counter--;
            canRemove = false;
            setTimeout(() => {
                canRemove = true;
            }, 50);
        }
    } else {
        if (canRemove && counter > 0) {
            topText.innerHTML = topText.innerHTML.slice(0, -1);
            counter--;
            canRemove = false;
            setTimeout(() => {
                canRemove = true;
            }, 50);
        }
    }
};

// audio
var audio = new Audio("wheel.wav");
var ocean = new Audio("ocean.mp3");

function isAudioPlaying(audio) {
  return !audio.paused;
}

const stopAudio = function () {
  audio.pause();
  audio.currentTime = 0;
};

// check mouse move direction
var direction = "";
var oldx = 0;
var oldy = 0;
var wheelRotation = 0;

const mouseDirection = function (e) {
  if (e.pageX > oldx && e.pageY == oldy) {
    direction = "RIGHT";
  } else if (e.pageX == oldx && e.pageY > oldy) {
    direction = "BOTTOM";
  } else if (e.pageX == oldx && e.pageY < oldy) {
    direction = "TOP";
  } else if (e.pageX < oldx && e.pageY == oldy) {
    direction = "LEFT";
  }

  oldx = e.pageX;
  oldy = e.pageY;
};

const rotateWheel = function (event) {
  const rect = wheel.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  if (isDragging) {
    // top or bottom
    if (mouseY < rect.height / 2) {
      if (direction == "RIGHT") {
        wheelRotation += 1;
        writeText();
      } else if (direction == "LEFT") {
        wheelRotation -= 1;
        removeText();
      }
    } else if (mouseY > rect.height / 2) {
      if (direction == "RIGHT") {
        wheelRotation -= 1;
        removeText();
      } else if (direction == "LEFT") {
        wheelRotation += 1;
        writeText();
      }
    }

    if (mouseX < rect.width / 2) {
      if (direction == "TOP") {
        wheelRotation += 1;
        writeText();
      } else if (direction == "BOTTOM") {
        wheelRotation -= 1;
        removeText();
      }
    } else if (mouseX > rect.width / 2) {
      if (direction == "TOP") {
        wheelRotation -= 1;
        removeText();
      } else if (direction == "BOTTOM") {
        wheelRotation += 1;
        writeText();
      }
    }

    // rotate wheel
    wheel.style.transform = `translate(-50%, -50%) rotate(${
      wheelRotation % 360
    }deg)`;

    if (!isAudioPlaying(audio)) {
      audio.loop = true;
      audio.play();
    }
  }
};

// check mouse drag
var isDragging = false;
const wheel = document.querySelector("#wheel");

wheel.addEventListener("mousemove", (event) => {
  mouseDirection(event);
  rotateWheel(event);
});

wheel.addEventListener("mousedown", () => {
  isDragging = true;
});

wheel.addEventListener("mouseup", () => {
  isDragging = false;
  stopAudio();
  if (counter == textArray.length) {
    ocean.play();
  }
});
