export class Clock {
  constructor() {
    this.t0 = null
    this.startTime = 0
    this.stopTime = 0
    this.activeTime = 0
    this.inactiveTime = 0
  }
  start() {
    this.t0 = performance.now() / 1000.0
    this.startTime = this.t0
    this.stopTime  = this.t0
  }
  getElapsedTime() {
    return (performance.now() / 1000.0 - this.t0 - this.inactiveTime)
  }
}

// if start >= end, event is instant i.e. triggers once at start, goes from ready -> done
// for events with duration, event transition from ready -> active -> done
export class Event {
  constructor(evtStream, start, end, actor, data) {
    this.ID = evtStream.evtCount
    this.start = start   // duration start
    this.end = end     // duration end
    this.actor = actor
    this.status = 'ready'
    this.iter = 0
    this.data = data || {}
    this.data.t0 = null
  }
}

export class EventStream {
  constructor() {
    this.all_events = {}
    this.active_events = {}
    this.sorted_event_ids = []
    this.evt_count  = 0
    this.curr_ptr   = 0
  }

  get all() { return this.all_events }
  set all(eventHash) { this.all_events = eventHash }
  get active() { return this.active_events }
  set active(eventHash) { this.active_events = eventHash }
  get evtCount() { return this.evt_count }
  set evtCount(count) { this.evt_count = count }
  get sortedEvents() { return this.sorted_event_ids }
  set sortedEvents(sortedEventIds) { this.sorted_event_ids = sortedEventIds }
  get currPtr() { return this.curr_ptr }
  set currPtr(ptr) { this.curr_ptr = ptr }

  setSortedEvents() { // call after all events loaded
    let eventIds = Object.keys(this.all_events)
    this.sorted_event_ids = eventIds.sort((evtId1, evtId2) => {
      return this.all_events[evtId1].start - this.all_events[evtId2].start
    })
  }
  addEvent(evt) {
    this.all_events[this.evt_count] = evt
    this.evt_count++
  }
  deleteEvent(evtId) { delete this.all_events[evtId] }
  deleteActiveEvent(evtId) { delete this.active_events[evtId] }
  computeCurrPtr(t) { // Approximate only - not an exact curr_ptr
    // search forward
    for (let i = 0; i < this.sorted_event_ids.length; i++) {
      const evt = this.all_events[this.sorted_event_ids[i]]
      if (evt) {
        if (Math.abs(evt.start - t) < 0.1) {
          this.curr_ptr = i
          break;
        }
      }
    }
  }
  cacheActive(bts, fts) { // backward, forward timestamps to cache
    // start from curr_ptr and move backward, forward
    let done = false
    let ptr  = this.curr_ptr
    while (ptr >= 0 && !done) { // look backward
      const evt = this.all_events[this.sorted_event_ids[ptr]]
      if (!evt || evt.start <= bts) {
        done = true
      } else {
        if (evt.status != 'done' && evt.start >= bts && !(evt.ID in this.active_events)) {
          this.active_events[evt.ID] = evt
        }
      }
      ptr--
    }
    done = false
    ptr  = this.curr_ptr
    let len = this.sorted_event_ids.length
    while (ptr < len && !done) { // look backward
      const evt = this.all_events[this.sorted_event_ids[ptr]]
      if (!evt || evt.start >= fts) {
        done = true
      } else {
        if (evt.status != 'done' && evt.start <= fts && !(evt.ID in this.active_events)) {
          this.active_events[evt.ID] = evt
        }
      }
      ptr++
    }
    // console.log("CACHELEN = ", Object.keys(this.active_events).length)
  }
}