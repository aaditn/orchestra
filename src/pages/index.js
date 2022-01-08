import {useEffect} from "react"
import Head from 'next/head'
import Image from 'next/image'
import { AudioUtil } from '../modules/audio/components/audio_util'
import { VideoUtil } from '../modules/video/components/video_util'
import styles from '../styles/Home.module.css'

export default function Home() {

  useEffect(() => {
    // alert('Finished loading')
    VideoUtil.initScene()
  }, [])

  const handleClickPlay = () => {
    // get initial voice data                                                                                           
    // AudioUtil.handlePlayAudio("/data/music/flight_of_the_bumble_bee.json")                                           
    // AudioUtil.handlePlayAudio("/data/music/fugue_sonata1_bach.json")                                                 
  
    AudioUtil.handlePlayAudio("/data/music/bach_double_vivace.json")
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Orchestra</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.grid}>
          <button onClick={handleClickPlay}>start</button>
          <div id="three-scene"></div>
        </div>
      </main>


    </div>
  )
}
