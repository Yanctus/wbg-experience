/** The elements the story animates, collected once when the timeline is built. */
export type StoryTargets = {
  stage?: HTMLElement
  room?: HTMLElement
  shadow?: HTMLElement
  tilt?: HTMLElement
  camera?: HTMLElement
  lift?: HTMLElement
  sheet?: HTMLElement
  board?: HTMLElement
  plan?: HTMLElement
  planLayers: HTMLElement[]
  walls?: HTMLElement
  planCentre?: HTMLElement
  planLeft?: HTMLElement
  planRight?: HTMLElement
  building?: HTMLElement
  wireframe?: HTMLElement
  white?: HTMLElement
  realAnchor?: HTMLElement
  photoreal?: HTMLElement
  realShadow?: HTMLElement
  backdrop?: HTMLElement
  foreground?: HTMLElement
  ground?: HTMLElement
  daylight?: HTMLElement
  content?: HTMLElement
  subline?: HTMLElement
  act2?: HTMLElement
  act3?: HTMLElement
  light?: HTMLElement
  dust?: HTMLElement
  header?: HTMLElement
  hint?: HTMLElement
}

/** What every act builder is handed: where it starts, how long it lasts. */
export type ActOptions = {
  timeline: gsap.core.Timeline
  position: number
  duration: number
  targets: StoryTargets
  compact: boolean
}
