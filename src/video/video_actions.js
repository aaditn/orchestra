import { sin, cos } from '../../libs/mannequin'

//-------- START VideoActions --------//
const VideoActions = {

    walk: (t, evt, reset) => {
        const actor = evt.actor
		const t0    = evt.data.t0 || 0 // start from a 0 position (t-t0)
		// walking motion
		if (! reset) {
			const sint =  sin(4 * (t-t0))
			actor.l_leg.raise = 30 * sint
			actor.r_leg.raise = -30 * sint
			actor.l_arm.raise = -30 * sint
			actor.r_arm.raise = 30 * sint
		} else {
			actor.l_leg.raise = 0
			actor.r_leg.raise = 0
			actor.l_arm.raise = 0
			actor.r_arm.raise = 0
		}
	},

	bow: (t, evt, reset) => {
        const actor = evt.actor
		const paramt   = (t - evt.start) / (evt.end - evt.start)
		// walking motion
		if (! reset) {
			if (paramt <= 0.5) {
				actor.torso.bend = 180 * paramt
			} else {
				actor.torso.bend = 180 * (1 - paramt)
			}
		} else {
			actor.torso.bend = 0
		}
	},

	// move instantly, no transition
	move: (t, evt) => {
        const actor    = evt.actor
		const endPos   = evt.data.endPos
		actor.position.set(endPos.x, endPos.y, endPos.z)
	},

    translate: (t, evt) => {
        const actor    = evt.actor
		const startPos = evt.data.startPos
		const endPos   = evt.data.endPos
		const paramt   = (t - evt.start) / (evt.end - evt.start)
		// place at parametrized (t) position
		const newPosX = startPos.x + (endPos.x - startPos.x) * paramt
		const newPosY = startPos.y + (endPos.y - startPos.y) * paramt
		const newPosZ = startPos.z + (endPos.z - startPos.z) * paramt
		actor.position.set(newPosX, newPosY, newPosZ)
	},

    rotate: (t, evt) => {
        const actor    = evt.actor
		const startRot = evt.data.startRot
		const endRot   = evt.data.endRot
		const paramt   = (t - evt.start) / (evt.end - evt.start)
		// place at parametrized (t) position
		actor.rotation.x = startRot.x + (endRot.x - startRot.x) * paramt
		actor.rotation.y = startRot.y + (endRot.y - startRot.y) * paramt
		actor.rotation.z = startRot.z + (endRot.z - startRot.z) * paramt
    },

	posture: (t, evt) => {
        const actor  = evt.actor
		let paramt   = (t - evt.start) / (evt.end - evt.start)
		if (evt.instant) paramt = 1.0
		// posture = [{position: {}}, {t_leg: [{raise: 20}, {turn: 20}]}, ...]
		const bodyParts = [
			'pelvis', 'torso', 'neck', 'head',
			'l_arm', 'l_elbow', 'l_wrist', 'r_arm', 'r_elbow', 'r_wrist',
			'l_leg', 'l_knee', 'l_ankle', 'r_leg', 'r_knee', 'r_ankle'
		]
		const posture = evt.data.posture
		posture.forEach((pos) => {
			if ('position' in pos) {
				if (pos.position.x) actor.position.x = pos.position.x * paramt
				if (pos.position.y) actor.position.y = pos.position.y * paramt
				if (pos.position.z) actor.position.z = pos.position.z * paramt
			} else if ('rotation' in pos) {
				if (pos.rotation.x) actor.rotation.x = pos.rotation.x * paramt
				if (pos.rotation.y) actor.rotation.y = pos.rotation.y * paramt
				if (pos.rotation.z) actor.rotation.z = pos.rotation.z * paramt
			} else if ('bend' in pos) {
				actor.bend = pos.bend * paramt
			} else if ('turn' in pos) {
				actor.turn = pos.turn * paramt
			} else {
				for (let key in pos) { // should be one key only	
					if (bodyParts.includes(key)) {
						const changes = pos[key]
						changes.forEach((change) => {
							for (let subk in change) {
								actor[key][subk] = change[subk] * paramt
							}
						})
					}
				}
			}
		})
	},

	animateInfluence: (t, evt) => {
		// influences = [{id: <influence_id>, startParam: <val>, endParam: <val>}, ...]
		const infs   = evt.data.influences
		const paramt = (t - evt.start) / (evt.end - evt.start) // 0 <= paramt <= 1
		const head   = evt.actor
		const targetInfs = head.morphTargetInfluences
		infs.forEach((infObj) => {
			const id       = infObj.id
			const start    = infObj.startParam
			const end      = infObj.endParam
			const infVal   = start + (end - start) * paramt
			targetInfs[id] = infVal
		})
	},
}

export { VideoActions }