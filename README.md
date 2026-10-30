<div align="center">
  <img src="docs/icon.png" alt="Pixy" width="96" height="96" />
  <h1>Pixy</h1>
  <p><em>Pixel-block drawing for iPad + Apple Pencil: shapes, freehand, paint bucket, export to Photos</em></p>
  <p><a href="https://pixy-bheng.vercel.app">Live</a> &middot; <a href="https://github.com/bunlongheng/pixy">Repo</a> &middot; <a href="https://bunlongheng.com/projects?name=pixy">Portfolio</a></p>
  <img src="docs/social-preview.png" alt="Pixy - preview" width="820" />
</div>

---

# Pixy

[![CI](https://github.com/bunlongheng/pixy/actions/workflows/ci.yml/badge.svg)](https://github.com/bunlongheng/pixy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Live](https://img.shields.io/badge/demo-live-brightgreen)](https://pixy-bheng.vercel.app)

A kid-friendly, **Minecraft-pixelated** shape editor for iPad and Apple Pencil. Search
the shape library, tap to drop a shape on a plain white sheet, then move, resize, and
paint it - and export the finished drawing straight to Photos.

**Live demo: [pixy-bheng.vercel.app](https://pixy-bheng.vercel.app)**

![Pixy](screenshots/hero.png)

## Features

- **14 shapes, all pixelated** - square, rectangle, circle, triangle, parallelogram,
  pentagon, hexagon, octagon, star, asterisk, moon (crescent), and solid / dashed /
  dotted lines. Every shape is rasterized to chunky Minecraft blocks.
- **Tap-to-add shape grid** - a compact rail of pixelated previews; tap to drop one on the
  canvas.
- **Move, resize, rotate, recolor** - drag to move, drag a corner grip to resize, use the
  top grip to rotate (everything snaps to the block grid). **17 crayon-box colors** plus a
  custom picker.
- **Draw, fill, erase** - freehand pencil, paint-bucket flood fill of enclosed areas, and a
  cell-by-cell eraser - all great with Apple Pencil.
- **Undo + copy / paste / duplicate** - Cmd/Ctrl+Z, C, V, D; Backspace/Delete removes.
- **Plain white sheet** - a fresh full-screen page, like Paint.
- **Export to Photos** - on iPad/iPhone the native share sheet opens with "Save Image";
  elsewhere it downloads a PNG.
- **iPad-first & responsive**, Apple-Pencil / touch / mouse via Pointer Events.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · HTML Canvas · Vitest + Playwright.
No runtime dependencies beyond React. The kid-handwriting font is
[Comic Neue](https://github.com/crozynski/comicneue), bundled under the
[SIL Open Font License 1.1](public/fonts/OFL.txt).

## Architecture

Static, client-only. All the geometry + pixelation is pure and unit-tested; the canvas
just draws the computed blocks.

```mermaid
flowchart TD
    Page["app/page.tsx<br/>(layout)"]
    Canvas["components/Canvas.tsx<br/>(pointer: move/resize/paint)"]
    Lib["components/Toolbar + ShapeLibrary + ColorPalette"]
    Editor["lib/useEditor.ts<br/>(shapes, selection, color, undo)"]
    Shapes["lib/shapes.ts<br/>(pure: verts, pixelation, hit-test)"]
    Render["lib/render.ts<br/>(paint scene)"]
    Export["lib/exportImage.ts<br/>(offscreen PNG + share)"]

    Page --> Canvas
    Page --> Lib
    Page --> Editor
    Page --> Export
    Canvas --> Shapes
    Canvas --> Render
    Editor --> Shapes
    Render --> Shapes
    Export --> Render
```

- `lib/shapes.ts` - pure geometry: polygon vertices, ray-cast point-in-shape, the
  `shapeCells` rasterizer (the pixel look), hit-testing, and snap/clamp. Unit-tested.
- `lib/render.ts` - paints the scene (reused by the live canvas and the export).
- `lib/exportImage.ts` - renders a clean offscreen PNG and hands it to the Web Share API.

## Develop

```bash
npm install
npm run dev            # http://localhost:3022

npm run typecheck
npm run lint           # eslint (flat config + jsx-a11y)
npm run format:check   # prettier
npm test               # vitest unit tests (coverage-gated: 95% lines/statements/functions)
npm run test:e2e       # playwright end-to-end
```

Husky pre-push runs typecheck + lint + format + unit; GitHub Actions runs the full gate
(format, typecheck, lint, unit, build, prod audit, e2e) on every push/PR.

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built by <a href="https://bunlongheng.com">Bunlong Heng</a> &middot; <a href="https://bunlongheng.com/projects/pixy">See it in my portfolio &rarr;</a></sub>
</p>

---

<div align="center">

<a href="https://bunlongheng.com"><img src="https://img.shields.io/badge/-bunlongheng.com-3A3A3C?style=for-the-badge&amp;labelColor=2A2A2C&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y%2BmAAADAFBMVEXx8vLq6v%2F19fX09PT8%2Ff309PT5%2BfnAwMBMaXHx8vL19fX5%2Bfny8vL09PT39%2Ff6%2Bfn6%2Bvr09PTx8fH4%2BPn%2F8vLy8%2FP09PTz8%2FPy8vL%2F%2F%2F%2Fz9PTz9PP19fby8vP19PXz8%2FT19%2Fb08%2FTx8vLy8vL09vby8%2FL29vf19fTv8PDz9vb7%2Bvn%2F%2Ff%2F9%2Ff3w8vH29fb%2F%2FP339%2Ff5%2Bfn59%2Ff19PT09PR7rao3VF3%2F%2Fv8AKDR6sqsBV1vv8fL4%2BPiux8b8%2Bvq90NDy8%2FR%2BlpppnZyZqrACLTxclZJSkI9en5ssZ2luqaUAeWgqbW4BX1gCfG0%2Fa3QaVG0MN0UKNUKUpKsGpYMAKjoRQ1UDf3AQRloJqIgEm32d0cUBg3ElbnQIln8eVWgrmIdP0KzF5d5s2acdfHwppJCP5MMXl4Tz8%2FLv8%2FP39%2FiewL5%2BqahYf4IrTFZkk5KlxsREiIYAHiqDnKFmnJowc3IdVllvpKK7zc3D2tnk5%2BmuycdwpKKuub2yv8Ly%2B%2FkAMT7z%2Bvjq7e09gH93q6kGdWpGgoJZmJSlw8M7c3WwyceTw76w1M8mYmpFfX8lW2AFOEpGiYhxqqRrqaRb2rdIsZ8AVE91jpU7d3t3saqBoKhako4AWVEcUlg3aWwDupAHb2YwmIkPP1ERSVA7WmZ8tq8HT14oZW%2BYuLsMl3wQT10ROksENUc8Z3MJSGVLh4dqpJ%2BXr7U51awUgHM4v6ad1MkPuJZAiowVd3IEhnZH0aoYrI05p5sDtYwkzZ8EPViYxsRel5USbHAIgmwIM0gQamzU4uF2malQi4oWQFQ1zaYrp4UXlYwfiHoyxqFE1q4qeX4yn5JIxKkdrX1b1rAbWGvd5Oh91sRijpomsJEVc3Ukc34dqIcwuJVKwZIXkoQZcXlNv5g%2BqZUZvpNl2rPG9N0WkIoNqouW4sVPwp%2BM0b6h0ssfq4d%2F1r8hpo%2Fh9e4AamUjnI9avaBixqgklYWSwL4xtItUxplYl5qZ58mq78wMgnYXfnlOmJaR1L%2Bj78ny9fS%2FrXQPAAAAFXRSTlP7Brvx%2FsJhAgD87r4U72C4uGH8vhRDodYHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC6UlEQVQokS2Sd3BUVRSHb0KS3QRCiZw5t%2By9j33zXjZkyUs2uekhEAi9dwRCL4JUEQRFAQUs9A4WOopKU0GpFoqCBZUivaqoFKkWLIS5GX7%2FfnPO78yZj%2Fj8UTViK6HggvNgSGuluEZRKbZqlN9H%2FFWiWUzIFQK5fhjOIRTDoqv4ia86S4q3KSByHdSqIhxofBKr5iNxLMm2bQqWVkorJ%2BAkO46nkQJhceSRmCTDvKJIJBLJzMxMLU6POJ4eBPF1KpNEbdt2Cms4LCcnZ%2FX6D3d%2BsKJJ7VSlNLoqgbjUtmkKKxlVmpf3bsFXW3d1b77gueJAQIPQBCilkMKemNi23Ts9T35%2FaMe2rsvmTypylGUFCSIYWJLXrm2nUwOPfNO5w%2B73Okxnjqe0JigQEL3JizoeONr%2F2u99vju4fd1rdZnyspQmnGvAUBprWNqz348%2FhXN%2F6P1%2By4Uvs%2FJkpRQRwpJBRVn7vf16Dfitz5XevQqWt3yalXtKaRIUQmglWfsu5y7%2BMrDs0TMftWo1ZVy64xioOVpcIdt8%2Fvqvf9%2F859KJsrLmrzA%2BOKC0IkFEtJza7JOfr%2FYd0P9G98tdOxe0Hp9qJrOIBgDuOeEtp%2F%2B4d%2FvWX%2F%2F9u%2B%2FtlaUTmOWZg7SQEEyuFe52%2BML9O3cZO%2F5xl06zn2VcadOJUqJTzt7a82XfP7sx9vmGNm1m1MstV4IHCVAAoTLqL1372ddn%2Fz%2B2v%2FWq12c1fSpsaeQWAZAANntxzuI3e3zbo8XGpm%2FMnNqiXrh%2BljaPd6UUabkjps19tdGnX2zKb9b4pTFDCzOMLmYtpW5h%2BpCRTeYtyV%2BT36zx808OL4xYGoFrkqDTbJpSXLdRgwbPZL%2BQnT129OOPFVEEsAMJpHKdeKMJgJSAiALdjJANQKnRJI4R6boAKEwLCiGoBBegQjBftQo1KQWOlplFKSV9qGaF1NpAE7QQESTlMSy6pp%2F4%2FFFVYxMNRBTaiM0tkImxNaL8vgfDR8gvoYRaxgAAAABJRU5ErkJggg%3D%3D" alt="bunlongheng.com"></a>
<a href="https://www.linkedin.com/in/bunlongheng/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
<a href="https://www.instagram.com/ibunlong/"><img src="https://img.shields.io/badge/Instagram-C13584?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
<a href="mailto:bheng.code@gmail.com"><img src="https://img.shields.io/badge/Email-2E7D32?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"></a>

<br>

Built by **[Bunlong](https://bunlongheng.com)** &nbsp;&middot;&nbsp; [more apps](https://bunlongheng.com/projects)

</div>
