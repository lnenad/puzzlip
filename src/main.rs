use image::GenericImageView;

use crate::puzzler::puzzlerize;

pub mod puzzler;

fn main() {
    let img = image::open("images/cats/cat.jpg").unwrap();
    let result = puzzlerize(&img, 5, 4);

    // evaluate score
}
