import * as Tone from 'tone'
import { SampleLibrary } from './Tonejs-Instruments'
import { VideoUtil } from '../../video/components/video_util'
import { Event } from '../../event/event'

const AudioUtil = {

	score: [],
    voices: {},
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
		let evt = new Event( Event.evtCount, when, when + duration, player, {
			action: "playNote", synth: synth, note: note
		})
		VideoUtil.all_events[Event.evtCount++] = evt
    },

	// synth, notes, startTime
    playNotes: (synth, notes, startTime, vstartTime, speed, voiceIdx) => {
		let bowdir  = true
		let curr    = startTime // audio clock (Tone.now())
		// const times = []

		/*
		const audio = document.querySelector('audio');
		const actx  = Tone.context;
		const dest  = actx.createMediaStreamDestination();
		const recorder = new MediaRecorder(dest.stream);
		synth.connect(dest);
		const chunks = [];
		recorder.start()
		recorder.ondataavailable = evt => chunks.push(evt.data);
		recorder.onstop = evt => {
		let blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
		audio.src = URL.createObjectURL(blob);
		};
		*/

		notes.forEach((noteArr, i) => {
			let duration = 0
			noteArr.forEach((el, j) => {
				if (j == 0) {
					duration = el * speed
				} else {
					const note   = el
					const vsched = vstartTime + 50 * (curr - startTime)
					const vdur   = 50 * duration
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

		/*
		let intvl = setInterval(() => {
			const n = Tone.now()
			if (n > times[0][1]) { // next note time has arrived
				if (n - times[0][1] < 0.1) {
					// play video of next note
					// format: [voiceIdx, curr, duration, note, strNum]
					const dur    = times[0][2]
					const note   = times[0][3]
					const strNum = times[0][4]
					const fingerNum = times[0][5]
					// console.log("sched =", times[0][1].toFixed(2), "now -", n.toFixed(2), " diff =", (n - times[0][1]).toFixed(2), " dur =", dur.toFixed(2), " note =", note )
					VideoUtil.moveBow(voiceIdx, bowdir, dur, strNum, fingerNum)
					bowdir = !bowdir
				}
				times.shift()
				if (times.length <= 0) {
					// recorder.stop();
					clearInterval(intvl)
				}
			}
		}, 40)
		*/

    },

	handleStopAudio: () => {
		AudioUtil.score.forEach((voiceBlob) => {
			voiceBlob.synth.dispose()
		})
		AudioUtil.score = []
	},

	handleStartAudio: async function(fileUrl) {
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

		// Play a score with multiple parts
		AudioUtil.score   = []
		if (Object.keys(AudioUtil.voices).length > 0) {
			for(let vname in AudioUtil.voices) {
				const voice = AudioUtil.voices[vname]
				const synth = SampleLibrary.load({ instruments: voice.instrument });
				const distortion = new Tone.Distortion(0.5);
				const filter = new Tone.AutoFilter(4).start();
				const panner3d = new Tone.Panner3D({pannerX: 200, pannerY: -17, pannerZ: -1})
				synth.chain(panner3d, Tone.Destination)
				synth.toDestination()
				AudioUtil.score.push({synth: synth, voice: voice})
			}
		}

		Tone.loaded().then(() => {
			const now  = Tone.now()
			const vnow = 50 * VideoUtil.clock.getElapsedTime() // video startTime
			console.log("Audio start at:", now)
			AudioUtil.score.forEach((blob, blobIdx) => {
				if (! blob.voice.muted) {
					AudioUtil.playNotes( 
						blob.synth, blob.voice.data, now, vnow, blob.voice.speed, blobIdx
					)
				}
			})
		})
    },

}

export { AudioUtil }
