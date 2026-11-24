/* Ordwell — boot (kept separate so the strict CSP needs no inline script) */
(function () { 'use strict'; try { window.OW.app.boot(); } catch (e) { console.error(e); var v = document.getElementById('view'); if (v) v.innerHTML = '<div class="empty"><h3>Something went wrong loading the workspace</h3><p>Try Start fresh in Settings › Data.</p></div>'; } })();
