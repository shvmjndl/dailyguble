
/* =========================================================
   ALMANAC: worked out in the reader's own browser.
     date, sunrise, sunset, moon   calculated here, instantly
     tides                         NOAA tide predictions
     weather                       US National Weather Service, or Open-Meteo outside the US
   Results are cached in the browser, so a returning reader sees them at once
   and the free public services get one request per reader every half hour at most.
   ========================================================= */
var DEFAULT_LOCATION = { lat: 44.105, lon: -69.1017, timeZone: 'America/New_York', tideStation: '8415490', units: 'F' };
var TIDE_TTL = 6 * 3600000, WEATHER_TTL = 30 * 60000, POINTS_TTL = 30 * 86400000;

function locationOf(issue){
  var l = Object.assign({}, DEFAULT_LOCATION, (issue && issue.location) || {});
  l.lat = +l.lat; l.lon = +l.lon; l.units = l.units === 'C' ? 'C' : 'F';
  try { new Intl.DateTimeFormat('en-US', { timeZone: l.timeZone }); } catch (e) { l.timeZone = DEFAULT_LOCATION.timeZone; }
  return l;
}
function datePartsIn(when, timeZone){
  var p = new Intl.DateTimeFormat('en-US', { timeZone: timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(when);
  function g(t){ return +p.filter(function(x){ return x.type === t; })[0].value; }
  return { y: g('year'), m: g('month'), d: g('day') };
}

/* ---------- sun (NOAA sunrise equation, within a minute or two) ---------- */
function sunEvent(y, m, d, lat, lon, rising){
  var DAY = 86400000, rad = Math.PI / 180;
  function mod(a, n){ return ((a % n) + n) % n; }
  var N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / DAY), lngHour = lon / 15;
  var t = N + ((rising ? 6 : 18) - lngHour) / 24, M = 0.9856 * t - 3.289;
  var L = mod(M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634, 360);
  var RA = mod(Math.atan(0.91764 * Math.tan(L * rad)) / rad, 360);
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  var sinDec = 0.39782 * Math.sin(L * rad), cosDec = Math.cos(Math.asin(sinDec));
  var cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
  if (cosH > 1 || cosH < -1) return null;
  var H = (rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad) / 15;
  var UT = mod(H + RA - 0.06571 * t - 6.622 - lngHour, 24);
  var noon = Date.UTC(y, m - 1, d, 12) - lngHour * 3600000, ms = Date.UTC(y, m - 1, d) + UT * 3600000;
  while (ms - noon > DAY / 2) ms -= DAY;
  while (noon - ms > DAY / 2) ms += DAY;
  return ms;
}
/* ---------- moon ---------- */
function moonOn(ms){
  var SYN = 29.530588853, age = (((ms - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % SYN + SYN) % SYN;
  var names = [[1.85, 'New moon'], [5.54, 'Waxing crescent'], [9.23, 'First quarter'], [12.92, 'Waxing gibbous'],
    [16.61, 'Full moon'], [20.3, 'Waning gibbous'], [23.99, 'Last quarter'], [27.68, 'Waning crescent'], [99, 'New moon']];
  var phase = names.filter(function(n){ return age < n[0]; })[0][1];
  return { phase: phase, illumination: Math.round((1 - Math.cos(2 * Math.PI * age / SYN)) / 2 * 100) };
}

/* ---------- small fetch helpers ---------- */
function cached(key, ttl){ var v = store('cache:' + key); return v && Date.now() - v.at < ttl ? v.data : null; }
function remember(key, data){ store('cache:' + key, { at: Date.now(), data: data }); }
function getJSON(url){
  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = ctrl && setTimeout(function(){ ctrl.abort(); }, 9000);
  return fetch(url, { headers: { Accept: 'application/geo+json, application/json' }, signal: ctrl && ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(function(r){ clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function pad2(n){ return (n < 10 ? '0' : '') + n; }

/* ---------- tides (NOAA) ---------- */
function fetchTides(station, day){
  var key = 'tides:' + station + ':' + day.y + pad2(day.m) + pad2(day.d), hit = cached(key, TIDE_TTL);
  if (hit) return Promise.resolve(hit);
  var start = new Date(Date.UTC(day.y, day.m - 1, day.d) - 86400000);
  var begin = start.getUTCFullYear() + pad2(start.getUTCMonth() + 1) + pad2(start.getUTCDate());
  return getJSON('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&interval=hilo' +
    '&units=english&time_zone=gmt&format=json&application=daily_guble&station=' + encodeURIComponent(station) + '&begin_date=' + begin + '&range=72')
    .then(function(body){
      if (!body || !Array.isArray(body.predictions)) throw new Error((body && body.error && body.error.message) || 'no predictions');
      var tides = body.predictions.map(function(p){
        return { type: p.type === 'H' ? 'high' : 'low', time: new Date(String(p.t).replace(' ', 'T') + ':00Z').toISOString(), feet: Math.round(Number(p.v) * 10) / 10 };
      });
      remember(key, tides);
      return tides;
    });
}

/* ---------- weather ---------- */
var WMO = { 0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain',
  67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorms', 96: 'Thunderstorms with hail', 99: 'Thunderstorms with hail' };
function inUS(loc){ return loc.lat > 17 && loc.lat < 72 && loc.lon > -180 && loc.lon < -64; }
function toUnits(f, units){ return f == null ? null : Math.round(units === 'C' ? (f - 32) * 5 / 9 : f); }
function localKeyIn(iso, tz){ return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz }); }

function weatherFromNWS(loc){
  var pkey = 'points:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3), pts = cached(pkey, POINTS_TTL);
  var points = pts ? Promise.resolve(pts) : getJSON('https://api.weather.gov/points/' + loc.lat.toFixed(4) + ',' + loc.lon.toFixed(4)).then(function(j){
    var p = j && j.properties; if (!p || !p.forecast) throw new Error('no forecast office here');
    var v = { forecast: p.forecast, hourly: p.forecastHourly }; remember(pkey, v); return v;
  });
  return points.then(function(p){
    return Promise.all([getJSON(p.forecast), getJSON(p.hourly).catch(function(){ return null; })]);
  }).then(function(r){
    var periods = (r[0] && r[0].properties && r[0].properties.periods) || [];
    if (!periods.length) throw new Error('empty forecast');
    var hour = r[1] && r[1].properties && r[1].properties.periods && r[1].properties.periods[0];
    var days = {}, tonight = null;
    periods.forEach(function(p){
      var k = localKeyIn(p.startTime, loc.timeZone), d = days[k] = days[k] || { date: k };
      if (p.isDaytime) { d.high = toUnits(p.temperature, loc.units); d.text = p.shortForecast; }
      else { d.low = toUnits(p.temperature, loc.units); if (!d.text) d.text = p.shortForecast; if (!tonight) tonight = { text: p.shortForecast, temp: d.low }; }
    });
    var first = periods[0];
    return {
      source: 'National Weather Service',
      current: hour ? { temp: toUnits(hour.temperature, loc.units), text: hour.shortForecast } : { temp: toUnits(first.temperature, loc.units), text: first.shortForecast },
      forecast: first.shortForecast + '. ' + (first.isDaytime ? 'High ' : 'Low ') + toUnits(first.temperature, loc.units) + '°.' +
        (first.windSpeed ? ' Wind ' + (first.windDirection ? first.windDirection + ' ' : '') + first.windSpeed + '.' : ''),
      tonight: tonight,
      days: Object.keys(days).sort().map(function(k){ return days[k]; })
    };
  });
}
function weatherFromOpenMeteo(loc){
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=4' +
    '&timezone=' + encodeURIComponent(loc.timeZone) + '&temperature_unit=' + (loc.units === 'C' ? 'celsius' : 'fahrenheit');
  return getJSON(url).then(function(j){
    var dl = j.daily || {}, days = (dl.time || []).map(function(t, i){
      return { date: t, high: Math.round(dl.temperature_2m_max[i]), low: Math.round(dl.temperature_2m_min[i]), text: WMO[dl.weather_code[i]] || '' };
    });
    if (!days.length) throw new Error('empty forecast');
    var cur = j.current || {}, today = days[0], tonightLow = days[1] ? days[1].low : today.low;
    return {
      source: 'Open-Meteo.com',
      current: { temp: Math.round(cur.temperature_2m), text: WMO[cur.weather_code] || today.text },
      forecast: today.text + '. High ' + today.high + '°, low tonight ' + tonightLow + '°.',
      tonight: { text: WMO[cur.weather_code] || today.text, temp: tonightLow },
      days: days
    };
  });
}
function fetchWeather(loc){
  var key = 'weather:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3) + ':' + loc.units, hit = cached(key, WEATHER_TTL);
  if (hit) return Promise.resolve(hit);
  var job = inUS(loc) ? weatherFromNWS(loc).catch(function(){ return weatherFromOpenMeteo(loc); }) : weatherFromOpenMeteo(loc);
  return job.then(function(w){ w.fetchedAt = Date.now(); remember(key, w); return w; });
}

/* ---------- where the reader is ---------- */
/* Each reader gets their own date, sun and weather. Their town comes from their
   connection (city level, no permission needed), or from their device if they tap
   "Use my exact location". Coordinates are rounded to about 1 km before use. */
var PLACE_API = 'https://api-bdc.io/data/reverse-geocode-client?localityLanguage=en';
function deviceTimeZone(fallback){
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback; } catch (e) { return fallback; }
}
function placeName(d){ return (d && (d.city || d.locality || d.principalSubdivision)) || ''; }
function storedPlace(){ var p = store('reader-place'); return p && isFinite(p.lat) && isFinite(p.lon) ? p : null; }
function findReaderPlace(){
  var p = storedPlace();
  if (p && (p.source === 'device' || Date.now() - p.at < 12 * 3600000)) return Promise.resolve(p);
  return getJSON(PLACE_API).then(function(d){
    if (!d || !isFinite(d.latitude) || !isFinite(d.longitude) || (d.latitude === 0 && d.longitude === 0)) throw new Error('no place');
    var q = { lat: Math.round(d.latitude * 100) / 100, lon: Math.round(d.longitude * 100) / 100, name: placeName(d), cc: d.countryCode || '', source: 'connection', at: Date.now() };
    store('reader-place', q);
    return q;
  });
}
/* Asked only when the reader taps the button. Calls back with true when the place changed. */
function useExactLocation(done){
  if (!navigator.geolocation) { done(false, 'This browser can’t share its location.'); return; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat = Math.round(pos.coords.latitude * 100) / 100, lon = Math.round(pos.coords.longitude * 100) / 100;
    getJSON(PLACE_API + '&latitude=' + lat + '&longitude=' + lon).catch(function(){ return {}; }).then(function(d){
      store('reader-place', { lat: lat, lon: lon, name: placeName(d) || 'your location', cc: d.countryCode || '', source: 'device', at: Date.now() });
      done(true);
    });
  }, function(err){
    done(false, err && err.code === 1 ? 'Location not shared, so the forecast uses the town your connection suggests.' : 'Couldn’t get your location just now.');
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 6 * 3600000 });
}

/* ---------- everything for today ---------- */
function weatherCacheFor(loc){ return cached('weather:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3) + ':' + loc.units, 6 * 3600000); }
var almanacJob = 0;
/* Does the edition print tides anywhere? Only then are they fetched. */
function usesTides(issue){ var j = JSON.stringify((issue && issue.pages) || []).concat(JSON.stringify((issue && issue.masthead) || {})); return /"type":"tides"|\{\{\s*(?:highWater|lowWater)/.test(j); }
function loadAlmanac(issue, onUpdate){
  var paper = locationOf(issue), job = ++almanacJob, tz = deviceTimeZone(paper.timeZone);
  var day = datePartsIn(new Date(), tz), tideDay = datePartsIn(new Date(), paper.timeZone);
  var paperPlace = String(((issue && issue.masthead) || {}).place || '').replace(/<[^>]*>/g, '').split(',')[0] || 'the paper’s town';
  var A = {
    date: day.y + '-' + pad2(day.m) + '-' + pad2(day.d), timeZone: tz,
    moon: moonOn(Date.UTC(day.y, day.m - 1, day.d, 12)),
    tideStation: usesTides(issue) ? paper.tideStation || null : null, tideTimeZone: paper.timeZone, tides: [], tideError: null,
    weather: null, weatherError: null, loadedAt: Date.now()
  };
  /* Sun and weather follow the reader's place once known; until then, the paper's town. */
  function placeAt(p){
    var here = p ? { lat: p.lat, lon: p.lon, timeZone: tz, units: p.cc === 'US' || p.cc === 'LR' ? 'F' : 'C' }
                 : { lat: paper.lat, lon: paper.lon, timeZone: tz, units: paper.units };
    A.lat = here.lat; A.lon = here.lon; A.units = here.units;
    A.placeName = p ? (p.name || 'where you are') : paperPlace;
    A.placeSource = p ? p.source : 'paper';
    var rise = sunEvent(day.y, day.m, day.d, here.lat, here.lon, true), set = sunEvent(day.y, day.m, day.d, here.lat, here.lon, false);
    A.sunrise = rise == null ? null : new Date(rise).toISOString();
    A.sunset = set == null ? null : new Date(set).toISOString();
    A.weather = weatherCacheFor(here);
    A.weatherError = null;
    return here;
  }
  var here = placeAt(storedPlace());
  // Tides belong to the paper's harbour, in its own time zone.
  if (A.tideStation) A.tides = cached('tides:' + A.tideStation + ':' + tideDay.y + pad2(tideDay.m) + pad2(tideDay.d), 7 * 86400000) || [];
  ALMANAC = A;
  function done(){ if (job === almanacJob && onUpdate) onUpdate(); }
  function weatherFor(loc){
    fetchWeather(loc).then(function(w){ if (A.lat === loc.lat && A.lon === loc.lon) { A.weather = w; A.weatherError = null; done(); } },
      function(){ if (!A.weather) A.weatherError = 'The forecast is unavailable right now.'; done(); });
  }
  if (A.tideStation) fetchTides(A.tideStation, tideDay).then(function(t){ A.tides = t; A.tideError = null; done(); },
    function(){ if (!A.tides.length) A.tideError = 'Tide predictions are unavailable right now.'; done(); });
  // the reader's own place when it's known; the paper's town only if theirs can't be found
  if (A.placeSource !== 'paper') weatherFor(here);
  findReaderPlace().then(function(p){
    if (job !== almanacJob) return;
    if (p.lat === A.lat && p.lon === A.lon && A.placeSource !== 'paper') return;   // already showing this place
    weatherFor(placeAt(p)); done();
  }, function(){ if (job === almanacJob && A.placeSource === 'paper') weatherFor(here); });
  return A;
}
