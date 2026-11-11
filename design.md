# PIXORA Design System & Architecture Specification

## 1. Product Direction & Philosophy

**PIXORA** is a friendly, browser-based digital image processing and computer vision studio. Digital image processing education often presents algorithms through sterile technical dashboards or CLI scripts. PIXORA reimagines image manipulation as an inviting atelier:

- **Warm Paper Surfaces:** Moving away from cold dark mode terminal screens to tactile, organic surfaces reminiscent of art paper, handmade stationery, and sunlit creative studios.
- **Soft Terracotta Actions:** Terracotta clay accents replace harsh neon primary colors, giving actions an intentional, grounded warmth.
- **Floral & Organic Imagery:** Calming subjects (e.g. cosmos flowers, botanical arrangements, textured documents) foster exploratory, non-intimidating interaction.
- **Gentle Editorial Typography:** High-contrast serif headlines paired with legible geometric humanist body type lend an editorial, reassuring aesthetic.
- **Reassuring Microcopy:** Empathetic language ("A little curiosity. A whole new possibility.", "Let your photo bloom.", "Room to try. Room to change your mind.") reduces fear of making mistakes.

---

## 2. Color Palette & Design Tokens

| Token Name | Hex Code | Purpose & Context |
| :--- | :--- | :--- |
| `paper.DEFAULT` | `#FAF7F2` | Primary canvas and page background (warm handmade paper) |
| `paper.surface` | `#FBF9F6` | Secondary panel surfaces and inner containers |
| `paper.muted` | `#F5EFEB` | Sidebar background and inactive item backgrounds |
| `paper.hero` | `#F6EEE3` | Hero banners and celebratory callouts |
| `border.warm` | `#EAE2D6` | Standard structural borders, divider lines, and card strokes |
| `border.subtle` | `#F0EAE1` | Secondary internal card dividers |
| `terracotta.DEFAULT` | `#B8533C` | Primary interactive buttons, drag handles, active states |
| `terracotta.hover` | `#A1422E` | Hover state for primary buttons |
| `terracotta.tint` | `#FAF1EE` | Active pill badges, selected navigation tabs, callout backgrounds |
| `terracotta.border` | `#EEC7BC` | Borders on active terracotta elements |
| `sage.DEFAULT` | `#E8EFEA` | Guidance cards, tips, successful operations, non-destructive badges |
| `sage.text` | `#36533E` | Text inside sage guidance banners |
| `sage.border` | `#D0E2D4` | Stroke border for sage cards |
| `ink.900` | `#2D2623` | High-contrast editorial titles and primary headings |
| `ink.700` | `#5D544F` | Body text, explanations, and readable descriptions |
| `ink.500` | `#7A706A` | Subtitles, labels, and secondary UI metadata |
| `ink.400` | `#9E948D` | Inactive icons, breadcrumb separators, borders |

---

## 3. Typography Hierarchy & Microcopy

### 3.1 Font Families
- **Headings & Editorial Display:** `Newsreader`, `Playfair Display`, `Georgia`, `serif`
  - High elegance, warmth, human craftsmanship.
  - Used for page titles, hero headers, card titles, and reassurance banners.
- **Interface & Technical Data:** `Plus Jakarta Sans`, `Inter`, `system-ui`, `sans-serif`
  - Crisp readability for sliders, dimensions, numerical metrics, buttons, and navigation.

### 3.2 Type Scale
- **Hero Title:** `text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight`
- **Page Title:** `text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2D2623]`
- **Section Heading:** `text-lg sm:text-xl font-serif font-bold`
- **Module Card Title:** `text-base font-serif font-bold`
- **Body & Explanations:** `text-xs sm:text-sm text-[#7A706A] leading-relaxed`
- **Data / Badge Labels:** `text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase`

---

## 4. Component Library & Visual Guidelines

### 4.1 Before / After Split Comparison
- Interactive draggable dividing line with circular handle `⟷`.
- Left layer contains the original unmutated image (`ImageData`), clipped by percentage.
- Right layer contains the processed/live preview image.
- Pill badges ("Original", "Your edit") float at top corners with `backdrop-blur-xs`.
- Touch and mouse listeners provide smooth 60fps horizontal sliding across all screen widths.

### 4.2 Adjustment Panel
- Categorized into clear tabs (e.g. `Basic` | `Enhance` | `Color`).
- Features a **Descriptive Callout Card** with friendly, non-technical explanations of what the algorithm actually does to the pixels.
- Sliders feature a terracotta accented track, custom thumb with elevation, and pill badge indicator.
- Live preview toggle switch (`Preview is on`) allows instant optimistic preview before committing.

### 4.3 Steps & Session History Bar
- Displays horizontal scrollable pills representing each applied operation (e.g. `01 Original image`, `02 Brightness +20`).
- Clicking any previous step allows users to non-destructively inspect or jump back in time.
- Dashed preview pill communicates pending uncommitted changes.

### 4.4 Reassurance Banners
- Placed near critical decision points (below editing viewport and export options).
- Reinforces user confidence: "Your original is kept for this session. Compare anytime, or undo to take a step back."

---

## 5. Mobile & Responsive Design Principles

Mobile ergonomics ("agar di hp tetap terasa nyaman jangan terlalu nabrak fontnya"):
- **Fluid Typography:** Headings scale down smoothly (`text-2xl` on mobile vs `text-4xl` on desktop) preventing ugly text wrapping.
- **Collapsible Drawer Navigation:** On mobile screens (`< 768px`), the navigation sidebar tucks into a backdrop drawer accessible via a comfortable hamburger button.
- **Stacked Layout:** Dual-column desktop layouts stack gracefully with the image viewer on top and adjustment controls directly below.
- **Touch-Friendly Controls:** Sliders, buttons, and handles maintain at least 44×44px touch-accessible target areas.

---

## 6. Technical Monolith Architecture

### 6.1 Browser Session-Local Processing
All image manipulation algorithms run directly in the client's browser utilizing HTML5 Canvas and typed arrays (`Uint8ClampedArray`):
- **Zero latency:** Instantaneous slider adjustments and real-time previews.
- **Privacy:** Images are never sent to external third parties.
- **PRD Algorithms:** Includes all 5 core modules:
  1. **Image Editor Studio:** Brightness, Contrast, Gamma, Grayscale, Negative, Sepia, Thresholding, CLAHE, Histogram Equalization, RGB separation, HSV transformation.
  2. **Photo Restoration:** Gaussian Blur, Median Filtering, Bilateral edge-preserving, Sharpening, Unsharp Mask, Motion Deblur, Scratch Reduction/Inpaint.
  3. **Creative Lab:** Pencil Sketch, Cartoon Effect, Emboss, Pixel Art, Halftone, Duotone, Vignette, Motion Blur, Glitch, Posterization.
  4. **Computer Vision Lab:** Sobel, Prewitt, Laplacian, Canny Edge Detection, Morphology (Erosion, Dilation, Opening, Closing), Contours, Watershed, Color Segmentation.
  5. **Document Scanner:** Quad Corner Detection, Bilinear Perspective Warp Straightener, Document Binarization, Contrast Enhancement.

### 6.2 Monolith Backend Architecture (TypeScript + Zod + SQLite + Prisma)
```
src/
├── server/
│   ├── db.ts                      # Prisma client singleton (SQLite connection)
│   ├── schemas/                   # Zod Validation & DTO Schema Layer
│   │   ├── project.schema.ts      # Project input schemas & infer types
│   │   ├── history.schema.ts      # Session history step schemas
│   │   ├── preset.schema.ts       # Algorithm preset schemas
│   │   ├── export.schema.ts       # Export logging & report schemas
│   │   └── index.ts               # Barrel export
│   ├── services/                  # Business Logic Layer (Prisma queries & data operations)
│   │   ├── project.service.ts     # Project CRUD operations
│   │   ├── history.service.ts     # Audit steps logging and retrieval
│   │   ├── preset.service.ts      # Algorithm parameter preset management
│   │   └── export.service.ts      # Export audit logging & report generator
│   └── controllers/               # Controller Layer (Zod validation & HTTP orchestration)
│       ├── project.controller.ts
│       ├── history.controller.ts
│       ├── preset.controller.ts
│       └── export.controller.ts
└── app/api/                       # Route Handlers (ROUTES)
    ├── projects/route.ts          # GET /api/projects, POST /api/projects
    ├── projects/[id]/route.ts     # GET, PATCH, DELETE /api/projects/[id]
    ├── history/route.ts           # GET, POST, DELETE /api/history
    ├── presets/route.ts           # GET, POST /api/presets
    ├── presets/[id]/route.ts      # DELETE /api/presets/[id]
    ├── export-log/route.ts        # GET, POST /api/export-log
    └── report/route.ts            # POST /api/report
```
