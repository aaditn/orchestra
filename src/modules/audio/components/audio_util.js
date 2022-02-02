import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'
import { SampleLibrary } from './Tonejs-Instruments'
import { VideoUtil, Event } from '../../video/components/video_util'

const AudioUtil = {

  score: [],
  tracks: {},
  recorder: null,
  chunks: [],
  trackPlayerMap: {},
  setTracks: (trks) => { AudioUtil.tracks = trks },

  getInstrumentSampleMap: () => {
    // clarinet samples are borked
    return {
      violin: "violin", viola: "violin", cello: "cello", contrabass: "contrabass",
      flute: "flute", oboe: "flute", clarinet: "flute", bassoon: "bassoon",
      "french horn": "french-horn", trumpet: "trumpet", trombone: "trombone",
      tuba: "tuba", "orchestra kit": "piano", "orchestral harp": "harp",
      "string ensemble 1": "violin", "acoustic grand piano": "piano",
      "pizzicato strings": "harp", "electric bass (finger)": "contrabass",
      "bright acoustic piano": "piano", "choir aahs": "cello", banjo: "harp",
      "fretless bass": "contrabass", "honky-tonk piano": "harp",
      "acoustic guitar (steel)": "guitar-acoustic",
    }
  },

  // returns 0 (E), 1 (A), 2 (D) or 3 (G)
  getViolinStringFromNote: (note) => {
    // anything else is on E string
    let strmap = {
      'G3': 3, 'G#3': 3, 'Ab3': 3, 'A3': 3, 'A#3': 3, 'Bb3': 3, 'B3': 3, 'C4': 3,
      'C#4': 3, 'D4': 3, 'D#4': 2, 'Eb4': 2, 'E4': 2, 'F4': 2, 'F#4': 2, 'Gb4': 2,
      'G4': 2, 'G#4': 2, 'Ab4': 2, 'A4': 2, 'A#4': 1, 'Bb4': 1, 'B4': 1, 'C5': 1,
      'C#5': 1, 'D5': 1, 'D#5': 1, 'Eb5': 1, 'E5': 1
    }
    if (note in strmap) {
      return strmap[note]
    } else {
      return 0 // E string
    }
  },

  // return 0 (open), 1 (finger1), 2, 3, 4
  getViolinFingerFromNote: (note) => {
    let fingerMap = {
      'G3': 0, 'G#3': 1, 'Ab3': 1, 'A3': 1, 'A#3': 2, 'Bb3': 2, 'B3': 2, 'C4': 3,
      'C#4': 3, 'D4': 4, 'D#4': 1, 'Eb4': 1, 'E4': 1, 'F4': 2, 'F#4': 2, 'Gb4': 2,
      'G4': 3, 'G#4': 3, 'Ab4': 3, 'A4': 4, 'A#4': 1, 'Bb4': 1, 'B4': 1, 'C5': 2,
      'C#5': 2, 'D5': 3, 'D#5': 3, 'Eb5': 3, 'E5': 4, 'F5': 1, 'F#5': 1, 'Gb5': 1,
      'G5': 2, 'G#5': 2, 'Ab4': 2, 'A5': 3, 'A#5': 3, 'Bb5': 3, 'B5': 4
    }
    if (note in fingerMap) {
      return fingerMap[note]
    } else {
      return 4 // 4th finger on E string for any note above B5 on E string
    }
  },

  queuePlayNote: (synth, note, when, duration, velocity) => {
    const player = null
    const vel    = velocity || 0.5
    let evt = new Event(VideoUtil.evtCount, when, when + duration, player, {
      action: "playNote", synth: synth, note: note, run_once: true, velocity: vel
    })
    VideoUtil.all_events[VideoUtil.evtCount++] = evt
  },

  // synth, notes, startTime - returns duration on this synth
  playMIDINotes: (synth, instrument, player, notes, startTime) => {
    let bowdir = true
    const tmult = 1.0 // will slow-down/speed-up by this factor
    notes.forEach((noteArr, i) => {
      const vsched   = (noteArr[0] * tmult) + startTime
      const duration = noteArr[1] * tmult
      const velocity = noteArr[2]
      for (let j = 3; j < noteArr.length; j++) {
        const note = noteArr[j]
        if (note != "R") { // "R" is a rest
          AudioUtil.queuePlayNote(synth, note, vsched, duration, velocity)
          switch (instrument) {
            case "violin":
            case "cello":
              if (j == 3) {
                // push only once for chords
                const strNum = AudioUtil.getViolinStringFromNote(note)
                const fingerNum = AudioUtil.getViolinFingerFromNote(note)
                VideoUtil.queueMoveBow(player, vsched, duration, bowdir, strNum, fingerNum)
                bowdir = !bowdir
              }
              break;
            case "piano":
              VideoUtil.queuePianoKey(player, vsched, duration, note)
              break;
          }
        }
      }
    })
  },

  // synth, notes, startTime - returns duration on this synth
  playNotes: (synth, instrument, notes, startTime, vstartTime, speed, trackIdx) => {
    let bowdir = true
    let curr = startTime // audio clock (Tone.now())
    notes.forEach((noteArr, i) => {
      let duration = 0
      noteArr.forEach((el, j) => {
        if (j == 0) {
          duration = el * speed
        } else {
          const note = el
          const vsched = vstartTime + (curr - startTime)
          if (note != "R") { // "R" is a rest
            AudioUtil.queuePlayNote(synth, note, vsched, duration)
            switch (instrument) {
              case "violin":
                if (j == 1) {
                  // push only once for chords
                  const strNum = AudioUtil.getViolinStringFromNote(note)
                  const fingerNum = AudioUtil.getViolinFingerFromNote(note)
                  // queue video event
                  if (trackIdx < 2) { // TODO - fix this hack - 2 players needs generalization
                    VideoUtil.queueMoveBow(trackIdx, vsched, duration, bowdir, strNum, fingerNum)
                  }
                  bowdir = !bowdir
                }
                break;
              case "piano":
                VideoUtil.queuePianoKey(trackIdx, vsched, duration, note)
                break;
            }
          }
        }
      })
      curr += duration
    })
  },

  startRecorder: () => {
    const audioElem = document.querySelector('audio')
    const actx = Tone.context;
    const dest = actx.createMediaStreamDestination()
    AudioUtil.chunks = [] // initialize audio chunks
    AudioUtil.recorder = new MediaRecorder(dest.stream)
    AudioUtil.recorder.start()
    AudioUtil.recorder.ondataavailable = e => { AudioUtil.chunks.push(e.data) }
    AudioUtil.recorder.onstop = e => {
      const blob = new Blob(AudioUtil.chunks.flat(), { type: 'audio/ogg; codecs=opus' })
      audioElem.src = URL.createObjectURL(blob)
    }
    return dest
  },

  stopRecorder: () => {
    // triggers callback recorder.onstop
    if (AudioUtil.recorder) {
      AudioUtil.recorder.stop()
    }
  },

  handleStopAudio: () => {
    AudioUtil.stopRecorder()
    AudioUtil.score.forEach((trackBlob) => {
      trackBlob.synth.dispose()
    })
    AudioUtil.score = []
  },

  // json = {{ voice1: { instrument: "violin", muted: false, speed: 0.2, data: [}}, ...}
  postProcessMIDI: (midi) => {
    console.log("MIDI: ", midi)
    const sampleMap = AudioUtil.getInstrumentSampleMap()
    midi.tracks.forEach(track => { // sort notes in each track by time
      track.notes.sort((a, b) => (a.time > b.time) ? 1 : -1)
    })
    const modJson = {}
    midi.tracks.forEach(track => { // sort notes in each track by time
      const notes = []
      let instrument = "piano" // default instrument
      const midi_instrument = track.instrument.name
      if (midi_instrument in sampleMap) {
        instrument = sampleMap[midi_instrument]
      }
      for (let i = 0; i < track.notes.length; i++) {
        const note = track.notes[i]
        notes.push([note.time, note.duration, note.velocity, note.name]) // queue current note
      }
      if (notes.length > 0) { // (track.channel >= 1 && track.channel <= 15) {
        modJson["voice" + track.channel] = {
          "instrument": instrument,
          "muted": false,
          "speed": 1,
          "data": notes
        }
      }
    })
    return modJson
  },

  loadAudioFile: async function (fileUrl, fileType) {
    if (fileType == "json") { // handle JSON file
      const response = await fetch(fileUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      const responseJson = await response.json()
      console.log(responseJson)
      AudioUtil.setTracks(responseJson)
    } else { // handle MIDI file
      const midi = await Midi.fromUrl(fileUrl)
      const modResponseJson = AudioUtil.postProcessMIDI(midi)
      AudioUtil.setTracks(modResponseJson)
    }

    // Create new scene based on tracks
    VideoUtil.clearScene()
    VideoUtil.players = {}
    VideoUtil.sceneSpec = AudioUtil.getSceneSpecFromTracks(AudioUtil.tracks)
    console.log("sceneSpec: ", VideoUtil.sceneSpec)
    VideoUtil.layoutScene()
    AudioUtil.createScoreFromTracks(AudioUtil.tracks)
  },

  getSceneSpecFromTracks: (tracks) => {
    const placement = VideoUtil.getPlayerPlacement()
    const sceneSpec = { 
      players: [],
      lights: [
        {type: "AmbientLight", color: "white", intensity: 0.5},
        {type: "PointLight", color: "white", intensity: 0.5, position: {x: 0, y: 100, z: 0},
          "mapSize.width": 1024, "mapSize.height": 1024, "castShadow": true },
      ]
    }
    const instrumentCount = { violin: 0, cello: 0, piano: 0 }
    if (Object.keys(tracks).length > 0) {
      for (let vname in tracks) {
        const track = tracks[vname]
        //---- Start Populate trackPlayerMap - hardcode for now (2 violins, 1 piano) ---//
        if (track.instrument in instrumentCount && 
            instrumentCount[track.instrument] < placement[track.instrument].length) {
          const player = placement[track.instrument][instrumentCount[track.instrument]]
          player.instrumentType = track.instrument
          sceneSpec.players.push(player)
          instrumentCount[track.instrument]++
        }
      }
    }
    return sceneSpec
  },

  createScoreFromTracks: (tracks) => {
    // Turn recorder on by default
    const dest = AudioUtil.startRecorder()

    // Play a score with multiple parts
    AudioUtil.trackPlayerMap = { violin: [], viola: [], cello: [], piano: []} // actor_id's
    AudioUtil.score = []
    const instruments = {}
    if (Object.keys(tracks).length > 0) {
      for (let vname in tracks) {
        const track = tracks[vname]
        const synth = SampleLibrary.load({ instruments: track.instrument })
        // const distortion = new Tone.Distortion(0.5);
        // const filter = new Tone.AutoFilter(4).start();
        // const panner3d = new Tone.Panner3D({pannerX: 200, pannerY: -17, pannerZ: -1})
        // synth.chain(panner3d, Tone.Destination)
        synth.toDestination()
        synth.connect(dest) // connect synth to AudioUtil.recorder as well
        synth.volume.value = -6

        //---- Start Populate trackPlayerMap ---//
        if (instruments[track.instrument]) instruments[track.instrument] += 1
        else instruments[track.instrument] = 1
        let player = null
        if (['violin', 'viola', 'cello', 'piano'].indexOf(track.instrument) >= 0) {
          player = AudioUtil.assignAvailablePlayer(track)
          if (!player) {
            console.log("Unassigned: ", track.instrument)
          }
        }
        //----  End Populate trackPlayerMap ---//
        AudioUtil.score.push({ synth: synth, track: track, player: player })
      }
      console.log("INSTRUMENTS:", instruments)
    }
  },

  assignAvailablePlayer: (track) => {
    let player = null
    let assigned  = false
    for (let actor_id in VideoUtil.players) {
      if (! assigned) {
        const testplayer = VideoUtil.players[actor_id]
        if (testplayer.instrumentType == track.instrument) {
          if (AudioUtil.trackPlayerMap[track.instrument].indexOf(actor_id) < 0) {
            AudioUtil.trackPlayerMap[track.instrument].push(actor_id)
            player = testplayer
            assigned = true
          }
        }
      }
    }
    return player
  },

  // Assumes AudioUtil.tracks is populated
  handleStartAudio: function (fileType, durationCallback) {

    Tone.loaded().then(() => {
      const now = Tone.now()
      const vnow = VideoUtil.clock.getElapsedTime() // video startTime
      console.log("Audio start at:", now)
      let maxDur = 0
      AudioUtil.score.forEach((blob, blobIdx) => {
        if (blob.player) {
          console.log("TRACK: ", blob.track.instrument, " assigned to player:", blob.player.ID)
        }
        if (!blob.track.muted) {
          if (fileType == "json") {
            const dur =
              AudioUtil.playNotes(
                blob.synth, blob.track.instrument, blob.track.data,
                now, vnow, blob.track.speed, blobIdx
              )
            if (dur > maxDur) maxDur = dur
          } else if (fileType == "midi") {
            const dur =
              AudioUtil.playMIDINotes( blob.synth, blob.track.instrument, blob.player, blob.track.data, now )
            if (dur > maxDur) maxDur = dur
          }
        }
      })
      durationCallback(maxDur)
    })
  },

}

export { AudioUtil }
