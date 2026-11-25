/* Lead Run inside the arcade. The game itself is the original (games.js); this only gives it a full-screen stage. */
(function () {
  'use strict';
  var d = document;
  window.Arcade.reg('run', {
    title: 'Lead Run', own: true,
    how: ['Fly the lead home. Steer with your mouse, your finger or the arrow keys.', 'Dodge what loses leads: spreadsheets, missed calls, double entries.', 'Collect CRM, Website, Automation and 3D to build the system. You have three lives.'],
    tie: ['', '#work', ''],
    start: function (c) {
      c.root.innerHTML = '<div class="lv arc-run"><div class="run-stage" data-run><canvas class="run-cv" role="img" aria-label="Lead Run, a small arcade game"></canvas><div class="run-ov"><p class="run-t">Lead Run</p><p class="run-s">Steer with your mouse, your finger or the arrow keys.</p><button class="hbtn run-go" type="button">Play <span aria-hidden="true">→</span></button><p class="run-best"></p></div></div></div>';
      var s = d.createElement('script'); s.src = c.base + 'games.js?r=' + Date.now(); c.root.appendChild(s);
    }
  });
})();
