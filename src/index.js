import { AudioUtil } from './audio/audio_util'
import { VideoUtil } from './video/video_util'
import './style.css'

const handleClickPlay = () => {

    // get initial voice data
    // AudioUtil.handlePlayAudio("/data/music/flight_of_the_bumble_bee.json")
    // AudioUtil.handlePlayAudio("/data/music/fugue_sonata1_bach.json")

    AudioUtil.handlePlayAudio("/data/music/bach_double_vivace.json")
}

//------------- MAIN ---------------//

document.querySelector("button").addEventListener("click", () => {
    handleClickPlay()
});

VideoUtil.initScene()
