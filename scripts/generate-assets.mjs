import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

await mkdir('assets/gts', { recursive: true })
await mkdir('store-assets', { recursive: true })

const svg = `
<svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="200" height="200" rx="58" fill="#74E6A7"/>
  <g fill="#000000">
    <rect x="48" y="104" width="144" height="32" rx="12"/>
    <rect x="34" y="82" width="30" height="76" rx="12"/>
    <rect x="176" y="82" width="30" height="76" rx="12"/>
    <rect x="66" y="92" width="22" height="56" rx="9"/>
    <rect x="152" y="92" width="22" height="56" rx="9"/>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile('assets/gts/icon.png')
await sharp(Buffer.from(svg)).png().toFile('store-assets/icon-240.png')
