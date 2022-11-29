import * as wasm from "puzzler";

let selectedCategory = "cats";
let loadedImage = null;
let playable = false;
let timer = null;

// 1 easiest ; 5 hardest
const newPuzzle = async (image) => {
  const canvasContainer = document.querySelector("#canvasContainer");
  canvasContainer.innerHTML = "";
  const canvas = document.createElement("canvas");
  canvas.id = "canvas";
  // canvas.width = 1000;
  // canvas.height = 500;

  console.log(image);
  canvasContainer.appendChild(canvas);
  const difficulty = document.querySelector("#difficulty").value;
  let grid = await wasm.puzzle_me(
    selectedCategory,
    10 / difficulty,
    image || ""
  );
  loadedImage = grid.image_url;

  console.log(typeof grid, grid);

  if (grid.message && grid.message.includes("error sending request")) {
    return alert("Error while trying to get image");
  }

  playable = true;
  timer = Date.now();

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

    const result = wasm.rotate_segment(
      grid,
      direction,
      canvasClickLeft,
      canvasClickTop
    );
    grid.segments[result.segment.idx] = result.segment;

    if (result.completed) {
      alert(`You won after ${(Date.now() - timer) / 1000} seconds.`);
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

const showIntro = () => {
  localStorage.setItem("closedIntro", "false");
  document.getElementById("intro").classList.remove("hidden");
}

const closeIntro = () => {
  localStorage.setItem("closedIntro", "true");
  document.getElementById("intro").classList.add("hidden");
}

window.newPuzzle = newPuzzle;

const setCategory = (category) => {
  document.querySelectorAll("nav > a").forEach(n => {
    n.classList.remove("active");
  });
  const id = `${category}Category`;
  selectedCategory = category;
  document.getElementById(id).classList.add("active");
  newPuzzle();
};

document
  .querySelector("#catsCategory")
  .addEventListener("click", setCategory.bind(null, "cats"));
document
  .querySelector("#dogsCategory")
  .addEventListener("click", setCategory.bind(null, "dogs"));
document
  .querySelector("#natureCategory")
  .addEventListener("click", setCategory.bind(null, "nature"));
document
  .querySelector("#nsfwCategory")
  .addEventListener("click", setCategory.bind(null, "nsfw"));
document
  .querySelector("#illustrationsCategory")
  .addEventListener("click", setCategory.bind(null, "illustrations"));

document
  .querySelector("#newPuzzle")
  .addEventListener("click", newPuzzle.bind(null, null));
document.querySelector("#reshuffle").addEventListener("click", reshuffle);
document.querySelector("#customImage").addEventListener("click", customImage);
document.querySelector("#about").addEventListener("click", showIntro);
document.querySelector("#closeIntro").addEventListener("click", closeIntro);

document.getElementById("catsCategory").classList.add("active");

if (localStorage.getItem("closedIntro") === "true") {
  document.getElementById("intro").classList.add("hidden");
}

newPuzzle();

function isValidURL(str) {
  const a = document.createElement("a");
  a.href = str;
  return a.host && a.host != window.location.host;
}
