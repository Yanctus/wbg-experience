#!/usr/bin/env node
/**
 * Prüft PNG-Dateien darauf, ob sie echte Transparenz besitzen oder ob ein
 * Transparenz-Schachbrett fest in die RGB-Pixel eingebrannt ist.
 *
 * Arbeitet ohne externe Abhängigkeiten: PNG-Chunks werden direkt geparst und
 * die IDAT-Daten mit dem eingebauten zlib entpackt und entfiltert.
 *
 *   node scripts/check-png-alpha.mjs [verzeichnis-oder-datei ...]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { inflateSync } from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Anzahl Kanäle pro PNG-Farbtyp. */
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

const COLOR_TYPE_NAMES = {
  0: 'Graustufen',
  2: 'RGB',
  3: 'Palette',
  4: 'Graustufen + Alpha',
  6: 'RGB + Alpha',
}

/** Zerlegt eine PNG-Datei in ihre Chunks. */
function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Keine gültige PNG-Signatur')
  }
  const chunks = []
  let offset = 8
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    chunks.push({ type, data: buffer.subarray(offset + 8, offset + 8 + length) })
    offset += 12 + length
    if (type === 'IEND') break
  }
  return chunks
}

function parseIHDR(data) {
  return {
    width: data.readUInt32BE(0),
    height: data.readUInt32BE(4),
    bitDepth: data[8],
    colorType: data[9],
    interlace: data[12],
  }
}

function paethPredictor(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

/** Entfiltert die entpackten IDAT-Daten zu rohen Samples. */
function unfilter(raw, { width, height, bitDepth, colorType }) {
  const channels = CHANNELS[colorType]
  const bitsPerPixel = channels * bitDepth
  const bytesPerPixel = Math.max(1, bitsPerPixel >> 3)
  const bytesPerRow = Math.ceil((width * bitsPerPixel) / 8)
  const out = Buffer.alloc(height * bytesPerRow)

  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    const rowStart = y * bytesPerRow
    const prevStart = rowStart - bytesPerRow
    for (let x = 0; x < bytesPerRow; x++) {
      const value = raw[pos + x]
      const left = x >= bytesPerPixel ? out[rowStart + x - bytesPerPixel] : 0
      const up = y > 0 ? out[prevStart + x] : 0
      const upLeft = y > 0 && x >= bytesPerPixel ? out[prevStart + x - bytesPerPixel] : 0
      let restored
      switch (filter) {
        case 0: restored = value; break
        case 1: restored = value + left; break
        case 2: restored = value + up; break
        case 3: restored = value + ((left + up) >> 1); break
        case 4: restored = value + paethPredictor(left, up, upLeft); break
        default: throw new Error(`Unbekannter Filtertyp ${filter} in Zeile ${y}`)
      }
      out[rowStart + x] = restored & 0xff
    }
    pos += bytesPerRow
  }
  return { pixels: out, bytesPerRow, bytesPerPixel, channels }
}

/** Statistik über den Alphakanal, falls vorhanden. */
function analyseAlpha(decoded, header) {
  const { pixels, bytesPerRow, bytesPerPixel, channels } = decoded
  const step = header.bitDepth === 16 ? 2 : 1
  const alphaOffset = (channels - 1) * step
  let min = 255
  let max = 0
  let transparent = 0
  let partial = 0
  let total = 0

  for (let y = 0; y < header.height; y++) {
    for (let x = 0; x < header.width; x++) {
      const a = pixels[y * bytesPerRow + x * bytesPerPixel + alphaOffset]
      if (a < min) min = a
      if (a > max) max = a
      if (a === 0) transparent++
      else if (a < 255) partial++
      total++
    }
  }
  return {
    min,
    max,
    fullyTransparentRatio: transparent / total,
    partialRatio: partial / total,
    isFlat: min === 255,
  }
}

/**
 * Sucht ein eingebranntes Schachbrettmuster in den RGB-Werten.
 *
 * Für jede Kachelgröße werden die Helligkeiten der beiden Schachbrett-Paritäten
 * getrennt gemittelt. Ein echtes eingebranntes Muster erzeugt bei genau einer
 * Kachelgröße einen deutlichen Ausschlag, während normaler Bildinhalt über alle
 * Kachelgrößen hinweg gleichmäßig kleine Werte liefert.
 */
function detectCheckerboard(decoded, header) {
  const { pixels, bytesPerRow, bytesPerPixel } = decoded
  const step = header.bitDepth === 16 ? 2 : 1
  const luma = new Float64Array(header.width * header.height)

  for (let y = 0; y < header.height; y++) {
    for (let x = 0; x < header.width; x++) {
      const i = y * bytesPerRow + x * bytesPerPixel
      const r = pixels[i]
      const g = bytesPerPixel > step ? pixels[i + step] : r
      const b = bytesPerPixel > 2 * step ? pixels[i + 2 * step] : r
      luma[y * header.width + x] = 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
  }

  const deltas = []
  let best = { tile: 0, delta: 0 }
  for (let tile = 4; tile <= 64; tile++) {
    let sumA = 0
    let sumB = 0
    let countA = 0
    let countB = 0
    for (let y = 0; y < header.height; y++) {
      const ty = Math.floor(y / tile)
      for (let x = 0; x < header.width; x++) {
        const v = luma[y * header.width + x]
        if ((ty + Math.floor(x / tile)) % 2 === 0) {
          sumA += v
          countA++
        } else {
          sumB += v
          countB++
        }
      }
    }
    if (!countA || !countB) continue
    const delta = Math.abs(sumA / countA - sumB / countB)
    deltas.push(delta)
    if (delta > best.delta) best = { tile, delta }
  }

  // Maximum gegen Median: macht den Test unabhängig von absoluten Schwellen.
  const sorted = [...deltas].sort((a, b) => a - b)
  const median = sorted[sorted.length >> 1] || 1e-6
  return { ...best, median, ratio: best.delta / median }
}

function analyseFile(file) {
  const chunks = readChunks(readFileSync(file))
  const ihdr = chunks.find((c) => c.type === 'IHDR')
  if (!ihdr) throw new Error('IHDR-Chunk fehlt')
  const header = parseIHDR(ihdr.data)

  const hasAlphaChannel = header.colorType === 4 || header.colorType === 6
  const result = {
    file,
    ...header,
    colorTypeName: COLOR_TYPE_NAMES[header.colorType] ?? `unbekannt (${header.colorType})`,
    hasAlphaChannel,
    hasTRNS: chunks.some((c) => c.type === 'tRNS'),
    alpha: null,
    checkerboard: null,
  }

  if (header.interlace !== 0 || header.colorType === 3) {
    result.note = 'Pixelanalyse übersprungen (interlaced oder Palette)'
    return result
  }

  const raw = inflateSync(
    Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)),
  )
  const decoded = unfilter(raw, header)

  if (hasAlphaChannel) result.alpha = analyseAlpha(decoded, header)
  result.checkerboard = detectCheckerboard(decoded, header)
  return result
}

/** Bewertet das Ergebnis: ok | warn | fail. */
function verdict(r) {
  const cb = r.checkerboard
  if (cb && cb.delta >= 0.25 && cb.ratio >= 4) {
    return {
      level: 'fail',
      text: `Schachbrett eingebrannt (Kachel ~${cb.tile}px, Δ${cb.delta.toFixed(2)}, ${cb.ratio.toFixed(1)}× Median)`,
    }
  }
  if (!r.hasAlphaChannel && !r.hasTRNS) {
    return { level: 'warn', text: 'kein Alphakanal — voll deckend' }
  }
  if (r.alpha?.isFlat) {
    return { level: 'warn', text: 'Alphakanal vorhanden, aber komplett opak' }
  }
  return {
    level: 'ok',
    text: `echte Transparenz (${(r.alpha.fullyTransparentRatio * 100).toFixed(1)}% transparent)`,
  }
}

function collectPngs(target) {
  if (statSync(target).isFile()) return [target]
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const full = join(target, entry.name)
    if (entry.isDirectory()) return collectPngs(full)
    return entry.name.toLowerCase().endsWith('.png') ? [full] : []
  })
}

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['public/assets']
const files = roots.flatMap((t) => collectPngs(resolve(t))).sort()

const ICONS = { ok: '✅', warn: '⚠️ ', fail: '❌' }
let failures = 0

console.log(`\nPNG-Transparenzprüfung — ${files.length} Datei(en)\n`)

for (const file of files) {
  const name = relative(process.cwd(), file)
  try {
    const r = analyseFile(file)
    const v = verdict(r)
    if (v.level === 'fail') failures++
    console.log(`${ICONS[v.level]} ${name}`)
    console.log(`   ${r.width}×${r.height}, ${r.bitDepth}-bit ${r.colorTypeName}`)
    console.log(`   Alphakanal: ${r.hasAlphaChannel ? 'ja' : 'nein'}${r.hasTRNS ? ' (tRNS)' : ''}`)
    if (r.alpha) {
      console.log(
        `   Alpha min/max: ${r.alpha.min}/${r.alpha.max}, ` +
          `teiltransparent: ${(r.alpha.partialRatio * 100).toFixed(1)}%`,
      )
    }
    if (r.checkerboard) {
      console.log(
        `   Schachbrett-Test: Kachel ${r.checkerboard.tile}px, ` +
          `Δ-Luma ${r.checkerboard.delta.toFixed(2)}, ` +
          `Median ${r.checkerboard.median.toFixed(3)} (${r.checkerboard.ratio.toFixed(1)}×)`,
      )
    }
    if (r.note) console.log(`   Hinweis: ${r.note}`)
    console.log(`   → ${v.text}\n`)
  } catch (error) {
    failures++
    console.log(`❌ ${name}\n   Fehler: ${error.message}\n`)
  }
}

console.log(
  failures
    ? `${failures} von ${files.length} Datei(en) sind problematisch.\n`
    : `Alle ${files.length} Datei(en) unauffällig.\n`,
)
process.exitCode = failures ? 1 : 0
