import { useEffect, useState } from "react"
import Head from 'next/head'
import { AudioUtil } from '../modules/audio/components/audio_util'
import { VideoUtil } from '../modules/video/components/video_util'
import MusicPlayerSlider from '../modules/video/components/PlayerSlider'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import styles from '../styles/Home.module.css'

export default function Home() {

  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [audioRunning, setAudioRunning] = useState(false)
  const [audioButtonText, setAudioButtonText] = useState("Start Audio")
  const [videoRunning, setVideoRunning] = useState(false)
  const [videoButtonText, setVideoButtonText] = useState("Start Video")
  const [pieceSelected, setPieceSelected] = useState(0)
  const pieces = [
    {url: "/data/music/flight_of_the_bumble_bee.json", name: "Bumble Bee", type: "json"},
    {url: "/data/music/fugue_sonata1_bach.json", name: "Bach Fugue", type: "json"},
    {url: "/data/music/bach_double_vivace.json", name: "Bach Double", type: "json"},
    {url: "/data/music/chopin_prelude_eminor.json", name: "Chopin Prelude", type: "json"},
    {url: "/data/music/tchaik_serenade.mid", name: "Tchaikovsky Serenade", type: "midi"},
    {url: "/data/music/tchaikovsky_nutcracker_suite_flowers.mid", name: "Nutcracker Waltz", type: "midi"},
    {url: "/data/music/lucy_in_the_sky_with_diamonds.mid", name: "Lucy in the Sky", type: "midi"},
    {url: "/data/music/abba_thank_you.mid", name: "ABBA - Thank You", type: "midi"},
  ]

  useEffect(() => {
    VideoUtil.initScene(setAssetsLoaded, true)
  }, [])

  // start load scene into DOM and start video loop only when assets loaded
  useEffect(() => {
    console.log("Assetsloaded = ", assetsLoaded)
    if (assetsLoaded) {
      document.getElementById("three-scene").appendChild(VideoUtil.renderer.domElement)
      setVideoRunning(true)
      setVideoButtonText("Pause Video")
      const piece = pieces[0]
      AudioUtil.loadAudioFile(piece.url, piece.type)
      VideoUtil.renderer.setAnimationLoop(VideoUtil.drawFrame)
    } else {
      document.getElementById("three-scene").innerHTML = ""
    }
  }, [assetsLoaded])

  const toggleAudio = () => {
    if (audioRunning) { // stop video
      AudioUtil.handleStopAudio()
      VideoUtil.clearEvents()
      setAudioRunning(false)
      setAudioButtonText("Start Audio")
    } else { // start video
      const piece = pieces[pieceSelected]
      AudioUtil.handleStartAudio(piece.url, piece.type, setDuration)
      setAudioRunning(true)
      setAudioButtonText("Stop Audio")
    }
  }

  const toggleVideo = () => {
    if (videoRunning) { // stop video
      setVideoRunning(false)
      setVideoButtonText("Start Video")
      // document.getElementById("three-scene").innerHTML = ""
      VideoUtil.renderer.setAnimationLoop(null)
      let now = performance.now() / 1000.0
      VideoUtil.clock.stopTime = now
      VideoUtil.clock.activeTime += VideoUtil.clock.stopTime - VideoUtil.clock.startTime
    } else { // start video
      setVideoRunning(true)
      // document.getElementById("three-scene").appendChild(VideoUtil.renderer.domElement)
      setVideoButtonText("Stop Video")
      VideoUtil.renderer.setAnimationLoop(VideoUtil.drawFrame)
      let now = performance.now() / 1000.0
      VideoUtil.clock.startTime = now
      VideoUtil.clock.inactiveTime += VideoUtil.clock.startTime - VideoUtil.clock.stopTime
    }
  }

  const changePieceSelected = (evt) => {
    setPieceSelected(evt.target.value)
    const piece = pieces[evt.target.value]
    AudioUtil.loadAudioFile(piece.url, piece.type)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Orchestra</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.grid}>
          <Select
            variant="standard"
            id="music"
            value={pieceSelected}
            label="Select Music"
            onChange={changePieceSelected}
          >
            {pieces.map((piece, pieceIdx) => (
              <MenuItem key={pieceIdx} value={pieceIdx}>{piece.name}</MenuItem>
            ))}
          </Select>
          &nbsp; &nbsp;
          <Button onClick={toggleAudio} variant="contained">
            {audioButtonText}
          </Button>
          &nbsp; &nbsp;
          <Button onClick={toggleVideo} variant="contained">
            {videoButtonText}
          </Button>
          <span id="audio_container"></span>
            <audio controls></audio>
          <MusicPlayerSlider duration={duration} position={5}/>
          <div id="three-scene"></div>
        </div>
      </main>

    </div>
  )
}
