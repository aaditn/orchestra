// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
export class Event {
  static evtCount = 1
  constructor(id, start, end, actor, data) {
    this.ID = id // Event.evtCount++
    this.start = start   // duration start
    this.end = end     // duration end
    this.actor = actor
    this.data = data || {}
    this.status = 'ready'
    this.data.t0 = null
  }
}

export class EventStream {
  constructor() {
    this.map = {}
  }
  add(evt) {
    this.map[Event.evtCount] = evt
    Event.evtCount++
  }
}
