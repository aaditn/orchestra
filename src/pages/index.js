import { useEffect, useState } from "react"
import Head from 'next/head'
import PubSub from 'pubsub-js'
import { AudioUtil } from '../modules/audio/components/audio_util'
import { VideoUtil } from '../modules/video/components/video_util'
import MusicPlayerSlider from '../modules/video/components/PlayerSlider'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import styles from '../styles/Home.module.css'

export default function Home() {

  const [assetsLoaded, setAssetsLoaded] = useState(false)
  const [audioRunning, setAudioRunning] = useState(false)
  const [audioButtonText, setAudioButtonText] = useState("Start Audio")
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
    {url: "/data/music/abba_dancing_queen.mid", name: "ABBA - Dancing Queen", type: "midi"},
    {url: "/data/music/nessun_dorma.mid", name: "Nessun Dorma", type: "midi"},
    {url: "/data/music/let_it_be.mid", name: "Beatles - Let It Be", type: "midi"},
    {url: "/data/music/ode_to_joy.mid", name: "Ode to Joy", type: "midi"},
    {url: "/data/music/brandenburg_3.mid", name: "Brandenburg Number 3", type: "midi"},
    {url: "/data/music/moto_perpetuo.mid", name: "Moto Perpetuo", type: "midi"},
    {url: "/data/music/paganini_caprice_24.mid", name: "Paganini Caprice 24", type: "midi"},
  ]

  useEffect(() => {
    VideoUtil.initScene(setAssetsLoaded, true)
  }, [])

  // start load scene into DOM and start video loop only when assets loaded
  useEffect(() => {
    console.log("Assetsloaded = ", assetsLoaded)
    if (assetsLoaded) {
      VideoUtil.attachRendererToDOM()
      const piece = pieces[0]
      AudioUtil.loadAudioFile(piece.url, piece.type)
      VideoUtil.renderer.setAnimationLoop(VideoUtil.drawFrame)
    } else {
      document.getElementById("three-scene").innerHTML = ""
    }
  }, [assetsLoaded])

  const toggleAudio = () => {
    if (audioRunning) { // stop video
      // AudioUtil.handleStopAudio()

      // AudioUtil.handleStopVideo() // added this to see if video gets dumped on this event

      VideoUtil.clearEvents()
      setAudioRunning(false)
      setAudioButtonText("Start Audio")
      VideoUtil.running = false
    } else { // start video
      const piece = pieces[pieceSelected]
      AudioUtil.handleStartAudio(piece.type)
      setAudioRunning(true)
      setAudioButtonText("Stop Audio")
      VideoUtil.running = true
    }
  }

  const changePieceSelected = (evt) => {
    setPieceSelected(evt.target.value)
    const piece = pieces[evt.target.value]
    AudioUtil.loadAudioFile(piece.url, piece.type)
  }

  return (
    <Container maxWidth="lg">
      <Head>
        <title>Orchestra</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <div>
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
          </div>
        </Grid>
        <Grid item xs={3}>
          <div>
            <Button onClick={toggleAudio} variant="contained">
              {audioButtonText}
            </Button>
          </div>
        </Grid>
        <Grid item xs={6}>
          <audio controls></audio>
        </Grid>
        {/*
        <Grid item xs={12}>
          <MusicPlayerSlider />
        </Grid>
        */}
        <Grid item xs={12}>
          <div id="three-scene" style={{border: "1px solid black"}}></div>
        </Grid>
        {/*
        <Grid item xs={12} md={6}>
          <div id="three-scene" style={{border: "1px solid black"}}></div>
        </Grid>
        <Grid item xs={12} md={6}>
          <div style={{border: "1px solid black"}}>
            <video id="recorded_video" playsInline loop></video>
          </div>
        </Grid>
        */}
      </Grid>
    </Container>
  )
}
