let pullDate = args.shortcutParameter
let now = new Date()
let dayOfWeek = now.getDay()

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
const groups = await ContactsGroup.all(container)

let ggGroup = null
let gcGroup = null

groups.forEach( group => {
    if (group.name === 'Gingin Chiro Clinic') {
        ggGroup = group
    } else if (group.name === 'Green Chiropractic') {
        gcGroup = group
    }
})

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
      let hasEmail = contact.emailAddresses.length
      
      pList.push({
        firstName: firstName,
        name: `${firstName} ${lastName}`,
        number: contact.phoneNumbers[0].value ? contact.phoneNumbers[0].value : '0433772956',
        contactExists: true,
        smsBody: hasEmail ? `Hay ${firstName}!\n\nThis is a friendly meow reminder for your appointment ${pullDate === 'today' ? 'today' : 'tomorrow'} at: ${formatTime(startTime)}.\n\n${factArray[counter] ? `Random fun fact: ${factArray[counter]}` : null}\n🙂🦄` : `Hay ${firstName}!\n\nThis is a friendly meow reminder for your appointment ${pullDate === 'today' ? 'today' : 'tomorrow'} at: ${formatTime(startTime)}.\n\n${factArray[counter] ? `Random fun fact: ${factArray[counter]}` : null}\n\nAlso, unfortunately I don't have your email in my system 🤖 may I please have your email address? Thank you! 🙂🦄`
        
      })
      
      counter = counter < 2 ? counter + 1 : counter = 0
    
    if (pullDate === 'today') {
        if (dayOfWeek === 2 || dateOfWeek === 4) {
            contact.organizationName = 'Gingin Chiro Clinic'
            Contact.update(contact)
            ggGroup.addMember(contact)
        }
    } else {
        if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5) {
            contact.organizationName = 'Green Chiropractic'
            Contact.update(contact)    
            gcGroup.addMember(contact)
        }
 }   
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
            smsBody: `Hay ${event.title.match(/\w+/)[0]}!\n\nThis is a friendly reminder for your appointment ${pullDate === 'today' ? 'today' : 'tomorrow'} at: ${formatTime(event.startDate)}.\n\n${factArray[counter] ? `Random fun fact: ${factArray[counter]}` : null}\n🙂🦄`,
//             contactExists: false
      })
    }
})

Contact.persistChanges()

console.log( pList)

Script.setShortcutOutput(pList)

Script.complete()
