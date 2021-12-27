import { AudioUtil } from './audio/audio_util'
import { VideoUtil } from './video/video_util'
import './style.css'

const handleClickPlay = () => {
    // get initial voice data
    // AudioUtil.handlePlayAudio("/data/flight_of_the_bumble_bee.json")
    // AudioUtil.handlePlayAudio("/data/fugue_sonata1_bach.json")
    AudioUtil.handlePlayAudio("/data/bach_double_vivace.json")
}

//------------- MAIN ---------------//

document.querySelector("button").addEventListener("click", () => {
    handleClickPlay()
});

VideoUtil.renderScene();
