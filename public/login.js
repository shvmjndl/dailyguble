(function(){
  'use strict';
  var form = document.getElementById('loginForm');
  var err = document.getElementById('loginError');
  var btn = document.getElementById('loginBtn');
  function show(text){ err.textContent = text; }
  function reset(){ btn.disabled = false; btn.textContent = 'Sign in'; }
  form.username.focus();
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var username = form.username.value.trim(), password = form.password.value;
    if (!username || !password) { show('Enter your username and password.'); return; }
    btn.disabled = true; btn.textContent = 'Checking…'; show('');
    fetch('/api/login', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){ d.status = r.status; return d; });
    }).then(function(d){
      if (d.status === 200) { btn.textContent = 'Signed in'; location.replace('/admin'); return; }
      reset(); form.password.value = ''; form.password.focus();
      if (d.status === 429 && d.error === 'locked') show('Too many attempts. Sign-in is locked for ' + Math.max(1, Math.ceil((d.retryAfter || 900) / 60)) + ' minutes.');
      else if (d.status === 401) show('That username and password don’t match.' + (d.remaining != null && d.remaining <= 2 ? ' ' + d.remaining + (d.remaining === 1 ? ' try' : ' tries') + ' left before a 15-minute lockout.' : ''));
      else if (d.status === 503 && d.error === 'not_configured') show('Sign-in isn’t set up on this server yet. Set ADMIN_PASSWORD_HASH and restart it.');
      else if (d.status === 503) show('The server is busy. Try again in a few seconds.');
      else if (d.status === 403) show('This sign-in came from another site and was blocked.');
      else show('Sign-in failed. Try again in a moment.');
    }, function(){ reset(); show('Couldn’t reach the server. Check your connection.'); });
  });
})();
