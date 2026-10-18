---
id: IDEA-2
title: One living canvas across every page
type: feature
status: idea
tags: [web, home, canvas, navigation, design]
created: 2026-10-18
---

The welcome screen is a frame: an ink window with hand-drawn rings, a face in
the middle, four corner links. Today a corner link navigates to a separate
placeholder page with a plain header. The idea is to keep **one canvas for the
whole site** and let its shapes reshape themselves per section, so every page
is the same drawing in a different pose and the content sits inside the frame.

**Clothes (`/odyah`).** The nested rectangles morph into a t-shirt outline:
the outer window edge keeps its torn-ink border, the inner rings become the
collar, shoulders and hem, drawn with the same travelling noise. The current
design is rendered inside the shirt silhouette; swiping or tapping the corner
triangles flips to the next design, the silhouette breathes with it.

**Photos (`/photojournal`).** The window slides to the right half of the
screen and becomes a viewport for photos; the left half stays black with the
rings compressed into a thin stack that doubles as a filmstrip or index. The
photo is a DOM `<img>` clipped by the window's wobbling inner edge (the canvas
draws the ink, a CSS `clip-path` or mask built from the same outline clips
the image).

**Manifest (`/manifest`).** The rings open into horizontal ruled lines with
the text running inside the white band, the stripe toggle becomes a reading
mode (black on white / white on black).

**About (`/about`).** The face grows into the whole window; the rings become
a speech balloon or a halo around it; the text sits in the balloon.

**Home.** Stays as it is: the rest state every section morphs from and back
to.

## How it works

- `rings-renderer.ts` already draws rings from a list of sampled outlines with
  noise displacement, band thickness, window mask, stripe and glitch. The
  change is to make the outline list a **scene** that can be any closed path
  (rounded rectangle, t-shirt, balloon), and to **interpolate between
  scenes**: both scenes are resampled to the same point count, each point
  tweens with an easing while the noise keeps flowing, so the frame visibly
  bends from one shape into the next.
- The canvas becomes a layout-level component (rendered once in the root
  route, below an `<Outlet />`) with a `scene` prop driven by the current
  route. Routes still exist and keep their URLs; only the page chrome stops
  being swapped.
- Section content is ordinary DOM positioned over the canvas, clipped where
  needed by a mask generated from the same outline (an SVG `<clipPath>` fed
  with the sampled points each frame, or a CSS `mask-image` from an
  offscreen canvas).
- Navigation: the corner links become section switches (the active corner
  folds into the frame), and swipe/arrow keys page within a section.
- Portrait keeps the quarter-turn trick; each scene declares where its
  content area is so it can be rotated along.

## Open questions

- How much of the Figma geometry the t-shirt silhouette should keep: one
  silhouette drawn by hand in Figma and sampled, or a parametric shirt built
  from the rectangle insets.
- Whether photos live in the repo, in Vercel Blob or in the core API.
- Morph duration and whether the glitch fires on every transition (a glitch
  on the morph itself would hide the tween seams).

### Phases

- [ ] Scenes: turn RINGS into a `Scene` (list of closed paths + window index + content box) and make the renderer accept one; home scene unchanged
- [ ] Morph: resample outlines to a shared point count and tween between scenes on route change, noise keeps flowing during the tween
- [ ] Root-level canvas: render HypnoRings once in the root route under the outlet, drive the scene from the matched route, corner links switch sections instead of swapping chrome
- [ ] Photos scene: window on the right, filmstrip on the left, image clipped by the live outline, keyboard and swipe paging
- [ ] Clothes scene: t-shirt silhouette, designs rendered inside, paging between designs
- [ ] Manifest and About scenes with their text layouts
- [ ] [manual] Walk every section on desktop and phone, tune morph timing and glitch-on-transition
