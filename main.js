let pullDate = args.shortcutParameter

async function getFact() {
  let url = "https://uselessfacts.jsph.pl/random.json?language=en"
  let r = new Request(url)
  let json = await r.loadJSON()
    return json.text
}

let cal = await Calendar.defaultForEvents()
let calByTitle = await Calendar.forEventsByTitle("GG/GC Chiropractic")

let pList = []
let patientArray = []
let container = await ContactsContainer.all()
let contacts = await Contact.all(container)

let counter = 0
let events

if (pullDate === "today") {
    events = await CalendarEvent.today([calByTitle])
} else {
    events = await CalendarEvent.tomorrow([calByTitle])
  }

factArray = []
for (let i = 0; i < 3; i++) {
    factArray.push(await getFact())
}

function hours12(date) { return (date.getHours() + 24) % 12 || 12 }
function minutes12(date) { if (date.getMinutes() === 0) { return "00" } else { return date.getMinutes() } }

function formatTime(startTime) {
  return `${hours12(startTime)}:${minutes12(startTime)}`
}

events.forEach(eventName => {
  let isInitial = eventName.title.toLowerCase().includes('initial')
  let isConcession = eventName.title.toLowerCase().match(/\sc$/)
  let eventNameFormatted
  if (isInitial || isConcession) {
    eventNameFormatted = eventName.title.match(/.*(?=\W\w*$)/)[0]
  } else { 
    eventNameFormatted = eventName.title
  }
  let firstName = eventNameFormatted.match(/(^\w+)/)[0]
  let lastName = eventNameFormatted.match(/(?!\w+\s).*/)[0].trim()

  let startTime = eventName.startDate

  contacts.forEach( contact => {
    
  if (contact.familyName === lastName.toString() && contact.givenName === firstName.toString()) {

    if (contact.phoneNumbers.length === 1) {  
      if (!patientArray.includes(eventName.title)) {

      patientArray.push(eventName.title)
      
      pList.push({
        firstName: firstName,
        name: `${firstName} ${lastName}`,
        number: contact.phoneNumbers[0].value,
        startTime: formatTime(startTime),
        randomFact: factArray[counter] ? `\nRandom fun fact: ${factArray[counter]}` : null
      })
      
      counter = counter < 2 ? counter + 1 : counter = 0
    }
     }
  }
})
})

events.forEach( event => {
  let isInitial = event.title.toLowerCase().includes('initial')
    if (isInitial) {
    event.title = event.title.match(/.*(?=\W\w*$)/)[0]
    }
    if (!patientArray.includes(event.title)) {
        pList.push({
            firstName: event.title.match(/\w+/)[0],
            number: '0433772956',
            startTime: formatTime(event.startDate),
            randomFact: null
      })
    }
})

console.log( pList)

Script.setShortcutOutput(pList)

Script.complete()
