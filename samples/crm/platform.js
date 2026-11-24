/* Lumen CRM Pro — platform layer: workspaces from templates (Services · B2B sales · Agency), products and price books,
   campaigns, lead conversion with duplicate check, approval processes, forecasting with territories and quotas,
   the integrations marketplace and the "+ New" menu. Everything persists in this browser only (demo). */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views;
  var P = function () { return C.P(); }, S = function () { return C.S(); }, D = 864e5;

  // ===== workspaces ===============================================================================================================
  var TPL = {
    services: { name: 'Lumen Homes', sub: 'Services · interiors', ic: 'dash', blurb: 'Project-based services: site visits, proposals, delivery and after-sales.', pipes: ['Sales: Qualified → Site visit → Design → Proposal → Negotiation → Won', 'Partnerships: Intro → Pilot → Agreement → Active'], fields: ['Site-visit outcome', 'Token advance', 'Handover status'] },
    b2b: { name: 'Northwind Cloud', sub: 'B2B SaaS', ic: 'server', blurb: 'Subscription software: walkthroughs, trials, annual contracts, renewals and expansion.', pipes: ['New business: Discovery → Walkthrough → Trial → Proposal → Negotiation → Closed won', 'Renewals: Upcoming → In review → Negotiation → Renewed'], fields: ['Walkthrough outcome', 'Signed order form (₹)', 'Onboarding status', 'Seats', 'ARR band'] },
    agency: { name: 'Brightline Studio', sub: 'Agency', ic: 'flag', blurb: 'Retainers and projects: pitches, scoping, SOWs, delivery and upsells.', pipes: ['New business: Brief → Pitch → Scoping → SOW sent → Negotiation → Signed', 'Retainers: Kick-off → Live → Renewal due → Renewed'], fields: ['Pitch outcome', 'Deposit received (₹)', 'Onboarding status', 'Retainer months'] }
  };
  function wsList() { var L = []; try { L = JSON.parse(localStorage.getItem('lumen-crm-wslist') || '[]'); } catch (e) { } if (!L.some(function (w) { return w.id === ''; })) L.unshift({ id: '', tpl: 'services', name: TPL.services.name }); if (!L.some(function (w) { return w.id === 'northwind'; })) L.push({ id: 'northwind', tpl: 'b2b', name: TPL.b2b.name }); return L; }
  function wsSave(L) { try { localStorage.setItem('lumen-crm-wslist', JSON.stringify(L)); } catch (e) { } }
  C.WS = (function () { var w = wsList().filter(function (x) { return x.id === C.wsId; })[0] || wsList()[0]; return { id: w.id, tpl: w.tpl, name: w.name, sub: TPL[w.tpl].sub, ic: TPL[w.tpl].ic }; })();
  function wsSwitch(id) { try { if (id) localStorage.setItem('lumen-crm-ws', id); else localStorage.removeItem('lumen-crm-ws'); } catch (e) { } location.hash = '#/dashboard'; location.reload(); }
  C.acts['ws-go'] = function (el) { wsSwitch(el.dataset.id); };
  C.acts['ws-new'] = function () {
    C.dialog('New workspace from a template', '<p class="hint">Each workspace is separate: its own records, pipelines, fields and users. Switch any time from the workspace menu.</p><div class="tplg" role="radiogroup" aria-label="Template">' + Object.keys(TPL).map(function (k, i) { var t = TPL[k]; return '<label class="tplc"><input type="radio" name="tpl" value="' + k + '"' + (i === 1 ? ' checked' : '') + '><span class="tpl-ic">' + C.ic(t.ic, 16) + '</span><b>' + { services: 'Services', b2b: 'B2B sales', agency: 'Agency' }[k] + '</b><span class="muted sm">' + t.blurb + '</span><ul>' + t.pipes.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '<li>Fields: ' + esc(t.fields.join(', ')) + '</li></ul></label>'; }).join('') + '</div><div class="field"><label for="ws-n">Workspace name</label><input id="ws-n" name="name" maxlength="32" placeholder="e.g. Acme Robotics" autocomplete="off"></div>', 'Create and switch', function (fd) {
      var k = fd.get('tpl'), n = String(fd.get('name') || '').trim() || TPL[k].name, id = (n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || k).slice(0, 30), L = wsList();
      while (L.some(function (w) { return w.id === id; })) id += '-2';
      L.push({ id: id, tpl: k, name: n }); wsSave(L); C.audit('settings', null, 'Workspace created', '', n + ' (' + k + ')'); C.save(); wsSwitch(id);
    });
  };
  // the workspace popover lists every workspace
  var ws0 = C.acts.ws; C.acts.ws = function (el) {
    ws0(el); var pop = $('#ws-pop'); if (!pop) return;
    var h = pop.querySelector('.wp-h'); if (h) h.innerHTML = '<span class="ws-tile">' + C.ic(C.WS.ic, 14) + '</span><div><b>' + esc(C.WS.name) + '</b><small>' + esc(C.WS.sub) + '</small></div>';
    h.insertAdjacentHTML('afterend', '<div class="wp-sec"><span class="wp-l">Switch workspace</span>' + wsList().filter(function (w) { return w.id !== C.WS.id; }).map(function (w) { return '<button type="button" role="menuitem" data-act="ws-go" data-id="' + esc(w.id) + '"><span class="ws-tile sm">' + C.ic(TPL[w.tpl].ic, 12) + '</span>' + esc(w.name) + '<small>' + { services: 'Services', b2b: 'B2B SaaS', agency: 'Agency' }[w.tpl] + '</small></button>'; }).join('') + '<button type="button" role="menuitem" data-act="ws-new">' + C.ic('plus', 15) + 'New workspace from a template…</button></div>');
  };
  function paintWs() { var b = $('#ws'); if (b) { var n = b.querySelector('b'), s = b.querySelector('.ws-sub,small,span:not(.ws-tile)'); if (n) n.textContent = C.WS.name; } $$('.crumb-ws,[data-ws-name]').forEach(function (x) { x.textContent = C.WS.name; }); document.title = document.title.replace(/^[^·|–-]*Lumen Homes/, C.WS.name); }
  C.onRoute = (function (prev) { return function (n, a) { if (prev) prev(n, a); setTimeout(paintWs, 0); }; })(C.onRoute);

  // ---- template seeding: rewrite the services demo into another business model ---------------------------------------------------
  var B2B = {
    pipes: { sales: { label: 'New business', st: [['qualified', 'discovery', 'Discovery'], ['visit', 'walkthrough', 'Walkthrough'], ['design', 'trial', 'Trial'], ['proposal', 'proposal', 'Proposal'], ['negotiation', 'negotiation', 'Negotiation'], ['won', 'won', 'Closed won'], ['lost', 'lost', 'Closed lost']] }, partner: { label: 'Renewals and expansion', st: [['intro', 'upcoming', 'Upcoming'], ['pilot', 'review', 'In review'], ['agreement', 'renego', 'Negotiation'], ['active', 'renewed', 'Renewed'], ['paused', 'churned', 'Churned']] } },
    cos: [['Kestrel Logistics', 'Logistics', 'kestrel-logistics.example'], ['Saffron Pay', 'Fintech', 'saffronpay.example'], ['Medisphere Clinics', 'Healthcare', 'medisphere.example'], ['Arcadia Retail', 'Retail', 'arcadia-retail.example'], ['Brightpath Learning', 'EdTech', 'brightpath.example'], ['Vantage Motors', 'Automotive', 'vantage-motors.example'], ['Tidewater Foods', 'FMCG', 'tidewater.example'], ['Orbitline Telecom', 'Telecom', 'orbitline.example'], ['Granite Infra', 'Construction', 'granite-infra.example'], ['Nimbus Insurance', 'Insurance', 'nimbus-ins.example'], ['Pinecrest Hotels', 'Hospitality', 'pinecrest.example'], ['Redwood Pharma', 'Pharma', 'redwood-pharma.example'], ['Coralbay Realty', 'Real estate', 'coralbay.example'], ['Zenith Manufacturing', 'Manufacturing', 'zenith-mfg.example'], ['Quill Media', 'Media', 'quillmedia.example'], ['Lattice Labs', 'Software', 'lattice.example']],
    roles: ['Head of Operations', 'CFO', 'VP Sales', 'IT Manager', 'Procurement lead', 'COO', 'Revenue Ops manager', 'CTO'],
    products: [['NW-STR', 'Starter plan · per seat / year', 'Subscription', 9600], ['NW-GRW', 'Growth plan · per seat / year', 'Subscription', 18000], ['NW-ENT', 'Enterprise plan · per seat / year', 'Subscription', 30000], ['NW-ANL', 'Analytics add-on · per seat / year', 'Add-on', 4800], ['NW-SSO', 'SSO and audit add-on · per org / year', 'Add-on', 120000], ['NW-ONB', 'Onboarding package', 'Services', 150000], ['NW-TRN', 'Admin training (1 day)', 'Services', 60000], ['NW-PSU', 'Premium support · per org / year', 'Support', 240000]],
    services: ['Starter plan', 'Growth plan', 'Enterprise plan', 'Analytics add-on', 'Migration project', 'Premium support'],
    notes: ['Wants SSO before rollout; security review scheduled.', 'Comparing us with two incumbents; price is not the blocker.', 'Champion is the RevOps manager; CFO signs above ₹25 L.', 'Trial: 42 of 60 invited users active in week one.', 'Asked for annual prepay discount and a 3-year price lock.', 'Needs data residency in India; confirmed on our side.', 'Procurement wants a DPA and our ISO 27001 report.', 'Walkthrough went well; next step is a technical deep dive with IT.'],
    tasks: ['Send the security questionnaire', 'Book the technical deep dive', 'Share the ROI calculator', 'Follow up on the trial usage', 'Send the order form for signature', 'Confirm seat count with procurement', 'Schedule the onboarding kick-off', 'Renewal check-in call'],
    tickets: ['SSO login loop for some users', 'CSV export times out above 50k rows', 'Invoice shows the wrong GSTIN', 'Webhook retries not firing', 'Request: custom role for auditors', 'Dashboard widget shows stale data']
  };
  var AGENCY = {
    pipes: { sales: { label: 'New business', st: [['qualified', 'brief', 'Brief'], ['visit', 'pitch', 'Pitch'], ['design', 'scoping', 'Scoping'], ['proposal', 'sow', 'SOW sent'], ['negotiation', 'negotiation', 'Negotiation'], ['won', 'won', 'Signed'], ['lost', 'lost', 'Lost']] }, partner: { label: 'Retainers', st: [['intro', 'kickoff', 'Kick-off'], ['pilot', 'live', 'Live'], ['agreement', 'renewal', 'Renewal due'], ['active', 'renewed', 'Renewed'], ['paused', 'ended', 'Ended']] } },
    cos: B2B.cos, roles: ['CMO', 'Brand manager', 'Head of Growth', 'Founder', 'Marketing director', 'Digital lead', 'Product marketing lead', 'CEO'],
    products: [['BL-RET', 'Monthly retainer · social and content', 'Retainer', 240000], ['BL-PER', 'Performance marketing · monthly', 'Retainer', 180000], ['BL-BRD', 'Brand identity project', 'Project', 650000], ['BL-WEB', 'Website design and build', 'Project', 900000], ['BL-VID', 'Video production day', 'Project', 120000], ['BL-SEO', 'SEO audit and roadmap', 'Project', 250000]],
    services: ['Brand identity', 'Website build', 'Performance retainer', 'Content retainer', 'SEO roadmap', 'Video campaign'],
    notes: ['Pitch deck approved by the CMO; legal reviewing the SOW.', 'Wants a 3-month trial retainer before committing to 12.', 'Budget is set for Q1; decision after their board meeting.', 'Loved the moodboard; asked for a second creative route.', 'Procurement asks for rate card and past case studies.'],
    tasks: ['Send the SOW for review', 'Book the creative review', 'Share two case studies', 'Confirm the kick-off date', 'Send the monthly report', 'Renewal check-in call'],
    tickets: ['Change request: new landing page variant', 'Asset delivery delayed', 'Invoice query on extra shoot day', 'Access request for the ad account']
  };
  function rewrite(p, S0, M) {
    var R = C.rng(2026);
    Object.keys(M.pipes).forEach(function (k) {
      var spec = M.pipes[k], pipe = p.pipes[k], map = {};
      pipe.label = spec.label; pipe.stages.forEach(function (s) { var x = spec.st.filter(function (q) { return q[0] === s.id; })[0]; if (x) { map[s.id] = x[1]; s.id = x[1]; s.label = x[2]; } });
      p.deals.forEach(function (d) { if (d.pipe === k && map[d.stage]) d.stage = map[d.stage]; });
      (p.gates || []).forEach(function (g) { if (g.pipe === k && map[g.stage]) g.stage = map[g.stage]; });
      (p.wf || []).forEach(function (w) { if (w.when && w.when.stage && map[w.when.stage]) w.when.stage = map[w.when.stage]; });
    });
    C.PIPES = p.pipes;
    p.companies.forEach(function (co, i) { var x = M.cos[i % M.cos.length]; co.name = x[0]; co.industry = x[1]; co.domain = x[2]; co.size = ['51–200', '201–500', '500+', '11–50'][i % 4]; });
    var fi = p.fields.company.filter(function (f) { return f.key === 'industry'; })[0]; if (fi) fi.opts = M.cos.map(function (x) { return x[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    p.contacts.forEach(function (c, i) { var co = c.co && p.companies.filter(function (x) { return x.id === c.co; })[0]; c.role = M.roles[i % M.roles.length]; if (co) c.email = c.name.toLowerCase().replace(/^(mr|mrs|ms|dr)\.?\s+/, '').split(' ')[0] + '@' + co.domain; });
    p.products = M.products.map(function (x) { return { sku: x[0], name: x[1], fam: x[2], price: x[3] }; });
    p.deals.forEach(function (d, i) {
      var co = d.co && p.companies.filter(function (x) { return x.id === d.co; })[0], prod = p.products[i % 3 + (M === B2B ? 0 : 0)], seats = [25, 40, 60, 120, 200][i % 5];
      d.items = M === B2B ? [{ sku: prod.sku, name: prod.name, qty: seats, price: prod.price }].concat(i % 3 === 0 ? [{ sku: 'NW-ONB', name: 'Onboarding package', qty: 1, price: 150000 }] : []) : [{ sku: p.products[i % p.products.length].sku, name: p.products[i % p.products.length].name, qty: p.products[i % p.products.length].fam === 'Retainer' ? 6 : 1, price: p.products[i % p.products.length].price }];
      d.name = (co ? co.name : (C.contact(d.c) || { name: 'Account' }).name.split(' ').slice(-1)[0]) + ' — ' + (M === B2B ? prod.name.split(' · ')[0] + ', ' + seats + ' seats' : d.items[0].name.split(' · ')[0]);
    });
    (p.quotes || []).forEach(function (q) { var d = p.deals.filter(function (x) { return x.id === q.d; })[0]; if (d) q.items = JSON.parse(JSON.stringify(d.items)); });
    (p.tickets || []).forEach(function (t, i) { t.subj = M.tickets[i % M.tickets.length]; });
    p.acts.forEach(function (a, i) { if (a.type === 'note' || a.type === 'call' || a.type === 'email' || a.type === 'wa') a.text = (a.type === 'call' ? 'Call: ' : a.type === 'email' ? 'Email: ' : a.type === 'wa' ? 'Message: ' : '') + M.notes[i % M.notes.length]; else if (a.type === 'visit') { a.type = 'call'; a.text = 'Walkthrough held · ' + M.notes[i % M.notes.length]; } });
    S0.leads.forEach(function (l, i) { l.service = M.services[i % M.services.length]; l.req = M.notes[(i + 3) % M.notes.length]; l.tl.forEach(function (e) { if (e.type === 'note' || e.type === 'call' || e.type === 'msg') e.text = M.notes[(i + e.t) % M.notes.length]; if (e.type === 'visit') { e.type = 'call'; e.text = 'Walkthrough held · ' + M.notes[i % M.notes.length]; } }); });
    S0.tasks.forEach(function (t, i) { t.text = M.tasks[i % M.tasks.length]; });
    p.users.forEach(function (u, i) { u.email = u.name.split(' ')[0].toLowerCase() + '@' + (M === B2B ? 'northwind' : 'brightline') + '.example'; u.title = ['Founder and CEO', 'Head of Sales', 'Account executive', 'Account executive'][i] || u.title; });
    var df = p.fields.deal, rl = function (k, l, o) { var f = df.filter(function (x) { return x.key === k; })[0]; if (f) { f.label = l; if (o) f.opts = o; } };
    if (M === B2B) { rl('visitOutcome', 'Walkthrough outcome', ['Strong fit', 'Needs a trial', 'Needs security review', 'Not a fit']); rl('advance', 'Signed order form (₹)'); rl('handover', 'Onboarding status', ['Not started', 'Kick-off booked', 'In progress', 'Live']); df.push({ key: 'seats', label: 'Seats', type: 'number' }, { key: 'arr', label: 'ARR band', type: 'select', opts: ['< ₹10 L', '₹10–25 L', '₹25–50 L', '₹50 L +'] }); }
    else { rl('visitOutcome', 'Pitch outcome', ['Won the room', 'Second round', 'Needs revision', 'Lost']); rl('advance', 'Deposit received (₹)'); rl('handover', 'Onboarding status', ['Not started', 'Kick-off booked', 'In progress', 'Live']); df.push({ key: 'months', label: 'Retainer months', type: 'number' }); }
    (p.tpls || []).forEach(function (t, i) { t.body = 'Hi {{first_name}}, ' + ['thanks for your interest in ' + (M === B2B ? 'Northwind' : 'Brightline') + '. Would a 20-minute call this week work?', 'here is a short overview of how we work with teams like yours.', 'following up on our conversation: the proposal is attached.', 'checking in on the next step. Happy to help with anything you need.'][i % 4] + ' — {{owner}}'; t.name = ['First reply', 'Overview', 'Proposal follow-up', 'Check-in', 'Case studies', 'Next steps', 'Intro'][i % 7]; });
    p.favs = [];
  }
  C.seeders.push(function (p, S0) {
    if (p.wsT === C.WS.tpl) return;
    if (C.WS.tpl === 'b2b') rewrite(p, S0, B2B); else if (C.WS.tpl === 'agency') rewrite(p, S0, AGENCY);
    if (!p.products) p.products = C.HALDEN.map(function (x) { return Array.isArray(x) ? { sku: x[0], name: x[1], fam: x[2], price: x[3] } : { sku: x.sku, name: x.name, fam: x.cat || x.fam || 'Product', price: x.price }; }).concat([{ sku: 'SV-DES', name: 'Interior design fee · per sq ft', fam: 'Services', price: 180 }, { sku: 'SV-EXE', name: 'Execution and site supervision', fam: 'Services', price: 250000 }]);
    p.wsT = C.WS.tpl;
  });
  // price books
  C.seeders.push(function (p) { if (p.books) return; p.books = [{ id: 'pb-std', name: 'Standard', adj: 0, cur: 'INR', def: true }, { id: 'pb-prt', name: 'Partner', adj: -15, cur: 'INR' }, { id: 'pb-pre', name: 'Annual prepay', adj: -10, cur: 'INR' }, { id: 'pb-usd', name: 'Export (USD)', adj: 0, cur: 'USD', fx: 84 }]; });

  // ===== Products and price books ==================================================================================================
  V.products = {
    title: function () { return 'Products and price books'; },
    render: function () {
      var u = C.ui.prod || (C.ui.prod = { book: 'pb-std', q: '', fam: 'all' }), bk = P().books.filter(function (b) { return b.id === u.book; })[0] || P().books[0], fams = P().products.map(function (x) { return x.fam; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var L = P().products.filter(function (x) { return (u.fam === 'all' || x.fam === u.fam) && (!u.q || (x.name + ' ' + x.sku).toLowerCase().indexOf(u.q.toLowerCase()) > -1); });
      var price = function (x) { var v = x.price * (1 + bk.adj / 100); return bk.cur === 'USD' ? '$' + (v / bk.fx).toLocaleString('en-US', { maximumFractionDigits: 0 }) : C.inr(v); };
      var used = {}; P().deals.forEach(function (d) { (d.items || []).forEach(function (i) { if (i.sku) used[i.sku] = (used[i.sku] || 0) + i.qty; }); });
      return C.page('Products and price books', P().products.length + ' products · line items on deals and quotes come from here') +
        '<div class="pbooks" role="tablist" aria-label="Price book">' + P().books.map(function (b) { return '<button type="button" role="tab" aria-selected="' + (b.id === bk.id) + '" class="pbk" data-act="pb-pick" data-id="' + b.id + '"><b>' + esc(b.name) + '</b><small>' + (b.adj ? b.adj + '% on list' : 'List prices') + ' · ' + b.cur + '</small></button>'; }).join('') + '</div>' +
        '<div class="ttool"><div class="sfield sm">' + C.ic('search', 14) + '<label class="sr" for="pr-q">Search products</label><input id="pr-q" data-in="pr-q" value="' + esc(u.q) + '" placeholder="Search name or SKU…" autocomplete="off"></div><label class="sr" for="pr-f">Family</label><select id="pr-f" class="sel sm" data-ch="pr-f"><option value="all">All families</option>' + fams.map(function (f) { return '<option' + (f === u.fam ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></div>' +
        '<section class="card flush"><div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Family</th><th scope="col" class="num">List price</th><th scope="col" class="num">' + esc(bk.name) + ' price</th><th scope="col" class="num">On open deals</th></tr></thead><tbody>' +
        L.map(function (x) { return '<tr><td><b>' + esc(x.name) + '</b></td><td class="mono sm">' + esc(x.sku) + '</td><td><span class="pill" style="--c:#667085">' + esc(x.fam) + '</span></td><td class="num mono">' + C.inr(x.price) + '</td><td class="num mono"><b>' + price(x) + '</b></td><td class="num">' + (used[x.sku] || '—') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    }
  };
  C.acts['pb-pick'] = function (el) { C.ui.prod.book = el.dataset.id; C.rerender(); var b = $('[data-act="pb-pick"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); };
  C.ins['pr-q'] = function (el) { C.ui.prod.q = el.value; clearTimeout(C._prq); C._prq = setTimeout(function () { C.rerender(); var x = $('#pr-q'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 150); };
  C.chs['pr-f'] = function (el) { C.ui.prod.fam = el.value; C.rerender(); var x = $('#pr-f'); if (x) x.focus(); };

  // ===== Campaigns ==================================================================================================================
  function campaigns() {
    var L = S().leads, spend = (P().mkt && P().mkt.spend) || {}, byC = {};
    L.forEach(function (l) { var k = l.utm && l.utm.campaign; if (!k || k === '(organic)') return; var c = byC[k] || (byC[k] = { slug: k, src: l.utm.source, med: l.utm.medium, leads: [], won: 0, rev: 0 }); c.leads.push(l); if (l.status === 'won') { c.won++; var d = P().deals.filter(function (x) { return x.leadId === l.id; })[0]; c.rev += d ? C.dealVal(d) : l.budget * 1e5; } });
    var TYPE = { paid_social: 'Paid social', cpc: 'Paid search', email: 'Email', qr: 'Offline · QR', referral: 'Referral' };
    var EXTRA = [{ slug: 'monthly-inspiration', src: 'newsletter', med: 'email', leads: [], won: 0, rev: 0, budget: 4000 }, { slug: 'design-week-stall', src: 'event', med: 'event', leads: [], won: 0, rev: 0, budget: 85000, status: 'Planned' }];
    return Object.keys(byC).map(function (k) { var c = byC[k], cost = Object.keys(spend).filter(function (s) { return s.indexOf(k + '|') === 0; }).reduce(function (s, x) { return s + spend[x]; }, 0) || (c.med === 'cpc' ? 64000 : c.med === 'qr' ? 12000 : 0); c.cost = cost; c.budget = Math.round(cost * 1.15 / 1000) * 1000 || 10000; c.type = TYPE[c.med] || c.med; c.status = 'Active'; return c; }).concat(EXTRA.filter(function (e) { return !byC[e.slug]; }).map(function (e) { e.cost = e.status === 'Planned' ? 0 : 3200; e.type = TYPE[e.med] || 'Event'; e.status = e.status || 'Completed'; return e; }));
  }
  V.campaigns = {
    title: function () { return 'Campaigns'; },
    render: function () {
      var L = campaigns(), sel = C.ui.campSel;
      var row = function (c) { var roi = c.cost ? (c.rev - c.cost) / c.cost : 0; return '<tr class="' + (sel === c.slug ? 'on' : '') + '"><td><button type="button" class="lnk-row" data-act="camp-sel" data-k="' + esc(c.slug) + '" aria-expanded="' + (sel === c.slug) + '"><b class="mono sm">' + esc(c.slug) + '</b></button><small class="muted">' + esc(c.src) + ' / ' + esc(c.med) + '</small></td><td>' + esc(c.type) + '</td><td><span class="hst ' + (c.status === 'Active' ? 'ok' : c.status === 'Planned' ? 'warn' : '') + '">' + c.status + '</span></td><td class="num mono">' + C.inr(c.budget) + '</td><td class="num mono">' + C.inr(c.cost) + '</td><td class="num">' + c.leads.length + '</td><td class="num">' + c.won + '</td><td class="num mono">' + (c.rev ? C.rs(c.rev) : '—') + '</td><td class="num"><b class="roas ' + (roi > 5 ? 'hi' : roi > 0 ? 'ok' : 'lo') + '">' + (c.cost ? Math.round(roi * 100) + '%' : '—') + '</b></td></tr>' + (sel === c.slug ? '<tr class="cx-x"><td colspan="9"><h3 class="h3">Members · ' + c.leads.length + ' leads</h3>' + (c.leads.length ? '<ul class="members">' + c.leads.map(function (l) { return '<li><a class="ochip" href="#/campaigns/' + l.id + '">' + C.avatar(l.name, 18) + esc(l.name) + '</a>' + C.pill(l.status) + '<span class="muted sm">' + C.dshort(l.created) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted sm">No responses yet.</p>') + '</td></tr>' : ''); };
      var tot = L.reduce(function (s, c) { s.cost += c.cost; s.leads += c.leads.length; s.rev += c.rev; return s; }, { cost: 0, leads: 0, rev: 0 });
      return C.page('Campaigns', 'Every campaign with its members, budget, actual cost and the revenue its leads produced', '<a class="btn" href="#/attribution">' + C.ic('chart', 14) + 'Ad-level attribution</a>') +
        '<div class="kpis sm4"><div class="kpi"><span class="kl">Campaigns</span><b>' + L.length + '</b><small>' + L.filter(function (c) { return c.status === 'Active'; }).length + ' active</small></div><div class="kpi"><span class="kl">Actual cost</span><b>' + C.inr(tot.cost) + '</b><small>90 days</small></div><div class="kpi"><span class="kl">Responses</span><b>' + tot.leads + '</b><small>leads with a campaign</small></div><div class="kpi"><span class="kl">Won revenue</span><b>' + C.rs(tot.rev) + '</b><small>from campaign leads</small></div></div>' +
        '<section class="card flush"><div class="tablewrap"><table class="tbl camp"><thead><tr><th scope="col">Campaign</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col" class="num">Budget</th><th scope="col" class="num">Actual cost</th><th scope="col" class="num">Leads</th><th scope="col" class="num">Won</th><th scope="col" class="num">Revenue</th><th scope="col" class="num">ROI</th></tr></thead><tbody>' + L.map(row).join('') + '</tbody></table></div></section>';
    }
  };
  C.acts['camp-sel'] = function (el) { C.ui.campSel = C.ui.campSel === el.dataset.k ? null : el.dataset.k; C.rerender(); var b = $('[data-act="camp-sel"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); };

  // ===== Lead conversion (lead → account, contact and deal, with duplicate check) =================================================
  function dupContacts(l) {
    var em = String(l.email || '').toLowerCase(), ph = String(l.phone || '').replace(/\D/g, '').slice(-3), last = l.name.split(' ').slice(-1)[0].toLowerCase();
    return P().contacts.filter(function (c) { if (c.leadId === l.id) return true; var e = String(c.email || '').toLowerCase(); return (em && e === em) || (ph.length === 3 && String(c.phone || '').replace(/\D/g, '').slice(-3) === ph && c.name.toLowerCase().indexOf(last) > -1); }).slice(0, 3);
  }
  function dupCos(l) { var dom = String(l.email || '').split('@')[1] || '', words = (l.req + ' ' + l.name).toLowerCase(); return P().companies.filter(function (c) { return (dom && c.domain && dom.indexOf(c.domain.replace(/^www\./, '')) > -1) || words.indexOf(c.name.toLowerCase().split(' ')[0]) > -1; }).slice(0, 3); }
  C.acts.convert = function (el) {
    var l = C.lead(el.dataset.id); if (!l) return; if (!C.can('edit', l)) { C.deny('convert leads owned by others'); return; }
    var dc = dupContacts(l), dco = dupCos(l), stages = C.PIPES.sales.stages.filter(function (s) { return !s.won && !s.lost; }), st = C.reached(l) >= 2 ? stages[1] : stages[0];
    var radio = function (name, v, label, sub, on) { return '<label class="cvo"><input type="radio" name="' + name + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '><span><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>'; };
    C.dialog('Convert ' + esc(l.name), '<p class="hint">One step: create or match the company, the contact and the deal. The lead keeps its history and links to all three.</p>' +
      '<fieldset class="cvs"><legend>' + C.ic('building', 14) + 'Company</legend>' + dco.map(function (c, i) { return radio('co', c.id, 'Use ' + esc(c.name), 'Possible match · ' + esc(c.domain || c.city || ''), i === 0); }).join('') + radio('co', 'new', 'Create a new company', '<input name="coName" placeholder="Company name" aria-label="New company name" autocomplete="off">', false) + radio('co', 'none', 'No company (individual buyer)', '', !dco.length) + '</fieldset>' +
      '<fieldset class="cvs"><legend>' + C.ic('user', 14) + 'Contact</legend>' + (dc.length ? '<p class="dupw">' + C.ic('flag', 13) + dc.length + ' possible duplicate' + (dc.length > 1 ? 's' : '') + ' found: merging keeps one record.</p>' : '') + dc.map(function (c, i) { return radio('ct', c.id, 'Merge into ' + esc(c.name) + ' (' + c.id + ')', esc(c.email || '') + ' · ' + esc(c.phone || ''), i === 0); }).join('') + radio('ct', 'new', 'Create contact “' + esc(l.name) + '”', esc(l.email || 'no email') + ' · ' + esc(l.phone), !dc.length) + '</fieldset>' +
      '<fieldset class="cvs"><legend>' + C.ic('deal', 14) + 'Deal</legend><label class="chk"><input type="checkbox" name="mkDeal" checked> Create a deal</label><div class="row2"><div class="field"><label for="cv-n">Deal name</label><input id="cv-n" name="dn" value="' + esc(l.name.split(' ').slice(-1)[0] + ' — ' + l.service) + '"></div><div class="field"><label for="cv-a">Amount (₹)</label><input id="cv-a" name="amt" type="number" min="0" step="1000" value="' + Math.round(l.budget * 1e5) + '"></div></div><div class="row2"><div class="field"><label for="cv-s">Stage (' + esc(C.PIPES.sales.label) + ')</label><select id="cv-s" name="st">' + stages.map(function (s) { return '<option value="' + s.id + '"' + (s === st ? ' selected' : '') + '>' + esc(s.label) + '</option>'; }).join('') + '</select></div><div class="field"><label for="cv-c">Expected close</label><input id="cv-c" name="close" type="date" value="' + new Date(Date.now() + 30 * D).toISOString().slice(0, 10) + '"></div></div></fieldset>',
      'Convert', function (fd) {
        var p = P(), coV = fd.get('co'), ctV = fd.get('ct'), co = null, c;
        if (coV === 'new') { var nm = String(fd.get('coName') || '').trim(); if (!nm) { var x = $('[name=coName]'); if (x) x.focus(); return false; } co = { id: C.nextId(p.companies, 'CO-', 100), name: nm, industry: '—', city: l.loc, size: '—', domain: (String(l.email || '').split('@')[1] || ''), owner: l.owner, created: Date.now(), fields: {} }; p.companies.unshift(co); C.audit('create', C.refOf('company', co)); }
        else if (coV && coV !== 'none') co = C.company(coV);
        if (ctV && ctV !== 'new') { c = C.contact(ctV); if (!c.leadId) c.leadId = l.id; if (!c.email && l.email) c.email = l.email; C.audit('merge', C.refOf('contact', c), 'Merged lead', '', l.id); }
        else { c = { id: C.nextId(p.contacts, 'P-', 300), name: l.name, co: co ? co.id : null, role: co ? '' : 'Buyer', phone: l.phone, email: l.email, city: l.loc, owner: l.owner, leadId: l.id, created: Date.now(), tags: [], fields: {} }; p.contacts.unshift(c); C.audit('create', C.refOf('contact', c)); }
        if (co && !c.co) c.co = co.id;
        var d = null;
        if (fd.get('mkDeal')) { d = { id: C.nextId(p.deals, 'D-', 2040), name: String(fd.get('dn') || l.name), pipe: 'sales', stage: fd.get('st'), items: [], amount: +fd.get('amt') || 0, close: new Date(fd.get('close') + 'T12:00').getTime(), owner: l.owner, c: c.id, co: co ? co.id : null, leadId: l.id, created: Date.now(), moved: Date.now(), fields: {} }; p.deals.unshift(d); C.audit('create', C.refOf('deal', d)); C.pact('system', 'Deal created by converting lead ' + l.id, { c: c.id, co: d.co, d: d.id }, l.owner); }
        l.conv = { c: c.id, co: co ? co.id : null, d: d ? d.id : null, t: Date.now() };
        C.log(l, 'status', 'Converted: contact ' + c.id + (co ? ', company ' + co.id : '') + (d ? ', deal ' + d.id : ''));
        C.audit('convert', { t: 'lead', id: l.id, name: l.name }, 'Converted', '', [c.id, co && co.id, d && d.id].filter(Boolean).join(' · '));
        C.save(); C.toast('Converted · ' + [co && co.name, c.name, d && d.id].filter(Boolean).join(' · '), { icon: 'check' });
        if (d) { C.fire('deal.stage', { t: 'deal', rec: d }, { stage: d.stage }); setTimeout(function () { location.hash = '#/deals/' + d.id; }, 30); }
      });
  };

  // ===== Approval processes ==========================================================================================================
  C.seeders.push(function (p) {
    var now = Date.now();
    if (!p.apr) {
      p.apr = { rules: [{ id: 'ar1', on: true, name: 'Discount above the role’s cap', what: 'quote.discount', steps: [{ upTo: 15, who: 'manager' }, { upTo: 100, who: 'admin' }] }], reqs: [] };
      var q = (p.quotes || []).filter(function (x) { return x.status === 'draft'; })[0];
      if (q) p.apr.reqs.push({ id: 'AP-101', kind: 'discount', ref: q.id, from: q.disc || 0, to: 12, by: 'Isha Bedi', t: now - 3 * 36e5, who: 'manager', st: 'pending', why: 'Matching a competitor quote; client signs this week if we reach 12%.' });
    }
    // v2: a second rule that is actually enforced: big deals need an admin before they can be marked Won
    if (!p.apr.v2) {
      p.apr.v2 = 1;
      p.apr.rules = p.apr.rules.filter(function (r) { return r.what !== 'deal.won'; });
      p.apr.rules.push({ id: 'ar2', on: true, name: 'Big deals need an admin before Won', what: 'deal.won', min: 2000000, steps: [{ who: 'admin' }] });
      var d = p.deals.filter(function (x) { return x.pipe === 'sales' && x.stage !== 'won' && x.owner !== 'Aarav Khanna'; }).sort(function (a, b) { return C.dealVal(b) - C.dealVal(a); }).filter(function (x) { return C.dealVal(x) >= 2000000 && x.stage === 'negotiation'; })[1];
      var won = C.PIPES.sales.stages.filter(function (s) { return s.won; })[0];
      if (d && won && !(+d.fields.advance > 0)) d.fields.advance = 250000;
      if (d && won) p.apr.reqs.unshift({ id: 'AP-102', kind: 'won', ref: d.id, to: won.id, val: C.dealVal(d), by: d.owner, t: now - 90 * 6e4, who: 'admin', st: 'pending', why: 'Order form is signed and the token advance has landed. Needs the second look before I mark it Won.' });
    }
  });
  function canApprove(r) { var me = C.me(); return me.role === 'admin' || (r.who === 'manager' && me.role === 'manager'); }
  function stepFor(v) { var rule = P().apr.rules[0]; for (var i = 0; i < rule.steps.length; i++) if (v <= rule.steps[i].upTo) return rule.steps[i].who; return 'admin'; }
  var qd0 = C.chs['q-disc'];
  C.chs['q-disc'] = function (el) {
    var cap = C.perm('discount') || 0, v = Math.max(0, +el.value || 0), rule = P().apr.rules[0];
    if (v <= cap || !rule.on) { qd0(el); return; }
    var qid = (location.hash.match(/Q-[\w-]+/) || [])[0], q = (P().quotes || []).filter(function (x) { return x.id === qid; })[0] || (P().quotes || [])[0];
    C.dialog('Request approval', '<p>Your role can give up to <b>' + cap + '%</b>. A <b>' + v + '%</b> discount needs approval from a <b>' + stepFor(v) + '</b>.</p><div class="field"><label for="ap-w">Why is it worth it?</label><textarea id="ap-w" name="why" rows="3" required placeholder="e.g. Matching a competitor; they sign this week"></textarea></div>', 'Send for approval', function (fd) {
      var r = { id: C.nextId(P().apr.reqs, 'AP-', 100), kind: 'discount', ref: q.id, from: q.disc || 0, to: v, by: C.me().name, t: Date.now(), who: stepFor(v), st: 'pending', why: String(fd.get('why')) };
      P().apr.reqs.unshift(r); q.pend = r.id; C.audit('update', { t: 'quote', id: q.id, name: q.id }, 'Discount approval requested', (q.disc || 0) + '%', v + '%');
      P().users.filter(function (u) { return u.role === r.who || u.role === 'admin'; }).forEach(function (u) { if (u.name !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' asks to approve ' + v + '% on ' + q.id, '#/approvals', 'check', u.name); });
      C.save(); C.badges(); C.rerender(); C.toast('Sent for approval · ' + r.id, { icon: 'check' });
    });
    el.value = q.disc || 0;
  };
  function wonRule() { return P().apr && P().apr.rules.filter(function (r) { return r.what === 'deal.won'; })[0]; }
  function pendingWon(d) { return P().apr.reqs.filter(function (r) { return r.kind === 'won' && r.ref === d.id && r.st === 'pending'; })[0]; }
  function requestWon(d, to) {
    var rule = wonRule(), pend = pendingWon(d);
    if (pend) { C.toast('Already waiting for an admin: ' + pend.id, { icon: 'clock' }); return; }
    C.dialog('Needs an admin’s approval', '<p><b>' + esc(d.name) + '</b> is <b>' + C.rs(C.dealVal(d)) + '</b>. Deals of ' + C.rs(rule.min) + ' or more need an admin to approve before they can be marked Won, so the order, stock reservation and revenue are signed off.</p><div class="field"><label for="aw-w">What should the admin know?</label><textarea id="aw-w" name="why" rows="3" required placeholder="e.g. Order form signed; token advance received"></textarea></div>', 'Send for approval', function (fd) {
      var r = { id: C.nextId(P().apr.reqs, 'AP-', 100), kind: 'won', ref: d.id, to: to, val: C.dealVal(d), by: C.me().name, t: Date.now(), who: 'admin', st: 'pending', why: String(fd.get('why')) };
      P().apr.reqs.unshift(r); C.audit('update', { t: 'deal', id: d.id, name: d.name }, 'Won approval requested', C.pstage(d.pipe, d.stage).label, 'Won');
      P().users.filter(function (u) { return u.role === 'admin' && u.name !== C.me().name; }).forEach(function (u) { C.notify(C.me().name.split(' ')[0] + ' asks you to approve ' + d.id + ' (' + C.rs(C.dealVal(d)) + ') as Won', '#/approvals', 'check', u.name); });
      C.pact('system', 'Sent for approval before Won (' + r.id + ')', { c: d.c, co: d.co, d: d.id }, C.me().name);
      C.save(); C.badges(); C.rerender(); C.toast('Sent to an admin · ' + r.id, { icon: 'check' });
    });
  }
  var mv0 = C.moveDeal;
  C.moveDeal = function (d, to, o) {
    o = o || {}; var rule = wonRule(), st = C.pstage(d.pipe, to);
    if (rule && rule.on && st && st.won && d.pipe === 'sales' && d.stage !== to && !o.approved && !o.force && C.dealVal(d) >= rule.min && C.me().role !== 'admin') {
      var ok = P().apr.reqs.filter(function (r) { return r.kind === 'won' && r.ref === d.id && r.st === 'approved' && !r.used; })[0];
      if (!ok) { requestWon(d, to); return false; }
      var res = mv0.apply(this, arguments); if (res) ok.used = true; return res;
    }
    return mv0.apply(this, arguments);
  };
  V.approvals = {
    title: function () { return 'Approvals'; },
    render: function () {
      var R = P().apr.reqs, f = C.ui.apF || 'pending', L = R.filter(function (r) { return f === 'all' || r.st === f; });
      return C.page('Approvals', 'Requests that need a decision · rules live in Settings → Approval processes', '<a class="btn" href="#/settings/approvals">' + C.ic('cog', 14) + 'Rules</a>') +
        '<div class="seg aprseg" role="group" aria-label="Status">' + [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']].map(function (x) { return '<button type="button" data-act="ap-f" data-v="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' <span class="count-b">' + (x[0] === 'all' ? R.length : R.filter(function (r) { return r.st === x[0]; }).length) + '</span></button>'; }).join('') + '</div>' +
        (L.length ? '<ul class="aprl">' + L.map(function (r) {
          var isWon = r.kind === 'won', q = !isWon && (P().quotes || []).filter(function (x) { return x.id === r.ref; })[0], d = isWon ? C.deal(r.ref) : q && C.deal(q.d), mine = canApprove(r), tone = r.st === 'approved' ? 'ok' : r.st === 'rejected' ? 'bad' : 'warn';
          var what = isWon ? 'asks to mark ' + (d ? '<a class="ochip" href="#/deals/' + d.id + '">' + esc(d.name.split(' — ').pop()) + '</a>' : esc(r.ref)) + ' as <b>Won</b> · <span class="mono">' + C.rs(r.val || (d ? C.dealVal(d) : 0)) + '</span>'
            : 'asks for a <b>' + r.to + '% discount</b> on <a class="ochip mono" href="#/quotes/' + esc(r.ref) + '">' + esc(r.ref) + '</a>' + (d ? ' · <span class="ochip">' + esc(d.name) + '</span> <span class="mono sm">' + C.rs(C.dealVal(d)) + '</span>' : '');
          var impact = isWon ? (d ? 'Closing it adds ' + C.rs(C.dealVal(d)) + ' to revenue, reserves its stock in Stockroom and sends a Purchase event to Meta.' : '') : (d ? 'Impact: ' + C.rs(C.dealVal(d) * (r.to - r.from) / 100) + ' off the quote total.' : '');
          return '<li class="apr ' + r.st + '"><div class="apr-h">' + C.avatar(r.by, 32) + '<div><b>' + esc(r.by) + '</b> ' + what + '<small class="muted">' + C.rel(r.t) + ' · needs ' + (r.who === 'admin' ? 'an admin' : 'a ' + r.who) + (isWon ? '' : ' · currently ' + r.from + '%') + '</small></div><span class="hst ' + tone + '">' + { pending: 'Waiting', approved: 'Approved', rejected: 'Rejected' }[r.st] + '</span></div>' +
            '<p class="apr-w">“' + esc(r.why) + '”</p>' + (impact ? '<p class="sm muted">' + esc(impact) + '</p>' : '') +
            (r.st === 'pending' ? '<div class="apr-a">' + (mine ? '<button type="button" class="btn pri sm" data-act="ap-do" data-id="' + r.id + '" data-v="approved">' + C.ic('check', 13) + 'Approve</button><button type="button" class="btn sm" data-act="ap-do" data-id="' + r.id + '" data-v="rejected">Reject</button>' : '<span class="muted sm">' + C.ic('lock', 12) + ' Only ' + (r.who === 'admin' ? 'an admin' : 'a ' + r.who) + ' can decide this.</span>') + '</div>' : '<p class="sm muted">' + (r.st === 'approved' ? 'Approved' : 'Rejected') + ' by ' + esc(r.dec) + ' · ' + C.rel(r.dt) + (r.note ? ' · “' + esc(r.note) + '”' : '') + (isWon && r.st === 'approved' && !r.used ? ' · the deal still needs its token advance before it can close' : '') + '</p>') + '</li>';
        }).join('') + '</ul>' : '<div class="empty-st">' + C.ic('check', 22) + '<b>Nothing waiting</b><span>Discounts above a role’s cap and big deals going to Won land here for a manager or admin.</span></div>');
    }
  };
  C.acts['ap-f'] = function (el) { C.ui.apF = el.dataset.v; C.rerender(); };
  C.acts['ap-do'] = function (el) {
    var r = P().apr.reqs.filter(function (x) { return x.id === el.dataset.id; })[0], v = el.dataset.v; if (!r || !canApprove(r)) { C.deny('decide this approval'); return; }
    var go = function (note) {
      r.st = v; r.dec = C.me().name; r.dt = Date.now(); r.note = note;
      if (r.kind === 'won') {
        var d = C.deal(r.ref), msg = 'Your request to mark ' + (d ? d.name.split(' — ').pop() : r.ref) + ' as Won was ' + v;
        C.audit('approve', { t: 'deal', id: r.ref, name: d ? d.name : r.ref }, 'Approval ' + r.id, 'pending', v);
        if (v === 'approved' && d && C.dealOpen(d)) {
          if (!C.gateFor(d, r.to)) { r.used = true; C.moveDeal(d, r.to, { approved: true }); msg += ' and the deal is now Won'; } else msg += ': add the token advance to finish';
        }
        C.notify(msg, '#/deals/' + r.ref, 'check', r.by);
      } else {
        var q = (P().quotes || []).filter(function (x) { return x.id === r.ref; })[0];
        if (q) { if (v === 'approved') { C.audit('update', { t: 'quote', id: q.id, name: q.id }, 'Discount', q.disc + '%', r.to + '% (approved ' + r.id + ')'); q.disc = r.to; } q.pend = null; }
        C.audit('approve', { t: 'quote', id: r.ref, name: r.ref }, 'Approval ' + r.id, 'pending', v); C.notify('Your ' + r.to + '% discount on ' + r.ref + ' was ' + v, '#/quotes/' + r.ref, 'check', r.by);
      }
      C.save(); C.badges(); C.rerender(); C.toast(r.id + ' ' + v, { icon: v === 'approved' ? 'check' : 'x' });
    };
    if (v === 'rejected') C.dialog('Reject ' + r.id, '<div class="field"><label for="ap-n">Reason (sent to ' + esc(r.by.split(' ')[0]) + ')</label><input id="ap-n" name="n" required placeholder="' + (r.kind === 'won' ? 'e.g. Token advance not yet in the bank' : 'e.g. Offer 8% with free installation instead') + '"></div>', 'Reject', function (fd) { go(String(fd.get('n'))); }); else go('');
  };
  C.badgeFns.push(function () { var n = P().apr ? P().apr.reqs.filter(function (r) { return r.st === 'pending' && canApprove(r); }).length : 0; return { approvals: n }; });

  var dv0 = V.deals && V.deals.render;
  if (dv0) V.deals.render = function () {
    var h = dv0.apply(this, arguments), d = C.cur && C.cur.arg && C.deal(C.cur.arg), r = d && P().apr && pendingWon(d);
    if (!r) return h;
    var b = '<div class="apr-ban" role="status">' + C.ic('clock', 14) + '<span><b>Waiting for an admin</b> to approve this deal as Won · ' + esc(r.id) + ' · requested ' + C.rel(r.t) + ' by ' + esc(r.by.split(' ')[0]) + '</span><a class="btn sm" href="#/approvals">Open approvals</a></div>';
    return h.indexOf('<div class="rec">') > -1 ? h.replace('<div class="rec">', b + '<div class="rec">') : h;
  };

  // ===== Forecasting, territories and quotas ==========================================================================================
  var TERR = { North: ['Gurugram', 'Delhi', 'Chandigarh', 'South Delhi', 'Dwarka'], East: ['Noida', 'Greater Noida', 'Ghaziabad', 'Kolkata'], West: ['Mumbai', 'Pune', 'Ahmedabad'], South: ['Bengaluru', 'Hyderabad', 'Chennai'] };
  C.seeders.push(function (p) {
    if (p.terr) return;
    p.terr = { list: [{ id: 'North', head: 'Meera Joshi', cities: TERR.North }, { id: 'East', head: 'Meera Joshi', cities: TERR.East }, { id: 'West', head: 'Aarav Khanna', cities: TERR.West }, { id: 'South', head: 'Aarav Khanna', cities: TERR.South }], rep: {}, quota: {} };
    p.users.forEach(function (u, i) { p.terr.rep[u.name] = ['West', 'North', 'North', 'East'][i] || 'North'; p.terr.quota[u.name] = [9000000, 6000000, 7500000, 5000000][i] || 5000000; });
  });
  function qtr(off) { var d = new Date(), q = Math.floor(d.getMonth() / 3) + off, y = d.getFullYear() + Math.floor(q / 4); q = ((q % 4) + 4) % 4; var a = new Date(y, q * 3, 1).getTime(), b = new Date(y, q * 3 + 3, 1).getTime(); return { a: a, b: b, label: 'Q' + (q + 1) + ' ' + y }; }
  function fcat(d) { if (d.fcat) return d.fcat; var s = C.pstage(d.pipe, d.stage); if (!s) return 'Pipeline'; if (s.won) return 'Closed'; if (s.lost) return 'Omitted'; return s.p >= 75 ? 'Commit' : s.p >= 50 ? 'Best case' : 'Pipeline'; }
  C.fcat = fcat;
  V.forecast = {
    title: function () { return 'Forecast'; },
    render: function () {
      var off = C.ui.fqOff || 0, Q = qtr(off), by = C.ui.fBy || 'rep', T = P().terr, open = C.ui.fOpen;
      var deals = P().deals.filter(function (d) { return d.pipe === 'sales' && C.visible(d) && ((d.close >= Q.a && d.close < Q.b) || (fcat(d) === 'Closed' && (d.wonAt || d.moved) >= Q.a && (d.wonAt || d.moved) < Q.b)); });
      var reps = P().users.filter(function (u) { return u.active !== false && C.visibleOwner(u.name); }).map(function (u) { return u.name; });
      var keyOf = function (d) { return by === 'rep' ? d.owner : (T.rep[d.owner] || 'North'); }, keys = by === 'rep' ? reps : T.list.map(function (t) { return t.id; });
      var rows = keys.map(function (k) { var L = deals.filter(function (d) { return keyOf(d) === k; }), sum = function (c) { return L.filter(function (d) { return fcat(d) === c; }).reduce(function (s, d) { return s + C.dealVal(d); }, 0); }; var quota = by === 'rep' ? T.quota[k] || 0 : reps.filter(function (r) { return T.rep[r] === k; }).reduce(function (s, r) { return s + (T.quota[r] || 0); }, 0); return { k: k, L: L, closed: sum('Closed'), commit: sum('Commit'), best: sum('Best case'), pipe: sum('Pipeline'), quota: quota }; });
      var tot = rows.reduce(function (s, r) { ['closed', 'commit', 'best', 'pipe', 'quota'].forEach(function (f) { s[f] += r[f]; }); return s; }, { closed: 0, commit: 0, best: 0, pipe: 0, quota: 0 });
      var bar = function (r) { var mx = Math.max(r.quota, r.closed + r.commit + r.best) || 1, w = function (v) { return (v / mx * 100).toFixed(1) + '%'; }; return '<div class="fbar" role="img" aria-label="Closed ' + C.rs(r.closed) + ', commit ' + C.rs(r.commit) + ', best case ' + C.rs(r.best) + ' against quota ' + C.rs(r.quota) + '"><i class="c1" style="width:' + w(r.closed) + '"></i><i class="c2" style="width:' + w(r.commit) + '"></i><i class="c3" style="width:' + w(r.best) + '"></i>' + (r.quota ? '<b style="left:' + w(r.quota) + '"></b>' : '') + '</div>'; };
      var body = rows.map(function (r) {
        var att = r.quota ? r.closed / r.quota * 100 : 0, isOpen = open === r.k;
        return '<tr><th scope="row"><button type="button" class="lnk-row" data-act="f-open" data-k="' + esc(r.k) + '" aria-expanded="' + isOpen + '">' + C.ic(isOpen ? 'chev-d' : 'chev-r', 13) + (by === 'rep' ? C.avatar(r.k, 22) : '') + '<b>' + esc(r.k) + '</b></button><small class="muted">' + (by === 'rep' ? (T.rep[r.k] || '') + ' territory' : r.L.length + ' deals') + '</small></th><td class="num mono">' + C.rs(r.quota) + '</td><td class="num mono"><b>' + C.rs(r.closed) + '</b></td><td class="num mono">' + C.rs(r.commit) + '</td><td class="num mono">' + C.rs(r.best) + '</td><td class="num mono">' + C.rs(r.pipe) + '</td><td class="fb">' + bar(r) + '<small><b>' + att.toFixed(0) + '%</b> of quota' + (r.quota ? ' · gap ' + C.rs(Math.max(0, r.quota - r.closed - r.commit)) + ' after commit' : '') + '</small></td></tr>' +
          (isOpen ? '<tr class="cx-x"><td colspan="7"><table class="tbl mini"><thead><tr><th scope="col">Deal</th><th scope="col">Stage</th><th scope="col">Close</th><th scope="col" class="num">Amount</th><th scope="col">Forecast category</th></tr></thead><tbody>' + r.L.map(function (d) { var s = C.pstage(d.pipe, d.stage); return '<tr><td><a href="#/deals/' + d.id + '">' + esc(d.name) + '</a></td><td><span class="pill" style="--c:' + s.color + '"><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span></td><td class="sm">' + C.dshort(d.close) + '</td><td class="num mono">' + C.rs(C.dealVal(d)) + '</td><td>' + (fcat(d) === 'Closed' ? '<span class="hst ok">Closed</span>' : '<label class="sr" for="fc-' + d.id + '">Forecast category for ' + esc(d.name) + '</label><select id="fc-' + d.id + '" class="sel sm" data-ch="f-cat" data-id="' + d.id + '"' + (C.can('edit', d) ? '' : ' disabled') + '>' + ['Commit', 'Best case', 'Pipeline', 'Omitted'].map(function (c) { return '<option' + (fcat(d) === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>' + (d.fcat ? ' <span class="tagc" title="Set by the rep, not by stage">override</span>' : '')) + '</td></tr>'; }).join('') + '</tbody></table></td></tr>' : '');
      }).join('');
      return C.page('Forecast', esc(C.PIPES.sales.label) + ' pipeline · ' + Q.label + ' · categories come from stage probability unless a rep overrides them', '<div class="seg" role="group" aria-label="Quarter">' + [[-1, 'Last'], [0, 'This quarter'], [1, 'Next']].map(function (x) { return '<button type="button" data-act="f-q" data-v="' + x[0] + '" aria-pressed="' + (off === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>') +
        '<div class="kpis sm4"><div class="kpi"><span class="kl">Quota</span><b>' + C.rs(tot.quota) + '</b><small>' + Q.label + '</small></div><div class="kpi"><span class="kl">Closed won</span><b>' + C.rs(tot.closed) + '</b><small>' + (tot.quota ? Math.round(tot.closed / tot.quota * 100) : 0) + '% attainment</small></div><div class="kpi"><span class="kl">Commit</span><b>' + C.rs(tot.closed + tot.commit) + '</b><small>closed + commit</small></div><div class="kpi"><span class="kl">Best case</span><b>' + C.rs(tot.closed + tot.commit + tot.best) + '</b><small>+ ' + C.rs(tot.pipe) + ' pipeline</small></div></div>' +
        '<section class="card flush"><div class="card-h pad"><div><h2>By ' + (by === 'rep' ? 'rep' : 'territory') + '</h2><p class="sub"><i class="lg c1"></i>Closed <i class="lg c2"></i>Commit <i class="lg c3"></i>Best case · the tick is the quota</p></div><div class="seg" role="group" aria-label="Group by"><button type="button" data-act="f-by" data-v="rep" aria-pressed="' + (by === 'rep') + '">Rep</button><button type="button" data-act="f-by" data-v="terr" aria-pressed="' + (by === 'terr') + '">Territory</button></div></div><div class="tablewrap"><table class="tbl fct"><thead><tr><th scope="col">' + (by === 'rep' ? 'Rep' : 'Territory') + '</th><th scope="col" class="num">Quota</th><th scope="col" class="num">Closed</th><th scope="col" class="num">Commit</th><th scope="col" class="num">Best case</th><th scope="col" class="num">Pipeline</th><th scope="col">Attainment</th></tr></thead><tbody>' + body + '</tbody></table></div></section>';
    }
  };
  C.acts['f-q'] = function (el) { C.ui.fqOff = +el.dataset.v; C.rerender(); };
  C.acts['f-by'] = function (el) { C.ui.fBy = el.dataset.v; C.ui.fOpen = null; C.rerender(); };
  C.acts['f-open'] = function (el) { C.ui.fOpen = C.ui.fOpen === el.dataset.k ? null : el.dataset.k; C.rerender(); var b = $('[data-act="f-open"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); };
  C.chs['f-cat'] = function (el) { var d = C.deal(el.dataset.id), was = fcat(d); d.fcat = el.value; C.audit('update', C.refOf('deal', d), 'Forecast category', was, el.value); C.save(); C.rerender(); var x = $('#fc-' + d.id); if (x) x.focus(); };

  // settings tabs owned here
  C.setTabs = C.setTabs || {};
  C.setTabs.workspace = function () {
    var cur = C.WS;
    return '<section class="card"><div class="card-h"><div><h2>This workspace</h2><p class="sub">Template: ' + { services: 'Services', b2b: 'B2B sales', agency: 'Agency' }[cur.tpl] + '</p></div></div><div class="wsc"><span class="ws-tile lg">' + C.ic(cur.ic, 20) + '</span><div><b>' + esc(cur.name) + '</b><span class="muted sm">' + esc(cur.sub) + ' · ' + P().users.length + ' users · ' + P().deals.length + ' deals · ' + P().contacts.length + ' contacts</span></div></div></section>' +
      '<section class="card"><div class="card-h"><div><h2>Workspaces</h2><p class="sub">Each one has its own records, pipelines, fields and users</p></div><button type="button" class="btn pri" data-act="ws-new">' + C.ic('plus', 14) + 'New from a template</button></div><ul class="wsl">' + wsList().map(function (w) { var t = TPL[w.tpl]; return '<li><span class="ws-tile">' + C.ic(t.ic, 14) + '</span><div><b>' + esc(w.name) + '</b><small class="muted">' + esc(t.blurb) + '</small></div>' + (w.id === cur.id ? '<span class="hst ok">Current</span>' : '<button type="button" class="btn sm" data-act="ws-go" data-id="' + esc(w.id) + '">Switch</button>') + '</li>'; }).join('') + '</ul></section>';
  };
  C.setTabs.approvals = function () {
    var A = P().apr;
    return '<section class="card"><div class="card-h"><div><h2>Approval processes</h2><p class="sub">When a request goes over a limit, it waits for the right person instead of being blocked</p></div><a class="btn" href="#/approvals">Open approvals</a></div><ul class="arules">' + A.rules.map(function (r) {
      return '<li><label class="sw"><input type="checkbox" data-ch="ar-on" data-id="' + r.id + '"' + (r.on ? ' checked' : '') + (C.can('settings') ? '' : ' disabled') + '><span aria-hidden="true"></span><span class="sr">' + esc(r.name) + '</span></label><div><b>' + esc(r.name) + '</b><ol class="asteps">' + (r.what === 'quote.discount' ? '<li>Up to the role’s cap (agent 5%, manager 15%): no approval</li>' + r.steps.map(function (s, i) { return '<li>Up to <label class="sr" for="as-' + i + '">Limit</label><input id="as-' + i + '" class="in-n" type="number" min="1" max="100" value="' + s.upTo + '" data-ch="ar-step" data-i="' + i + '"' + (C.can('settings') && i === 0 ? '' : ' disabled') + '>%: a <b>' + s.who + '</b> approves</li>'; }).join('') : '<li>When a deal of <label class="sr" for="ar-min">Threshold in lakh</label>₹ <input id="ar-min" class="in-n" type="number" min="1" max="500" value="' + Math.round(r.min / 1e5) + '" data-ch="ar-min"' + (C.can('settings') ? '' : ' disabled') + '> L or more is moved to Won by a non-admin, an <b>admin</b> approves it first</li>') + '</ol></div></li>';
    }).join('') + '</ul></section>';
  };
  C.chs['ar-on'] = function (el) { var r = P().apr.rules.filter(function (x) { return x.id === el.dataset.id; })[0]; r.on = el.checked; C.audit('settings', null, 'Approval rule: ' + r.name, el.checked ? 'off' : 'on', el.checked ? 'on' : 'off'); C.save(); };
  C.chs['ar-min'] = function (el) { var r = wonRule(), v = Math.max(1, Math.min(500, +el.value || 20)) * 1e5; C.audit('settings', null, 'Won approval threshold', C.rs(r.min), C.rs(v)); r.min = v; C.save(); C.toast('Threshold is now ' + C.rs(v), { icon: 'check' }); };
  C.chs['ar-step'] = function (el) { var s = P().apr.rules[0].steps[+el.dataset.i], v = Math.max(1, Math.min(99, +el.value || 15)); C.audit('settings', null, 'Approval limit (' + s.who + ')', s.upTo + '%', v + '%'); s.upTo = v; C.save(); };
  C.setTabs.territories = function () {
    var T = P().terr, ro = C.can('settings') ? '' : ' disabled';
    return '<section class="card"><div class="card-h"><div><h2>Territories</h2><p class="sub">Leads and accounts are matched to a territory by city; forecasts roll up by territory</p></div></div><div class="terrg">' + T.list.map(function (t) { return '<div class="terr"><b>' + t.id + '</b><small class="muted">Head: ' + esc(t.head) + '</small><p class="sm">' + t.cities.map(esc).join(', ') + '</p></div>'; }).join('') + '</div></section>' +
      '<section class="card flush"><div class="card-h pad"><div><h2>Quotas</h2><p class="sub">Per rep, per quarter (₹, ' + esc(C.PIPES.sales.label) + ' pipeline)</p></div></div><div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Rep</th><th scope="col">Territory</th><th scope="col" class="num">Quarterly quota (₹ L)</th></tr></thead><tbody>' + P().users.map(function (u) { return '<tr><td><span class="ochip">' + C.avatar(u.name, 18) + esc(u.name) + '</span></td><td><label class="sr" for="tr-' + u.name.replace(/\W/g, '') + '">Territory for ' + esc(u.name) + '</label><select id="tr-' + u.name.replace(/\W/g, '') + '" class="sel sm" data-ch="tr-rep" data-n="' + esc(u.name) + '"' + ro + '>' + T.list.map(function (t) { return '<option' + (T.rep[u.name] === t.id ? ' selected' : '') + '>' + t.id + '</option>'; }).join('') + '</select></td><td class="num"><label class="sr" for="qt-' + u.name.replace(/\W/g, '') + '">Quota for ' + esc(u.name) + '</label><input id="qt-' + u.name.replace(/\W/g, '') + '" class="in-n" type="number" min="0" step="5" value="' + Math.round((T.quota[u.name] || 0) / 1e5) + '" data-ch="qt-set" data-n="' + esc(u.name) + '"' + ro + '></td></tr>'; }).join('') + '</tbody></table></div></section>';
  };
  C.chs['tr-rep'] = function (el) { var T = P().terr; C.audit('settings', null, 'Territory for ' + el.dataset.n, T.rep[el.dataset.n], el.value); T.rep[el.dataset.n] = el.value; C.save(); };
  C.chs['qt-set'] = function (el) { var T = P().terr, v = Math.max(0, +el.value || 0) * 1e5; C.audit('settings', null, 'Quota for ' + el.dataset.n, C.rs(T.quota[el.dataset.n] || 0), C.rs(v)); T.quota[el.dataset.n] = v; C.save(); C.toast('Quota saved', { icon: 'check' }); };

  // ===== Integrations marketplace ======================================================================================================
  var APPS = [
    ['meta', 'Meta Pixel and Conversions API', 'Marketing', 'scan', 'Browser and server events, lead ads, ROAS back to campaigns.', '#/tracking'],
    ['gsc', 'Google Search Console', 'Marketing', 'search', 'Queries, pages, indexing and organic leads by landing page.', '#/gsc'],
    ['gads', 'Google Ads', 'Marketing', 'mega', 'Import gclid conversions and offline conversions from won deals.', ''],
    ['wa', 'WhatsApp Business', 'Messaging', 'wa', 'Shared inbox, templates and opt-ins on every contact.', '#/conversations'],
    ['mail', 'Email (IMAP and SMTP)', 'Messaging', 'mail', 'Two-way sync into Conversations and timelines.', '#/conversations'],
    ['cal', 'Calendar sync', 'Productivity', 'cal', 'Meetings and site visits both ways; free/busy for booking.', '#/calendar'],
    ['stock', 'Halden Stockroom', 'Operations', 'box', 'Won deals reserve stock; availability shows on line items.', '../inventory/index.html'],
    ['ledger', 'Ledgerline accounting', 'Finance', 'note', 'Push accepted quotes as invoices with GST; payment status back.', ''],
    ['sign', 'Inkwell e-signature', 'Sales', 'form', 'Send quotes for signature; signed PDF lands on the deal.', ''],
    ['chat', 'Website chat', 'Messaging', 'bot', 'The scripted assistant creates leads with transcripts.', '#/bot'],
    ['hook', 'Webhooks and REST API', 'Developer', 'bolt', 'Push record changes anywhere; keys scoped by role.', ''],
    ['sheet', 'Spreadsheet import and export', 'Data', 'upload', 'CSV with mapping, merge preview and undo.', '#/contacts']
  ];
  C.seeders.push(function (p) { if (!p.apps) p.apps = { meta: 1, gsc: 1, wa: 1, mail: 1, cal: 1, stock: 1, chat: 1, sheet: 1 }; });
  // the previous Integrations screen (Search Console + Meta tabs) stays reachable for the before/after review only
  if (V.integrations) { var IV0 = V.integrations; V['integrations-v1'] = { title: function () { return 'Integrations (previous version)'; }, render: IV0.render, mount: IV0.mount }; }
  V.integrations = {
    title: function () { return 'Integrations'; },
    render: function () {
      var on = P().apps, f = C.ui.mpF || 'All', cats = ['All', 'Connected'].concat(APPS.map(function (a) { return a[2]; }).filter(function (v, i, a) { return a.indexOf(v) === i; })), L = APPS.filter(function (a) { return f === 'All' || (f === 'Connected' ? on[a[0]] : a[2] === f); });
      return C.page('Integrations', Object.keys(on).filter(function (k) { return on[k]; }).length + ' of ' + APPS.length + ' connected') +
        '<div class="chips tight" role="group" aria-label="Category">' + cats.map(function (c) { return '<button type="button" class="chip" data-act="mp-f" data-v="' + c + '" aria-pressed="' + (f === c) + '">' + c + '</button>'; }).join('') + '</div>' +
        '<div class="mpg">' + L.map(function (a) { var c = !!on[a[0]]; return '<article class="mpc' + (c ? ' on' : '') + '"><div class="mpc-h"><span class="mpc-ic">' + C.ic(a[3], 18) + '</span><div><b>' + esc(a[1]) + '</b><small class="muted">' + a[2] + '</small></div>' + (c ? '<span class="hst ok">Connected</span>' : '') + '</div><p>' + esc(a[4]) + '</p><div class="mpc-a">' + (c ? (a[5] ? '<a class="btn sm" href="' + a[5] + '">Open</a>' : '') + '<button type="button" class="btn sm ghost" data-act="mp-tog" data-k="' + a[0] + '">Disconnect</button>' : '<button type="button" class="btn sm pri" data-act="mp-tog" data-k="' + a[0] + '">Connect</button>') + '</div></article>'; }).join('') + '</div>';
    }
  };
  C.acts['mp-f'] = function (el) { C.ui.mpF = el.dataset.v; C.rerender(); var b = $('[data-act="mp-f"][aria-pressed="true"]'); if (b) b.focus(); };
  C.acts['mp-tog'] = function (el) {
    if (!C.can('settings')) { C.deny('connect integrations'); return; }
    var k = el.dataset.k, a = APPS.filter(function (x) { return x[0] === k; })[0], on = P().apps;
    if (on[k]) { on[k] = 0; C.audit('settings', null, 'Integration', a[1], 'disconnected'); C.save(); C.rerender(); C.toast(a[1] + ' disconnected', { icon: 'x', undo: function () { on[k] = 1; C.save(); C.rerender(); } }); return; }
    C.dialog('Connect ' + esc(a[1]), '<p class="hint">You’ll be asked to sign in to the provider and approve access.</p><ol class="steps3"><li class="done">Choose the account</li><li class="now">Grant read and write for records, events and files</li><li>Map fields (defaults are fine)</li></ol><label class="chk"><input type="checkbox" name="ok" required> Allow Lumen to read and write these records</label>', 'Connect', function () { on[k] = 1; C.audit('settings', null, 'Integration', a[1], 'connected'); C.save(); C.rerender(); C.toast(a[1] + ' connected', { icon: 'check' }); });
  };

  // ===== "+ New" menu in the top bar =============================================================================================
  var NEW = [['New lead', 'inbox', function () { if (C.acts['new-lead']) C.acts['new-lead'](); else location.hash = '#/inbox'; }], ['New contact', 'user', function () { location.hash = '#/contacts'; setTimeout(function () { var b = $('[data-act="contact-new"],[data-act="c-new"]'); if (b) b.click(); }, 120); }], ['New company', 'building', function () { location.hash = '#/companies'; setTimeout(function () { var b = $('[data-act="company-new"],[data-act="co-new"]'); if (b) b.click(); }, 120); }], ['New deal', 'deal', function () { location.hash = '#/deals'; setTimeout(function () { var b = $('[data-act="deal-new"]'); if (b) b.click(); }, 120); }], ['New task', 'tasks', function () { location.hash = '#/tasks'; }], ['New quote', 'quote', function () { location.hash = '#/quotes'; }], ['New ticket', 'ticket', function () { location.hash = '#/tickets'; setTimeout(function () { var b = $('[data-act="t-new"],[data-act="ticket-new"]'); if (b) b.click(); }, 120); }]];
  function mountNew() {
    if ($('#newb')) return; var top = $('.top .gsearch') || $('#gsearch'); if (!top) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'newb'; b.className = 'btn pri sm newb'; b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-label', 'New record'); b.setAttribute('aria-expanded', 'false'); b.innerHTML = C.ic('plus', 14) + '<span>New</span>';
    top.parentNode.insertBefore(b, top.nextSibling);
    b.addEventListener('click', function () {
      var m = $('#new-pop'); if (m) { m.remove(); b.setAttribute('aria-expanded', 'false'); return; }
      m = document.createElement('div'); m.id = 'new-pop'; m.className = 'ws-pop'; m.setAttribute('role', 'menu');
      m.innerHTML = NEW.map(function (x, i) { return '<button type="button" role="menuitem" data-i="' + i + '">' + C.ic(x[1], 15) + x[0] + '</button>'; }).join('');
      document.body.appendChild(m); var r = b.getBoundingClientRect(); m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(r.left, innerWidth - 240)) + 'px'; b.setAttribute('aria-expanded', 'true'); m.querySelector('button').focus();
      m.addEventListener('click', function (e) { var x = e.target.closest('button'); if (!x) return; m.remove(); b.setAttribute('aria-expanded', 'false'); NEW[+x.dataset.i][2](); });
    });
  }
  document.addEventListener('click', function (e) { var m = $('#new-pop'); if (m && !e.target.closest('#new-pop,#newb')) { m.remove(); var b = $('#newb'); if (b) b.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', function (e) { var m = $('#new-pop'); if (m && e.key === 'Escape') { m.remove(); var b = $('#newb'); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); } } });
  C.onRoute = (function (prev) { return function (n, a) { if (prev) prev(n, a); mountNew(); }; })(C.onRoute);

  C.searchers.push(function (terms, hit) { var o = []; [['Forecast', 'forecast'], ['Approvals', 'approvals'], ['Products and price books', 'products'], ['Campaigns', 'campaigns'], ['Integrations marketplace', 'integrations']].forEach(function (x) { if (hit(x[0] + ' quota territory commit best case price book sku campaign members approval discount marketplace')) o.push({ g: 'Go to', ic: 'arrow', label: x[0], sub: 'Page', run: function () { location.hash = '#/' + x[1]; } }); }); return o.slice(0, 3); });
})();
