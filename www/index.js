import * as wasm from "puzzler";

let selectedCategory = "cats";
let loadedImage = null;
let playable = false;
let timer = null;
let timeInterval = null;
let moves = 0;
let score = 0;
let lastCorrectMove = null;
let scoreTable = {};

const scoring = {
  0: 4,
  1: 4,
  2: 4,
  3: 3,
  4: 3,
  5: 3,
  6: 3,
  7: 2,
  8: 2,
  9: 2,
};

const storedSettings = {
  animate:
    localStorage.getItem("animate") &&
    localStorage.getItem("animate") === "true"
      ? true
      : false,
  difficulty: localStorage.getItem("difficulty")
};

let animate =
  storedSettings.animate !== undefined ? storedSettings.animate : true;

if (animate) {
  document.getElementById("animate").setAttribute("checked", true);
} else {
  document.getElementById("animate").removeAttribute("checked");
}

if (storedSettings.difficulty !== undefined) {
  document.getElementById("difficulty").setAttribute("value", storedSettings.difficulty);
}

const resetState = () => {
  stopTimer();
  playable = false
  timer = null
  timeInterval = null
  moves = 0
  score = 0
  lastCorrectMove = null
  scoreTable = {};
  document.getElementById("score").innerText = score;
  document.getElementById("moves").innerText = moves;
}

// 1 easiest ; 5 hardest
const newPuzzle = async (image) => {
  resetState();

  const canvasContainer = document.getElementById("canvasContainer");
  canvasContainer.classList.add("loading");
  canvasContainer.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.classList.add("transitionsNicely");

  canvasContainer.appendChild(canvas);
  const difficulty = document.getElementById("difficulty").value;
  localStorage.setItem("difficulty", difficulty);
  canvasContainer.classList.remove("loading");

  let grid = await wasm.puzzle_me(
    selectedCategory,
    10 / difficulty,
    image || "",
    animate
  );
  loadedImage = grid.image_url;

  console.log(grid);

  if (grid.message && grid.message.includes("error sending request")) {
    return alert("Error while trying to get image");
  }

  playable = true;
  timer = Date.now();
  stopTimer();
  startTimer();
  moves = 0;
  score = 0;

  document.getElementById("idealMoves").innerText = grid.ideal_moves;

  const clickHandler = (direction, event) => {
    event.preventDefault();
    if (!playable) {
      return false;
    }

    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasClickLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasClickTop = (event.clientY - boundingRect.top) * scaleY;

    // Perform segment rotation
    const result = wasm.rotate_segment(
      grid,
      direction,
      canvasClickLeft,
      canvasClickTop
    );

    grid.segments[result.segment.idx] = result.segment;

    // If correct move on a new segment increase score
    if (result.correct_move && !scoreTable[result.segment.idx]) {
      if (lastCorrectMove === null) {
        score += 4;
      } else {
        let ttm = Math.floor((Date.now() - lastCorrectMove) / 1000);
        score += Math.round((1 + (difficulty / 10)) * (scoring[ttm] || 1));
      }
      lastCorrectMove = Date.now();
      scoreTable[result.segment.idx] = score;
      document.getElementById("score").innerText = score;
    }

    moves += 1;
    document.getElementById("moves").innerText = moves;

    if (result.completed) {
      stopTimer();
      gameWon();
      timer = null;
      playable = false;
    }
  };

  const clickHandlerR = (e) => clickHandler("right", e);
  const clickHandlerL = (e) => clickHandler("left", e);

  canvas.removeEventListener("contextmenu", clickHandlerR);
  canvas.addEventListener("contextmenu", clickHandlerR);
  canvas.removeEventListener("click", clickHandlerL);
  canvas.addEventListener("click", clickHandlerL);
};

const reshuffle = () => {
  newPuzzle(loadedImage);
};

const customImage = () => {
  const imageURL = prompt("Enter the URL to the custom image");
  if (isValidURL(imageURL)) {
    newPuzzle(imageURL);
  } else {
    alert("Invalid URL provided");
  }
};

const openFullscreen = () => {
  const controls = document.getElementById("controlsContainer");
  document.getElementById("canvasContainer").classList.add("fullScreen");
  document.getElementById("dragHandler").style.display = "block";
  document.getElementById("closeFullscreen").style.display = "block";
  document.getElementById("openFullscreen").style.display = "none";
  controls.classList.add("floating");

  dragElement(controls);
};

const closeFullscreen = () => {
  const controls = document.getElementById("controlsContainer");
  document.getElementById("canvasContainer").classList.remove("fullScreen");
  document.getElementById("dragHandler").style.display = "none";
  document.getElementById("closeFullscreen").style.display = "none";
  document.getElementById("openFullscreen").style.display = "block";
  controls.classList.remove("floating");

  dragElement(controls);
};

const toggleAnimation = () => {
  const value = document.getElementById("animate").checked;
  animate = value;
  localStorage.setItem("animate", animate);
};

const parseTime = (elapsed) => {
  const seconds = String(Math.round(elapsed % 60)).padStart(2, "0");
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  return { seconds, minutes };
}

const startTimer = () => {
  timeInterval = setInterval(timerStep, 1000);
};

const timerStep = () => {
  const elapsed = Math.round((Date.now() - timer) / 1000);
  const { seconds, minutes } = parseTime(elapsed);
  document.getElementById("time").innerText = `${minutes}:${seconds}`;
};

const stopTimer = () => {
  clearInterval(timeInterval);
  timeInterval = null;
};

const showIntro = () => {
  localStorage.setItem("closedIntro", "false");
  document.getElementById("intro").style.display = "block";
};

const closeIntro = () => {
  localStorage.setItem("closedIntro", "true");
  document.getElementById("intro").style.display = "none";
};

window.newPuzzle = newPuzzle;

const setCategory = (category) => {
  document.querySelectorAll("nav > a").forEach((n) => {
    n.classList.remove("active");
  });
  const id = `${category}Category`;
  selectedCategory = category;
  document.getElementById(id).classList.add("active");
  newPuzzle();
};

document
  .getElementById("openFullscreen")
  .addEventListener("click", openFullscreen);
document
  .getElementById("closeFullscreen")
  .addEventListener("click", closeFullscreen);

document.getElementById("animate").addEventListener("click", toggleAnimation);

document
  .getElementById("catsCategory")
  .addEventListener("click", setCategory.bind(null, "cats"));
document
  .getElementById("dogsCategory")
  .addEventListener("click", setCategory.bind(null, "dogs"));
document
  .getElementById("natureCategory")
  .addEventListener("click", setCategory.bind(null, "nature"));
document
  .getElementById("nsfwCategory")
  .addEventListener("click", () => {
    const legal = confirm("Please confirm if you are 18+");
    if (legal) {
      setCategory("nsfw");
    }
  });
document
  .getElementById("illustrationsCategory")
  .addEventListener("click", setCategory.bind(null, "illustrations"));

document
  .getElementById("newPuzzle")
  .addEventListener("click", newPuzzle.bind(null, null));
document.getElementById("reshuffle").addEventListener("click", reshuffle);
document.getElementById("customImage").addEventListener("click", customImage);
document.getElementById("about").addEventListener("click", showIntro);
document.getElementById("closeIntro").addEventListener("click", closeIntro);

document.getElementById("catsCategory").classList.add("active");

if (localStorage.getItem("closedIntro") === "true") {
  document.getElementById("intro").style.display = "none";
}

newPuzzle();

/******************************/
/******************************/
/*******HELPER FUNCTIONS*******/
/******************************/
/******************************/
function isValidURL(str) {
  const a = document.createElement("a");
  a.href = str;
  return a.host && a.host != window.location.host;
}

function dragElement(elmnt) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  document.getElementById("dragHandler").addEventListener("mousedown", dragMouseDown);
  document.getElementById("dragHandler").addEventListener("touchstart", dragMouseDown, {passive:false});

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("touchend", closeDragElement);
    // call a function whenever the cursor moves:
    document.addEventListener("mousemove", elementDrag);
    document.addEventListener("touchmove", elementDrag);
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - (e.clientX || e.touches[0].clientX);
    pos2 = pos4 - (e.clientY || e.touches[0].clientY);
    pos3 = (e.clientX || e.touches[0].clientX);
    pos4 = (e.clientY || e.touches[0].clientY);
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
    document.removeEventListener("touchend", closeDragElement);
    document.removeEventListener("touchmove", elementDrag);
  }
}


const gameWon = () => {
  document.getElementById("celebration").style.display = "block";
  document.getElementById("resultScore").innerText = score;
  document.getElementById("resultMoves").innerText = moves;
  const elapsed = Math.round((Date.now() - timer) / 1000);
  const { seconds, minutes } = parseTime(elapsed);
  document.getElementById("resultTime").innerText = `${minutes}:${seconds}`;

  showModal();
}

const showModal = function () {
  const modalWindow = document.getElementById("resultsModal");

  modalWindow.classList
    ? modalWindow.classList.add("open")
    : (modalWindow.className += " " + "open");
};

const closeButton = document.getElementById("resultsModalClose");
const closeOverlay = document.getElementById("resultsModalOverlay");

const closeModal = (modalWindow) => {
  modalWindow.classList
    ? modalWindow.classList.remove("open")
    : (modalWindow.className = modalWindow.className.replace(
        new RegExp("(^|\\b)" + "open".split(" ").join("|") + "(\\b|$)", "gi"),
        " "
      ));
};

closeButton.addEventListener("click", function () {
  const modalWindow = this.parentNode.parentNode;

  document.getElementById("celebration").style.display = "none";

  closeModal(modalWindow);
});

closeOverlay.addEventListener("click", function () {
  const modalWindow = this.parentNode;

  document.getElementById("celebration").style.display = "none";

  closeModal(modalWindow);
});
