# Wedding Journey

Landing page điện ảnh cho thiệp cưới — hành trình bản đồ 3D từ Košice đến Vinh, gặp nhau tại Hà Tĩnh.

## Tech Stack

- React 18 + TypeScript
- Vite
- Three.js + @react-three/fiber + @react-three/drei
- GSAP (animation timeline)
- Framer Motion (UI animations)

## Chạy project

```bash
cd /Users/aidenpham/Downloads/intro
npm install
npm run dev
```

## Tùy chỉnh

### Thời gian animation

Chỉnh trong `src/components/WeddingJourney.tsx`:

```typescript
const DUR = {
  INTRO: 1.5,   // Thời gian intro
  SCENE1: 5.0,  // Košice
  SCENE2: 5.0,  // Vinh
  SCENE3: 6.0,  // Hà Tĩnh + finale
}
```

### Màu sắc

Chỉnh trong `src/styles/globals.css`:

```css
:root {
  --ivory: #F8F0E3;
  --champagne-gold: #D7AE6A;
  --ruby-red: #A80F2D;
  --deep-ocean: #193A49;
  --muted-sage: #68765C;
  --blush-pink: #E9C4BE;
}
```

### Link nút mở thiệp cưới

Chỉnh trong `src/components/WeddingFinale.tsx`:

```typescript
<OpenInvitationButton href="https://locnt1.my.canva.site/tungvahang" />
```

### Tọa độ thành phố

Chỉnh trong `src/components/WeddingJourney.tsx`:

```typescript
const KOSICE_POS = latLonToWorld(48.7164, 21.2611)
const VINH_POS = latLonToWorld(18.6796, 105.6813)
const HATINH_POS = latLonToWorld(18.3428, 105.9057)
```

## Cấu trúc file

```
src/
├── components/
│   ├── WeddingJourney.tsx      # Timeline orchestrator (GSAP)
│   ├── MapScene.tsx             # 3D terrain + water + lighting
│   ├── HeartPin.tsx             # Ruby heart marker
│   ├── GoldenFlightTrail.tsx    # Golden light trail
│   ├── MeetingParticles.tsx     # Particles at meeting point
│   ├── LocationLabel.tsx        # City name labels
│   ├── WeddingFinale.tsx        # Finale date + CTA
│   ├── OpenInvitationButton.tsx # Glassmorphism CTA button
│   ├── AudioController.tsx      # SoundCloud embed
│   └── LoadingScreen.tsx       # Loading overlay
├── styles/globals.css           # CSS variables + base styles
├── App.tsx + App.css
└── main.tsx
```

## Responsive

- Mobile-first, tối ưu cho 9:16
- Tested: 390×844, 430×932, 768×1024, 1440×900
- DPR capped ở 1.5 cho mobile performance
- `prefers-reduced-motion` supported
