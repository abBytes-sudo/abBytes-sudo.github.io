/* Orbit Assistants: the front-desk assistant used when a visitor's business is not one of the six trades
   ("a law firm in Delhi", "a yoga studio"). Books a time, answers hours, prices and location, hands over.
   The page sets the business name before mounting: Orbit.agents.front.business = 'Your Delhi law firm'. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || !O.registerAgent || O.agents.front) return;
  function B(l, v) { return { label: l, value: v }; }
  function biz() { var b = O.agents.front.business || 'Your business'; return /^your business$/i.test(b) ? 'the front desk' : b.replace(/^your\s+/i, 'the ') + '’s front desk'; }
  function dayOpts() {
    var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
    for (var i = 0; i < 3; i++) { var x = new Date(d); x.setDate(d.getDate() + i); out.push(B(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : O.fmtDay(x), 'slot:day=' + x.toISOString().slice(0, 10))); }
    return out;
  }
  function dayLabel(iso) { var d = new Date(iso + 'T00:00:00'), t = new Date(); t.setHours(0, 0, 0, 0); var diff = Math.round((d - t) / 864e5); return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : O.fmtDay(d); }
  O.registerAgent({
    id: 'front', name: 'Front desk assistant', business: 'Your business', role: 'Front desk', industry: 'Any', accent: '#47E3A5', initials: 'OR', kind: 'customer',
    helloLine: 'I can book a time, share prices and hours, or get someone to call you back.',
    greeting: function (bot) { bot.say('Hi, you’ve reached ' + biz() + '. I can book a time, answer the usual questions, or get someone to call you back.', { buttons: O.agents.front.menu }); },
    menu: [B('Book a time', 'flow:book'), B('Opening hours', 'intent:hours'), B('Prices', 'intent:prices'), B('Where you are', 'intent:where'), B('Call me back', 'handover')],
    intents: [
      { id: 'book', label: 'Book a time', kw: ['book', 'booking', 'appointment', 'slot', 'visit', 'come in', 'come by', 'reserve', 'schedule', 'can i come', 'drop by'], re: [/\b(book|appointment|slot|reserve|schedule|come (in|by|over))\b/i], flow: 'book' },
      { id: 'hours', label: 'Opening hours', kw: ['open', 'opening hours', 'timings', 'hours', 'closing time', 'close', 'sunday', 'holiday', 'what time'], re: [/\b(open|timings?|hours|clos(e|ing))\b/i], run: function (bot) { bot.say('We’re open **Monday to Saturday, 10 am to 7 pm**, and **Sunday, 11 am to 4 pm**. Want me to book a time?', { buttons: [B('Book a time', 'flow:book'), B('Something else', 'menu')] }); } },
      { id: 'prices', label: 'Prices', kw: ['price', 'prices', 'cost', 'how much', 'how much is it', 'fee', 'fees', 'rates', 'charges', 'quote', 'pricing'], re: [/\b(price|cost|how much|fees?|rates?|charges?|quote)\b/i], run: function (bot) { bot.say('Most work is priced after a short chat, because it depends on what you need. I can take your details and someone sends exact rates by the morning, or you can book a time to come in.', { buttons: [B('Send me rates', 'handover'), B('Book a time', 'flow:book')] }); } },
      { id: 'where', label: 'Where you are', kw: ['where', 'location', 'address', 'located', 'directions', 'parking', 'map', 'how to reach'], re: [/\b(where|address|located|directions|parking)\b/i], run: function (bot) { bot.say('You’ll find us on the ground floor, with parking at the back. I can send the map pin on WhatsApp when you book.', { buttons: [B('Book a time', 'flow:book'), B('Something else', 'menu')] }); } }
    ],
    extract: function (text, bot) {
      var w = bot.nlp.when(text) || {}, o = {};
      if (w.iso) o.day = w.iso; if (w.time) o.time = w.time; var p = bot.nlp.party(text); if (p) o.party = p; var ph = bot.nlp.phone(text); if (ph) o.phone = ph;
      return o;
    },
    flows: {
      book: { intent: 'book', slots: [
        { name: 'day', ask: function (bot) { bot.say('Which day suits you?', { buttons: dayOpts() }); }, parse: function (t, bot) { var w = bot.nlp.when(t); return w && w.iso ? w.iso : undefined; }, hint: 'Tell me a day, like “tomorrow” or “Saturday”.' },
        { name: 'time', ask: function (bot, s) { bot.say('What time ' + dayLabel(s.day) + '? We’re open 10 am to 7 pm.', { buttons: [B('11 am', 'slot:time=11:00'), B('1 pm', 'slot:time=13:00'), B('4 pm', 'slot:time=16:00'), B('6 pm', 'slot:time=18:00')] }); },
          parse: function (t, bot) { var w = bot.nlp.when(t); return w && w.time ? w.time : undefined; },
          validate: function (v) { var h = +String(v).split(':')[0]; return h < 10 || h >= 19 ? 'We’re open 10 am to 7 pm. Pick a time in that window?' : ''; }, hint: 'Tell me a time, like “11 am”.' },
        { name: 'name', ask: function (bot) { bot.say('And the name for the booking?'); }, parse: function (t, bot) { return bot.nlp.name(t); }, hint: 'Just your name is fine.' },
        { name: 'phone', ask: function (bot) { bot.say('A number for the reminder? You can skip this.', { buttons: [B('Skip', 'slot:phone=none')] }); }, parse: function (t, bot) { if (/^\s*(skip|no|none|later)\b/i.test(t)) return 'none'; return bot.nlp.phone(t); }, hint: 'Type a number, or tap Skip.' }
      ], done: function (bot, s) {
        var when = dayLabel(s.day) + ' at ' + O.fmtTime(s.time), ph = s.phone && s.phone !== 'none' ? s.phone : '';
        bot.user.name = s.name; if (ph) bot.user.phone = ph;
        bot.lead({ name: s.name, phone: ph, intent: 'book', payload: { day: s.day, time: s.time, party: s.party || 1 } }); bot.event('booking', { kind: 'visit' });
        bot.say('Booked, ' + s.name.split(' ')[0] + ': **' + when + '**. ' + (ph ? 'A reminder goes to your phone the evening before.' : 'See you then.'), { buttons: [B('Opening hours', 'intent:hours'), B('Where you are', 'intent:where'), B('That’s all', 'say:bye')] });
      } }
    },
    kb: [
      { id: 'f-pay', q: 'How can I pay?', a: 'UPI, cards and cash at the desk. We send a receipt on WhatsApp.', keys: ['pay', 'payment', 'upi', 'card', 'cash'] },
      { id: 'f-cancel', q: 'Can I cancel or move a booking?', a: 'Yes, any time up to two hours before. Just message here and I’ll move it.', keys: ['cancel', 'reschedule', 'move my booking', 'change my booking'] },
      { id: 'f-wa', q: 'Can I message on WhatsApp?', a: 'Yes. This same assistant answers on WhatsApp and Instagram, and a person can step in any time.', keys: ['whatsapp', 'instagram', 'message you'] },
      { id: 'f-walk', q: 'Do I need a booking?', a: 'Walk-ins are welcome when there’s a free slot, but a booking means no wait.', keys: ['walk in', 'walk-in', 'without booking', 'need a booking'] }
    ],
    samples: ['Are you open on Sunday?', 'How much does it cost?', 'Can I book for tomorrow 11 am?', 'Where are you located?'],
    contexts: [{ label: 'Just browsing', context: {} }]
  });
})();
