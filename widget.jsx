// NYSE Countdown Widget for Übersicht
// Place this file in your Übersicht widgets folder.
// File must keep the .jsx extension for Übersicht to detect it.

export const refreshFrequency = 1000 // refresh every second

export const command = "date" // no shell command needed, pure JS logic

// ─── NYSE Holiday Logic ──────────────────────────────────────────────────────

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mo = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const da = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, mo, da)
}

function nthWeekday(y, mo, wd, n) {
  let d = new Date(y, mo, 1), count = 0
  while (true) {
    if (d.getDay() === wd) { count++; if (count === n) return d }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  }
}

function lastWeekday(y, mo, wd) {
  let d = new Date(y, mo + 1, 0)
  while (d.getDay() !== wd) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  return d
}

function observed(date) {
  const w = date.getDay()
  if (w === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
  if (w === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getHolidayKeys(y) {
  const e = easter(y)
  const gf = new Date(e.getFullYear(), e.getMonth(), e.getDate() - 2)
  return [
    observed(new Date(y, 0, 1)),       // New Year's Day
    nthWeekday(y, 0, 1, 3),            // MLK Day
    nthWeekday(y, 1, 1, 3),            // Presidents' Day
    gf,                                 // Good Friday
    lastWeekday(y, 4, 1),              // Memorial Day
    observed(new Date(y, 5, 19)),      // Juneteenth
    observed(new Date(y, 6, 4)),       // Independence Day
    nthWeekday(y, 8, 1, 1),            // Labor Day
    nthWeekday(y, 10, 4, 4),           // Thanksgiving
    observed(new Date(y, 11, 25)),     // Christmas
  ].map(d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
}

function isHoliday(date) {
  const y = date.getFullYear()
  const key = `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  return getHolidayKeys(y).includes(key)
}

function getHolidayName(date) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
  const e = easter(y), gf = new Date(e.getFullYear(), e.getMonth(), e.getDate() - 2)
  const checks = [
    [observed(new Date(y, 0, 1)),  "New Year's Day"],
    [nthWeekday(y, 0, 1, 3),      "Martin Luther King Jr. Day"],
    [nthWeekday(y, 1, 1, 3),      "Presidents' Day"],
    [gf,                           "Good Friday"],
    [lastWeekday(y, 4, 1),        "Memorial Day"],
    [observed(new Date(y, 5, 19)),"Juneteenth"],
    [observed(new Date(y, 6, 4)), "Independence Day"],
    [nthWeekday(y, 8, 1, 1),      "Labor Day"],
    [nthWeekday(y, 10, 4, 4),     "Thanksgiving Day"],
    [observed(new Date(y, 11, 25)),"Christmas Day"],
  ]
  for (const [hd, name] of checks) {
    if (hd.getMonth() === m && hd.getDate() === d) return name
  }
  return "Market Holiday"
}

// ─── Time Helpers ─────────────────────────────────────────────────────────────

function getET() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }))
}

function isWeekday(d) { return d.getDay() !== 0 && d.getDay() !== 6 }

function pad(n) { return String(n).padStart(2, '0') }

const OPEN_H = 9, OPEN_M = 30, CLOSE_H = 16, CLOSE_M = 0
const OPEN_S = OPEN_H * 3600 + OPEN_M * 60
const CLOSE_S = CLOSE_H * 3600

function getNextOpen(et) {
  const ns = et.getHours() * 3600 + et.getMinutes() * 60 + et.getSeconds()
  let n = new Date(et)
  if (isWeekday(et) && !isHoliday(et) && ns < OPEN_S) {
    n.setHours(OPEN_H, OPEN_M, 0, 0)
    return n
  }
  n.setDate(n.getDate() + 1)
  n.setHours(OPEN_H, OPEN_M, 0, 0)
  for (let i = 0; i < 10; i++) {
    if (isWeekday(n) && !isHoliday(n)) return n
    n.setDate(n.getDate() + 1)
  }
  return n
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Main Render ─────────────────────────────────────────────────────────────

export const render = () => {
  const et = getET()
  const ns = et.getHours() * 3600 + et.getMinutes() * 60 + et.getSeconds()
  const isOpen = isWeekday(et) && !isHoliday(et) && ns >= OPEN_S && ns < CLOSE_S
  const isPre  = isWeekday(et) && !isHoliday(et) && ns >= 4 * 3600 && ns < OPEN_S
  const isHoli = isWeekday(et) && isHoliday(et)

  let statusLabel, statusClass
  if (isOpen)      { statusLabel = 'Open';       statusClass = 'status-open' }
  else if (isPre)  { statusLabel = 'Pre-Market'; statusClass = 'status-pre' }
  else             { statusLabel = 'Closed';     statusClass = 'status-closed' }

  // Countdown to next open or close
  const nextOpen = getNextOpen(et)
  const msToOpen = nextOpen - et
  const totalToOpen = Math.max(0, Math.floor(msToOpen / 1000))
  const cdH = Math.floor(totalToOpen / 3600)
  const cdM = Math.floor((totalToOpen % 3600) / 60)
  const cdS = totalToOpen % 60

  // Countdown to close
  const msToClose = (CLOSE_H * 3600 - ns) * 1000
  const totalToClose = Math.max(0, Math.floor(msToClose / 1000))
  const clH = Math.floor(totalToClose / 3600)
  const clM = Math.floor((totalToClose % 3600) / 60)
  const clS = totalToClose % 60

  // Progress bar
  let progress = 0
  if (isOpen) {
    const elapsed = ns - OPEN_S
    const total = CLOSE_S - OPEN_S
    progress = Math.min(100, (elapsed / total) * 100)
  }

  // Next session label
  const nextDay = DAYS[nextOpen.getDay()]
  const nextDate = `${nextDay} ${MONTHS[nextOpen.getMonth()]} ${nextOpen.getDate()}`
  const nextLabel = isOpen ? nextDate : (
    Math.round(msToOpen / 86400000) <= 1 ? nextDay : nextDate
  )

  const etFormatted = et.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  })

  return (
    <div className="widget">
      {/* Ambient glows */}
      <div className="glow-top" />
      <div className="glow-bot" />

      {/* Header */}
      <div className="header">
        <div className="exchange-row">
          <div className="exchange-icon">N</div>
          <span className="exchange-name">NYSE</span>
        </div>
        <div className={`status-pill ${statusClass}`}>
          <div className="dot" />
          {statusLabel}
        </div>
      </div>

      <div className="divider" />

      {/* Holiday notice */}
      {isHoli && (
        <div className="holi-bar">
          {getHolidayName(et)} — Market Closed
        </div>
      )}

      {/* Countdown block */}
      {isOpen ? (
        <div className="open-block">
          <div className="cd-label">Market closes in</div>
          <div className="cd-row">
            <div className="seg">
              <span className="big-num">{pad(clH)}</span>
              <span className="unit">hrs</span>
            </div>
            <span className="colon">:</span>
            <div className="seg">
              <span className="big-num">{pad(clM)}</span>
              <span className="unit">min</span>
            </div>
            <span className="colon">:</span>
            <div className="seg">
              <span className="big-num">{pad(clS)}</span>
              <span className="unit">sec</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width: `${progress}%`}} />
          </div>
        </div>
      ) : (
        <div className="closed-block">
          <div className="cd-label">{isPre ? 'Opens in' : 'Next open in'}</div>
          <div className="cd-row">
            <div className="seg">
              <span className="big-num">{pad(cdH)}</span>
              <span className="unit">hrs</span>
            </div>
            <span className="colon">:</span>
            <div className="seg">
              <span className="big-num">{pad(cdM)}</span>
              <span className="unit">min</span>
            </div>
            <span className="colon">:</span>
            <div className="seg">
              <span className="big-num">{pad(cdS)}</span>
              <span className="unit">sec</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{width: isPre ? `${Math.min(100,((OPEN_S - 4*3600 - totalToOpen) / (OPEN_S - 4*3600)) * 100)}%` : '0%'}} />
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="info-grid">
        <div className="info-card">
          <div className="ic-label">ET Time</div>
          <div className="ic-value">{etFormatted}</div>
        </div>
        <div className="info-card">
          <div className="ic-label">Next session</div>
          <div className="ic-value">{isOpen ? nextLabel : (isPre ? 'Today' : nextLabel)}</div>
        </div>
        <div className="info-card">
          <div className="ic-label">Opens at</div>
          <div className="ic-value">9:30 AM ET</div>
        </div>
        <div className="info-card">
          <div className="ic-label">Closes at</div>
          <div className="ic-value">4:00 PM ET</div>
        </div>
      </div>
    </div>
  )
}

// ─── Positioning ─────────────────────────────────────────────────────────────
// Edit top/left/right/bottom to reposition the widget on your desktop.

export const className = `
  top: 14px;
  left: 380px;
  font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;

  .widget {
    width: 310px;
    background: rgba(16, 16, 20, 0.85);
    border-radius: 24px;
    border: 0.5px solid rgba(255,255,255,0.13);
    padding: 22px;
    color: #fff;
    position: relative;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.09);
  }

  .glow-top {
    position: absolute;
    top: -70px; right: -50px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(0,120,255,0.11) 0%, transparent 70%);
    pointer-events: none;
  }

  .glow-bot {
    position: absolute;
    bottom: -50px; left: -40px;
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(52,199,89,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .exchange-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .exchange-icon {
    width: 26px; height: 26px;
    background: rgba(255,255,255,0.09);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    border: 0.5px solid rgba(255,255,255,0.12);
    font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.88);
  }

  .exchange-name {
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.42);
    text-transform: uppercase;
  }

  .status-pill {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .status-open   { background: rgba(52,199,89,0.15);  border: 0.5px solid rgba(52,199,89,0.35);  color: #34C759; }
  .status-closed { background: rgba(255,69,58,0.13);  border: 0.5px solid rgba(255,69,58,0.3);   color: #FF453A; }
  .status-pre    { background: rgba(255,159,10,0.13); border: 0.5px solid rgba(255,159,10,0.3);  color: #FF9F0A; }

  .dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  .divider {
    height: 0.5px;
    background: rgba(255,255,255,0.07);
    margin-bottom: 16px;
  }

  .holi-bar {
    background: rgba(255,159,10,0.1);
    border: 0.5px solid rgba(255,159,10,0.25);
    border-radius: 10px;
    padding: 7px 11px;
    font-size: 11px;
    color: rgba(255,159,10,0.9);
    margin-bottom: 14px;
  }

  .cd-label {
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 6px;
  }

  .cd-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 14px;
  }

  .seg {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 62px;
  }

  .big-num {
    font-size: 46px; font-weight: 200;
    letter-spacing: -2px; line-height: 1;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    font-size: 9px; font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.24);
    margin-top: 1px;
  }

  .colon {
    font-size: 34px; font-weight: 200;
    color: rgba(255,255,255,0.2);
    padding-bottom: 8px;
    padding-left: 1px; padding-right: 1px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.12; }
  }

  .progress-track {
    height: 2.5px;
    background: rgba(255,255,255,0.07);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 18px;
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #0A84FF, #30D158);
    transition: width 1s linear;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .info-card {
    background: rgba(255,255,255,0.04);
    border: 0.5px solid rgba(255,255,255,0.07);
    border-radius: 11px;
    padding: 9px 11px;
  }

  .ic-label {
    font-size: 9px; font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.27);
    margin-bottom: 3px;
  }

  .ic-value {
    font-size: 12px; font-weight: 400;
    color: rgba(255,255,255,0.8);
    font-variant-numeric: tabular-nums;
  }
`
