use image::GenericImageView;

use crate::puzzler::puzzlerize;

pub mod puzzler;

fn main() {
    let img = image::open("cat.jpg").unwrap();
    let result = puzzlerize(&img, 5, 4);

    // split the image into sections
    // and return the sections

    // paint the sections on canvas

    // allow rotation of sections

    // evaluate score

    println!("Hello, world!");
}
