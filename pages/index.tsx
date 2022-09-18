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

  return (
    <>
      <a
        className={styles.btn}
        rel="noreferrer"
        target="_blank"
        href='https://github.com/SyMind/ji'
      >
        <span className={styles.github} />
      </a>
      <div className={styles.container}>
        <div className={styles.stage} ref={container} />
      </div>
    </>
  )
}

export default Home

export async function getStaticProps() {
  return {
    props: { }
  }
}
