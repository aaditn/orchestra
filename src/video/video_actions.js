import { sin } from '../../libs/mannequin'

//-------- START VideoActions --------//
const VideoActions = {

    walk: (t, evt, reset) => {
        const actor = evt.data.actor
		const t0    = evt.t0 || 0 // start from a 0 position (t-t0)
		// walking motion
		if (! reset) {
			const sint = sin(4 * (t-t0))
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
        const actor = evt.data.actor
		const t0    = evt.t0 || 0
		// walking motion
		if (! reset) {
			actor.torso.bend = 45 + 45 * sin(2 * (t-t0))
		} else {
			actor.torso.bend = 0
		}
	},

	// move instantly, no transition
	move: (t, evt) => {
        const actor    = evt.data.actor
		const endPos   = evt.data.endPos
		actor.position.set(endPos.x, endPos.y, endPos.z)
	},

    translate: (t, evt) => {
        const actor    = evt.data.actor
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
        const actor    = evt.data.actor
		const startRot = evt.data.startRot
		const endRot   = evt.data.endRot
		const paramt   = (t - evt.start) / (evt.end - evt.start)
		// place at parametrized (t) position
		actor.rotation.x = startRot.x + (endRot.x - startRot.x) * paramt
		actor.rotation.y = startRot.y + (endRot.y - startRot.y) * paramt
		actor.rotation.z = startRot.z + (endRot.z - startRot.z) * paramt
    },
}

export { VideoActions }