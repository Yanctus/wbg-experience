import { useRef } from 'react'
import { useScene01Animation } from '../../hooks/useScene01Animation'
import styles from './Scene01.module.css'

export function Scene01() {
  const sceneRef = useRef<HTMLElement>(null)

  useScene01Animation(sceneRef)

  return (
    <section ref={sceneRef} className={styles.scene}>
      <h1 className={styles.title}>Scene 01</h1>
    </section>
  )
}
