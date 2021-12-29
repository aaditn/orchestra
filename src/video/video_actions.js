import { sin } from '../../libs/mannequin'

//-------- START VideoActions --------//
const VideoActions = {

    walk: (t, evt) => {
        const actor = evt.data.actor
		// walking motion
		actor.l_leg.raise = 30 * sin(4 * t)
		actor.r_leg.raise = -30 * sin(4 * t)
		actor.l_arm.raise = -30 * sin(4 * t)
		actor.r_arm.raise = 30 * sin(4 * t)
	},

    translate: (t, evt) => {
        const actor    = evt.data.actor
		const startPos = evt.data.startPos
		const endPos   = evt.data.endPos
		const deltaT   = t - evt.start
		const totalT   = evt.end - evt.start
		// place at parametrized (t) position
		const newPosX = startPos.x + (endPos.x - startPos.x) * deltaT / totalT
		const newPosY = startPos.y + (endPos.y - startPos.y) * deltaT / totalT
		const newPosZ = startPos.z + (endPos.z - startPos.z) * deltaT / totalT
		actor.position.set(newPosX, newPosY, newPosZ)
	},

    rotate: (t, evt) => {
        const actor    = evt.data.actor
		const startRot = evt.data.startRot
		const endRot   = evt.data.endRot
		const deltaT   = t - evt.start
		const totalT   = evt.end - evt.start
		// place at parametrized (t) position
		const newRotX = startRot.x + (endRot.x - startRot.x) * deltaT / totalT
		const newRotY = startRot.y + (endRot.y - startRot.y) * deltaT / totalT
		const newRotZ = startRot.z + (endRot.z - startRot.z) * deltaT / totalT
		actor.rotation.x = newRotX
		actor.rotation.y = newRotY
		actor.rotation.z = newRotZ
    },
}

export { VideoActions }