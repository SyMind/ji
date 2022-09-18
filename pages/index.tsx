import {useEffect, useRef} from 'react'
import type { NextPage } from 'next'
import IKun from '../src/ikun'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ikun = new IKun(container.current!)
    ikun.run()

    return () => {
      ikun.dispose()
    }
  }, [])

  return <div className={styles.stage} ref={container} />
}

export default Home
