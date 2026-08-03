/**
 * The scroll-scrubbed walkthrough: one continuous film, four chapters,
 * driven entirely by scroll position while the section is pinned.
 *
 * The video is encoded all-intra (a keyframe on every frame), so seeking to
 * arbitrary timestamps is cheap; a small lerp on top removes the residual
 * stepping between scroll events. Around the frame, three depth layers move
 * at different rates against a perspective stage — sky behind, foliage in
 * front — so the scroll reads as moving *through* the estate, not past it.
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { resolveImage, resolveVideo, ASSETS } from './assets'

const CHAPTERS = 4
const SCROLL_LENGTH = 4200 // px of scroll the pinned film consumes

export async function initFilm(reducedMotion: boolean): Promise<void> {
  const section = document.querySelector<HTMLElement>('.film')
  if (!section) return

  const video = section.querySelector<HTMLVideoElement>('.film__video')!
  const frame = section.querySelector<HTMLElement>('.film__frame')!

  // Swap the blurred placeholder for the film's real first frame as soon as
  // one loads — sharp, because it is exactly what the video will show.
  if (ASSETS.walkthroughPoster.remote) {
    resolveImage('walkthroughPoster').then((url) => {
      const probe = new Image()
      probe.onload = () => {
        const poster = section.querySelector<HTMLImageElement>('.film__poster')!
        poster.src = url
        poster.classList.add('film__poster--sharp')
      }
      probe.src = url
    })
  }
  const sky = section.querySelector<HTMLElement>('.film__layer--sky')!
  const foliage = section.querySelector<HTMLElement>('.film__layer--fg')!
  const railFill = section.querySelector<HTMLElement>('.film__railfill')!
  const railItems = [...section.querySelectorAll<HTMLElement>('.film__rail li')]
  const titles = [...section.querySelectorAll<HTMLElement>('.film__chaptertitle')]

  // Reduced motion: no pin, no scrub — the poster, the chapter names and a
  // playable (user-initiated) video are the whole story.
  if (reducedMotion) {
    section.classList.add('film--static')
    railItems.forEach((li) => li.classList.add('is-active'))
    const src = await videoSource()
    if (src) {
      video.src = src
      video.controls = true
      video.classList.add('film--ready')
    }
    return
  }

  // ---- video wiring -------------------------------------------------------
  let duration = 0
  let videoReady = false

  const src = await videoSource()
  if (src) {
    video.src = src
    video.load()
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      video.addEventListener('loadedmetadata', done, { once: true })
      video.addEventListener('error', done, { once: true })
      // never block the page on a slow CDN
      setTimeout(done, 8000)
    })
    if (video.readyState >= 1 && Number.isFinite(video.duration)) {
      duration = video.duration
      videoReady = true
      section.classList.add('film--ready')
    }
  }

  // ---- scrub state --------------------------------------------------------
  let progress = 0 // set by ScrollTrigger
  let shownTime = 0 // lerped toward target each frame

  if (videoReady) {
    const tick = () => {
      const target = progress * Math.max(duration - 0.05, 0)
      // Critically damped-ish lerp: fast enough to feel attached to the
      // scroll, slow enough to swallow scroll-event granularity.
      shownTime += (target - shownTime) * 0.22
      if (Math.abs(shownTime - target) > 0.001 && video.seekable.length > 0) {
        video.currentTime = shownTime
      }
    }
    gsap.ticker.add(tick)
  }

  // ---- chapter titles -----------------------------------------------------
  const showTitle = (index: number) => {
    titles.forEach((el, i) => {
      gsap.to(el, {
        opacity: i === index ? 1 : 0,
        y: i === index ? 0 : i < index ? -18 : 18,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
    railItems.forEach((li, i) => li.classList.toggle('is-active', i === index))
  }

  let activeChapter = -1

  // ---- the pinned timeline ------------------------------------------------
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: `+=${SCROLL_LENGTH}`,
    pin: '.film__pin',
    scrub: true,
    anticipatePin: 1,
    onUpdate(self) {
      progress = self.progress

      // progress rail
      const horizontal = matchMedia('(max-width: 820px)').matches
      railFill.style.transform = horizontal
        ? `scaleX(${self.progress})`
        : `scaleY(${self.progress})`

      // chapters
      const chapter = Math.min(CHAPTERS - 1, Math.floor(self.progress * CHAPTERS))
      if (chapter !== activeChapter) {
        activeChapter = chapter
        showTitle(chapter)
      }

      // depth: sky drifts up slowly, foliage sweeps down faster, the frame
      // itself breathes very slightly toward the viewer mid-chapter.
      const p = self.progress
      sky.style.transform = `translateY(${p * -6}%) scale(${1.04 + p * 0.03})`
      foliage.style.transform = `translateY(${p * 34}%) scale(${1 + p * 0.08})`
      const chapterLocal = (p * CHAPTERS) % 1
      const breathe = Math.sin(chapterLocal * Math.PI) * 0.012
      frame.style.transform = `scale(${1 + breathe}) rotateX(${(0.5 - chapterLocal) * 1.2}deg)`
    },
    onEnter: () => showTitle(0),
    onLeaveBack: () => {
      activeChapter = -1
      titles.forEach((el) => gsap.set(el, { opacity: 0 }))
    },
  })
}

async function videoSource(): Promise<string | null> {
  // Small screens get the 720p master; it scrubs just as smoothly at less
  // than two thirds of the transfer size.
  const key = matchMedia('(max-width: 900px)').matches ? 'walkthrough720' : 'walkthrough'
  const entry = ASSETS[key]
  if (!entry.remote && !(await localExists(entry.local))) return null
  return resolveVideo(key)
}

async function localExists(path: string): Promise<boolean> {
  try {
    const res = await fetch(path, { headers: { Range: 'bytes=0-1' } })
    const type = res.headers.get('content-type') ?? ''
    return res.ok && !type.includes('text/html')
  } catch {
    return false
  }
}
