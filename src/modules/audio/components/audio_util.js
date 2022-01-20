import * as Tone from 'tone'
import { SampleLibrary } from './Tonejs-Instruments'
import { VideoUtil, Event } from '../../video/components/video_util'

const AudioUtil = {

	score: [],
    voices: {},
	recorder: null,
	chunks: [],
    setVoices: (vs) => { AudioUtil.voices = vs },

    // returns 0 (E), 1 (A), 2 (D) or 3 (G)
    getViolinStringFromNote: (note) => {
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
    },

    // return 0 (open), 1 (finger1), 2, 3, 4
    getViolinFingerFromNote: (note) => {
		let fingerMap = {
			'G3': 0, 'G#3': 1, 'Ab3': 1, 'A3': 1, 'A#3': 2, 'Bb3': 2, 'B3': 2, 'C4': 3, 
			'C#4': 3, 'D4': 0, 'D#4': 1, 'Eb4': 1, 'E4': 1, 'F4': 2, 'F#4': 2, 'Gb4': 2,
			'G4': 3, 'G#4': 3, 'Ab4': 3, 'A4': 0, 'A#4': 1, 'Bb4': 1, 'B4': 1, 'C5': 2, 
			'C#5': 2, 'D5': 3, 'D#5': 3, 'Eb5': 3, 'E5': 0, 'F5': 1, 'F#5': 1, 'Gb5': 1,
			'G5': 2, 'G#5': 2, 'Ab4': 2, 'A5': 3, 'A#5': 3, 'Bb5': 3, 'B5': 4
		}
		if (note in fingerMap) {
			return fingerMap[note]
		} else {
			return 4 // 4th finger on E string for any note above B5 on E string
		}
    },

	playNote: (synth, note, duration, when) => {
		synth.triggerAttackRelease(note, duration, when)
    },

	queuePlayNote: (synth, note, when, duration) => {
		const player = null
		let evt = new Event( VideoUtil.evtCount, when, when + duration, player, {
			action: "playNote", synth: synth, note: note, run_once: true
		})
		VideoUtil.all_events[VideoUtil.evtCount++] = evt
    },

	// synth, notes, startTime - returns duration on this synth
    playNotes: (synth, notes, startTime, vstartTime, speed, voiceIdx) => {
		let bowdir = true
		let curr   = startTime // audio clock (Tone.now())

		notes.forEach((noteArr, i) => {
			let duration = 0
			noteArr.forEach((el, j) => {
				if (j == 0) {
					duration = el * speed
				} else {
					const note   = el
					const vsched = vstartTime + (curr - startTime)
					const vdur   = duration
					if (note != "R") { // "R" is a rest
						// AudioUtil.playNote(synth, note, duration, curr)
						AudioUtil.queuePlayNote(synth, note, vsched, duration)
						if (j == 1) {
							// push only once for chords
							const strNum = AudioUtil.getViolinStringFromNote(note)
							const fingerNum = AudioUtil.getViolinFingerFromNote(note)
							// queue video event
							VideoUtil.queueMoveBow(voiceIdx, vsched, vdur, bowdir, strNum, fingerNum)
							bowdir = !bowdir
						}
					}
				}
			})
			curr += duration
		})
    },

	handleStopAudio: () => {
		AudioUtil.score.forEach((voiceBlob) => {
			voiceBlob.synth.dispose()
		})
		AudioUtil.score = []
	},

	handleStartAudio: async function(fileUrl, durationCallback) {
		// fetch the JSON audio data from fileUrl
		const response = await fetch(fileUrl ,{
			headers : { 
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		})
		const responseJson = await response.json()
		console.log(responseJson)
		AudioUtil.setVoices(responseJson)
		const num = []
		for (let vname in responseJson) num.push(responseJson[vname].data.length)
		
		// const synth = new Tone.Synth().toDestination();
		// const synth = SampleLibrary.load({ instruments: "saxophone" }).toDestination();
		// playMidiFile(synth, "/midi/tchaik_serenade.mid")

		// Turn recorder on by default
		const audio = document.querySelector('audio')
		const actx  = Tone.context;
		const dest  = actx.createMediaStreamDestination()
		AudioUtil.recorder = new MediaRecorder(dest.stream)
		AudioUtil.recorder.start()
		AudioUtil.recorder.ondataavailable = e => { AudioUtil.chunks.push(e.data)}
		AudioUtil.recorder.onstop = evt => {
			let blob = new Blob(AudioUtil.chunks.flat(), { type: 'audio/ogg; codecs=opus' })
			audio.src = URL.createObjectURL(blob)
		};
		setTimeout(() => { AudioUtil.recorder.stop() }, 30000) // test dumping audio

		// Play a score with multiple parts
		AudioUtil.score   = []
		if (Object.keys(AudioUtil.voices).length > 0) {
			for(let vname in AudioUtil.voices) {
				const voice = AudioUtil.voices[vname]
				const synth = SampleLibrary.load({ instruments: voice.instrument });
				// const distortion = new Tone.Distortion(0.5);
				// const filter = new Tone.AutoFilter(4).start();
				// const panner3d = new Tone.Panner3D({pannerX: 200, pannerY: -17, pannerZ: -1})
				// synth.chain(panner3d, Tone.Destination)
				synth.toDestination()
				synth.connect(dest) // connect synth to AudioUtil.recorder as well
				AudioUtil.score.push({synth: synth, voice: voice})
			}
		}

		Tone.loaded().then(() => {
			const now  = Tone.now()
			const vnow = VideoUtil.clock.getElapsedTime() // video startTime
			console.log("Audio start at:", now)
			let maxDur = 0
			AudioUtil.score.forEach((blob, blobIdx) => {
				if (! blob.voice.muted) {
					const dur =
						AudioUtil.playNotes( 
							blob.synth, blob.voice.data, now, vnow, blob.voice.speed, blobIdx
						)
					if (dur > maxDur) maxDur = dur
				}
			})
			durationCallback(maxDur)
		})
    },

}

export { AudioUtil }
