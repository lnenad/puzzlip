pub mod grid;
extern crate base64;

use image::DynamicImage;
use image::GenericImageView;
use rand::{Rng, thread_rng};
use rand::distributions::Uniform;
use grid::get_grid_dimensions;
use bytebuffer::ByteBuffer;
use std::io::BufReader;
use std::fs::File;
use std::io::Cursor;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
pub struct Piece {
    pub ri: Vec<u8>,
    pub r: u32,
    pub dw: u32,
    pub dh: u32,
}

pub fn puzzlerize(img: &DynamicImage, cx: u32, cy: u32) -> (Vec<Piece>, u32, u32) {
    let (w, h) = img.dimensions();
    let copy = img.clone();

    let (gx, gy) = get_grid_dimensions(w, h, cx, cy);
    println!("Piece dimensions: {} {}",gx, gy);
    let pieces = get_pieces(copy, gx, gy, cx, cy);

    (pieces, gx, gy)
}

fn get_pieces(mut img: DynamicImage, gx: u32, gy: u32, cx: u32, cy: u32) -> Vec<Piece> {
    let mut v = vec![];
    let mut rng = thread_rng();
    let side = Uniform::new(1, 3);
    
    for i in 0..gx {
        for j in 0..gy {
            let i = img.crop(i*cx, j*cy, cx, cy);
            let r = rng.sample(side);
            let rot_i = match r {
                1 => i.rotate90(),
                2 => i.rotate180(),
                3 => i.rotate270(),
                _ => i,
            };
            let (dw, dh) = rot_i.dimensions();
            let mut bytes: Vec<u8> = Vec::new();
            rot_i.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png);

            let piece = Piece{r: r, ri: bytes, dw, dh};
            v.push(piece);
        }
    }
    v
}