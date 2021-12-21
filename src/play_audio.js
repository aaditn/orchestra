// const { Tone } = require("tone/build/esm/core/Tone")

const App = () => {

  let voices   = {}
  let numNotes = []
  const setNumNotes = (num) => { numNotes = num }
  const setVoices = (vs) => { voices = vs }
  const updateNumNotes = (voiceIdx) => {
    const num = numNotes
    num[voiceIdx] -= 1
    setNumNotes(num)
  }

  // getData from server
  const getJson = (fileUrl) => {
    fetch(fileUrl ,{
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        }
    }).then((response) =>  {
      return response.json();
    }).then((myJson) => {
      console.log(myJson);
      document.querySelector("button").removeAttribute("disabled"); // enable play
      setVoices(myJson)
      // initialize numNotes for each voice
      const num = []
      for (let vname in myJson) num.push(myJson[vname].data.length)
      setNumNotes(num)
    });
  }

  // returns 0 (E), 1 (A), 2 (D) or 3 (G)
  const getViolinStringFromNote = (note) => {
    // anything else is on E string
    let strmap = {
      'G3': 3, 'G#3': 3, 'Ab3': 3, 'A3': 3, 'A#3': 3, 'Bb3': 3, 'B3': 3, 'C4': 3, 
      'C#4': 3, 'D4': 2, 'D#4': 2, 'Eb4': 2, 'E4': 2, 'F4': 2, 'F#4': 2, 'Gb4': 2, 
      'G4': 2, 'G#4': 2, 'Ab4': 2, 'A4': 1, 'A#4': 1, 'Bb4': 1, 'B4': 1, 'C5': 1, 
      'C#5': 1, 'D5': 1, 'D#5': 1, 'Eb5': 1, 'E5': 0 
    }
    if (note in strmap) {
      return strmap[note]
    } else {
      return 0 // E string
    }
  }

  const playNote = (synth, note, duration, when) => {
    synth.triggerAttackRelease(note, duration, when)
  }
  
  // synth, notes, startTime
  const playNotes = (synth, notes, startTime, speed, updateNumNotes, voiceIdx) => {
    let bowdir = true
    let curr = startTime
    const times = []
    notes.forEach((noteArr, i) => {
      let duration = 0
      noteArr.forEach((el, j) => {
        if (j == 0) {
          duration = el * speed
        } else {
          const note = el
          if (note != "R") { // "R" is a rest
            playNote(synth, note, duration, curr)
            if (j == 1) {
              // push only once for chords
              const strNum = getViolinStringFromNote(note)
              times.push([voiceIdx, curr, duration, note, strNum])
            }
          }
        }
      })
      curr += duration
    })
    let intvl = setInterval(() => {
      const n = Tone.now()
      if (n > times[0][1]) { // next note time has arrived
        if (n - times[0][1] < 0.1) {
          console.log(times[0][1], n, (n - times[0][1]), times.length,  )
          updateNumNotes(voiceIdx)
          // play video of next note
          // format: [voiceIdx, curr, duration, note, strNum]
          const dur    = times[0][2] * 0.6
          const note   = times[0][3]
          const strNum = times[0][4]
          console.log(times[0][1], n, (n - times[0][1]), times.length, note, strNum )
          moveBow(voiceIdx, bowdir, dur, note, strNum) // 0.75 leads to
          bowdir = !bowdir
        }
        times.shift()
        if (times.length <= 0) {
          clearInterval(intvl)
        }
      }
    }, 20)
  }
  
  const handleClickPlay = () => {
    // const synth = new Tone.Synth().toDestination();
    // const synth = SampleLibrary.load({ instruments: "saxophone" }).toDestination();
    // playMidiFile(synth, "/midi/tchaik_serenade.mid")

    // Play a score with multiple parts
    let score   = []
    if (Object.keys(voices).length > 0) {
      for(let vname in voices) {
        const voice = voices[vname]
        const synth = SampleLibrary.load({ instruments: voice.instrument });
        const distortion = new Tone.Distortion(0.5);
        const filter = new Tone.AutoFilter(4).start();
        const panner3d = new Tone.Panner3D({pannerX: 200, pannerY: -17, pannerZ: -1})
        synth.chain(panner3d, Tone.Destination)
        // synth.toDestination();
        score.push({synth: synth, voice: voice})
      }
    }
    
    Tone.loaded().then(() => {
      const now = Tone.now()
      console.log("NOW = ", now)
      score.forEach((blob, blobIdx) => {
        if (! blob.voice.muted) {
          playNotes( blob.synth, blob.voice.data, now, blob.voice.speed, updateNumNotes, blobIdx )
        }
      })
    })
  }

  // get initial voice data
  getJson("/data/bach_double_vivace.json")
  // getJson("/data/flight_of_the_bumble_bee.json")
  // getJson("/data/fugue_sonata1_bach.json")
  document.querySelector("button").addEventListener("click", () => {
    handleClickPlay()
  });
}



App()