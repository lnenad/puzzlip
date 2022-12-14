pub mod grid;
extern crate base64;

use grid::get_grid_dimensions;
use image::DynamicImage;
use image::GenericImageView;
use rand::distributions::Uniform;
use rand::{thread_rng, Rng};
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Serialize, Deserialize, Debug)]
pub struct Piece {
    pub ri: Vec<u8>,
    pub dw: u32,
    pub dh: u32,
    pub current_rotation: u32,
}

pub fn puzzlerize(img: &DynamicImage, cx: u32, cy: u32) -> (Vec<Piece>, u32, u32, u32) {
    let (w, h) = img.dimensions();
    let copy = img.clone();

    let (gx, gy) = get_grid_dimensions(w, h, cx, cy);
    println!("Piece dimensions: {} {}", gx, gy);
    let (pieces, ideal_moves) = get_pieces(copy, gx, gy, cx, cy);

    (pieces, gx, gy, ideal_moves)
}

fn get_pieces(mut img: DynamicImage, gx: u32, gy: u32, cx: u32, cy: u32) -> (Vec<Piece>, u32) {
    let mut v = vec![];
    let mut rng = thread_rng();
    let side = Uniform::new(1, 4);
    let mut ideal_moves = 0;
    for i in 0..gx {
        for j in 0..gy {
            let i = img.crop(i * cx, j * cy, cx, cy);
            let r = rng.sample(side);
            let rot_i = match r {
                1 => i.rotate90(),
                2 => i.rotate180(),
                3 => i.rotate270(),
                _ => i,
            };
            let (dw, dh) = rot_i.dimensions();
            let mut bytes: Vec<u8> = Vec::new();
            rot_i.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png).unwrap();

            let piece = Piece {
                ri: bytes,
                dw,
                dh,
                current_rotation: r,
            };
            ideal_moves += if r == 3 {
                1
            } else {
                r
            };
            v.push(piece);
        }
    }
    (v, ideal_moves)
}

pub fn rotate_piece(p: &Piece, direction: &String) -> (Piece, DynamicImage) {
    let i = image::load_from_memory(&p.ri[..]).unwrap();
    let rot_i = match direction.as_str() {
        "left" => i.rotate90(),
        "right" => i.rotate270(),
        _ => i,
    };
    let mut bytes: Vec<u8> = Vec::new();
    rot_i.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png).unwrap();

    let ri = bytes;
    let rot_apply = match direction.as_str() {
        "left" => p.current_rotation + 1,  // Left click
        "right" => p.current_rotation - 1, // Right click
        _ => p.current_rotation,
    };

    let new_rotation = if rot_apply == 4294967295 {
        // since unsigned int this is max value means we've gone below zero
        3
    } else if rot_apply > 3 {
        0 // Position reset to starting
    } else {
        rot_apply
    };

    (
        Piece {
            ri,
            dw: p.dw,
            dh: p.dh,
            current_rotation: new_rotation,
        },
        rot_i,
    )
}
