import '@fontsource-variable/fraunces'
import '@fontsource-variable/instrument-sans'
import './styles/main.css'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import { initReveals } from './reveal'
import { initFilm } from './film'
import { resolveImage } from './assets'

gsap.registerPlugin(ScrollTrigger)

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
if (reducedMotion) document.documentElement.classList.add('reduced-motion')

// ---- smooth scroll --------------------------------------------------------
if (!reducedMotion) {
  const lenis = new Lenis({ lerp: 0.11 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  // anchor navigation through Lenis so pinning offsets stay correct
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.hash)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: 0 })
    })
  })
}

// ---- topbar state ---------------------------------------------------------
const topbar = document.getElementById('topbar')!
topbar.classList.add('hero-mode')
ScrollTrigger.create({
  start: 80,
  onUpdate: (self) => topbar.classList.toggle('topbar--solid', self.scroll() > 80),
})

// ---- hero image: blur-up from the committed placeholder --------------------
resolveImage('hero').then((url) => {
  const full = document.querySelector<HTMLImageElement>('.hero__img--full')
  if (!full) return
  full.hidden = false
  full.src = url
  const done = () => full.classList.add('is-loaded')
  full.complete ? done() : full.addEventListener('load', done, { once: true })
})

// ---- sections -------------------------------------------------------------
initReveals(reducedMotion)
initFilm(reducedMotion)

// ---- application form (prototype: client-side confirmation only) ----------
const form = document.querySelector<HTMLFormElement>('.apply__form')
form?.addEventListener('submit', (e) => {
  e.preventDefault()
  if (!form.reportValidity()) return
  form.querySelector<HTMLElement>('.apply__success')!.hidden = false
  form.querySelector<HTMLButtonElement>('.apply__submit')!.disabled = true
})
