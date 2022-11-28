use image::DynamicImage;
use image::GenericImageView;
use crate::puzzler::{puzzlerize, Piece};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
pub struct Grid {
    pub segments: Vec<GridSegment>,
    pub gx: u32,
    pub gy: u32,
    pub w: u32,
    pub h: u32,
    pub difficulty: u32,
}

#[derive(Serialize, Deserialize)]
#[derive(Debug)]
pub struct GridSegment {
    pub x: f64,
    pub y: f64,
    pub w: u32,
    pub h: u32,
    pub p: Piece,
    pub idx: u32
}

pub fn generate_grid(img: &DynamicImage, difficulty: u32, w: u32, h: u32, cx: u32, cy: u32) -> Grid {
    let (puzzle, gx, gy) = puzzlerize(&img, cx, cy);
    let mut grid = Grid{segments: Vec::new(), w, h, difficulty, gx: gx, gy: gy};

    let mut iter = puzzle.into_iter().enumerate();
    for i in 0..gx {
        for j in 0..gy {
            let (idx, piece) = iter.next().unwrap();
            
            grid.segments.push(GridSegment{x: i as f64*piece.dw as f64, y: j as f64*piece.dh as f64, w: piece.dw, h: piece.dh, p: piece, idx: idx as u32});
        }
    }

    grid
}

pub fn get_grid_dimensions(x: u32, y: u32, cx: u32, cy: u32) -> (u32, u32) {
    (x / cx as u32, y / cy as u32)
}