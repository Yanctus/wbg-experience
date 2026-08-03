/**
 * Scroll choreography for everything that is not the film: hero entrance,
 * fact counters, staggered card reveals, hero parallax, timeline accents.
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initReveals(reducedMotion: boolean): void {
  if (reducedMotion) {
    // Content must never be hidden without motion.
    document
      .querySelectorAll<HTMLElement>('.reveal-line, .values__card, .shares__card')
      .forEach((el) => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      el.textContent = format(Number(el.dataset.count), 'plain' in el.dataset)
    })
    return
  }

  // ---- hero entrance ------------------------------------------------------
  gsap.to('.hero .reveal-line', {
    opacity: 1,
    y: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.15,
  })

  // hero parallax: image drifts slower than the page
  gsap.to('.hero__img', {
    yPercent: 12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('.hero__content', {
    yPercent: -14,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '75% top', scrub: true },
  })

  // ---- facts counters -----------------------------------------------------
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count)
    const plain = 'plain' in el.dataset
    const state = { value: 0 }
    gsap.to(state, {
      value: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => {
        el.textContent = format(Math.round(state.value), plain)
      },
    })
  })

  // ---- generic section reveals -------------------------------------------
  const reveal = (targets: string, vars: gsap.TweenVars = {}) => {
    gsap.utils.toArray<HTMLElement>(targets).forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 34,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
        ...vars,
      })
    })
  }

  reveal('.section-title')
  reveal('.section-kicker', { y: 16 })
  reveal('.history__cols p', { stagger: 0.15 })
  reveal('.shares__lede')
  reveal('.shares__note')
  reveal('.apply__contactcard')
  reveal('.apply__form')

  // cards: stagger inside their grids
  ;(
    [
      ['.values__grid', '.values__card'],
      ['.shares__cards', '.shares__card'],
      ['.facts__grid', '.facts__item'],
      ['.history__timeline', 'li'],
    ] as const
  ).forEach(([grid, card]) => {
    const container = document.querySelector(grid)
    if (!container) return
    gsap.from(container.querySelectorAll(card), {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.09,
      scrollTrigger: { trigger: container, start: 'top 82%' },
    })
  })

  // timeline accent: activate entries as they pass the viewport middle
  gsap.utils.toArray<HTMLElement>('.history__timeline li').forEach((li) => {
    ScrollTrigger.create({
      trigger: li,
      start: 'top 65%',
      onEnter: () => li.classList.add('is-active'),
      onLeaveBack: () => li.classList.remove('is-active'),
    })
  })
}

function format(n: number, plain: boolean): string {
  return plain ? String(n) : n.toLocaleString('de-DE')
}
