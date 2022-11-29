extern crate console_error_panic_hook;
mod puzzler;
mod utils;

use std::panic;

use crate::puzzler::grid::generate_grid;
use crate::puzzler::rotate_piece;

use image::GenericImageView;
use puzzler::grid::{Grid, GridSegment};
use rand::distributions::Uniform;
use rand::{thread_rng, Rng};
use serde::{Deserialize, Serialize};
use url::Url;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;
use wasm_bindgen::JsCast;
use web_sys::ImageData;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

#[derive(Serialize, Deserialize, Debug)]
struct ClickResult {
    pub completed: bool,
    pub segment: Option<GridSegment>,
}

pub fn get_image_url(category: String) -> &'static str {
    let images = match category.as_str() {
        "nature" => {
            vec![
                "https://i.imgur.com/lEN5tIF.jpeg",
                "https://i.imgur.com/Cinvhmj.jpg",
                "https://i.imgur.com/lEoYK3f.jpg",
                "https://i.imgur.com/CqhfEid.jpg",
                "https://i.imgur.com/sjNWk3f.jpg",
                "https://i.imgur.com/TKPTC1O.jpg",
                "https://i.imgur.com/JK1acFd.jpg",
                "https://i.imgur.com/c0BgvtW.jpg",
                "https://i.imgur.com/XekJco3.jpg",
                "https://i.imgur.com/jYWrrii.jpg",
                "https://i.imgur.com/ZP7Eoss.jpg",
                "https://i.imgur.com/jYWrrii.jpg",
            ]
        }
        "cats" => {
            vec![
                "https://i.imgur.com/7LEH4Pc.png",
                "https://i.imgur.com/OAAae8G.jpg",
                "https://i.imgur.com/AsKHvMZ.jpg",
                "https://i.imgur.com/bm6iE0O.jpg",
                "https://i.imgur.com/asPTxwa.jpg",
                "https://i.imgur.com/ZhchcWy.jpg",
                "https://i.imgur.com/tPcrV0k.jpg",
                "https://i.imgur.com/NeR2YLx.jpg",
            ]
        }
        "dogs" => {
            vec![
                "https://i.imgur.com/Vny273m.jpg",
                "https://i.imgur.com/LAhOMow.jpg",
                "https://i.imgur.com/D9VHi5n.jpg",
                "https://i.imgur.com/wF99U4K.jpg",
            ]
        }
        "illustrations" => {
            vec![
                "https://i.imgur.com/YkijIi3.jpg",
                "https://i.imgur.com/8JBzF1q.png",
                "https://i.imgur.com/z4GkZn3.jpg",
                "https://i.imgur.com/sioHeAu.jpg",
                "https://i.imgur.com/2sK6sRg.png",
                "https://i.imgur.com/VP9u8S4.jpg",
                "https://i.imgur.com/jQi5zPd.jpg",
            ]
        }
        _ => {
            // Default to cats
            vec!["https://i.imgur.com/7LEH4Pc.png"]
        }
    };
    let mut rng = thread_rng();
    let side = Uniform::new(0, images.len());

    images[rng.sample(side)]
}

#[wasm_bindgen]
pub async fn puzzle_me(category: String, difficulty: u32, image: String) -> JsValue {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let client = reqwest::Client::new();
    let image_url = if image.is_empty() {
        String::from(get_image_url(category))
    } else {
        if Url::parse(image.as_str()).is_ok() {
            image
        } else {
            format!("{}{}", "https://i.imgur.com/", image)
        }
    };
    let body = match client
        .get(&image_url)
        //.header("Authorization", "Client-ID 8e27c656b2d26fd")
        .send()
        .await
    {
        Ok(r) => r.bytes().await.unwrap(),
        Err(e) => return JsValue::from(e),
    };

    let img = image::load_from_memory(&body[..]).unwrap();
    let (w, h) = img.dimensions();

    let cx = difficulty * 10;
    let cy = difficulty * 10;
    let grid = generate_grid(image_url, &img, difficulty, w, h, cx, cy);

    let document = web_sys::window().unwrap().document().unwrap();
    let canvas = document.get_element_by_id("canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .map_err(|_| ())
        .unwrap();

    canvas.set_width(w);
    canvas.set_height(h);

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    let mut iter = grid.segments.iter();
    for _ in 0..grid.gx {
        for _ in 0..grid.gy {
            let gs = iter.next().unwrap();
            let i = image::load_from_memory(&gs.p.ri[..]).unwrap();
            let img_bytes = i.to_rgba8();

            let image_data_temp =
                ImageData::new_with_u8_clamped_array_and_sh(Clamped(&img_bytes), gs.w, gs.h)
                    .unwrap();

            context.put_image_data(&image_data_temp, gs.x, gs.y);
        }
    }

    serde_wasm_bindgen::to_value(&grid).unwrap()
}

#[wasm_bindgen]
pub fn rotate_segment(
    grid_bytes: JsValue,
    direction: String,
    click_x: f64,
    click_y: f64,
) -> JsValue {
    let document = web_sys::window().unwrap().document().unwrap();
    let canvas = document.get_element_by_id("canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .map_err(|_| ())
        .unwrap();

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    let mut grid: Grid = serde_wasm_bindgen::from_value(grid_bytes).unwrap();
    let mut grid_enum = grid.segments.iter_mut().enumerate();
    let mut result: ClickResult = ClickResult {
        completed: true,
        segment: None,
    };

    for (idx, mut segment) in &mut grid_enum {
        if click_x > segment.x && click_y > segment.y // Check collision
            && click_x < segment.x + (segment.w as f64) && click_y < segment.y + (segment.h as f64)
        {
            let (rotated_piece, rotated_image) = rotate_piece(&segment.p, &direction);

            let img_bytes = rotated_image.to_rgba8();

            let image_data_temp = ImageData::new_with_u8_clamped_array_and_sh(
                Clamped(&img_bytes),
                segment.w,
                segment.h,
            )
            .unwrap();

            context.put_image_data(&image_data_temp, segment.x, segment.y);

            log(format!("{:?}", segment.p.current_rotation).as_str());
            if rotated_piece.current_rotation != 0 {
                result.completed = false;
            }
            result.segment = Some(GridSegment {
                x: segment.x,
                y: segment.y,
                w: segment.w,
                h: segment.h,
                p: rotated_piece,
                idx: idx as u32,
            });
        } else {
            if segment.p.current_rotation != 0 {
                result.completed = false;
            }
        }
    }

    return serde_wasm_bindgen::to_value(&result).unwrap();
}
