// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
export class Event {
  static evtCount = 1
  constructor(start, end, actor, data) {
    this.ID = Event.evtCount
    this.start = start   // duration start
    this.end = end     // duration end
    this.actor = actor
    this.data = data || {}
    this.status = 'ready'
    this.data.t0 = null
    // Increment evtCount
    Event.evtCount++
  }
  static incrementEvtCount() {
    Event.evtCount++
  }
}

export class EventStream {
  constructor() {
    this.all_events_map = {}
  }
  getEvent(evtId) {
    return this.all_events_map[evtId]
  }
  addEvent(evt) {
    this.all_events_map[Event.evtCount] = evt
  }
  deleteEvent(evtId) {
    delete this.all_events_map[evtId]
  }
  getAllEvents() {
    return this.all_events_map
  }
  clearStream() {
    this.all_events_map = {}
  }
}
