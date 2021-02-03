let pullDate = args.shortcutParameter
let now = new Date()
let dayOfWeek = now.getDay()
let wordFilter = ['cx:', 'check:', 'birthday', 'lunch', 'rent', 'coming', 'open', 'closed', 'school']

async function getFacts(amount) {
//  let url = "https://uselessfacts.jsph.pl/random.json?language=en"    
  let url = `https://cat-fact.herokuapp.com/facts/random?animal_type=cat&amount=${amount + 6}`
  let r = new Request(url)
  let facts = await r.loadJSON()
  return facts.map(fact => fact.text)
}

let cal = await Calendar.defaultForEvents()
let calByTitle = await Calendar.forEventsByTitle("GG/GC Chiropractic")

let pList = []
let patientArray = []
let container = await ContactsContainer.all()
let contacts = await Contact.all(container)

let counter = 0
let events = pullDate === 'today' ? await CalendarEvent.today([calByTitle]) : await CalendarEvent.tomorrow([calByTitle])

factArray = await getFacts(events.length)

function hours12(date) { return (date.getHours() + 24) % 12 || 12 }
function minutes12(date) { if (date.getMinutes() === 0) { return "00" } else { return date.getMinutes() } }

function formatTime(startTime) {
  return `${hours12(startTime)}:${minutes12(startTime)}`
}

function formatSMSBody(pullDate, formattedEvent, catFact, hasEmail) {
  const signature = '🍐😸'
  const greeting = `Hay ${formattedEvent.firstName}!`
  const mainMessage = `This is a friendly meow reminder for your appointment ${pullDate === 'today' ? 'today' : 'tomorrow'} at: ${formatTime(formattedEvent.startTime)}.`
  const appendCatFact = `Random Cat Fact: ${catFact}`
//   const announcement = `\nAs you may already be aware, Perth metro is under Lockdown until Friday 6pm.\nJust like in March last year, essential health workers are able to keep working (with masks). However, if you are feeling *any* respiratory symptoms, please let me know immediately so we can reschedule your appointment.\n\nAside from that, please use the sanitiser provided when you come in, and practice social distancing. \nIf you would like to reschedule your appointment, please let me know and I can shift you to the same time next week. \n\nAll hail the almighty Mark McGowan!`
// const announcement = `\n\nLOCKDOWN UPDATE: THE FOLLOWING DOES NOT APPLY TO GINGIN\n\nAs you may already be aware, Perth metro is under Lockdown until Friday 6pm.\nJust like in March last year, essential health workers are able to keep working (with masks). However, if you are feeling *any* respiratory symptoms, please let me know immediately so we can reschedule your appointment.\n\nAside from that, please use the sanitiser provided when you come in, and practice social distancing. \nIf you would like to reschedule your appointment, please let me know and I can shift you to the same time next week. \n\nAll hail the almighty Mark McGowan!`  
const announcement = `\n\nAs you may already be aware, Perth metro is under Lockdown until Friday 6pm.\nJust like in March last year, essential health workers are able to keep working (with masks). However, if you are feeling *any* respiratory symptoms, please let me know immediately so we can reschedule your appointment.\n\nAside from that, please use the sanitiser provided when you come in, and practice social distancing. \nIf you would like to reschedule your appointment, please let me know and I can shift you to the same time next week. \n\nAll hail the almighty Mark McGowan!`  
const requestEmail = `\n\nAlso, unfortunately I don't have your email in my system 🤖 may I please have your email address? Thank you! `
const messageFooter = `${hasEmail ? '' : requestEmail}${announcement}\n${signature}`

  return `${greeting}\n\n${mainMessage}\n\n${appendCatFact}${messageFooter}`
}

function formatEvent(event) {
  const startTime = event.startDate
  const eventName = event.title
  const isInitial = eventName.toLowerCase().includes('initial')
  const isConcession = eventName.toLowerCase().match(/\sc$/)
  const eventNameFormatted = isInitial || isConcession ? eventName.match(/.*(?=\s\w+$)/)[0] : eventName

  let firstName = eventNameFormatted.match(/(^\w+)/)[0]
  firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  let lastName = eventNameFormatted.match(/(?!\w+\s).*/)[0].trim()
  lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1)

  return { firstName, lastName, startTime, eventName }
}


events.forEach(event => {
  const formattedEvent = formatEvent(event)
  const catFact = factArray[counter].match(/\w+/g).length >= 2 ? factArray[counter] : factArray[counter + 1]
  let hasEmail = false
  const isFilteredEvent = !formattedEvent.eventName.toLowerCase().split(' ').some(word => wordFilter.indexOf(word))
  
  if (!isFilteredEvent) {
      contacts.forEach( contact => {
      
      if (contact.familyName === formattedEvent.lastName && contact.givenName === formattedEvent.firstName) {

        if (contact.phoneNumbers.length === 1) { 

          if (!patientArray.includes(formattedEvent.eventName)) {  
          console.log(formattedEvent.eventName)
          patientArray.push(formattedEvent.eventName)
          hasEmail = contact.emailAddresses.length
          
          pList.push({
            number: contact.phoneNumbers[0].value ? contact.phoneNumbers[0].value : '0433772956',
            smsBody: formatSMSBody(pullDate, formattedEvent, catFact, hasEmail)
          })

          counter ++

          }
        }
      }
    })
  }

  if (!patientArray.includes(formattedEvent.eventName) && isFilteredEvent) {
    console.log(`CONTACT NOT FOUND: ${formattedEvent.eventName}`)
    pList.push({
      number: '0433772956',
      smsBody: formatSMSBody(pullDate, formattedEvent, catFact, hasEmail)
    })

    counter ++
  }
})

console.log( pList)

Script.setShortcutOutput(pList)
Script.complete()