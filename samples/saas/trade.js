/* Orbit Assistants: the six trades plus a front-desk fallback. One content set per trade, shared by the main page
   ("Tell it your business") and the six trade pages (clinic.html, salon.html, restaurant.html, real-estate.html,
   construction.html, store.html).
     window.OrbitTrades.order              ['clinic','salon','restaurant','realestate','construction','store']
     window.OrbitTrades.byId[id]           content set (see the clinic entry for the fields)
     window.OrbitTrades.classify(text)     { id, noun, city, generic, score } or null ("a dental clinic in Pune")
     window.OrbitTrades.headline(t, city, noun)   "Your Pune dental clinic, answering at 11:42 pm."
     window.OrbitTrades.hinglish(text)     { text: English the engine reads, lang: 'Hinglish' | 'English', hits }
     window.OrbitTrades.colors(id)         { acc, ink, deep, tx, soft } for CSS variables
   No network, no DOM. */
(function () {
  'use strict';
  var COL = {
    clinic: { acc: '#60A5FA', ink: '#041528', deep: '#0A1626', tx: '#1D4ED8', soft: '#DDE8FD' },
    salon: { acc: '#F0A5C8', ink: '#2A0A1A', deep: '#24101B', tx: '#BE185D', soft: '#FCE4EF' },
    restaurant: { acc: '#E8B04B', ink: '#241700', deep: '#211708', tx: '#8A5205', soft: '#FBEFCF' },
    realestate: { acc: '#5EEAD4', ink: '#04201B', deep: '#07201E', tx: '#0B6B64', soft: '#D9F7F1' },
    construction: { acc: '#F59E4B', ink: '#241100', deep: '#1D130A', tx: '#9A4408', soft: '#FDEBD6' },
    store: { acc: '#C8FF4D', ink: '#0A1000', deep: '#10150A', tx: '#4A6000', soft: '#EEF8CF' },
    front: { acc: '#47E3A5', ink: '#04221A', deep: '#082A20', tx: '#08724C', soft: '#DDFBEF' }
  };

  var T = {
    clinic: {
      id: 'clinic', agent: 'clinic', page: 'clinic.html', label: 'Clinic', plural: 'clinics', noun: 'clinic', people: 'patients',
      biz: 'Calder Clinic', mark: 'CC', city: 'Bengaluru', ch: 'whatsapp', staff: { name: 'Meera', role: 'front desk' },
      kw: ['dental clinic', 'dentist', 'dental', 'clinic', 'polyclinic', 'hospital', 'doctor', 'doctors', 'physio', 'physiotherapy', 'physiotherapist', 'dermatologist', 'derma', 'skin clinic', 'eye clinic', 'eye hospital', 'ent clinic', 'paediatric', 'pediatric', 'paediatrician', 'pediatrician', 'gynaecologist', 'gynecologist', 'diagnostic centre', 'diagnostic', 'diagnostics', 'path lab', 'pathology', 'nursing home', 'ayurveda', 'ayurvedic', 'homeopathy', 'homeopath', 'vet', 'veterinary', 'pet clinic', 'ivf', 'fertility', 'orthopaedic', 'orthopedic', 'cardiologist', 'medical centre', 'medical center', 'healthcare', 'therapist', 'therapy', 'psychologist', 'counsellor'],
      nouns: ['dental clinic', 'skin clinic', 'eye clinic', 'pet clinic', 'vet clinic', 'veterinary clinic', 'physiotherapy clinic', 'dermatology clinic', 'eye hospital', 'fertility clinic', 'ivf clinic', 'ent clinic', 'diagnostic centre', 'nursing home', 'medical centre', 'polyclinic', 'hospital', 'clinic', 'physio clinic', 'ivf centre'],
      sub: 'It books, moves and reminds on WhatsApp at any hour, and never gives medical advice. Patients get a slot by midnight; your front desk gets the bookings at 9:05 am.',
      questions: ['Dentist tomorrow evening?', 'Move my appointment to Friday', 'Earliest skin doctor this week', 'Fee for a dental cleaning?', 'Kal shaam 6 baje dentist chahiye', 'Is this swelling serious?'],
      meter: 'parso subah 11 baje dentist chahiye, 2 logon ke liye',
      figures: [['7 in 10', 'booking requests arrive after 7 pm'], ['11 s', 'median first reply, day or night'], ['1 in 5', 'no-shows saved by the night-before reminder']],
      flows: [
        { t: 'Book an appointment', d: 'Picks the doctor by what needs treating, offers the next two slots and books it in under a minute.', q: 'dentist tomorrow evening' },
        { t: 'Move or cancel', d: 'Finds the booking, moves it in two taps and puts the old slot back on the calendar.', q: 'can I move my appointment to Friday?' },
        { t: 'Earliest slot', d: 'When it can’t wait, it shows the first free slot across every doctor who treats it.', q: 'earliest skin doctor this week' },
        { t: 'Fees and insurance', d: 'Answers from the FAQ your front desk edits: consult fees, cashless insurance, parking, timings.', q: 'how much is a dental cleaning?' },
        { t: 'Hands over anything clinical', d: 'Symptoms, reports and emergencies go to a person with the chat attached. It never gives medical advice.', q: 'is this swelling serious?' }
      ],
      story: {
        who: 'Ritu Sharma', first: 'Ritu', ch: 'whatsapp',
        m1: 'Tooth pain since evening. Can I see a dentist tomorrow?',
        r1: 'Sorry about the pain, Ritu. Dr Anil Rao has 9:30 am or 6:30 pm tomorrow. If there’s swelling with a fever, please go to emergency now.',
        card: { title: 'Dr Anil Rao', meta: 'Dentist · 12 years', price: '₹700 consult' },
        m2: '9:30 please. Will I need a root canal?',
        r2: 'Booked for 9:30 am. Dr Rao will check and tell you; I can’t say from here. Reminder at 8 am.',
        booking: { h: 'Appointment booked', day: 'Tomorrow', time: '9:30 am', where: 'Dr Anil Rao · Dental', ref: 'CC-3107' },
        crm: [{ name: 'Ritu Sharma', need: 'Tooth pain, root canal?', src: 'WhatsApp', stage: 'Booked 9:30', hot: true }, { name: 'Arjun Pillai', need: 'Skin consult', src: 'Web chat', stage: 'Booked', time: 'Tue' }, { name: 'Sneha Rao', need: 'Physio, 6 sessions', src: 'Instagram', stage: 'New', time: 'Mon' }],
        rank: { q: 'Who needs a call before 9:30?', items: [['Ritu Sharma', 'Pain, booked 9:30 am'], ['Kabir Joshi', 'Report question, wants a doctor'], ['Sneha Rao', 'Still choosing a slot']] },
        head: '11:42 pm. By 9:05 am, a booked root-canal check.',
        caps: ['Ritu writes on WhatsApp.', 'Answered in the same minute.', 'Tomorrow, 9:30 am. Booked.', 'In the clinic CRM, marked urgent.', 'First call of the day. Handed to Meera.']
      },
      inbox: [
        { id: 'k1', who: 'Kabir Joshi', ch: 'whatsapp', status: 'waiting', why: 'Report question', ago: 38, msgs: [['user', 'my blood report says ALT 62, is that bad?'], ['bot', 'That one needs a doctor, so I’m passing you to the front desk with this chat. You won’t need to repeat yourself.']] },
        { id: 'k2', who: 'Ananya Iyer', ch: 'web', status: 'bot', booked: 'Physio · Sat 10:00 am', ago: 412, msgs: [['user', 'physio for my knee, saturday morning'], ['bot', 'Saturday 10:00 am is free with our physiotherapist. Booked, and a reminder goes out on Friday evening.']] },
        { id: 'k3', who: 'Rohit Menon', ch: 'instagram', status: 'human', ago: 95, msgs: [['user', 'running late, can I take the 6:30 slot instead of 6?'], ['agent', 'Done, Rohit. You’re at 6:30 with Dr Iyer.', 'Meera']] }
      ],
      brief: { industry: 'Clinic', channels: ['WhatsApp', 'Web chat'], goals: ['answer FAQs', 'book appointments', 'hand over to my team'] },
      map: 'Your doctors, their timings, fees and the insurance you accept.'
    },

    salon: {
      id: 'salon', agent: 'salon', page: 'salon.html', label: 'Salon', plural: 'salons', noun: 'salon', people: 'clients',
      biz: 'Maison Verve', mark: 'MV', city: 'Bengaluru', ch: 'instagram', staff: { name: 'Anika', role: 'salon manager' },
      kw: ['salon', 'hair salon', 'beauty salon', 'unisex salon', 'spa', 'day spa', 'beauty parlour', 'beauty parlor', 'parlour', 'parlor', 'barber', 'barbershop', 'barber shop', 'nail studio', 'nail salon', 'nails', 'nail bar', 'makeup studio', 'makeup artist', 'bridal studio', 'bridal makeup', 'brow bar', 'lash studio', 'grooming', 'hair studio', 'aesthetics', 'beauty studio', 'tattoo studio', 'tattoo'],
      nouns: ['hair salon', 'beauty salon', 'unisex salon', 'day spa', 'beauty parlour', 'barbershop', 'barber shop', 'nail studio', 'nail salon', 'makeup studio', 'bridal studio', 'brow bar', 'lash studio', 'hair studio', 'beauty studio', 'tattoo studio', 'salon', 'spa', 'parlour'],
      sub: 'It books stylists, rebooks the usual and sells packages on Instagram and WhatsApp, even at 11 pm. Your chairs fill while you sleep; your manager sees the day at 9:05 am.',
      questions: ['Balayage with Anika on Saturday', 'Rebook my usual', 'Haircut and beard trim tomorrow 6pm', 'Do you have packages?', 'Facial for 2 on Friday', 'Kal shaam 7 baje haircut milega?'],
      meter: 'kal shaam 7 baje haircut aur beard trim, 2 logon ke liye',
      figures: [['4 in 10', 'bookings made between 9 pm and midnight'], ['2 taps', 'to rebook the usual'], ['1 in 6', 'chats that add a package']],
      flows: [
        { t: 'Book a stylist', d: 'Service, stylist and slot in one go, with the time each service really takes.', q: 'balayage with Anika on saturday afternoon' },
        { t: 'Rebook the usual', d: 'Remembers the last cut and the stylist, and offers the next free slot.', q: 'rebook my usual' },
        { t: 'Services and prices', d: 'Prices from your own menu, including how long a keratin takes on long hair.', q: 'what are your services and prices?' },
        { t: 'Packages', d: 'Shows the monthly and bridal packages, and saves the lead when someone is keen.', q: 'do you have packages?' },
        { t: 'Reschedule or cancel', d: 'Moves a booking in two taps and offers the freed slot to the waitlist.', q: 'can I move my 4pm cut to Friday?' }
      ],
      story: {
        who: 'Sana Kapoor', first: 'Sana', ch: 'instagram',
        m1: 'Need a bridal trial before the 14th. The wedding’s on the 20th!',
        r1: 'Congratulations, Sana! Isha does our bridal trials: Saturday 7 Dec at 11 am, or Sunday 8 Dec at 3 pm. About 3 hours.',
        card: { title: 'Bridal trial', meta: 'Hair and makeup · 3 h', price: '₹4,500, adjusted in the package' },
        m2: 'Saturday 11 works!',
        r2: 'Booked: Saturday 7 Dec, 11 am with Isha. A prep list comes the day before.',
        booking: { h: 'Trial booked', day: 'Sat 7 Dec', time: '11:00 am', where: 'Isha Kapoor · Bridal', ref: 'MV-2214' },
        crm: [{ name: 'Sana Kapoor', need: 'Bridal trial, package', src: 'Instagram', stage: 'Booked', hot: true }, { name: 'Tara Bose', need: 'Balayage', src: 'WhatsApp', stage: 'Booked', time: 'Tue' }, { name: 'Neel Bose', need: 'Cut and beard', src: 'Web chat', stage: 'New', time: 'Mon' }],
        rank: { q: 'Who should Anika call first?', items: [['Sana Kapoor', 'Bridal, keen on the package'], ['Meera Iyer', 'Wants a Sunday colour slot'], ['Rohan Mehta', 'Asked about prices']] },
        head: '11:42 pm. By 9:05 am, a booked bridal trial.',
        caps: ['Sana writes on Instagram.', 'Answered in the same minute.', 'Saturday, 11 am. Booked.', 'In the salon CRM, marked hot.', 'First call of the day. Handed to Anika.']
      },
      inbox: [
        { id: 's1', who: 'Priya Nair', ch: 'instagram', status: 'waiting', why: 'Allergy question', ago: 22, msgs: [['user', 'I react to some hair dyes. Which colour is safe for me?'], ['bot', 'That needs a person who can see your patch test, so I’m passing you to the team with this chat.']] },
        { id: 's2', who: 'Tara Bose', ch: 'whatsapp', status: 'bot', booked: 'Balayage · Sat 2:00 pm', ago: 390, msgs: [['user', 'balayage saturday 2pm'], ['bot', 'Saturday 2:00 pm with Anika is yours. It takes about 3 hours; come with dry, unwashed hair.']] },
        { id: 's3', who: 'Rohan Mehta', ch: 'web', status: 'human', ago: 70, msgs: [['user', 'group booking for 5 on Sunday, a pre-wedding thing'], ['agent', 'We can do that, Rohan. I’ll hold two chairs from 10 am and send a plan.', 'Anika']] }
      ],
      brief: { industry: 'Salon', channels: ['Instagram', 'WhatsApp'], goals: ['book appointments', 'answer FAQs', 'hand over to my team'] },
      map: 'Your services and how long each takes, your stylists and their days, your packages.'
    },

    restaurant: {
      id: 'restaurant', agent: 'dining', page: 'restaurant.html', label: 'Restaurant', plural: 'restaurants', noun: 'restaurant', people: 'guests',
      biz: 'Tamarind Row', mark: 'TR', city: 'Bengaluru', ch: 'web', staff: { name: 'Rahul', role: 'host' },
      kw: ['restaurant', 'cafe', 'café', 'coffee shop', 'coffee house', 'bistro', 'bar', 'pub', 'brewery', 'microbrewery', 'brewpub', 'bakery', 'patisserie', 'dessert shop', 'cloud kitchen', 'dhaba', 'diner', 'eatery', 'food truck', 'caterer', 'catering', 'pizzeria', 'fine dining', 'lounge', 'canteen', 'sweet shop', 'tea room', 'tea house', 'kitchen and bar', 'steakhouse', 'biryani'],
      nouns: ['fine dining restaurant', 'coffee shop', 'coffee house', 'cloud kitchen', 'dessert shop', 'food truck', 'sweet shop', 'tea room', 'microbrewery', 'brewpub', 'restaurant', 'cafe', 'café', 'bistro', 'bar', 'pub', 'brewery', 'bakery', 'patisserie', 'dhaba', 'diner', 'eatery', 'pizzeria', 'lounge', 'steakhouse'],
      sub: 'It holds tables, runs the waitlist and answers menu questions by diet, on your website and WhatsApp. The 11 pm booking is on the floor plan before your host walks in.',
      questions: ['Table for 6 on Saturday at 8', 'Something vegan and not spicy', 'Private room for 14, birthday', 'Kal raat 8 baje 4 logon ke liye table', 'Gluten free desserts under 400', 'Change my booking to 9 pm'],
      meter: 'kal subah 11 baje table for 6',
      figures: [['1 in 3', 'bookings made after the kitchen closes'], ['90 s', 'to book a table, start to finish'], ['3 of 4', 'menu questions answered without a server']],
      flows: [
        { t: 'Book a table', d: 'Party, date, time and the right table, with the occasion noted for the floor.', q: 'table for 6 on saturday at 8' },
        { t: 'Menu and diets', d: 'Vegan, Jain, gluten free or not spicy, matched dish by dish from your menu.', q: 'something vegan and not spicy' },
        { t: 'Waitlist', d: 'When Saturday is full, it takes a number and messages when a table frees up.', q: 'join the waitlist for saturday' },
        { t: 'Change or cancel', d: 'Moves a booking and gives the table back to the waitlist.', q: 'change my booking to 9 pm' },
        { t: 'Private dining', d: 'Large parties and events go to a person, with the date, size and budget attached.', q: 'private room for 14, birthday' }
      ],
      story: {
        who: 'Vikram Menon', first: 'Vikram', ch: 'web',
        m1: 'Table for 6 tomorrow at 8? It’s my dad’s 60th.',
        r1: 'Happy 60th to him! 8 pm has our window table for 6. Shall I hold it?',
        card: { title: 'Window table', meta: 'Seats 6 · by the tamarind tree', price: 'Tomorrow, 8:00 pm' },
        m2: 'Yes please, and one Jain meal.',
        r2: 'Held for 6 at 8 pm, one Jain thali noted. Want a candle on the dessert?',
        booking: { h: 'Table held', day: 'Tomorrow', time: '8:00 pm', where: 'Window table · party of 6', ref: 'TR-0907' },
        crm: [{ name: 'Vikram Menon', need: '60th birthday · 6', src: 'Web chat', stage: 'Confirmed', hot: true }, { name: 'Farah Khan', need: 'Private room, 14', src: 'Instagram', stage: 'Needs a person', time: 'Tue' }, { name: 'Dev Sharma', need: 'Waitlist, Saturday', src: 'WhatsApp', stage: 'Waiting', time: 'Mon' }],
        rank: { q: 'Who needs a call before service?', items: [['Farah Khan', 'Private room for 14'], ['Vikram Menon', 'Birthday, candle on dessert'], ['Dev Sharma', 'Waitlist for Saturday']] },
        head: '11:42 pm. By 9:05 am, a table held for a 60th.',
        caps: ['Vikram writes on your website.', 'Answered in the same minute.', 'Tomorrow, 8 pm. Held.', 'On the floor plan, birthday noted.', 'First call of the day. Handed to Rahul.']
      },
      inbox: [
        { id: 'r1', who: 'Farah Khan', ch: 'instagram', status: 'waiting', why: 'Private dining', ago: 31, msgs: [['user', 'private room for 14 on the 21st, budget around 40k'], ['bot', 'A private room for 14 needs a person to confirm, so I’m passing this to our host with the date and budget.']] },
        { id: 'r2', who: 'Dev Sharma', ch: 'whatsapp', status: 'bot', booked: 'Waitlist · Sat, party of 4', ago: 520, msgs: [['user', 'saturday 8pm for 4?'], ['bot', 'Saturday 8 pm is full. You’re on the waitlist; I’ll message the moment a table for 4 frees up.']] },
        { id: 'r3', who: 'Neha Kulkarni', ch: 'web', status: 'human', ago: 64, msgs: [['user', 'my friend has a nut allergy, is the kofta safe?'], ['agent', 'Good you asked, Neha. The kofta has cashew; I’ll have the kitchen make the dal and greens without nuts.', 'Rahul']] }
      ],
      brief: { industry: 'Restaurant', channels: ['Web chat', 'WhatsApp'], goals: ['book appointments', 'answer FAQs', 'hand over to my team'] },
      map: 'Your tables and covers, the menu with diets marked, your service hours.'
    },

    realestate: {
      id: 'realestate', agent: 'realty', page: 'real-estate.html', label: 'Real estate', plural: 'real estate teams', noun: 'brokerage', people: 'buyers and tenants',
      biz: 'Alderway Homes', mark: 'AH', city: 'Bengaluru', ch: 'whatsapp', staff: { name: 'Kiran', role: 'sales' },
      kw: ['real estate', 'realty', 'property', 'properties', 'broker', 'brokerage', 'estate agent', 'estate agency', 'property dealer', 'realtor', 'real estate agency', 'developer', 'property developer', 'homes', 'flats', 'apartments', 'villas', 'plots', 'rentals', 'rental', 'pg', 'co-living', 'coliving', 'leasing', 'commercial space', 'housing'],
      nouns: ['real estate agency', 'real estate company', 'real estate firm', 'realty firm', 'property firm', 'property developer', 'estate agency', 'property dealer', 'brokerage', 'real estate office', 'agency', 'developer', 'co-living', 'coliving'],
      sub: 'It finds homes from a typed brief and books the visit on WhatsApp at midnight. Your agents start the day with qualified, booked buyers, ranked.',
      questions: ['3 BHK in Indiranagar under 1.5 lakh a month', '4 BHK villa for sale under 5 Cr', 'Can I see it on Sunday?', '2 BHK to rent near Koramangala, budget 60k', 'Whitefield mein 3 BHK kitne ka hai?', 'Can the owner come down on rent?'],
      meter: 'kal shaam 6 baje 3 BHK dekhna hai, 1.5 lakh tak',
      figures: [['85%', 'of chats finished without a person'], ['6 in 10', 'visit requests arrive after 8 pm'], ['2 min', 'from first message to a booked visit']],
      flows: [
        { t: 'Find a home', d: 'Reads “3 BHK under 1.5 lakh, furnished” and sends the homes that fit, with photos.', q: '3 BHK in Indiranagar under 1.5 lakh a month' },
        { t: 'Book a visit', d: 'Offers the open slots, verifies the phone, books the visit and queues a reminder.', q: 'book a visit for sunday' },
        { t: 'Price check', d: 'Gives the going range for a locality and size, from your own listings.', q: 'what is the price range for 3 BHK in Whitefield?' },
        { t: 'Save a search', d: 'Saves the brief and alerts the buyer when a new home matches.', q: 'save a search alert' },
        { t: 'Price talk goes to an agent', d: 'Negotiation, ownership and legal questions go to a person with the whole chat.', q: 'can the owner come down on the rent?' }
      ],
      story: {
        who: 'Priya Nair', first: 'Priya', ch: 'whatsapp', img: 'interior/photos/room-2.jpg',
        m1: '3 BHK in Indiranagar under 1.5 lakh a month',
        r1: 'Two homes fit. Lakeview Court, ₹1.35 L a month.',
        card: { title: 'Lakeview Court', meta: '3 BHK · furnished', price: '₹1.35 L a month' },
        m2: 'Can I see one on Saturday?',
        r2: 'Saturday 11 am is free. Booked for you.',
        booking: { h: 'Visit booked', day: 'Saturday', time: '11:00 am', where: 'Lakeview Court', ref: 'AV-4821' },
        crm: [{ name: 'Priya Nair', need: '3 BHK, Indiranagar', src: 'WhatsApp', stage: 'Visit booked', hot: true }, { name: 'Rohan Mehta', need: 'Plot, Whitefield', src: 'Web chat', stage: 'Qualified', time: 'Tue' }, { name: 'Sana Qureshi', need: '2 BHK, HSR', src: 'Instagram', stage: 'New', time: 'Mon' }],
        rank: { q: 'Who should I call first?', items: [['Priya Nair', 'Visit booked, Saturday 11 am'], ['Rohan Mehta', 'Asked for a callback'], ['Sana Qureshi', 'Still browsing']] },
        head: '11:42 pm. By 9:05 am, a booked visit.',
        caps: ['Priya writes on WhatsApp.', 'Answered in the same minute.', 'Saturday, 11 am. Booked.', 'Waiting in the CRM, marked hot.', 'Ranked first. Handed to Kiran.']
      },
      inbox: [
        { id: 'e1', who: 'Rohan Mehta', ch: 'web', status: 'bot', booked: 'Search alert · plot, Whitefield', ago: 640, msgs: [['user', 'plot in Whitefield, 30x40, under 1.2 Cr'], ['bot', 'Nothing fits today, so I’ve saved the search. You’ll hear from me the day a 30x40 under ₹1.2 Cr lists.']] },
        { id: 'e2', who: 'Sana Qureshi', ch: 'instagram', status: 'human', ago: 88, msgs: [['user', '2 BHK in HSR, can I bring my dog?'], ['agent', 'Two of our HSR homes allow pets, Sana. I’ll send both and hold Sunday 11 am for a visit.', 'Kiran']] }
      ],
      brief: { industry: 'Real estate', channels: ['WhatsApp', 'Instagram'], goals: ['qualify leads', 'book appointments', 'hand over to my team'] },
      map: 'Your listings and localities, your agents and their areas, visit slots and rules.'
    },

    construction: {
      id: 'construction', agent: 'build', page: 'construction.html', label: 'Construction', plural: 'construction firms', noun: 'firm', people: 'homeowners',
      biz: 'Plinth Stoneworks', mark: 'PS', city: 'Bengaluru', ch: 'instagram', staff: { name: 'Dev', role: 'estimator' },
      kw: ['construction', 'construction company', 'construction firm', 'contractor', 'civil contractor', 'builder', 'builders', 'interior designer', 'interior design', 'interiors', 'renovation', 'remodelling', 'remodeling', 'architect', 'architecture', 'masonry', 'stone', 'tiles', 'tiling', 'flooring', 'waterproofing', 'painting contractor', 'painter', 'carpentry', 'carpenter', 'modular kitchen', 'kitchens', 'home improvement', 'fabrication', 'landscaping', 'landscaper', 'plumber', 'plumbing', 'electrician', 'electrical', 'solar', 'roofing'],
      nouns: ['construction company', 'construction firm', 'civil contractor', 'interior design studio', 'interior designer', 'interiors studio', 'architecture studio', 'architect', 'renovation company', 'modular kitchen studio', 'waterproofing company', 'painting contractor', 'landscaping company', 'contractor', 'builders', 'builder'],
      sub: 'It prices the job in a minute and books the site visit on Instagram and WhatsApp, late at night when homeowners plan. Your estimator starts the day with a brief, not a callback list.',
      questions: ['120 sq ft kitchen in granite, how much?', 'Stone cladding for a 300 sqft wall, budget 2 lakh', 'Granite vs quartz for a worktop', 'Book a site visit for Saturday morning', 'Bathroom remodel kitne ka hoga?', 'How long does a kitchen take?'],
      meter: 'parso subah 10 baje site visit, 120 sq ft kitchen',
      figures: [['5 in 10', 'estimate requests sent after 9 pm'], ['1 min', 'to a price range, before GST'], ['3 of 4', 'site visits that arrive with a brief']],
      flows: [
        { t: 'A price range', d: 'Area, material and finish in, a before-GST range out, from your own rate card.', q: 'how much for a 120 sq ft kitchen in granite?' },
        { t: 'Book a site visit', d: 'Offers the next visit slots and books the estimator with the brief attached.', q: 'book a site visit for saturday morning' },
        { t: 'Compare materials', d: 'Granite or quartz, slate or sandstone: cost, care and how long each lasts.', q: 'granite vs quartz for a worktop' },
        { t: 'Past work', d: 'Shows finished jobs like theirs, by project type.', q: 'show me past kitchens' },
        { t: 'Off the rate card goes to a person', d: 'Structural work and anything it can’t price goes to the team with the brief.', q: 'can you move a load-bearing wall?' }
      ],
      story: {
        who: 'Arjun Rao', first: 'Arjun', ch: 'instagram',
        m1: 'How much to redo a 120 sq ft kitchen in granite?',
        r1: 'About ₹4.3 to ₹6.4 L before GST, depending on the cabinets and the granite you pick. Want a free site visit to firm it up?',
        card: { title: 'Kitchen · 120 sq ft', meta: 'Granite worktop · mid-range cabinets', price: '₹4.3 to ₹6.4 L before GST' },
        m2: 'Saturday morning?',
        r2: 'Booked: Saturday 10 am. Dev will bring granite slabs to choose from.',
        booking: { h: 'Site visit booked', day: 'Saturday', time: '10:00 am', where: 'Kitchen · HSR Layout', ref: 'AC-5530' },
        crm: [{ name: 'Arjun Rao', need: 'Kitchen, 120 sq ft', src: 'Instagram', stage: 'Visit booked', hot: true }, { name: 'Meera Iyer', need: 'Stone cladding', src: 'WhatsApp', stage: 'Range sent', time: 'Tue' }, { name: 'Kabir Rao', need: 'Full home', src: 'Web chat', stage: 'New', time: 'Mon' }],
        rank: { q: 'Who should Dev call first?', items: [['Arjun Rao', 'Visit Saturday, budget clear'], ['Kabir Rao', 'Full home, wants a call'], ['Meera Iyer', 'Cladding, comparing quotes']] },
        head: '11:42 pm. By 9:05 am, a site visit with a budget.',
        caps: ['Arjun writes on Instagram.', 'A price range in the same minute.', 'Saturday, 10 am. Booked.', 'In the CRM, with the brief.', 'First call of the day. Handed to Dev.']
      },
      inbox: [
        { id: 'c1', who: 'Kabir Rao', ch: 'web', status: 'waiting', why: 'Structural work', ago: 44, msgs: [['user', 'we want to add a floor on top of our house, can you do that?'], ['bot', 'Adding a floor needs an engineer’s look, so I’m passing this to the team with your details.']] },
        { id: 'c2', who: 'Meera Iyer', ch: 'whatsapp', status: 'bot', booked: 'Range sent · cladding, 300 sq ft', ago: 600, msgs: [['user', 'stone cladding for a 300 sqft wall, budget 2 lakh'], ['bot', 'That fits the basic tier at about ₹1.8 L; standard is about ₹2.4 L. Want a site visit to firm it up?']] },
        { id: 'c3', who: 'Ishaan Gupta', ch: 'instagram', status: 'human', ago: 120, msgs: [['user', 'can I see a finished bathroom near Jayanagar?'], ['agent', 'Yes, Ishaan. A client in 4th Block is happy to show theirs on Saturday at noon.', 'Dev']] }
      ],
      brief: { industry: 'Construction', channels: ['Instagram', 'WhatsApp', 'Web chat'], goals: ['qualify leads', 'book appointments', 'hand over to my team'] },
      map: 'Your rate card by job and finish, your service areas and the visit calendar.'
    },

    store: {
      id: 'store', agent: 'support', page: 'store.html', label: 'Online store', plural: 'online stores', noun: 'store', people: 'shoppers',
      biz: 'Northlane', mark: 'NL', city: 'Online', ch: 'web', staff: { name: 'Asha', role: 'support' },
      kw: ['online store', 'online shop', 'ecommerce', 'e-commerce', 'd2c', 'dtc', 'shop', 'store', 'boutique', 'clothing brand', 'clothing', 'fashion brand', 'fashion', 'apparel', 'jewellery', 'jewelry', 'shoes', 'sneakers', 'electronics', 'gadgets', 'home decor', 'gift shop', 'bookstore', 'book shop', 'shopify', 'marketplace', 'seller', 'retail', 'brand', 'merch'],
      nouns: ['online store', 'online shop', 'clothing brand', 'fashion brand', 'jewellery brand', 'jewelry brand', 'sneaker store', 'shoe store', 'electronics store', 'home decor store', 'gift shop', 'bookstore', 'boutique', 'd2c brand', 'store', 'shop', 'brand'],
      sub: 'It tracks orders, starts returns and helps with sizes on your website, WhatsApp and Instagram, at any hour. Your support team starts the day with the odd ones only.',
      questions: ['Where’s my order NL-10482?', 'I want to return my jacket', 'White sneakers under $150', 'Is the Harbor Jacket in stock in S?', 'Mera order kab tak aayega?', 'What size should I take?'],
      meter: 'kal subah tak delivery chahiye, 2 jackets size M',
      figures: [['7 in 10', 'support chats are order status or returns'], ['0', 'tickets raised for “where is my order”'], ['1 in 8', 'chats that end in a sale']],
      flows: [
        { t: 'Track an order', d: 'Finds the order by number and says where it is, with the tracking link.', q: 'where is my order NL-10482?' },
        { t: 'Start a return', d: 'Checks the window, takes the reason and issues the return.', q: 'I want to return my jacket' },
        { t: 'Find something', d: 'Turns “white sneakers under 150” into products that are in stock.', q: 'white sneakers under $150' },
        { t: 'Size advice', d: 'Uses the size chart and what they usually wear.', q: 'what size should I take in the Harbor Jacket?' },
        { t: 'Restock alert', d: 'Takes an email and writes the day the size is back.', q: 'tell me when the harbor jacket is back in S' }
      ],
      story: {
        who: 'Neha Joshi', first: 'Neha', ch: 'web',
        m1: 'Where’s my order NL-10482? I need it for Friday.',
        r1: 'It’s out for delivery tomorrow, before 6 pm. Want a WhatsApp message when it’s 3 stops away?',
        card: { title: 'Order NL-10482', meta: 'Harbor Jacket, Sage · size M', price: 'Arrives tomorrow, by 6 pm' },
        m2: 'Yes please. Can I swap it if M is big?',
        r2: 'Yes, free exchange within 30 days. I’ve noted size S as your backup.',
        booking: { h: 'Update set', day: 'Tomorrow', time: 'by 6:00 pm', where: 'NL-10482 · Harbor Jacket', ref: 'Alert on' },
        crm: [{ name: 'Neha Joshi', need: 'Order NL-10482', src: 'Web chat', stage: 'Resolved', hot: true }, { name: 'Aman Verma', need: 'Zip broke, refund', src: 'Instagram', stage: 'Needs a person', time: 'Tue' }, { name: 'Riya Das', need: 'Size exchange', src: 'WhatsApp', stage: 'Return made', time: 'Mon' }],
        rank: { q: 'Which chats need a person?', items: [['Aman Verma', 'Faulty zip, refund asked'], ['Riya Das', 'Exchange to size S'], ['Neha Joshi', 'Resolved, nothing to do']] },
        head: '11:42 pm. By 9:05 am, a question that never became a ticket.',
        caps: ['Neha writes on your website.', 'Answered in the same minute.', 'Tracked, alert set.', 'Logged, no ticket needed.', 'Only the odd one goes to Asha.']
      },
      inbox: [
        { id: 'o1', who: 'Riya Das', ch: 'whatsapp', status: 'bot', booked: 'Return · Harbor Jacket, M to S', ago: 300, msgs: [['user', 'the jacket is too big, can I swap for S?'], ['bot', 'Done: return NL-R-2291 is open and a size S is held for you. The courier collects tomorrow.']] },
        { id: 'o2', who: 'Kunal Shah', ch: 'instagram', status: 'human', ago: 75, msgs: [['user', 'can I change the delivery address? moving tomorrow'], ['agent', 'Sure, Kunal. Send the new address and I’ll update the courier before 10 am.', 'Asha']] }
      ],
      brief: { industry: 'Retail', channels: ['Web chat', 'WhatsApp', 'Instagram'], goals: ['track orders', 'answer FAQs', 'hand over to my team'] },
      map: 'Your catalogue and stock, order status from your store, the returns policy.'
    },

    front: {
      id: 'front', agent: 'front', page: null, label: 'Business', plural: 'businesses', noun: 'business', people: 'customers',
      biz: 'Your business', mark: 'YB', city: '', ch: 'whatsapp', staff: { name: 'Nora', role: 'front desk' }, kw: [], nouns: [],
      sub: 'Orbit answers the late message, books the time or takes the details, and hands your team a tidy list at 9:05 am. Scripted for your business, on your website, WhatsApp and Instagram.',
      questions: ['Are you open on Sunday?', 'How much does it cost?', 'Can I book for tomorrow 11 am?', 'Where are you located?', 'Can someone call me back?', 'Kal subah 11 baje aa sakte hain?'],
      meter: 'kal subah 11 baje aa sakte hain? 2 log',
      figures: [['6 in 10', 'messages arrive outside office hours'], ['11 s', 'median first reply'], ['1 in 4', 'chats that become a booking or a lead']],
      flows: [
        { t: 'Book a time', d: 'Offers open slots, takes the name and number, and confirms.', q: 'can I book for tomorrow 11 am?' },
        { t: 'Opening hours', d: 'Answers timings and holidays from the FAQ your team edits.', q: 'are you open on Sunday?' },
        { t: 'Prices', d: 'Gives the price list, or takes details when a quote is needed.', q: 'how much does it cost?' },
        { t: 'Where to find you', d: 'Address, parking and directions, with a map link.', q: 'where are you located?' },
        { t: 'Call me back', d: 'Takes the number and the reason, and puts it at the top of the morning list.', q: 'can someone call me back?' }
      ],
      story: {
        who: 'Rhea Shah', first: 'Rhea', ch: 'whatsapp',
        m1: 'Are you open tomorrow at 11? I’d like to come in.',
        r1: 'We are, from 10 am to 7 pm, and 11 am is free. Shall I book it for you, Rhea?',
        card: { title: 'Tomorrow, 11:00 am', meta: 'Visit · about 30 min', price: 'Free to book' },
        m2: 'Yes please',
        r2: 'Booked for 11 am. A reminder comes at 9.',
        booking: { h: 'Visit booked', day: 'Tomorrow', time: '11:00 am', where: 'Front desk', ref: 'OR-1142' },
        crm: [{ name: 'Rhea Shah', need: 'Visit tomorrow, 11 am', src: 'WhatsApp', stage: 'Booked', hot: true }, { name: 'Kunal Rao', need: 'Price question', src: 'Web chat', stage: 'Answered', time: 'Tue' }, { name: 'Isha Menon', need: 'Call me back', src: 'Instagram', stage: 'New', time: 'Mon' }],
        rank: { q: 'Who should Nora call first?', items: [['Isha Menon', 'Asked for a call back'], ['Rhea Shah', 'Visiting at 11 am'], ['Kunal Rao', 'Price answered']] },
        head: '11:42 pm. By 9:05 am, a booked visit.',
        caps: ['Rhea writes on WhatsApp.', 'Answered in the same minute.', 'Tomorrow, 11 am. Booked.', 'In the CRM, ready for the morning.', 'First call of the day. Handed to Nora.']
      },
      inbox: [],
      brief: { industry: 'Something else', channels: ['WhatsApp', 'Web chat'], goals: ['answer FAQs', 'book appointments', 'hand over to my team'] },
      map: 'Your services, prices, hours and the questions people ask most.'
    }
  };
  var ORDER = ['clinic', 'salon', 'restaurant', 'realestate', 'construction', 'store'];
  ORDER.concat('front').forEach(function (id) { T[id].color = COL[id]; });

  /* ---------- places: a short list of Indian cities and well-known localities, plus "in <place>" ---------- */
  var CITIES = ['Bengaluru', 'Bangalore:Bengaluru', 'Mumbai', 'Bombay:Mumbai', 'Navi Mumbai', 'Thane', 'Delhi', 'New Delhi', 'Gurugram', 'Gurgaon:Gurugram', 'Noida', 'Ghaziabad', 'Faridabad', 'Pune', 'Hyderabad', 'Secunderabad', 'Chennai', 'Madras:Chennai', 'Kolkata', 'Calcutta:Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi', 'Cochin:Kochi', 'Chandigarh', 'Mohali', 'Indore', 'Bhopal', 'Nagpur', 'Surat', 'Vadodara', 'Baroda:Vadodara', 'Coimbatore', 'Mysuru', 'Mysore:Mysuru', 'Goa', 'Panaji', 'Dehradun', 'Ludhiana', 'Amritsar', 'Visakhapatnam', 'Vizag:Visakhapatnam', 'Bhubaneswar', 'Patna', 'Ranchi', 'Guwahati', 'Mangaluru', 'Mangalore:Mangaluru', 'Nashik', 'Udaipur', 'Jodhpur', 'Agra', 'Varanasi', 'Kanpur', 'Raipur', 'Thiruvananthapuram', 'Trivandrum:Thiruvananthapuram', 'Madurai', 'Vijayawada', 'Shimla', 'Rishikesh', 'Puducherry', 'Pondicherry:Puducherry', 'Siliguri', 'Jammu', 'Srinagar', 'Dubai', 'London', 'Singapore', 'Toronto', 'Sydney', 'New York',
    'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'Bandra', 'Andheri', 'Powai', 'Juhu', 'Colaba', 'Lower Parel', 'Worli', 'Saket', 'Hauz Khas', 'Vasant Kunj', 'Connaught Place', 'Defence Colony', 'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Anna Nagar', 'T Nagar', 'Adyar', 'Salt Lake', 'Park Street', 'Koregaon Park', 'Baner', 'Viman Nagar', 'Kothrud', 'Aundh'];
  var PLACES = CITIES.map(function (c) { var p = c.split(':'); return { re: new RegExp('(^|[^a-z])' + p[0].toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+') + '(?=$|[^a-z])', 'i'), name: p[1] || p[0], len: p[0].length }; }).sort(function (a, b) { return b.len - a.len; });
  var NOTPLACE = /^(my|our|the|a|an|this|that|town|city|area|building|market|mall|home|house|office|india|the city|my area|our area|my city|our city)$/i;

  function clean(t) { return String(t || '').toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9&'\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function title(s) { return String(s).replace(/\b([a-z])/g, function (m, c) { return c.toUpperCase(); }); }
  function stem(w) { return w.length < 4 ? w : w.replace(/ies$/, 'y').replace(/([^s])s$/, '$1'); }

  function placeOf(raw) {
    for (var i = 0; i < PLACES.length; i++) if (PLACES[i].re.test(raw)) return PLACES[i].name;
    var m = String(raw).match(/\b(?:in|at|near|from)\s+([a-z][a-z.'-]{2,20}(?:\s+[a-z][a-z.'-]{2,20})?)\s*[.!?]*$/i);
    if (m && !NOTPLACE.test(m[1].trim())) return title(m[1].trim().toLowerCase());
    return '';
  }
  var FILLER = /^(?:(?:hi|hello|hey|ok|so|well)\b[\s,]*)*(?:(?:i|we)\s+(?:run|own|have|manage|operate|started|am|are)\s+|(?:i'm|we're|im)\s+|it's\s+|its\s+|my\s+|our\s+)*(?:(?:a|an|the|one|two|small|tiny|big|large|new|little|local|family|busy|growing|own|premium|boutique|chain of)\s+)*/i;
  function nounOf(raw, place) {
    var s = clean(raw);
    if (place) s = s.replace(new RegExp('\\b(?:in|at|near|from)?\\s*' + place.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+') + '\\b.*$'), '').trim();
    s = s.replace(/\b(?:in|at|near|from)\b.*$/, '').trim();
    s = s.replace(FILLER, '').replace(/\b(business|company)\b$/, '$1').trim();
    var w = s.split(' ').filter(Boolean).slice(-3);
    var out = w.join(' ');
    if (!out || out.length < 3 || out.length > 28 || /^(a|an|the|my|our|business)$/.test(out)) return '';
    return out;
  }

  var GENERIC = /\s(gym|fitness|studio|school|academy|college|institute|coaching|tuition|classes|hotel|resort|homestay|hostel|guest ?house|villa stay|agency|firm|consultancy|consultants?|practice|office|yoga|pilates|dance|music|travel|tours?|garage|workshop|showroom|dealership|dealer|pharmacy|chemist|optician|opticals|laundry|dry clean\w*|florist|photograph\w*|events?|wedding planner|planner|printing|press|courier|logistics|warehouse|factory|manufactur\w*|distributor|wholesaler|startup|company|business|services?|centre|center|club|venue|hall|lab|labs|kennel|daycare|creche|preschool|playschool|car wash|repairs?|rentals?|insurance|ca firm|accountant|lawyer|law firm|advocate|bank|finance|nbfc|tailor|boutique hotel)\s/i;
  function classify(text) {
    var raw = String(text || '').trim(); if (!raw) return null;
    var s = ' ' + clean(raw) + ' ', toks = clean(raw).split(' ').map(stem), place = placeOf(raw), best = null;
    ORDER.forEach(function (id) {
      var t = T[id], sc = 0, hit = '';
      t.kw.forEach(function (k) {
        var kk = clean(k), ok = s.indexOf(' ' + kk + ' ') >= 0 || (kk.indexOf(' ') < 0 && toks.indexOf(stem(kk)) >= 0);
        if (ok) { var w = 1 + kk.split(' ').length; sc += w; if (kk.length > hit.length) hit = kk; }
      });
      if (sc && (!best || sc > best.score)) best = { id: id, score: sc, hit: hit };
    });
    /* the engine's own tokenizer, when it is on the page, catches plurals and odd spacing ("dentists", "e commerce") */
    var O = window.Orbit;
    if (!best && O && O.nlp && O.nlp.content) {
      var ct = O.nlp.content(raw);
      ORDER.forEach(function (id) { T[id].kw.forEach(function (k) { if (k.indexOf(' ') < 0 && ct.indexOf(O.nlp.stem(k)) >= 0 && !best) best = { id: id, score: 1, hit: k }; }); });
    }
    if (best) {
      var t = T[best.id], noun = t.noun;
      t.nouns.some(function (n) { if (s.indexOf(' ' + clean(n) + ' ') >= 0) { noun = n; return true; } return false; });
      if (noun === t.noun && best.hit && t.nouns.indexOf(best.hit) >= 0) noun = best.hit;
      return { id: best.id, noun: noun, city: place, generic: false, score: best.score };
    }
    var n = nounOf(raw, place);
    /* a front-desk fallback only for something that reads like a business: a known kind, or "we run / I own …" */
    var intro = /\b(?:i|we)\s+(?:run|own|have|manage|operate|started)\b|\b(?:i'm|im|we're)\s+an?\b/i.test(raw);
    if (n && !(GENERIC.test(' ' + n + ' ') || intro)) n = '';
    if (!n) return null;
    return { id: 'front', noun: n, city: place, generic: true, score: 0 };
  }

  function headline(t, city, noun) {
    var n = noun || (t && t.noun) || 'business';
    return 'Your ' + (city ? city + ' ' : '') + n + ', answering at ';
  }

  /* ---------- Hinglish: what the engine reads. Times like "subah 11 baje" become "11 am". ---------- */
  var HI_WORDS = ['kal', 'aaj', 'parso', 'parson', 'subah', 'subha', 'shaam', 'sham', 'raat', 'dopahar', 'dopehar', 'baje', 'bajey', 'chahiye', 'chaiye', 'chahie', 'kitne', 'kitna', 'kitni', 'hai', 'hain', 'mujhe', 'humein', 'hume', 'mera', 'meri', 'mere', 'ke', 'liye', 'log', 'logon', 'logo', 'kya', 'kab', 'kahan', 'kaha', 'abhi', 'karo', 'kar', 'karna', 'dikhao', 'batao', 'milega', 'milegi', 'nahi', 'nahin', 'haan', 'ji', 'wala', 'wali', 'tak', 'sasta', 'bhai', 'yaar', 'saade', 'sawa', 'mein', 'aur', 'aayega', 'aayegi', 'hoga', 'hogi', 'sakte', 'dekhna', 'chalega', 'daant', 'baal', 'dard', 'khana'];
  var STRONG = { baje: 1, bajey: 1, chahiye: 1, chaiye: 1, chahie: 1, kitne: 1, kitna: 1, subah: 1, shaam: 1, parso: 1, logon: 1, milega: 1, aayega: 1, hoga: 1, dekhna: 1, sakte: 1, raat: 1, dopahar: 1 };
  var HIW = {}; HI_WORDS.forEach(function (w) { HIW[w] = 1; });
  function hinglish(text) {
    var raw = String(text || ''), t = ' ' + raw.toLowerCase().replace(/[’`]/g, "'") + ' ', hits = 0, strong = 0;
    t.replace(/[a-z]+/g, function (w) { if (HIW[w]) { hits++; if (STRONG[w]) strong++; } return w; });
    var part = /\b(subah|subha|savere|morning)\b/.test(t) ? 'am' : /\b(dopahar|dopehar|shaam|sham|raat|evening|night)\b/.test(t) ? 'pm' : '';
    /* times: "saade 7 baje" 7:30, "sawa 8" 8:15, "11 baje" with the part of day */
    t = t.replace(/\b(saade|sawa|paune)\s+(\d{1,2})(?:\s*(?:baje|bajey))?\b/g, function (m, k, h) { var hh = +h, mm = k === 'saade' ? '30' : k === 'sawa' ? '15' : '45'; if (k === 'paune') hh = hh - 1 || 12; var ap = part || ((hh >= 8 && hh <= 11) ? 'am' : 'pm'); return ' ' + hh + ':' + mm + ' ' + ap + ' '; });
    t = t.replace(/\b(\d{1,2})(?::(\d{2}))?\s*(?:baje|bajey)\b/g, function (m, h, mm) { var hh = +h, ap = part; if (!ap) ap = (hh >= 8 && hh <= 11) ? 'am' : (hh === 12 ? 'pm' : (hh <= 7 ? 'pm' : '')); return ' ' + hh + (mm ? ':' + mm : '') + (ap ? ' ' + ap : '') + ' '; });
    var R = [
      [/\bparso(n)?\b/g, 'day after tomorrow'], [/\bkal\b/g, 'tomorrow'], [/\baaj\b/g, 'today'], [/\babhi\b/g, 'now'],
      [/\b(subah|subha|savere)\b/g, 'morning'], [/\b(dopahar|dopehar)\b/g, 'afternoon'], [/\b(shaam|sham)\b/g, 'evening'], [/\braat\b/g, 'night'],
      [/\b(\d{1,2})\s*(logon|logo|log|bande)\b/g, '$1 people'], [/\b(do|teen|chaar|paanch|chhe|saat|aath)\s*(logon|logo|log)\b/g, function (m, n) { return { do: 2, teen: 3, chaar: 4, paanch: 5, chhe: 6, saat: 7, aath: 8 }[n] + ' people'; }],
      [/\b(ke liye|keliye|ke lie|ke liyea)\b/g, 'for'], [/\b(chahiye|chaiye|chahie|chahte hain|chahta hoon|chahti hoon)\b/g, 'want'],
      [/\b(kitne ka hoga|kitne ka hai|kitna hoga|kitna hai|kitne ka|kitne paise|kya rate hai|rate kya hai|price kya hai|kitna lagega|kitne lagenge)\b/g, 'how much is it'],
      [/\bkab tak\b/g, 'by when'], [/\b(aayega|aayegi|aaega|aaegi|pahunchega)\b/g, 'arrive'], [/\bkab\b/g, 'when'], [/\b(kahan|kaha)\b/g, 'where'],
      [/\b(mera|meri|mere)\b/g, 'my'], [/\b(mujhe|humein|hume|hamein)\b/g, 'i'],
      [/\b(\d+(?:\.\d+)?\s*(?:k|lakh|lac|l|cr|crore)?)\s+tak\b/g, 'under $1'], [/\btak\b/g, 'by'],
      [/\bbook kar(o|do|dijiye|na|denge)?\b/g, 'book'], [/\bcancel kar(o|do|dijiye|na)?\b/g, 'cancel'], [/\b(dikhao|dikha do|dikhaiye)\b/g, 'show me'], [/\b(batao|bata do|bataiye)\b/g, 'tell me'],
      [/\bdekhna hai\b/g, 'want to see'], [/\b(milega|milegi|mil jayega|mil sakta hai)\b/g, 'available'], [/\b(aa sakte hain|aa sakta hoon|aa sakti hoon|aa jaun)\b/g, 'can I come'],
      [/\bhai kya\b/g, 'is there'], [/\b(nahi|nahin)\b/g, 'no'], [/\b(haan ji|ji haan|haan)\b/g, 'yes'], [/\baur\b/g, 'and'], [/\bmein\b/g, 'in'],
      [/\b(sasta|saste)\b/g, 'cheap'], [/\b(teekha|tikha|mirchi wala)\b/g, 'spicy'], [/\bdaant\b/g, 'tooth'], [/\bbaal\b/g, 'hair'], [/\bdard\b/g, 'pain'], [/\bkhana\b/g, 'food'], [/\bghar\b/g, 'home'],
      [/\b(hai|hain|ho|hoga|hogi|ji|bhai|yaar|na|toh|bhi|se|ka|ki|ke)\b/g, ' ']
    ];
    var lang = (strong >= 1 || hits >= 2) ? 'Hinglish' : 'English';
    if (lang === 'Hinglish') R.forEach(function (r) { t = t.replace(r[0], r[1]); });
    return { text: t.replace(/\s+/g, ' ').trim(), lang: lang, hits: hits };
  }

  window.OrbitTrades = {
    order: ORDER, byId: T, classify: classify, headline: headline, hinglish: hinglish, place: placeOf,
    colors: function (id) { return COL[id] || COL.front; },
    byAgent: function (agent) { for (var k in T) if (T[k].agent === agent) return T[k]; return null; }
  };
})();
