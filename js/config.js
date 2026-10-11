/* =========================================================
   SITE SETTINGS — the only file you normally need to touch
   ========================================================= */
window.SITE_CONFIG = {

  /* 1) DATABASE (from Supabase → Project Settings → API Keys)
        Leave blank to preview the site without a database. */
  supabaseUrl: "https://llflflvxdxbylokvhywr.supabase.co",   // e.g. "https://abcdefghijk.supabase.co"
  supabaseKey: "sb_publishable_q-utYdWaFoXm-rvQZAL7NA_D9R2M_vY",   // the PUBLISHABLE key (starts with sb_publishable_) — safe to be public

  /* 2) THE JOURNEY
        The two of you start walking on journeyStart and reach the
        kissing tree when she lands (that date is set from the site's
        edit button, so it lives in the database). */
  journeyStart: "2026-10-10T00:00:00-07:00",

  /* 3) MUSIC — set to null to hide the music button */
  music: "assets/music.mp3",
  musicVolume: 0.45,

  /* 4) STARTING VALUES — used until the database has its own.
        After setup, change these from the site's edit button instead. */
  defaults: {
    her_tz:     "Europe/Berlin",
    her_city:   "Germany",
    arrival_at: "2026-12-08T00:00:00-08:00",   // midnight Dec 8, LA time
    updated_at: null
  }
};
