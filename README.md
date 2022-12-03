<center>

# Puzzlip

</center>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)
[![GitHub Issues](https://img.shields.io/github/issues/lnenad/puzzlip.svg)](https://github.com/lnenad/puzzlip/issues)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Basic Overview

This is a relatively simple puzzle generator application written in Rust and used via Javascript in https://puzzlip.com. If you like the game or use the code please consider [buying me a coffee](https://www.buymeacoffee.com/lnenad)

#### Disclaimer

This was made to learn/practice both Rust and wasm so the code quality is definitely subpar with a lot of room for improvements/optimizations. Looking forward to PRs that improve the codebase. 

## Technical overview

The application works by loading an image from a remote URL, loading it in memory using the `image` crate, taking the difficulty multiplier and generating a square grid of image pieces. The grid is sent back to Javascript. When a user clicks on a field, either left or right, the click location,relative to the canvas, is sent back to Rust and the clicked piece is rotated to it's correct position, again, using the `image` crate. The data that is transferred Rust <> Javascript is encoded using `serde_wasm_bindgen`.  

## Output

There are 5 levels of difficulty, these dictate the square dimensions for the output. The formulae for the square dimensions are `(10 / difficulty) * 10` to get the amount of grid segments, and then divide the dimensions of the image by that amount. The output looks like this

<img src="https://raw.githubusercontent.com/lnenad/puzzlip/master/output_example.png">

## Loading custom images

Because the original application works by fetching images via URLs we can load any public image that is CORS enabled. This is pretty cool since you don't have to be limited by the application's library.

## Contributing
Please take a look at our [contributing](https://github.com/lnenad/puzzlip/blob/master/CONTRIBUTING.md) guidelines if you're interested in helping!

#### Pending Features
- Saving the puzzle image
- Generating a full puzzle piece (with the side thingies) and exporting to a CAD format for printing

## Attribution
- https://simplecss.org for easy styling