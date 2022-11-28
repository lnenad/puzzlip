import * as wasm from "puzzler";

let selectedCategory = "cats";

// 1 easiest ; 5 hardest
const newPuzzle = (async (image) => {
    const canvasContainer = document.querySelector("#canvasContainer");
    canvasContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    // canvas.width = 1000;
    // canvas.height = 500;

    canvasContainer.appendChild(canvas);
    const difficulty = document.querySelector("#difficulty").value;
    let grid = await wasm.puzzle_me(selectedCategory, 10 / difficulty, image || "");

    console.log(grid);
    
    const clickHandler = (direction, event) => {
        event.preventDefault();
        const boundingRect = canvas.getBoundingClientRect();
      
        const scaleX = canvas.width / boundingRect.width;
        const scaleY = canvas.height / boundingRect.height;
      
        const canvasClickLeft = (event.clientX - boundingRect.left) * scaleX;
        const canvasClickTop = (event.clientY - boundingRect.top) * scaleY;
      
        //const row = Math.min(Math.floor(canvasClickTop / (CELL_SIZE + 1)), height - 1);
        //const col = Math.min(Math.floor(canvasClickLeft / (CELL_SIZE + 1)), width - 1);

        const segment = wasm.rotate_segment(grid, direction, canvasClickLeft, canvasClickTop);
        grid.segments[segment.idx] = segment;
    };

    const clickHandlerR = (e) => clickHandler("right", e);
    const clickHandlerL = (e) => clickHandler("left", e);

    canvas.removeEventListener('contextmenu', clickHandlerR);
    canvas.addEventListener('contextmenu', clickHandlerR);
    canvas.removeEventListener('click', clickHandlerL);
    canvas.addEventListener("click", clickHandlerL);  
});

window.newPuzzle = newPuzzle;

const setCategory = (category) => {
    selectedCategory = category;
    newPuzzle();
};

document.querySelector("#catsCategory").addEventListener("click", setCategory.bind(null, "cats"));
document.querySelector("#dogsCategory").addEventListener("click", setCategory.bind(null, "dogs"));
document.querySelector("#natureCategory").addEventListener("click", setCategory.bind(null, "nature"));
document.querySelector("#nsfwCategory").addEventListener("click", setCategory.bind(null, "nsfw"));
document.querySelector("#illustrationsCategory").addEventListener("click", setCategory.bind(null, "illustrations"));

document.querySelector("#newPuzzle").addEventListener("click", newPuzzle);
document.querySelector("#reshuffle").addEventListener("click", reshuffle);

newPuzzle();