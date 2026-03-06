import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const watch = process.argv.includes('--watch')

const srcDir = resolve(__dirname, 'src')
const distDir = resolve(__dirname, 'dist')

// Ensure dist directories exist
mkdirSync(resolve(distDir, 'icons'), { recursive: true })

// Generate minimal placeholder PNG icons if they don't exist
function generatePlaceholderPNG(size) {
  // Minimal valid PNG: IHDR + single-color IDAT + IEND
  // This creates a blue (#2563eb) square
  const { createPNG } = buildMinimalPNG(size)
  return createPNG
}

function buildMinimalPNG(size) {
  // Build a minimal valid PNG file
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // CRC32 table
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[n] = c
  }

  function crc32(buf) {
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function makeChunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const crcData = Buffer.concat([typeBytes, data])
    const crcVal = Buffer.alloc(4)
    crcVal.writeUInt32BE(crc32(crcData))
    return Buffer.concat([length, typeBytes, data, crcVal])
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)  // width
  ihdr.writeUInt32BE(size, 4)  // height
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type (RGB)
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Raw image data: filter byte + RGB pixels per row
  const rawData = []
  // Blue color: #2563eb
  const r = 0x25, g = 0x63, b = 0xeb
  for (let y = 0; y < size; y++) {
    rawData.push(0) // filter: none
    for (let x = 0; x < size; x++) {
      rawData.push(r, g, b)
    }
  }

  // Compress with deflate (use zlib-compatible raw deflate)
  // Simple: store blocks (no compression)
  const rawBuf = Buffer.from(rawData)

  // zlib header: CMF=0x78, FLG=0x01
  const zlibParts = [Buffer.from([0x78, 0x01])]

  // Split into store blocks of max 65535 bytes
  let offset = 0
  while (offset < rawBuf.length) {
    const remaining = rawBuf.length - offset
    const blockSize = Math.min(remaining, 65535)
    const isLast = (offset + blockSize) >= rawBuf.length

    const header = Buffer.alloc(5)
    header[0] = isLast ? 0x01 : 0x00
    header.writeUInt16LE(blockSize, 1)
    header.writeUInt16LE(blockSize ^ 0xffff, 3)
    zlibParts.push(header)
    zlibParts.push(rawBuf.subarray(offset, offset + blockSize))
    offset += blockSize
  }

  // Adler-32 checksum
  let a = 1, bv = 0
  for (let i = 0; i < rawBuf.length; i++) {
    a = (a + rawBuf[i]) % 65521
    bv = (bv + a) % 65521
  }
  const adler = Buffer.alloc(4)
  adler.writeUInt32BE((bv << 16) | a)
  zlibParts.push(adler)

  const compressedData = Buffer.concat(zlibParts)

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressedData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return {
    createPNG: Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
  }
}

// Generate icons
for (const size of [16, 48, 128]) {
  const iconPath = resolve(__dirname, 'icons', `icon${size}.png`)
  if (!existsSync(iconPath)) {
    const png = generatePlaceholderPNG(size)
    writeFileSync(iconPath, png)
    console.log(`Generated placeholder icon: icon${size}.png`)
  }
}

// Copy static files to dist
function copyStatic() {
  copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'))
  copyFileSync(resolve(srcDir, 'popup', 'index.html'), resolve(distDir, 'popup.html'))
  copyFileSync(resolve(srcDir, 'popup', 'style.css'), resolve(distDir, 'popup.css'))
  copyFileSync(resolve(srcDir, 'detail', 'index.html'), resolve(distDir, 'detail.html'))
  copyFileSync(resolve(srcDir, 'detail', 'style.css'), resolve(distDir, 'detail.css'))
  for (const size of [16, 48, 128]) {
    copyFileSync(
      resolve(__dirname, 'icons', `icon${size}.png`),
      resolve(distDir, 'icons', `icon${size}.png`)
    )
  }
  console.log('Static files copied to dist/')
}

// esbuild config
const buildOptions = {
  bundle: true,
  sourcemap: watch,
  minify: !watch,
  target: 'chrome120',
  logLevel: 'info',
}

async function build() {
  // Content script (IIFE - no ES modules in content scripts)
  await esbuild.build({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'content', 'index.ts')],
    outfile: resolve(distDir, 'content.js'),
    format: 'iife',
  })

  // Background service worker (ESM)
  await esbuild.build({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'background', 'index.ts')],
    outfile: resolve(distDir, 'background.js'),
    format: 'esm',
  })

  // Popup (IIFE)
  await esbuild.build({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'popup', 'main.ts')],
    outfile: resolve(distDir, 'popup.js'),
    format: 'iife',
  })

  // Detail page (IIFE)
  await esbuild.build({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'detail', 'main.ts')],
    outfile: resolve(distDir, 'detail.js'),
    format: 'iife',
  })

  copyStatic()
  console.log('Build complete!')
}

async function watchBuild() {
  // Content script
  const ctxContent = await esbuild.context({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'content', 'index.ts')],
    outfile: resolve(distDir, 'content.js'),
    format: 'iife',
  })

  // Background
  const ctxBg = await esbuild.context({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'background', 'index.ts')],
    outfile: resolve(distDir, 'background.js'),
    format: 'esm',
  })

  // Popup
  const ctxPopup = await esbuild.context({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'popup', 'main.ts')],
    outfile: resolve(distDir, 'popup.js'),
    format: 'iife',
  })

  // Detail
  const ctxDetail = await esbuild.context({
    ...buildOptions,
    entryPoints: [resolve(srcDir, 'detail', 'main.ts')],
    outfile: resolve(distDir, 'detail.js'),
    format: 'iife',
  })

  await Promise.all([
    ctxContent.watch(),
    ctxBg.watch(),
    ctxPopup.watch(),
    ctxDetail.watch(),
  ])

  copyStatic()
  console.log('Watching for changes...')
}

if (watch) {
  watchBuild()
} else {
  build()
}
