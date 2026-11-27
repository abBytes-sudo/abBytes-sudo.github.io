/* Ordwell — template library, shared by the app (Templates → Use template) and the marketing templates gallery.
   Task rows: [title, statusIndex, startOffsetDays, durationDays, estimateHours, tags, roleIndex]. deps: [blockerIndex, taskIndex]. */
(function () {
  'use strict';
  var OW = window.OW = window.OW || {};
  OW.TEMPLATES = [
    { id: 'tp-agency', name: 'Agency client delivery', hue: 18, cat: 'Agencies', blurb: 'Kick-off to launch for a website or brand project, with client review built in and a budget sheet that does its own maths.',
      statuses: [['Brief', 'todo'], ['In progress', 'active'], ['Internal review', 'review'], ['Client review', 'review2'], ['Approved', 'done']],
      fields: [['Budget', 'number', 'inr'], ['Spent', 'number', 'inr'], ['Remaining', 'formula', 'inr', '{Budget} - {Spent}']],
      views: ['Board', 'Timeline', 'Table', 'Client-visible list'], autos: ['Client review → tag client-visible and set a 2-day reply window', 'Approved → notify the account manager'],
      tasks: [['Kick-off call and goals', 4, 0, 1, 2, ['client-visible']], ['Discovery workshop', 1, 1, 3, 10, []], ['Sitemap and content inventory', 1, 3, 4, 10, []], ['Moodboard and visual direction', 0, 5, 5, 16, ['design']], ['Wireframes — key pages', 0, 8, 6, 20, ['design']], ['Visual design — homepage', 0, 13, 6, 24, ['design', 'client-visible']], ['Copywriting', 0, 10, 10, 18, ['content']], ['Build — front end', 0, 19, 12, 60, ['dev']], ['QA across devices', 0, 30, 4, 12, ['qa']], ['Client UAT', 0, 33, 4, 6, ['client-visible']], ['Launch', 0, 38, 1, 2, ['milestone', 'client-visible']]],
      deps: [[1, 2], [2, 4], [3, 5], [4, 5], [5, 7], [6, 7], [7, 8], [8, 9], [9, 10]] },
    { id: 'tp-site', name: 'Construction site', hue: 40, cat: 'Construction', blurb: 'Survey to handover for a fit-out or small build: trades in sequence, snag list, inspections and vendor payments with a running balance.',
      statuses: [['Planned', 'todo'], ['Mobilised', 'active'], ['Snag list', 'blocked'], ['Inspection', 'review'], ['Signed off', 'done']],
      fields: [['Vendor', 'select', null, null, ['Civil contractor', 'MEP contractor', 'Glazing', 'Joinery', 'Own crew']], ['Contract value', 'number', 'inr'], ['Paid', 'number', 'inr'], ['Balance', 'formula', 'inr', '{Contract value} - {Paid}']],
      views: ['Timeline', 'Board', 'Payments table', 'Calendar'], autos: ['Snag list → mark urgent and notify the site lead', 'Due tomorrow → remind the vendor owner'],
      tasks: [['Site survey and measurements', 0, 0, 2, 6, []], ['Demolition and debris removal', 0, 2, 3, 0, ['civil']], ['Civil — walls and flooring base', 0, 5, 9, 0, ['civil']], ['Electrical first fix', 0, 12, 6, 0, ['mep']], ['Plumbing and drainage', 0, 12, 5, 0, ['mep']], ['False ceiling', 0, 18, 5, 0, ['civil']], ['Flooring', 0, 22, 6, 0, ['civil']], ['Painting', 0, 27, 6, 0, ['finishes']], ['Fixtures and fittings', 0, 32, 4, 0, ['finishes']], ['Snag walk with client', 0, 36, 1, 3, ['client-visible']], ['Handover', 0, 38, 1, 2, ['milestone', 'client-visible']]],
      deps: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]] },
    { id: 'tp-sprint', name: 'Product sprint', hue: 222, cat: 'Product', blurb: 'A two-week sprint with points, a bug bash, review and retro — plus a burn-up dashboard ready on day one.',
      statuses: [['Backlog', 'backlog'], ['To do', 'todo'], ['In progress', 'active'], ['In review', 'review'], ['Done', 'done']],
      fields: [['Points', 'number', 'num'], ['Area', 'select', null, null, ['Frontend', 'Backend', 'Design', 'Infra']]],
      views: ['Board', 'List by assignee', 'Workload', 'Burn-up dashboard'], autos: ['All subtasks done → move parent to review', 'Bug report form → assign the on-call engineer'],
      tasks: [['Sprint planning', 1, 0, 1, 2, ['ritual']], ['Story: saved filters', 1, 1, 5, 13, ['frontend']], ['Story: export to CSV', 1, 1, 4, 8, ['backend']], ['Story: onboarding checklist', 1, 2, 6, 13, ['frontend']], ['Story: weekly email digest', 0, 3, 6, 8, ['backend']], ['Bug bash', 1, 8, 1, 4, ['qa']], ['Sprint review and show-and-tell', 1, 9, 1, 2, ['milestone']], ['Retro', 1, 9, 1, 1, ['ritual']]],
      deps: [[0, 1], [0, 2], [0, 3], [1, 5], [3, 5], [5, 6]] },
    { id: 'tp-mkt', name: 'Marketing calendar', hue: 330, cat: 'Marketing', blurb: 'A month of posts, reels, newsletters and a campaign, laid out on a calendar with channel tags and an approval step.',
      statuses: [['Idea', 'backlog'], ['Writing', 'active'], ['Design', 'review'], ['Scheduled', 'review2'], ['Published', 'done']],
      fields: [['Channel', 'select', null, null, ['Instagram', 'LinkedIn', 'Newsletter', 'Blog', 'YouTube']], ['Reach', 'number', 'num']],
      views: ['Calendar', 'Board', 'Table'], autos: ['Published → move to the content archive', 'Design → ask the brand lead to review'],
      tasks: [['Month theme and key dates', 1, 0, 2, 3, []], ['Reel: behind the scenes', 0, 2, 4, 8, ['reel']], ['Carousel: 5 tips', 0, 4, 3, 5, ['carousel']], ['Newsletter — week 1', 0, 5, 2, 4, ['newsletter']], ['Festive campaign concept', 0, 6, 5, 10, ['campaign']], ['Influencer collab brief', 0, 9, 3, 4, ['campaign']], ['Newsletter — week 3', 0, 18, 2, 4, ['newsletter']], ['Monthly report', 0, 28, 2, 4, ['report', 'client-visible']]],
      deps: [[0, 1], [0, 4], [4, 5]] },
    { id: 'tp-onboard', name: 'Client onboarding', hue: 150, cat: 'Agencies', blurb: 'Contract signed to first deliverable in ten working days: access, assets, kick-off deck and a shared status rhythm.',
      statuses: [['To do', 'todo'], ['In progress', 'active'], ['Waiting on client', 'review2'], ['Done', 'done']],
      fields: [['Owner team', 'select', null, null, ['Accounts', 'Design', 'Tech']]],
      views: ['List', 'Board', 'Client-visible list'], autos: ['Created via the intake form → assign accounts'],
      tasks: [['Countersign contract and PO', 0, 0, 1, 1, ['client-visible']], ['Collect brand assets and logins', 0, 1, 3, 2, ['client-visible']], ['Set up the client workroom and guests', 0, 1, 1, 1, []], ['Kick-off deck', 0, 2, 3, 6, []], ['Kick-off meeting', 0, 5, 1, 2, ['milestone', 'client-visible']], ['Weekly status note rhythm', 0, 6, 1, 1, []]],
      deps: [[0, 1], [2, 4], [3, 4], [4, 5]] },
    { id: 'tp-event', name: 'Event production', hue: 280, cat: 'Events', blurb: 'A launch event or offsite: venue, vendors, run-of-show and guest list, counting down to the day.',
      statuses: [['To book', 'todo'], ['Booked', 'active'], ['Confirming', 'review'], ['Ready', 'done']],
      fields: [['Vendor cost', 'number', 'inr'], ['Advance paid', 'number', 'inr'], ['Due to vendor', 'formula', 'inr', '{Vendor cost} - {Advance paid}']],
      views: ['Timeline', 'Table', 'Calendar'], autos: ['Due tomorrow → remind the owner'],
      tasks: [['Venue shortlist and booking', 0, 0, 5, 6, []], ['Guest list and invites', 0, 3, 10, 6, []], ['AV and stage vendor', 0, 5, 4, 3, []], ['Catering tasting', 0, 10, 1, 3, []], ['Run-of-show', 0, 14, 4, 6, []], ['Rehearsal', 0, 20, 1, 4, []], ['Event day', 0, 21, 1, 12, ['milestone']]],
      deps: [[0, 2], [0, 3], [2, 4], [4, 5], [5, 6]] }
  ];
})();
