# Hero Media Spec For Designer

## Purpose

This document defines the required image and video specs for the Hero block on the homepage.
It is prepared as a handoff for design production and content preparation.

## Hero Layout Constraints

- Max container width: `1280px`
- Hero corner radius: `24px`
- Media render mode: `object-cover` (image/video can be cropped on edges)
- Text/content area is on the left side of the Hero
- Additional decorative panel appears on desktop (right side), so avoid placing critical details there

## Hero Height Modes (3 Types)

### 1) `normal`

- Mobile: `384px` height
- Tablet (`md`): `480px` height
- Desktop (`lg`): `544px` height

### 2) `tall`

- Mobile: `448px` height
- Tablet (`md`): `560px` height
- Desktop (`lg`): `640px` height

### 3) `wow`

- Mobile: `512px` height
- Tablet (`md`): `640px` height
- Desktop (`lg`): `736px` height

## Image Specs (Hero Slides)

### Main Source

- Master size: `2560 x 1440` (16:9)
- Format: `JPG` or `WebP`
- Quality target: `80-90`

### Additional Source For Tall/Wow Safety

- Optional second source: `2160 x 1620` (4:3)
- Use when scene composition is sensitive to top/bottom crop in higher Hero modes

## Video Specs (Hero Slides)

- Primary master: `1920 x 1080` (`.mp4`, H.264)
- FPS: `24/25/30`
- Bitrate target: `8-15 Mbps`
- Optional high-res version: `2560 x 1440` for premium desktop scenes
- Provide poster frame in matching composition

## Composition Rules (Important)

- Keep the left side visually clean for text readability (title, subtitle, CTA)
- Place key object in center/right third
- Keep all critical details inside central safe area:
  - about `70%` of frame width
  - about `70%` of frame height
- Avoid tiny details near frame borders (they may be cropped by `object-cover`)

## Handoff Checklist

For each Hero slide, prepare:

- One image master (`2560 x 1440`)
- Optional safe variant (`2160 x 1620`) if needed
- Optional video master (`1920 x 1080` H.264)
- Poster image for video
- Short note from designer: focal point position and crop risk areas

