# PLATIVEZDE — Glass coin loader

Local Three.js animation: glass coin, ₽ / $ faces, theme-dependent liquid and a seamless 12-second fill/drain cycle. One revolution takes 6 seconds. Controls: pause, speed, theme, restart. Reduced-motion preference starts paused.

## Run

npm install
npm run dev

## Build

npm run build
npm run preview

This is a visual prototype, not a fluid simulation. The liquid geometry stays inside the circular coin cavity; the surface has two small waves. The canvas background is transparent. No account data, API keys or external assets are needed at runtime.

Design reference: PLATIVEZDE Figma, file qhOgTR3Z8vwlO90JR34Fus. Reviewed the populated pages: KYC, History, email/password changes, 3DS, SBP/crypto top-up, card details/issuance, subscriptions, banners, animations and cover. Direction: neutral light/dark surfaces, blue action accents, rounded glass objects and restrained highlights.

Success and cancel animations are subsequent work.

Liquid palette is locked to the theme: light #1473E6 (Figma CTA 3:44346), dark #579CFF (Figma CTA 100:12632). No custom colour control.

Screen backgrounds match Figma: light #FFFFFF (3:44315), dark #131313 (96:11525). The canvas and page use solid backgrounds without gradients.
