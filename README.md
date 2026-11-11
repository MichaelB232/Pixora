# PIXORA — Interactive Digital Image Processing & Vision Studio

> **Platform:** Next.js (App Router), Tailwind CSS, TypeScript\
> **Backend:** Monolith Architecture (Services, Controllers, Routes) with SQLite & Prisma ORM\
> **Processing Engine:** Client-Side Browser HTML5 Canvas & TypedArrays (Session-Local, Zero-Latency, Privacy-First)

---

## 1. Project Overview & Product Direction

**PIXORA** transforms digital image processing into a warm, inviting atelier inspired by editorial art publications and physical paper studios:
- **Warm Paper Surfaces:** Natural ivory paper backgrounds (`#FAF7F2`), warm beige borders (`#EAE2D6`), and soft peach callout cards.
- **Terracotta Action Hierarchy:** Calming terracotta (`#B8533C`) primary buttons, handles, and indicators replace harsh primary colors.
- **Floral & Organic Subjects:** Default floral imagery (`cosmos.jpg`) and document samples to encourage gentle exploration.
- **Reassuring Microcopy:** Empathetic language ("A little curiosity. A whole new possibility.", "Let your photo bloom.", "Room to try. Room to change your mind.") prevents fear of mistakes.
- **Fully Responsive:** Seamlessly adapted for 4K desktop, laptop, tablet, and mobile smartphones (with fluid typography and collapsible drawer navigation).

---

## 2. Five Core PRD Modules & Destinations

### Module 1: Image Editor Studio (`/studio/editor`)
- **Basic:** Brightness (-100 to +100), Contrast (-100 to +100), Gamma Correction (0.2 to 2.5), Global Binary Thresholding, Adaptive Mean Thresholding.
- **Enhance:** Histogram Equalization, CLAHE (Contrast-Limited Adaptive Histogram Equalization).
- **Color:** Grayscale conversion, Negative (Intensity Inversion), Sepia transformation matrix, HSV Saturation & Hue Shift, RGB channel separation.
- **Interactive UI:** Split-view comparison slider with draggable handle, real-time live preview toggle, step-by-step history bar, reset controls.

### Module 2: Photo Restoration (`/studio/restoration`)
- Gaussian Smoothing, Salt & Pepper noise removal (Median Filter), Bilateral edge-preserving filtering, Laplacian sharpening, Unsharp Masking, Motion Deblur (directional deconvolution), Scratch Reduction & Inpainting.

### Module 3: Creative Lab (`/studio/creative`)
- Pencil Sketch (Color Dodge blend of inverted blurred grayscale), Cartoon Effect (Bilateral filter + Laplacian edge overlay), Emboss relief, Pixel Art (downsampling + color quantization), Halftone screening, Terracotta Duotone, Radial Vignette, Motion Streaks, Chromatic Glitch, Posterization.

### Module 4: Computer Vision Lab (`/studio/vision`)
- **Edge Detection:** Sobel Operator, Prewitt Operator, Laplacian Operator, Canny Edge Detection (Gaussian blur → Sobel gradient & angles → Non-max suppression → Hysteresis).
- **Morphological Operations:** Erosion, Dilation, Opening, Closing.
- **Segmentation & Contours:** Contour extraction & highlighting, Watershed catchment region map preview, HSV Color Segmentation.

### Module 5: Document Scanner (`/studio/scanner`)
- Document corner detection, Bilinear quadrilateral perspective warp straightening, Document Binarization (adaptive thresholding for sharp text), Document Clean Enhancement (Color Enhanced, Clean Grayscale, Sharp Black & White).

### Supporting Destinations:
- **Image Analysis (`/studio/analysis`):** 256-bin real-time histogram calculation (RGB & Luminance), pixel intensity statistical metrics (Mean, Standard Deviation, Min, Max, Median), technical specifications (dimensions, megapixels, aspect ratio).
- **Session History (`/studio/history`):** Complete non-destructive session timeline, one-click time travel jump, undo, redo, and revert to original.
- **Export Center (`/studio/export`):** Formats (PNG Lossless, JPG with quality slider, WebP), editable file name, download button, and Academic Processing Audit Report generation (`.json`).
- **Processing Pipeline (`/studio/pipeline`):** Sequential execution chain (e.g. Grayscale → Gaussian Blur → Canny Edge Detection).

---

## 3. Monolith Backend Architecture

Built with TypeScript and structured into clean, strictly decoupled tiers with **Zod** schema validation:

```
src/
├── server/
│   ├── db.ts                      # Prisma client singleton (SQLite connection)
│   ├── schemas/                   # Validation & DTO Schema Layer (Zod)
│   │   ├── project.schema.ts      # Project input schemas & inferred types
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

---

## 4. Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm or yarn

### Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize SQLite database & Prisma client:
   ```bash
   npx prisma db push
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Design Documentation

Detailed visual rationale, design tokens, color hierarchy, component guidelines, and interaction principles are documented in [design.md](design.md) at the project root.
