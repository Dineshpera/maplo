/* Maplo: which tech company is in which building in Hyderabad's IT corridor, and who is hiring there now.
   One static page. Data: data/core.json first (map + companies), data/jobs.json right after (job lists). */
(() => {
  "use strict";
  const BRAND = "Maplo";            // the name also appears in index.html, manifest.webmanifest and pipeline/build.py
  const REPO_ISSUES = "";           // e.g. "https://github.com/<you>/maplo/issues/new" once the repo is public
  const KEY = "maplo:";
  const CENTER = [78.372, 17.437];

  // ---------- strings ----------
  const T = {
    en: {
      search: "Search company, building or job", hiring: "Hiring now", entry: "Entry level", metro: "Near metro", allAreas: "All areas", nearMe: "Near me",
      navExplore: "Explore", navSearch: "Search", navSaved: "Saved", navUpdates: "Updates",
      heroQ: "Where does Hyderabad work?", heroJobs: "open jobs", heroEmp: "employers hiring", heroCos: "companies mapped",
      heroNote: (pj, ph, d) => `${ph} of those employers are pinned to an exact building (${pj} jobs). Jobs come from each employer's own career site, updated ${d}.`,
      heroNear: "Hiring near me",
      listHead: (j, h) => `${j} open jobs · ${h} employers`, listFiltered: n => `${n} companies match`,
      jobsWord: "jobs", jobs: (n, p) => `${n}${p ? "+" : ""} job${n === 1 && !p ? "" : "s"}`,
      noMatch: "Nothing matches these filters.", clear: "Clear filters",
      officeNotPublished: "Hiring in Hyderabad · building not published", areaOnlyShort: "building not published",
      conf: { verified: "Verified address", mapped: "On OpenStreetMap", area: "Area only, building not published" },
      checked: d => `checked ${d}`, source: "Source", back: "Back",
      directions: "Directions", save: "Save", saved: "Saved", share: "Share", website: "Website",
      hiringHere: "Hiring here now", alsoHere: "Also in this building",
      noneHiring: "No openings found in our tracked sources for the companies here.",
      metroWalk: (s, m) => `~${m} min walk · ${s} metro`, floors: n => `${n} floors`,
      bOpen: "open jobs", bCos: "companies", sources: "Sources & confidence",
      fixOsm: "Fix this building on OpenStreetMap", suggest: "Suggest a correction",
      offices: "Hyderabad offices", openJobs: "Open jobs in Hyderabad",
      jobLocNote: "Each job's location comes from the posting. A job can be at a different office from the one shown here.",
      partialNote: "From the company's own career site. Its public list may show only part of the openings, so there can be more.",
      noJobsTracked: "No openings found in our tracked sources right now.", noFeed: "We don't track this company's job board yet.",
      all: "All", viewed: "Viewed", entryTag: "Entry level", loadingJobs: "Loading jobs…",
      searchRecent: "Recent searches", searchHint: "Try “Mindspace”, “Micron”, “data engineer” or “మైండ్‌స్పేస్”.",
      grp: { companies: "Companies", buildings: "Buildings", parks: "IT parks", jobs: "Jobs" },
      noResults: q => `No match for “${q}”. Try a company, a building or an IT park.`,
      savedEmpty: "Save buildings and companies. Each time you open the app, new openings at them show up here.",
      savedNew: n => `${n} new opening${n === 1 ? "" : "s"} at your saved places since you last looked`,
      iosHint: "On iPhone, add this app to your Home Screen so your saved places are kept.",
      savedB: "Buildings", savedC: "Companies", newSince: n => `+${n} new`,
      top: "Top hiring buildings", topNote: "Open jobs at the companies pinned to each building.",
      changes: "What changed", noChanges: d => `Tracking started on ${d}. Changes show up after the next daily update.`,
      ch: { new_company: "added to the map", office_added: "office added:", started_hiring: "started hiring", no_openings: "no openings found now",
            more_jobs: "is hiring more", fewer_jobs: "has fewer openings", removed: "no longer listed" },
      since: d => `since ${d}`,
      stale: d => `Jobs were last updated on ${d}. Some may have closed since.`,
      offline: "You're offline. Showing the last loaded data.", copied: "Link copied",
      offlineBanner: d => `You're offline. Showing jobs as of ${d}; links to job postings need a connection.`,
      install: "Install app", iosInstall: "To install: tap Share, then Add to Home Screen.", installed: "Maplo is on your home screen",
      nearOutside: "You're outside the IT corridor, so here's all of it.", locDenied: "Location is off. Pick an area instead.",
      sortJobs: "Most jobs", sortNear: "Nearest", unnamed: "Building not named on the map yet",
      shareB: (n, p, j, cs) => `${n}, ${p}: ${j ? j + " open jobs at " : ""}${cs}. Who works where in Hyderabad, on ${BRAND}:`,
      shareC: (n, j, w) => `${n} in Hyderabad: ${j ? j + " open jobs" : "office"}${w ? " at " + w : ""}. On ${BRAND}:`,
      cardJobs: "open jobs right now", cardFoot: "Jobs from each employer's own career site · Map © OpenStreetMap contributors",
      saveImage: "Save image", close: "Close", dark: "Dark mode", light: "Light mode",
      about: (o, j) => `Map data © OpenStreetMap contributors (ODbL), updated ${o}. Jobs from employers' own public job boards and career sites (Greenhouse, Lever, Ashby, Workable, Workday), updated ${j}. Every job links to the employer's own posting. Map tiles: OpenFreeMap. No login, no tracking.`,
      mapFail: "The map couldn't start on this device, so here is the list.",
      camIntro: "Find a building with your camera",
      camBody: "Point your phone at an office building and see who's inside and who's hiring. It uses your camera, location and compass on this phone only. Nothing is uploaded.",
      camStart: "Start camera", camNot: "Not now", camTitle: "Point at a building", camLocating: "Finding your location…",
      camLooks: "Looks like", camOr: "Or one of these", camIndoor: m => `Location is rough here (±${m} m). Tap the building you're near:`,
      camNoCompass: "No compass on this device. Tap the building you're facing:", camNone: "No mapped building that way. Turn slowly.",
      camOpen: "Open", camSnap: "Share", camDenied: "Camera or location is blocked. You can allow it in your browser settings.",
      camUnsupported: "This browser can't open the camera.", camFacing: (a, d) => `GPS ±${a} m · facing ${d}`,
      camHint: "Works in the dark too: it uses direction, not the picture.", camSim: "Simulated position",
      dirs: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    },
    te: {
      search: "కంపెనీ, బిల్డింగ్ లేదా జాబ్ వెతకండి", hiring: "ఇప్పుడు హైరింగ్", entry: "ఫ్రెషర్స్", metro: "మెట్రో దగ్గర", allAreas: "అన్ని ఏరియాలు", nearMe: "నా దగ్గర",
      navExplore: "అన్వేషణ", navSearch: "వెతుకు", navSaved: "సేవ్", navUpdates: "అప్‌డేట్స్",
      heroQ: "హైదరాబాద్ ఎక్కడ పనిచేస్తుంది?", heroJobs: "ఖాళీ ఉద్యోగాలు", heroEmp: "కంపెనీల్లో హైరింగ్", heroCos: "మ్యాప్‌లో కంపెనీలు",
      heroNote: (pj, ph, d) => `వీటిలో ${ph} కంపెనీలు ఏ బిల్డింగ్‌లో ఉన్నాయో ఖచ్చితంగా తెలుసు (${pj} ఉద్యోగాలు). ఉద్యోగాలు కంపెనీల సొంత కెరీర్ సైట్ల నుంచి, అప్‌డేట్ ${d}.`,
      heroNear: "నా దగ్గర హైరింగ్",
      listHead: (j, h) => `${j} ఖాళీలు · ${h} కంపెనీలు`, listFiltered: n => `${n} కంపెనీలు సరిపోయాయి`,
      jobsWord: "జాబ్స్", jobs: (n, p) => `${n}${p ? "+" : ""} ఉద్యోగాలు`,
      noMatch: "ఈ ఫిల్టర్లకు ఏమీ సరిపోలేదు.", clear: "ఫిల్టర్లు తీసేయి",
      officeNotPublished: "హైదరాబాద్‌లో హైరింగ్ · బిల్డింగ్ ప్రకటించలేదు", areaOnlyShort: "బిల్డింగ్ ప్రకటించలేదు",
      conf: { verified: "ధృవీకరించిన అడ్రస్", mapped: "OpenStreetMap‌లో ఉంది", area: "ఏరియా మాత్రమే, బిల్డింగ్ ప్రకటించలేదు" },
      checked: d => `${d}న చెక్ చేశాం`, source: "ఆధారం", back: "వెనక్కి",
      directions: "దారి", save: "సేవ్", saved: "సేవ్ అయింది", share: "షేర్", website: "వెబ్‌సైట్",
      hiringHere: "ఇక్కడ ఇప్పుడు హైరింగ్", alsoHere: "ఈ బిల్డింగ్‌లో ఇంకా",
      noneHiring: "ఇక్కడి కంపెనీలకు మేము చూసే సోర్స్‌లలో ఖాళీలు కనిపించలేదు.",
      metroWalk: (s, m) => `~${m} నిమిషాల నడక · ${s} మెట్రో`, floors: n => `${n} ఫ్లోర్లు`,
      bOpen: "ఖాళీలు", bCos: "కంపెనీలు", sources: "ఆధారాలు, నమ్మకం",
      fixOsm: "ఈ బిల్డింగ్‌ను OpenStreetMap‌లో సరిచేయండి", suggest: "సవరణ సూచించండి",
      offices: "హైదరాబాద్ ఆఫీసులు", openJobs: "హైదరాబాద్‌లో ఖాళీ ఉద్యోగాలు",
      jobLocNote: "ప్రతి ఉద్యోగం లొకేషన్ దాని పోస్టింగ్ నుంచి వస్తుంది. ఉద్యోగం ఇక్కడ చూపిన ఆఫీస్ కాకుండా వేరే ఆఫీస్‌లో ఉండొచ్చు.",
      partialNote: "కంపెనీ సొంత కెరీర్ సైట్ నుంచి. అక్కడి పబ్లిక్ లిస్ట్‌లో కొన్ని ఉద్యోగాలే కనిపించవచ్చు, ఇంకా ఎక్కువ ఉండొచ్చు.",
      noJobsTracked: "మేము చూసే సోర్స్‌లలో ఇప్పుడు ఖాళీలు కనిపించలేదు.", noFeed: "ఈ కంపెనీ జాబ్ బోర్డ్‌ను ఇంకా ట్రాక్ చేయడం లేదు.",
      all: "అన్నీ", viewed: "చూశారు", entryTag: "ఫ్రెషర్", loadingJobs: "ఉద్యోగాలు లోడ్ అవుతున్నాయి…",
      searchRecent: "ఇటీవల వెతికినవి", searchHint: "“మైండ్‌స్పేస్”, “Micron”, “data engineer” అని ప్రయత్నించండి.",
      grp: { companies: "కంపెనీలు", buildings: "బిల్డింగ్‌లు", parks: "ఐటీ పార్కులు", jobs: "ఉద్యోగాలు" },
      noResults: q => `“${q}” కి ఏమీ దొరకలేదు. కంపెనీ, బిల్డింగ్ లేదా ఐటీ పార్క్ పేరు ప్రయత్నించండి.`,
      savedEmpty: "బిల్డింగ్‌లు, కంపెనీలను సేవ్ చేయండి. యాప్ తెరిచిన ప్రతిసారి వాటిలో కొత్త ఖాళీలు ఇక్కడ కనిపిస్తాయి.",
      savedNew: n => `మీరు సేవ్ చేసిన చోట్ల ${n} కొత్త ఖాళీలు`,
      iosHint: "iPhone‌లో ఈ యాప్‌ను Home Screen‌కి యాడ్ చేయండి, అప్పుడు సేవ్ చేసినవి పోవు.",
      savedB: "బిల్డింగ్‌లు", savedC: "కంపెనీలు", newSince: n => `+${n} కొత్తవి`,
      top: "ఎక్కువ హైరింగ్ ఉన్న బిల్డింగ్‌లు", topNote: "ప్రతి బిల్డింగ్‌లో ఉన్న కంపెనీల ఖాళీ ఉద్యోగాలు.",
      changes: "ఏం మారింది", noChanges: d => `${d} నుంచి ట్రాక్ చేస్తున్నాం. తర్వాతి రోజువారీ అప్‌డేట్ నుంచి మార్పులు కనిపిస్తాయి.`,
      ch: { new_company: "మ్యాప్‌లో కొత్తగా చేరింది", office_added: "ఆఫీస్ జోడించాం:", started_hiring: "హైరింగ్ మొదలుపెట్టింది", no_openings: "ఇప్పుడు ఖాళీలు కనిపించడం లేదు",
            more_jobs: "ఇంకా ఎక్కువ హైరింగ్", fewer_jobs: "ఖాళీలు తగ్గాయి", removed: "ఇప్పుడు లిస్ట్‌లో లేదు" },
      since: d => `${d} నుంచి`,
      stale: d => `ఉద్యోగాలు చివరిగా ${d}న అప్‌డేట్ అయ్యాయి. కొన్ని మూసేసి ఉండొచ్చు.`,
      offline: "ఇంటర్నెట్ లేదు. చివరిగా లోడ్ అయిన డేటా చూపిస్తున్నాం.", copied: "లింక్ కాపీ అయింది",
      offlineBanner: d => `ఇంటర్నెట్ లేదు. ${d} నాటి ఉద్యోగాలు చూపిస్తున్నాం; జాబ్ లింకులు తెరవడానికి నెట్ కావాలి.`,
      install: "యాప్ ఇన్‌స్టాల్", iosInstall: "ఇన్‌స్టాల్ చేయడానికి: Share నొక్కి, Add to Home Screen ఎంచుకోండి.", installed: "Maplo మీ హోమ్ స్క్రీన్‌పై ఉంది",
      nearOutside: "మీరు ఐటీ కారిడార్ బయట ఉన్నారు, అందుకే మొత్తం చూపిస్తున్నాం.", locDenied: "లొకేషన్ ఆఫ్‌లో ఉంది. ఏరియా ఎంచుకోండి.",
      sortJobs: "ఎక్కువ ఉద్యోగాలు", sortNear: "దగ్గరలో", unnamed: "బిల్డింగ్ పేరు ఇంకా మ్యాప్‌లో లేదు",
      shareB: (n, p, j, cs) => `${n}, ${p}: ${j ? j + " ఖాళీ ఉద్యోగాలు · " : ""}${cs}. ${BRAND}‌లో చూడండి:`,
      shareC: (n, j, w) => `హైదరాబాద్‌లో ${n}: ${j ? j + " ఖాళీ ఉద్యోగాలు" : "ఆఫీస్"}${w ? " · " + w : ""}. ${BRAND}‌లో చూడండి:`,
      cardJobs: "ఇప్పుడు ఖాళీ ఉద్యోగాలు", cardFoot: "ఉద్యోగాలు కంపెనీల సొంత కెరీర్ సైట్ల నుంచి · మ్యాప్ © OpenStreetMap",
      saveImage: "ఇమేజ్ సేవ్", close: "మూసేయి", dark: "డార్క్ మోడ్", light: "లైట్ మోడ్",
      about: (o, j) => `మ్యాప్ డేటా © OpenStreetMap contributors (ODbL), అప్‌డేట్ ${o}. ఉద్యోగాలు కంపెనీల సొంత జాబ్ బోర్డులు, కెరీర్ సైట్ల నుంచి, అప్‌డేట్ ${j}. ప్రతి ఉద్యోగం కంపెనీ సొంత పేజీకి వెళ్తుంది. లాగిన్ లేదు, ట్రాకింగ్ లేదు.`,
      mapFail: "ఈ ఫోన్‌లో మ్యాప్ తెరవలేకపోయాం, అందుకే లిస్ట్ చూపిస్తున్నాం.",
      camIntro: "కెమెరాతో బిల్డింగ్ కనుక్కోండి",
      camBody: "ఫోన్‌ను ఏదైనా ఆఫీస్ బిల్డింగ్ వైపు పెట్టండి, లోపల ఎవరున్నారో, ఎవరు హైరింగ్ చేస్తున్నారో చూడండి. ఇది ఈ ఫోన్‌లోనే మీ కెమెరా, లొకేషన్, కంపాస్ వాడుతుంది. ఏదీ అప్‌లోడ్ అవ్వదు.",
      camStart: "కెమెరా ఆన్ చేయి", camNot: "ఇప్పుడు కాదు", camTitle: "బిల్డింగ్ వైపు పెట్టండి", camLocating: "మీ లొకేషన్ కనుక్కుంటున్నాం…",
      camLooks: "ఇది కావచ్చు", camOr: "లేదా ఇవి", camIndoor: m => `ఇక్కడ లొకేషన్ సరిగ్గా లేదు (±${m} మీ). మీ దగ్గరి బిల్డింగ్‌ను ట్యాప్ చేయండి:`,
      camNoCompass: "ఈ ఫోన్‌లో కంపాస్ లేదు. మీ ఎదురుగా ఉన్న బిల్డింగ్‌ను ట్యాప్ చేయండి:", camNone: "ఆ దిశలో మ్యాప్ చేసిన బిల్డింగ్ లేదు. మెల్లగా తిరగండి.",
      camOpen: "తెరువు", camSnap: "షేర్", camDenied: "కెమెరా లేదా లొకేషన్ బ్లాక్ అయింది. బ్రౌజర్ సెట్టింగ్స్‌లో అనుమతించవచ్చు.",
      camUnsupported: "ఈ బ్రౌజర్‌లో కెమెరా తెరవడం కుదరదు.", camFacing: (a, d) => `GPS ±${a} మీ · ${d} వైపు`,
      camHint: "చీకట్లో కూడా పనిచేస్తుంది: ఫోటో కాదు, దిశ చూస్తుంది.", camSim: "సిమ్యులేటెడ్ లొకేషన్",
      dirs: ["ఉత్తరం", "ఈశాన్యం", "తూర్పు", "ఆగ్నేయం", "దక్షిణం", "నైరుతి", "పడమర", "వాయువ్యం"],
    },
  };

  // Telugu and spelling variants -> the English words used in our data, so one search box works in both.
  const ALIAS = [
    ["మైండ్‌స్పేస్", "mindspace"], ["మైండ్ స్పేస్", "mindspace"], ["mind space", "mindspace"], ["హైటెక్ సిటీ", "hitec city"], ["హైటెక్", "hitec"],
    ["hitech", "hitec"], ["hi-tec", "hitec"], ["hi tec", "hitec"], ["మాదాపూర్", "madhapur"], ["కొండాపూర్", "kondapur"], ["గచ్చిబౌలి", "gachibowli"],
    ["gachibouli", "gachibowli"], ["gachibowly", "gachibowli"], ["రాయదుర్గం", "raidurg"], ["రాయదుర్గ్", "raidurg"], ["raidurgam", "raidurg"], ["rayadurg", "raidurg"],
    ["ఫైనాన్షియల్ డిస్ట్రిక్ట్", "financial district"], ["fin district", "financial district"], ["నానక్‌రామ్‌గూడ", "nanakramguda"], ["నానక్ రామ్ గూడ", "nanakramguda"],
    ["నాలెడ్జ్ సిటీ", "knowledge city"], ["బిల్డింగ్", "building"], ["bldg", "building"], ["టవర్", "tower"], ["మెట్రో", "metro"],
    ["వేవ్‌రాక్", "waverock"], ["డీఎల్ఎఫ్", "dlf"], ["స్కైవ్యూ", "skyview"], ["ఫీనిక్స్", "phoenix"], ["దివ్యశ్రీ", "divyasree"], ["ఆర్ఎంజెడ్", "rmz"],
    ["సాలార్‌పురియా", "salarpuria"], ["ఇనార్బిట్", "inorbit"], ["మైక్రాన్", "micron"], ["అమ్జెన్", "amgen"], ["సేల్స్‌ఫోర్స్", "salesforce"],
    ["హైరేడియస్", "highradius"], ["ఇన్వెస్కో", "invesco"], ["లాయిడ్స్", "lloyds"], ["ఫ్యాక్ట్‌సెట్", "factset"], ["జెనోటి", "zenoti"], ["నోవార్టిస్", "novartis"],
    ["మైక్రోసాఫ్ట్", "microsoft"], ["గూగుల్", "google"], ["అమెజాన్", "amazon"], ["డెలాయిట్", "deloitte"], ["ఇంటర్న్", "intern"], ["ఇంజనీర్", "engineer"],
    ["డేటా", "data"], ["అనలిస్ట్", "analyst"], ["డెవలపర్", "developer"], ["సాఫ్ట్‌వేర్", "software"], ["మేనేజర్", "manager"], ["ఫ్రెషర్", "intern"],
  ].map(([a, b]) => [a.replace(/[‌‍]/g, ""), b]).sort((a, b) => b[0].length - a[0].length);

  // ---------- small helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
  };
  const icon = (id, cls = "ic") => `<svg class="${cls}"><use href="#i-${id}"/></svg>`;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesk = () => matchMedia("(min-width: 900px)").matches;
  const vibrate = ms => { try { navigator.vibrate?.(ms); } catch { /* ignore */ } };

  let lang = store.get("lang", (navigator.language || "").toLowerCase().startsWith("te") ? "te" : "en");
  const t = (k, ...a) => { const v = T[lang][k] ?? T.en[k]; return typeof v === "function" ? v(...a) : v; };

  const S = { filters: new Set(), area: "", query: "", view: "explore", sort: "jobs", me: null, jobFilter: "all", detail: null };
  let D, byB, byC, JOBS = null, map = null, mapReady = false, selected = [], meMarker = null, lastList = "";
  const saved = store.get("saved", { b: {}, c: {} });
  const viewed = new Set(store.get("viewed", []));
  let recent = store.get("recent", []);

  const fmtDate = iso => {
    if (!iso) return "–";
    try { return new Date(iso + "T00:00:00").toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  };
  const placeOf = b => b.park || b.area;
  const bName = b => (b.unnamed ? t("unnamed") : b.name);
  const officeBs = c => c.offices.map(o => byB[o.building]).filter(Boolean);
  const bJobs = b => b.companies.reduce((s, id) => s + (byC[id]?.nj || 0), 0);
  const bPartial = b => b.companies.some(id => byC[id]?.partial && byC[id]?.nj);
  const nfmt = (n, p) => `${n}${p ? "+" : ""}`;
  const metres = (a, b) => {
    const r = Math.PI / 180, la1 = a[0] * r, la2 = b[0] * r, dla = la2 - la1, dlo = (b[1] - a[1]) * r;
    const h = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  const fmtDist = m => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
  const PALETTE = ["#3B6E8F", "#7A5C99", "#2F7D6B", "#A0603A", "#5B6B2F", "#8F3B5C", "#3F5AA8", "#6B4E3D", "#2E7591", "#9A4E2E"];
  function monoEl(name, size = 42) {
    const words = String(name).replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
    const ini = ((words[0]?.[0] || "?") + (words[1]?.[0] || words[0]?.[1] || "")).toUpperCase();
    let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<span class="mono" style="background:${PALETTE[h % PALETTE.length]};width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;border-radius:${Math.round(size * .3)}px">${esc(ini)}</span>`;
  }

  let toastTimer;
  function toast(msg, ms = 2600) {
    const el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  // ---------- data ----------
  fetch("data/core.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
    D = d;
    byB = Object.fromEntries(d.buildings.map(b => [b.id, b]));
    byC = Object.fromEntries(d.companies.map(c => [c.id, c]));
    for (const c of d.companies) c._h = norm([c.name, c.sector, ...c.offices.map(o => `${o.label} ${o.address || ""}`), ...officeBs(c).map(b => `${b.name} ${placeOf(b)}`)].join(" "));
    for (const b of d.buildings) b._h = norm([b.name, b.park, b.area, ...b.companies.map(id => byC[id]?.name)].join(" "));
    applyTheme();
    initMap();
    applyLang();
    route();
    return fetch("data/jobs.json").then(r => r.json()).then(j => {
      JOBS = j.companies || {};
      for (const [cid, js] of Object.entries(JOBS)) for (const x of js) x._h = norm(`${x.title} ${byC[cid]?.name || ""} ${x.team || ""}`);
      fillPendingSeen();
      updateSavedDot();
      if (S.detail || ["search", "saved"].includes(S.view)) render();
    });
  }).catch(e => {
    $("#body").innerHTML = `<div class="empty">${icon("x")}<p>Could not load the data (${esc(e.message)}). Check your connection and reload.</p></div>`;
  });

  function norm(s) {
    let q = String(s || "").toLowerCase().replace(/[‌‍]/g, "");
    for (const [a, b] of ALIAS) if (q.includes(a)) q = q.split(a).join(b);
    return q.replace(/[^\p{L}\p{N}\s+.#-]/gu, " ").replace(/\s+/g, " ").trim();
  }

  // ---------- filters ----------
  const metroNear = b => b.metro && b.metro[1] <= 10;
  function companyMatches(c) {
    if (S.filters.has("hiring") && !c.nj) return false;
    if (S.filters.has("entry") && !c.ne) return false;
    if (S.filters.has("metro") || S.area) {
      const bs = officeBs(c);
      if (S.filters.has("metro") && !bs.some(metroNear)) return false;
      if (S.area && !bs.some(b => placeOf(b) === S.area)) return false;
    }
    return true;
  }
  const filtering = () => S.filters.size > 0 || !!S.area;
  function visibleBuildings() {
    if (!filtering()) return D.buildings;
    return D.buildings.filter(b => (!S.area || placeOf(b) === S.area) && (!S.filters.has("metro") || metroNear(b)) &&
      b.companies.some(id => byC[id] && companyMatches(byC[id])));
  }

  function renderChips() {
    const c = D.counts;
    const nMetro = D.buildings.filter(metroNear).length;
    const areas = [...new Set(D.buildings.map(placeOf))].sort((a, b) => a.localeCompare(b));
    $("#chips").innerHTML =
      `<button class="chip" data-near>${icon("locate")}${esc(t("nearMe"))}</button>` +
      `<button class="chip ${S.filters.has("hiring") ? "on" : ""}" data-f="hiring" aria-pressed="${S.filters.has("hiring")}">${icon("briefcase")}${esc(t("hiring"))} <span class="n num">${c.hiring}</span></button>` +
      `<button class="chip ${S.filters.has("entry") ? "on" : ""}" data-f="entry" aria-pressed="${S.filters.has("entry")}">${icon("cap")}${esc(t("entry"))} <span class="n num">${c.entry}</span></button>` +
      `<button class="chip ${S.filters.has("metro") ? "on" : ""}" data-f="metro" aria-pressed="${S.filters.has("metro")}">${icon("train")}${esc(t("metro"))} <span class="n num">${nMetro}</span></button>` +
      `<label class="chip ${S.area ? "on" : ""}">${icon("pin")}<select id="area" aria-label="${esc(t("allAreas"))}"><option value="">${esc(t("allAreas"))}</option>` +
      areas.map(a => `<option ${a === S.area ? "selected" : ""}>${esc(a)}</option>`).join("") + `</select></label>`;
  }

  // ---------- routing ----------
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = h.match(/^([bc])=(.+)$/);
    S.detail = m ? { type: m[1], id: m[2] } : null;
    $("#modal").hidden = true;
    if (!m) S.view = ["search", "saved", "updates"].includes(h) ? h : "explore";
    if (!m) lastList = h;
    $$("#nav a").forEach(a => a.classList.toggle("on", !S.detail && a.dataset.v === S.view));
    render();
    if (!isDesk()) {
      if (S.view === "search" && !S.detail) setSnap("full");
      else if (S.detail && snap === "peek") setSnap("half");
    }
  }
  window.addEventListener("hashchange", route);
  const go = h => { if (location.hash.slice(1) === h) route(); else location.hash = h; };
  const goBack = () => go(lastList || "");

  function render() {
    if (!D) return;
    const body = $("#body");
    if (S.detail) {
      S.detail.type === "b" ? renderBuilding(S.detail.id) : renderCompany(S.detail.id);
    } else {
      setSelected([]);
      if (S.view === "search") renderSearch();
      else if (S.view === "saved") renderSaved();
      else if (S.view === "updates") renderUpdates();
      else renderExplore();
      if (map && mapReady && map.getPitch() > 1 && !S.detail) map.easeTo({ pitch: 0, duration: 600 });
    }
    body.scrollTop = 0;
  }

  // ---------- explore ----------
  function renderExplore() {
    const c = D.counts;
    let list = D.companies.filter(companyMatches);
    if (S.sort === "near" && S.me) {
      const d = x => Math.min(...officeBs(x).map(b => metres([S.me.lat, S.me.lon], [b.lat, b.lon])), 1e9);
      list = list.map(x => [x, d(x)]).sort((a, z) => a[1] - z[1]).map(([x, dd]) => (x._d = dd, x));
    }
    let html = "";
    const stale = daysSince(D.jobs_date);
    if (!navigator.onLine) html += `<div class="banner off">${icon("download")}<span>${esc(t("offlineBanner", fmtDate(D.jobs_date)))}</span></div>`;
    else if (stale > 2) html += `<div class="banner">${icon("clock")}<span>${esc(t("stale", fmtDate(D.jobs_date)))}</span></div>`;
    if (!store.get("intro", false) && !filtering()) {
      html += `<section class="hero">
        <button class="x" data-intro-x aria-label="${esc(t("close"))}">${icon("x")}</button>
        <h1>${esc(t("heroQ"))}</h1>
        <div class="stats">
          <div class="stat"><b data-count="${c.jobs}">${c.jobs}</b><span>${esc(t("heroJobs"))}</span></div>
          <div class="stat"><b data-count="${c.hiring}">${c.hiring}</b><span>${esc(t("heroEmp"))}</span></div>
          <div class="stat"><b data-count="${c.companies}">${c.companies}</b><span>${esc(t("heroCos"))}</span></div>
        </div>
        <p class="note">${esc(t("heroNote", c.pinned_jobs, c.pinned_hiring, fmtDate(D.jobs_date)))}</p>
        <div class="cta"><button class="btn primary" data-near>${icon("locate")}${esc(t("heroNear"))}</button>
          <button class="btn small" data-jump="Mindspace">Mindspace</button><button class="btn small" data-jump="HITEC City">HITEC City</button>
          <button class="btn small" data-jump="Financial District">Financial District</button><button class="btn small" data-jump="Gachibowli">Gachibowli</button></div>
      </section>`;
    }
    const totalJobs = list.reduce((s, x) => s + x.nj, 0);
    const hiringN = list.filter(x => x.nj).length;
    html += `<div class="vhead"><h2 class="num">${filtering() ? esc(t("listFiltered", list.length)) : esc(t("listHead", totalJobs, hiringN))}</h2>
      ${S.me ? `<div class="seg"><button data-sort="jobs" class="${S.sort === "jobs" ? "on" : ""}">${esc(t("sortJobs"))}</button><button data-sort="near" class="${S.sort === "near" ? "on" : ""}">${esc(t("sortNear"))}</button></div>` : ""}</div>`;
    if (!list.length) html += `<div class="empty">${icon("search")}<p>${esc(t("noMatch"))}</p><button class="btn" data-clear>${esc(t("clear"))}</button></div>`;
    html += list.slice(0, 300).map(companyRow).join("");
    if (list.length > 300) html += `<p class="more">300 / ${list.length}</p>`;
    html += aboutHtml();
    $("#body").innerHTML = html;
    rollCounts();
  }
  const daysSince = iso => (iso ? Math.floor((Date.now() - new Date(iso + "T06:00:00+05:30").getTime()) / 864e5) : 0);

  function rollCounts() {
    if (reduceMotion) return;
    const els = $$("[data-count]"); if (!els.length) return;
    const t0 = performance.now(), dur = 650;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - (1 - k) ** 3;
      els.forEach(el => { el.textContent = Math.round(+el.dataset.count * e); });
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function confIcon(conf) { return conf === "verified" ? icon("shield") : conf === "mapped" ? icon("map") : icon("pin"); }

  function companyRow(c) {
    const bs = officeBs(c), b = bs[0];
    let where;
    if (b) {
      const o = c.offices.find(x => x.building === b.id);
      where = `${o?.conf === "verified" ? icon("shield") : ""}<span>${esc(bName(b))} · ${esc(placeOf(b))}${bs.length > 1 ? ` · +${bs.length - 1}` : ""}</span>`;
    } else if (c.offices.length) where = `<span>${esc(c.offices[0].label)} · ${esc(t("areaOnlyShort"))}</span>`;
    else where = `<span>${esc(t("officeNotPublished"))}</span>`;
    if (c._d != null && S.sort === "near" && c._d < 1e9) where += `<span>· ${fmtDist(c._d)}</span>`;
    const nn = newCount("c", c.id);
    return `<button class="row" data-c="${esc(c.id)}">${monoEl(c.name)}<span class="rmain"><span class="rname">${esc(c.name)}</span><span class="rsub">${where}</span></span>
      ${nn ? `<span class="newb">${esc(t("newSince", nn))}</span>` : ""}${c.nj ? `<span class="jp"><span>${nfmt(c.nj, c.partial)}</span><small>${esc(t("jobsWord"))}</small></span>` : ""}</button>`;
  }
  function buildingRow(b, extra = "") {
    const j = bJobs(b), nn = newCount("b", b.id);
    return `<button class="row" data-b="${esc(b.id)}"><span class="bicon ${j ? "hire" : ""}">${icon("building")}</span><span class="rmain"><span class="rname">${esc(bName(b))}</span>
      <span class="rsub">${esc(placeOf(b))} · ${b.companies.length} ${esc(t("bCos"))}${extra}</span></span>
      ${nn ? `<span class="newb">${esc(t("newSince", nn))}</span>` : ""}${j ? `<span class="jp"><span>${nfmt(j, bPartial(b))}</span><small>${esc(t("jobsWord"))}</small></span>` : ""}</button>`;
  }

  function aboutHtml() {
    const dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    return `<div class="about">${esc(t("about", fmtDate(D.osm_date), fmtDate(D.jobs_date)))}
      <div class="row2"><button class="btn small" data-theme-toggle>${icon(dark ? "sun" : "moon")}${esc(t(dark ? "light" : "dark"))}</button>
      ${installEvt ? `<button class="btn small" data-install>${icon("download")}${esc(t("install"))}</button>` : ""}
      ${REPO_ISSUES ? `<a class="btn small" href="${esc(REPO_ISSUES)}" target="_blank" rel="noopener">${esc(t("suggest"))}</a>` : ""}</div>
      ${isIOS && !standalone ? `<p class="hint">${esc(t("iosInstall"))}</p>` : ""}</div>`;
  }

  // ---------- building ----------
  function renderBuilding(id) {
    const b = byB[id]; if (!b) return goBack();
    const cs = b.companies.map(i => byC[i]).filter(Boolean).sort((a, z) => z.nj - a.nj || a.name.localeCompare(z.name));
    const hiring = cs.filter(c => c.nj), rest = cs.filter(c => !c.nj);
    const j = bJobs(b), isSaved = !!saved.b[b.id];
    const osmEdit = b.source.includes("openstreetmap.org/") ? b.source.replace("openstreetmap.org/", "openstreetmap.org/edit?").replace(/\/(\d+)$/, "=$1") : "";
    const tenantRow = c => {
      const o = c.offices.find(x => x.building === b.id) || {};
      return `<button class="row" data-c="${esc(c.id)}">${monoEl(c.name)}<span class="rmain"><span class="rname">${esc(c.name)}</span>
        <span class="rsub"><span class="conf ${esc(o.conf || "mapped")}">${confIcon(o.conf)}${esc(t("conf")[o.conf || "mapped"])}</span>${o.floor ? `<span>· ${esc(o.floor)}</span>` : ""}</span></span>
        ${c.nj ? `<span class="jp"><span>${nfmt(c.nj, c.partial)}</span><small>${esc(t("jobsWord"))}</small></span>` : ""}</button>`;
    };
    $("#body").innerHTML = `
      <div class="dhead"><button class="back" data-back aria-label="${esc(t("back"))}">${icon("back")}</button>
        <div><h2>${esc(bName(b))}</h2><div class="sub">${esc(placeOf(b))}${b.levels ? ` · ${esc(t("floors", b.levels))}` : ""}</div>
        <div class="pills">${b.metro ? `<span class="pill metro">${icon("train")}${esc(t("metroWalk", b.metro[0], b.metro[1]))}</span>` : ""}</div></div></div>
      <div class="bigstat"><div class="h"><b>${nfmt(j, bPartial(b))}</b><span>${esc(t("bOpen"))}</span></div><div><b>${cs.length}</b><span>${esc(t("bCos"))}</span></div></div>
      <div class="actions">
        <a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}" target="_blank" rel="noopener">${icon("nav")}${esc(t("directions"))}</a>
        <button class="btn ${isSaved ? "on" : ""}" data-save="b:${esc(b.id)}" aria-pressed="${isSaved}">${icon("bookmark")}${esc(t(isSaved ? "saved" : "save"))}</button>
        <button class="btn" data-share="b:${esc(b.id)}">${icon("share")}${esc(t("share"))}</button>
      </div>
      ${hiring.length ? `<div class="sec">${esc(t("hiringHere"))} <span class="count">${hiring.length}</span></div>${hiring.map(tenantRow).join("")}` : `<p class="note">${esc(t("noneHiring"))}</p>`}
      ${rest.length ? `<div class="sec">${esc(t("alsoHere"))} <span class="count">${rest.length}</span></div>${rest.map(tenantRow).join("")}` : ""}
      <details class="src"><summary>${esc(t("sources"))}</summary><ul>
        <li>${esc(bName(b))}: <a href="${esc(b.source)}" target="_blank" rel="noopener">${esc(host(b.source))}</a></li>
        ${cs.map(c => { const o = c.offices.find(x => x.building === b.id) || {};
          return `<li><b>${esc(c.name)}</b>: ${esc(t("conf")[o.conf || "mapped"])}${o.checked ? `, ${esc(t("checked", fmtDate(o.checked)))}` : ""} · <a href="${esc(o.source)}" target="_blank" rel="noopener">${esc(host(o.source))}</a></li>`; }).join("")}
      </ul></details>
      <div class="links">${osmEdit ? `<a href="${esc(osmEdit)}" target="_blank" rel="noopener">${icon("ext")}${esc(t("fixOsm"))}</a>` : ""}${suggestLink(bName(b))}</div>`;
    setSelected([b.id]);
    flyTo(b);
    markSeen("b", b.id);
  }

  // ---------- company ----------
  function renderCompany(id) {
    const c = byC[id]; if (!c) return goBack();
    const bs = officeBs(c), isSaved = !!saved.c[c.id];
    const offices = c.offices.map(o => {
      const b = byB[o.building];
      const name = b ? bName(b) : o.label;
      return `<div class="card office">${b ? `<a class="t" href="#b=${esc(b.id)}">${esc(name)}</a>` : `<span class="t">${esc(name)}</span>`}
        <div class="meta">${esc(b ? placeOf(b) : (o.address || ""))}${o.floor ? ` · ${esc(o.floor)}` : ""}</div>
        ${b && o.address ? `<div class="meta">${esc(o.address)}</div>` : ""}
        <div class="l"><span class="conf ${esc(o.conf)}">${confIcon(o.conf)}${esc(t("conf")[o.conf] || "")}</span>
          ${o.checked ? `<span>${esc(t("checked", fmtDate(o.checked)))}</span>` : ""}
          <a href="${esc(o.source)}" target="_blank" rel="noopener">${esc(t("source"))}: ${esc(host(o.source))}</a></div></div>`;
    }).join("");
    let jobs;
    if (!c.nj) jobs = `<p class="note">${esc(t(c.board ? "noJobsTracked" : "noFeed"))}</p>`;
    else if (!JOBS) jobs = `<div class="sec">${esc(t("openJobs"))}</div><div class="skel"></div><div class="skel"></div><div class="skel"></div>`;
    else {
      const all = JOBS[c.id] || [];
      const list = S.jobFilter === "entry" ? all.filter(j => j.entry) : all;
      jobs = `<div class="sec">${esc(t("openJobs"))} <span class="count num">${nfmt(c.nj, c.partial)}</span></div>
        ${c.ne ? `<div class="seg" style="margin-bottom:10px"><button data-jf="all" class="${S.jobFilter !== "entry" ? "on" : ""}">${esc(t("all"))}</button><button data-jf="entry" class="${S.jobFilter === "entry" ? "on" : ""}">${esc(t("entryTag"))} · ${c.ne}</button></div>` : ""}
        ${c.partial ? `<p class="note">${esc(t("partialNote"))}</p>` : ""}
        ${list.slice(0, 400).map(j => `<a class="job ${viewed.has(j.url) ? "seen" : ""}" href="${esc(j.url)}" target="_blank" rel="noopener" data-job="${esc(j.url)}">
          <div class="jt"><span>${esc(j.title)}</span>${icon("ext")}</div>
          <div class="tags"><span class="meta">${esc(j.location)}${j.team ? " · " + esc(j.team) : ""}${j.updated ? " · " + esc(fmtDate(j.updated)) : ""}</span>
          ${j.entry ? `<span class="tag entry">${esc(t("entryTag"))}</span>` : ""}${viewed.has(j.url) ? `<span class="tag viewed">${esc(t("viewed"))}</span>` : ""}</div></a>`).join("")}
        <p class="note">${esc(t("jobLocNote"))}</p>`;
    }
    $("#body").innerHTML = `
      <div class="dhead"><button class="back" data-back aria-label="${esc(t("back"))}">${icon("back")}</button>
        ${monoEl(c.name, 52)}<div><h2>${esc(c.name)}</h2><div class="sub">${esc(c.sector || "")}${c.website ? ` · <a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(host(c.website))}</a>` : ""}</div>
        <div class="pills">${c.nj ? `<span class="pill hire">${icon("briefcase")}${esc(t("jobs", c.nj, c.partial))}</span>` : ""}</div></div></div>
      <div class="actions">
        ${bs.length === 1 ? `<a class="btn primary" href="https://www.google.com/maps/dir/?api=1&destination=${bs[0].lat},${bs[0].lon}" target="_blank" rel="noopener">${icon("nav")}${esc(t("directions"))}</a>`
          : c.website ? `<a class="btn primary" href="${esc(c.website)}" target="_blank" rel="noopener">${icon("ext")}${esc(t("website"))}</a>` : `<span></span>`}
        <button class="btn ${isSaved ? "on" : ""}" data-save="c:${esc(c.id)}" aria-pressed="${isSaved}">${icon("bookmark")}${esc(t(isSaved ? "saved" : "save"))}</button>
        <button class="btn" data-share="c:${esc(c.id)}">${icon("share")}${esc(t("share"))}</button>
      </div>
      ${c.offices.length ? `<div class="sec">${esc(t("offices"))}</div>${offices}` : `<p class="note">${esc(t("officeNotPublished"))}</p>`}
      ${jobs}
      <div class="links">${suggestLink(c.name)}</div>`;
    setSelected(bs.map(b => b.id));
    if (bs.length === 1) flyTo(bs[0]); else if (bs.length > 1) fit(bs);
    markSeen("c", c.id);
  }

  const suggestLink = what => REPO_ISSUES ? `<a href="${esc(REPO_ISSUES)}?title=${encodeURIComponent("Correction: " + what)}" target="_blank" rel="noopener">${icon("ext")}${esc(t("suggest"))}</a>` : "";
  const host = u => { try { return new URL(u).host.replace(/^www\./, ""); } catch { return u; } };

  // ---------- search ----------
  let searchTimer;
  function renderSearch() {
    const raw = S.query.trim(), q = norm(raw);
    let html = "";
    if (!q) {
      html += recent.length ? `<div class="sec">${esc(t("searchRecent"))}</div><div class="qchips">${recent.map(r => `<button class="chip" data-q="${esc(r)}">${icon("clock")}${esc(r)}</button>`).join("")}</div>` : "";
      html += `<p class="note">${esc(t("searchHint"))}</p><div class="sec">${esc(t("grp").parks)}</div><div class="qchips">` +
        D.parks.slice().sort((a, z) => z.buildings - a.buildings).slice(0, 12).map(p => `<button class="chip" data-park="${esc(p.name)}">${esc(p.name)}</button>`).join("") + "</div>";
      $("#body").innerHTML = html; return;
    }
    const words = q.split(" ");
    const hit = h => words.every(w => h.includes(w));
    const rank = (name, h) => (norm(name).startsWith(q) ? 0 : norm(name).includes(q) ? 1 : 2) + (h ? 0 : 0);
    const cs = D.companies.filter(c => hit(c._h)).sort((a, z) => rank(a.name) - rank(z.name) || z.nj - a.nj).slice(0, 12);
    const bs = D.buildings.filter(b => hit(b._h)).sort((a, z) => rank(a.name) - rank(z.name) || bJobs(z) - bJobs(a)).slice(0, 8);
    const ps = D.parks.filter(p => hit(norm(p.name))).slice(0, 5);
    const js = [];
    if (JOBS) for (const [cid, list] of Object.entries(JOBS)) for (const j of list) if (hit(j._h)) { js.push([cid, j]); if (js.length >= 40) break; }
    if (cs.length) html += `<div class="sec">${esc(t("grp").companies)} <span class="count">${cs.length}</span></div>${cs.map(companyRow).join("")}`;
    if (bs.length) html += `<div class="sec">${esc(t("grp").buildings)} <span class="count">${bs.length}</span></div>${bs.map(b => buildingRow(b)).join("")}`;
    if (ps.length) html += `<div class="sec">${esc(t("grp").parks)}</div><div class="qchips">${ps.map(p => `<button class="chip" data-park="${esc(p.name)}">${icon("map")}${esc(p.name)} <span class="n">${p.buildings}</span></button>`).join("")}</div>`;
    if (js.length) html += `<div class="sec">${esc(t("grp").jobs)} <span class="count">${js.length}${js.length >= 40 ? "+" : ""}</span></div>` +
      js.map(([cid, j]) => `<a class="job ${viewed.has(j.url) ? "seen" : ""}" href="${esc(j.url)}" target="_blank" rel="noopener" data-job="${esc(j.url)}"><div class="jt"><span>${esc(j.title)}</span>${icon("ext")}</div>
        <div class="tags"><span class="meta"><b>${esc(byC[cid]?.name)}</b> · ${esc(j.location)}</span>${j.entry ? `<span class="tag entry">${esc(t("entryTag"))}</span>` : ""}</div></a>`).join("");
    if (!html) html = `<div class="empty">${icon("search")}<p>${esc(t("noResults", raw))}</p></div>`;
    $("#body").innerHTML = html;
  }
  function remember(q) {
    q = q.trim(); if (q.length < 2) return;
    recent = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, 5); store.set("recent", recent);
  }

  // ---------- saved ----------
  const jobUrlsOf = (kind, id) => {
    if (!JOBS) return null;
    const cids = kind === "c" ? [id] : (byB[id]?.companies || []);
    return cids.flatMap(c => (JOBS[c] || []).map(j => j.url));
  };
  function newCount(kind, id) {
    const s = saved[kind][id]; if (!s || !s.seen || !JOBS) return 0;
    const seen = new Set(s.seen); return (jobUrlsOf(kind, id) || []).filter(u => !seen.has(u)).length;
  }
  function markSeen(kind, id) {
    if (!saved[kind][id] || !JOBS) return;
    saved[kind][id].seen = jobUrlsOf(kind, id); store.set("saved", saved); updateSavedDot();
  }
  function fillPendingSeen() {
    for (const kind of ["b", "c"]) for (const id of Object.keys(saved[kind])) if (!saved[kind][id].seen) saved[kind][id].seen = jobUrlsOf(kind, id);
    store.set("saved", saved);
  }
  function toggleSave(kind, id) {
    if (saved[kind][id]) delete saved[kind][id];
    else { saved[kind][id] = { at: Date.now(), seen: jobUrlsOf(kind, id) }; vibrate(12); }
    store.set("saved", saved); updateSavedDot();
    const btn = $(`[data-save="${kind}:${CSS.escape(id)}"]`);
    if (btn) { const on = !!saved[kind][id]; btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", on); btn.innerHTML = `${icon("bookmark")}${esc(t(on ? "saved" : "save"))}`; }
  }
  function totalNew() {
    let n = 0; for (const kind of ["b", "c"]) for (const id of Object.keys(saved[kind])) n += newCount(kind, id); return n;
  }
  function updateSavedDot() { const n = totalNew(), el = $("#savedDot"); el.hidden = !n; el.textContent = n > 99 ? "99+" : n; }
  function renderSaved() {
    const bs = Object.keys(saved.b).map(id => byB[id]).filter(Boolean);
    const cs = Object.keys(saved.c).map(id => byC[id]).filter(Boolean);
    const n = totalNew();
    let html = `<div class="vhead"><h2>${esc(t("navSaved"))}</h2></div>`;
    if (!bs.length && !cs.length) html += `<div class="empty">${icon("bookmark")}<p>${esc(t("savedEmpty"))}</p></div>`;
    if (n) html += `<div class="banner">${icon("briefcase")}<span>${esc(t("savedNew", n))}</span></div>`;
    if (bs.length) html += `<div class="sec">${esc(t("savedB"))}</div>${bs.map(b => buildingRow(b)).join("")}`;
    if (cs.length) html += `<div class="sec">${esc(t("savedC"))}</div>${cs.map(companyRow).join("")}`;
    if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone && (bs.length || cs.length)) html += `<p class="note">${esc(t("iosHint"))}</p>`;
    $("#body").innerHTML = html;
  }

  // ---------- updates ----------
  function renderUpdates() {
    const top = D.buildings.map(b => [b, bJobs(b)]).filter(x => x[1] > 0).sort((a, z) => z[1] - a[1]).slice(0, 10);
    const max = top[0]?.[1] || 1;
    let html = `<div class="vhead"><h2>${esc(t("top"))}</h2><span class="meta">${esc(fmtDate(D.jobs_date))}</span></div><p class="note">${esc(t("topNote"))}</p>`;
    html += `<div>${top.map(([b, j], i) => `<button class="lb" data-b="${esc(b.id)}"><span class="rk">${i + 1}</span><span class="rmain"><span class="rname">${esc(bName(b))}</span>
      <span class="rsub">${esc(b.companies.filter(id => byC[id]?.nj).map(id => byC[id].name).slice(0, 3).join(", "))}</span><span class="bar" style="width:${Math.max(6, Math.round(j / max * 100))}%"></span></span>
      <span class="jp"><span>${nfmt(j, bPartial(b))}</span><small>${esc(t("jobsWord"))}</small></span></button>`).join("")}</div>`;
    html += `<div class="sec" style="margin-top:26px">${esc(t("changes"))}</div>`;
    if (!D.changes.length) html += `<div class="empty">${icon("pulse")}<p>${esc(t("noChanges", fmtDate(D.generated)))}</p></div>`;
    else html += D.changes.map(ch => {
      const good = ["started_hiring", "more_jobs", "new_company"].includes(ch.type), off = ch.type === "office_added";
      const where = ch.where?.length ? ` ${esc(ch.where.join(", "))}` : "";
      const jobs = ch.jobs != null ? ` · ${ch.was != null ? `${ch.was} → ` : ""}${esc(t("jobs", ch.jobs))}` : "";
      return `<button class="ev" data-c="${esc(ch.company)}"><span class="evi ${good ? "g" : off ? "o" : ""}">${icon(good ? "briefcase" : off ? "building" : "pulse")}</span>
        <span class="rmain"><span><b>${esc(ch.name)}</b> ${esc(t("ch")[ch.type] || ch.type)}${where}${jobs}</span><span class="meta">${esc(t("since", fmtDate(ch.since)))}</span></span></button>`;
    }).join("");
    $("#body").innerHTML = html;
  }

  // ---------- sharing ----------
  const basePath = () => location.origin + location.pathname.replace(/index\.html$/, "");
  const shareUrl = (kind, id) => `${basePath()}${kind}/${encodeURIComponent(id)}/`;
  function shareInfo(kind, id) {
    if (kind === "b") {
      const b = byB[id], cs = b.companies.map(i => byC[i]).filter(Boolean).sort((a, z) => z.nj - a.nj);
      const j = bJobs(b);
      return { title: bName(b), text: t("shareB", bName(b), placeOf(b), j ? nfmt(j, bPartial(b)) : 0, cs.slice(0, 4).map(c => c.name).join(", ")) };
    }
    const c = byC[id], b = officeBs(c)[0];
    return { title: c.name, text: t("shareC", c.name, c.nj ? nfmt(c.nj, c.partial) : 0, b ? bName(b) : "") };
  }
  async function share(kind, id) {
    const url = shareUrl(kind, id), { title, text } = shareInfo(kind, id);
    let file = null;
    try { file = await makeCard(kind, id); } catch (e) { console.warn("card", e); }
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title, text: `${text} ${url}` }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    if (navigator.share && !isDesk()) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(`${text} ${url}`); toast(t("copied")); } catch { /* clipboard blocked */ }
    if (file) showCard(file);
  }
  function showCard(file) {
    const u = URL.createObjectURL(file), m = $("#modal");
    m.innerHTML = `<div class="box"><img src="${u}" alt=""><div class="row2"><a class="btn primary" href="${u}" download="${esc(file.name)}">${icon("download")}${esc(t("saveImage"))}</a><button class="btn" data-close>${esc(t("close"))}</button></div></div>`;
    m.hidden = false;
    m.onclick = e => { if (e.target === m || e.target.closest("[data-close]")) { m.hidden = true; URL.revokeObjectURL(u); } };
  }

  function wrap(x, text, maxW, maxLines) {
    const words = String(text).split(" "), lines = []; let line = "";
    for (const w of words) {
      const tryL = line ? line + " " + w : w;
      if (x.measureText(tryL).width > maxW && line) { lines.push(line); line = w; } else line = tryL;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += "…"; }
    return lines;
  }
  function logoPath(x, X, Y, s) {
    x.save(); x.translate(X, Y); x.scale(s / 64, s / 64);
    x.fillStyle = "#fff"; x.beginPath(); x.roundRect ? x.roundRect(0, 0, 64, 64, 16) : x.rect(0, 0, 64, 64); x.fill();
    x.fillStyle = "#F45B35"; x.fill(new Path2D("M32 9.5c-9.7 0-17.5 7.6-17.5 17C14.5 39.2 32 55 32 55s17.5-15.8 17.5-28.5c0-9.4-7.8-17-17.5-17z"));
    x.fillStyle = "#172B3A"; x.fillRect(24, 21, 7, 13); x.fillRect(32.5, 15, 8, 19); x.fillRect(22, 34, 20, 2.6);
    x.beginPath(); x.arc(48.5, 14.5, 5.5, 0, 7); x.fillStyle = "#13A37F"; x.fill(); x.lineWidth = 2.6; x.strokeStyle = "#fff"; x.stroke();
    x.restore();
  }
  async function makeCard(kind, id) {
    try { await document.fonts?.ready; } catch { /* ignore */ }
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d"), F = (w, s) => `${w} ${s}px "Plus Jakarta Sans", "Noto Sans Telugu", system-ui, sans-serif`;
    x.fillStyle = "#F5F2EB"; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W, 0, 40, W, 0, 900); g.addColorStop(0, "rgba(244,91,53,.28)"); g.addColorStop(1, "rgba(244,91,53,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = "#F45B35"; x.fillRect(0, 0, W, 150);
    logoPath(x, 64, 37, 76);
    x.fillStyle = "#fff"; x.font = F(800, 54); x.textBaseline = "middle"; x.fillText(BRAND, 160, 76);
    x.font = F(700, 30); x.textAlign = "right"; x.fillText(lang === "te" ? "హైదరాబాద్ ఐటీ మ్యాప్" : "Hyderabad IT map", W - 64, 76); x.textAlign = "left";
    let y = 250; x.textBaseline = "alphabetic";
    let title, sub, big, partial, rows, metro;
    if (kind === "b") {
      const b = byB[id], cs = b.companies.map(i => byC[i]).filter(Boolean).sort((a, z) => z.nj - a.nj);
      title = bName(b); sub = placeOf(b); big = bJobs(b); partial = bPartial(b); metro = b.metro && t("metroWalk", b.metro[0], b.metro[1]);
      rows = cs.slice(0, 5).map(c => [c.name, c.nj ? nfmt(c.nj, c.partial) : ""]);
      if (cs.length > 5) rows.push([`+${cs.length - 5} ${t("bCos")}`, ""]);
    } else {
      const c = byC[id], bs = officeBs(c);
      title = c.name; sub = bs.length ? `${bName(bs[0])} · ${placeOf(bs[0])}` : (c.offices[0]?.label || "Hyderabad");
      big = c.nj; partial = c.partial; metro = bs[0]?.metro && t("metroWalk", bs[0].metro[0], bs[0].metro[1]);
      rows = (JOBS?.[c.id] || []).slice(0, 5).map(j => [j.title, ""]);
    }
    x.fillStyle = "#172B3A"; x.font = F(800, 76);
    for (const l of wrap(x, title, W - 128, 2)) { x.fillText(l, 64, y); y += 88; }
    x.fillStyle = "#475867"; x.font = F(600, 38); x.fillText(sub, 64, y); y += 54;
    if (metro) { x.fillStyle = "#1E5BD8"; x.font = F(700, 32); x.fillText(metro, 64, y); y += 30; }
    y += 150;
    if (big) {
      x.fillStyle = "#0F7B5F"; x.font = F(800, 210); const s = nfmt(big, partial); x.fillText(s, 56, y);
      const w = x.measureText(s).width; x.font = F(700, 42); x.fillStyle = "#172B3A"; x.fillText(t("cardJobs"), 56 + w + 28, y - 24);
      y += 60;
    } else y -= 100;
    x.font = F(700, 38);
    for (const [name, n] of rows) {
      y += 70; x.fillStyle = "#FFFFFF"; x.beginPath(); x.roundRect ? x.roundRect(56, y - 50, W - 112, 64, 18) : x.rect(56, y - 50, W - 112, 64); x.fill();
      x.fillStyle = "#172B3A"; const l = wrap(x, name, W - 300, 1)[0]; x.fillText(l, 84, y - 6);
      if (n) { x.fillStyle = "#0F7B5F"; x.textAlign = "right"; x.fillText(n, W - 84, y - 6); x.textAlign = "left"; }
      if (y > H - 260) break;
    }
    x.fillStyle = "#E6E1D6"; x.fillRect(64, H - 170, W - 128, 2);
    x.fillStyle = "#6B7A86"; x.font = F(600, 26); x.fillText(t("cardFoot"), 64, H - 120);
    x.fillText(fmtDate(D.jobs_date), 64, H - 80);
    x.fillStyle = "#C2410C"; x.font = F(800, 30); x.textAlign = "right"; x.fillText(shareUrl(kind, id).replace(/^https?:\/\//, "").replace(/\/$/, ""), W - 64, H - 80); x.textAlign = "left";
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    return new File([blob], `${BRAND.toLowerCase()}-${kind}-${id}.png`, { type: "image/png" });
  }

  // ---------- map ----------
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const darkNow = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  const styleUrl = () => `https://tiles.openfreemap.org/styles/${darkNow() ? "dark" : "positron"}`;

  function initMap() {
    if (!window.maplibregl) return mapFailed();
    try {
      map = new maplibregl.Map({
        container: "map", style: styleUrl(), attributionControl: false, minZoom: 10.5, maxZoom: 19, maxPitch: 60,
        center: CENTER, zoom: isDesk() ? 13.4 : 12.4,
      });
    } catch (e) { console.warn(e); return mapFailed(); }
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-right");
    window.__maplo = { map };  // handy for debugging in the console
    map.on("style.load", setupLayers);
    map.once("load", () => {
      if (!S.detail) fit(D.buildings, 14);
      // Keep the © line small (it stays one tap away, and the full credits are in the list footer).
      document.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    });
    map.on("error", e => console.warn("map", e?.error?.message || e));
  }
  function mapFailed() {
    $("#map").innerHTML = `<p class="note" style="padding:16px">${esc(t("mapFail"))}</p>`;
    if (!isDesk()) setSnap("full");
  }

  function pill(fill) {
    const r = 2, w = 32 * r, h = 24 * r, pad = 2 * r, rad = (h - 2 * pad) / 2;
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    const rr = (X, Y, W2, H2, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W2, Y, X + W2, Y + H2, R); x.arcTo(X + W2, Y + H2, X, Y + H2, R); x.arcTo(X, Y + H2, X, Y, R); x.arcTo(X, Y, X + W2, Y, R); x.closePath(); };
    x.shadowColor = "rgba(0,0,0,.28)"; x.shadowBlur = 3 * r; x.shadowOffsetY = r;
    rr(pad, pad, w - 2 * pad, h - 2 * pad, rad); x.fillStyle = "#fff"; x.fill();
    x.shadowColor = "transparent"; rr(pad + 2 * r, pad + 2 * r, w - 2 * pad - 4 * r, h - 2 * pad - 4 * r, rad - 2 * r); x.fillStyle = fill; x.fill();
    return [{ width: w, height: h, data: x.getImageData(0, 0, w, h).data }, { pixelRatio: r, stretchX: [[pad + rad, w - pad - rad]], stretchY: [[h / 2 - 1, h / 2 + 1]], content: [pad + rad * .55, pad + 3 * r, w - pad - rad * .55, h - pad - 3 * r] }];
  }

  const ptsGeo = () => ({ type: "FeatureCollection", features: visibleBuildings().map(b => {
    const j = bJobs(b);
    return { type: "Feature", geometry: { type: "Point", coordinates: [b.lon, b.lat] },
      properties: { id: b.id, name: b.unnamed ? "" : b.name, jobs: j, label: j ? nfmt(j, bPartial(b)) : "", sk: -j } };
  }) });
  const fpGeo = () => ({ type: "FeatureCollection", features: D.buildings.filter(b => b.fp).map(b => ({
    type: "Feature", geometry: { type: "Polygon", coordinates: [b.fp] },
    properties: { id: b.id, jobs: bJobs(b), h: Math.min(140, (parseFloat(b.levels) || 7) * 3.6) } })) });
  const parksGeo = () => ({ type: "FeatureCollection", features: D.parks.map(p => ({
    type: "Feature", geometry: { type: "Polygon", coordinates: [p.outline.map(([la, lo]) => [lo, la])] }, properties: { name: p.name } })) });
  const metroGeo = () => ({ type: "FeatureCollection", features: [
    ...D.metro.lines.map(l => ({ type: "Feature", geometry: { type: "LineString", coordinates: l }, properties: {} })),
    ...D.metro.stations.map(s => ({ type: "Feature", geometry: { type: "Point", coordinates: [s.lon, s.lat] }, properties: { name: s.name, st: 1 } })),
  ] });

  let firstLoad = true;
  function setupLayers() {
    const hire = css("--hire-mark") || "#13A37F", brand = css("--brand") || "#F45B35", idle = css("--idle") || "#8A929C";
    const ink = css("--ink") || "#172B3A", surface = css("--surface") || "#fff", metro = css("--metro") || "#1E5BD8", dark = darkNow();
    for (const [n, f] of [["pill-hire", dark ? "#1A9E78" : "#0F7B5F"], ["pill-sel", brand]]) if (!map.hasImage(n)) { const [img, o] = pill(f); map.addImage(n, img, o); }
    const font = ["Noto Sans Bold"], fontR = ["Noto Sans Regular"];
    map.addSource("parks", { type: "geojson", data: parksGeo() });
    map.addSource("metro", { type: "geojson", data: metroGeo() });
    map.addSource("fp", { type: "geojson", data: fpGeo() });
    map.addSource("pts", { type: "geojson", data: ptsGeo(), cluster: true, clusterMaxZoom: 13, clusterRadius: 46, clusterProperties: { jobs: ["+", ["get", "jobs"]] } });

    map.addLayer({ id: "parks-fill", type: "fill", source: "parks", paint: { "fill-color": brand, "fill-opacity": dark ? .07 : .05 } });
    map.addLayer({ id: "parks-line", type: "line", source: "parks", paint: { "line-color": brand, "line-opacity": .55, "line-width": 1.5, "line-dasharray": [3, 2] } });
    map.addLayer({ id: "fp-3d", type: "fill-extrusion", source: "fp", minzoom: 14.5, paint: {
      "fill-extrusion-color": ["case", [">", ["get", "jobs"], 0], hire, dark ? "#3A4856" : "#CFC9BC"],
      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15.5, ["get", "h"]],
      "fill-extrusion-opacity": .78 } });
    map.addLayer({ id: "fp-sel", type: "fill-extrusion", source: "fp", minzoom: 14.5, filter: ["in", ["get", "id"], ["literal", []]], paint: {
      "fill-extrusion-color": brand, "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15.5, ["+", ["get", "h"], 4]], "fill-extrusion-opacity": .92 } });
    map.addLayer({ id: "metro-case", type: "line", source: "metro", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": surface, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 4, 16, 9] } });
    map.addLayer({ id: "metro-line", type: "line", source: "metro", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": metro, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2, 16, 5], "line-opacity": .85 } });
    map.addLayer({ id: "metro-st", type: "circle", source: "metro", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.5, 16, 7], "circle-color": surface, "circle-stroke-color": metro, "circle-stroke-width": 2.5 } });
    map.addLayer({ id: "metro-label", type: "symbol", source: "metro", minzoom: 12, filter: ["==", ["geometry-type"], "Point"],
      layout: { "text-field": ["concat", "Ⓜ ", ["get", "name"]], "text-font": font, "text-size": 11.5, "text-offset": [0, 1.2], "text-anchor": "top", "text-optional": true },
      paint: { "text-color": metro, "text-halo-color": surface, "text-halo-width": 1.6 } });
    map.addLayer({ id: "parks-label", type: "symbol", source: "parks", minzoom: 13.2, maxzoom: 15.6,
      layout: { "text-field": ["get", "name"], "text-size": 12, "text-font": font, "text-transform": "uppercase", "text-letter-spacing": .06, "text-max-width": 8 },
      paint: { "text-color": dark ? "#FFB49C" : "#A8391A", "text-halo-color": surface, "text-halo-width": 1.6, "text-opacity": .9 } });

    map.addLayer({ id: "cl", type: "circle", source: "pts", filter: ["has", "point_count"], paint: {
      "circle-color": ["case", [">", ["get", "jobs"], 0], dark ? "#1A9E78" : "#0F7B5F", idle],
      "circle-radius": ["step", ["get", "point_count"], 17, 8, 21, 25, 26], "circle-stroke-color": surface, "circle-stroke-width": 3, "circle-opacity": 0 } });
    map.addLayer({ id: "cl-n", type: "symbol", source: "pts", filter: ["has", "point_count"], layout: {
      "text-field": ["case", [">", ["get", "jobs"], 0], ["format", ["to-string", ["get", "jobs"]], {}, "\n", {}, t("jobsWord"), { "font-scale": .68 }], ["to-string", ["get", "point_count"]]],
      "text-font": font, "text-size": 13, "text-line-height": 1.0, "text-allow-overlap": true }, paint: { "text-color": "#fff", "text-opacity": 0 } });
    const solo = ["!", ["has", "point_count"]];
    map.addLayer({ id: "b-dot", type: "circle", source: "pts", filter: solo, paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 3.5, 17, 7], "circle-color": ["case", [">", ["get", "jobs"], 0], hire, idle],
      "circle-stroke-color": surface, "circle-stroke-width": 1.5, "circle-opacity": 0, "circle-stroke-opacity": 0 } });
    map.addLayer({ id: "b-halo", type: "circle", source: "pts", filter: ["in", ["get", "id"], ["literal", []]], paint: {
      "circle-radius": 24, "circle-color": brand, "circle-opacity": .2, "circle-stroke-color": brand, "circle-stroke-width": 1.5, "circle-stroke-opacity": .5 } });
    map.addLayer({ id: "b-pill", type: "symbol", source: "pts", filter: ["all", solo, [">", ["get", "jobs"], 0]], layout: {
      "icon-image": "pill-hire", "icon-text-fit": "both", "icon-text-fit-padding": [1, 5, 1, 5], "text-field": ["get", "label"], "text-font": font, "text-size": 12.5,
      "symbol-sort-key": ["get", "sk"], "icon-allow-overlap": false, "text-allow-overlap": false, "icon-padding": 1 }, paint: { "text-color": "#fff", "icon-opacity": 0, "text-opacity": 0 } });
    map.addLayer({ id: "b-sel-dot", type: "circle", source: "pts", filter: ["in", ["get", "id"], ["literal", []]], paint: {
      "circle-radius": 8, "circle-color": brand, "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
    map.addLayer({ id: "b-pill-sel", type: "symbol", source: "pts", filter: ["in", ["get", "id"], ["literal", []]], layout: {
      "icon-image": "pill-sel", "icon-text-fit": "both", "icon-text-fit-padding": [2, 7, 2, 7], "text-field": ["get", "label"], "text-font": font, "text-size": 14,
      "icon-allow-overlap": true, "text-allow-overlap": true }, paint: { "text-color": "#fff" } });
    map.addLayer({ id: "b-label", type: "symbol", source: "pts", minzoom: 15.8, filter: solo, layout: {
      "text-field": ["get", "name"], "text-font": fontR, "text-size": 11.5, "text-offset": [0, 1.25], "text-anchor": "top", "text-optional": true, "text-max-width": 9 },
      paint: { "text-color": ink, "text-halo-color": surface, "text-halo-width": 1.5 } });

    // Hiring buildings pop in as a wave on first open (one short transition, no loops).
    const show = () => {
      const tr = { duration: reduceMotion ? 0 : 700, delay: 0 };
      for (const [l, ps] of [["cl", ["circle-opacity"]], ["cl-n", ["text-opacity"]], ["b-dot", ["circle-opacity", "circle-stroke-opacity"]], ["b-pill", ["icon-opacity", "text-opacity"]]])
        for (const p of ps) { map.setPaintProperty(l, `${p}-transition`, tr); map.setPaintProperty(l, p, 1); }
    };
    firstLoad ? setTimeout(show, 250) : show();
    firstLoad = false;

    if (!mapReady) {
      const clickB = e => { const f = e.features?.[0]; if (f) go("b=" + f.properties.id); };
      for (const l of ["b-dot", "b-pill", "b-pill-sel", "b-sel-dot", "fp-3d"]) {
        map.on("click", l, clickB);
        map.on("mouseenter", l, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", l, () => { map.getCanvas().style.cursor = ""; pop.remove(); });
      }
      map.on("click", "cl", async e => {
        const f = e.features[0];
        try { const z = await map.getSource("pts").getClusterExpansionZoom(f.properties.cluster_id); map.easeTo({ center: f.geometry.coordinates, zoom: z + .3, padding: sheetPad() }); } catch { /* ignore */ }
      });
      map.on("mouseenter", "cl", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "cl", () => { map.getCanvas().style.cursor = ""; });
      const pop = new maplibregl.Popup({ closeButton: false, offset: 14 });
      map.on("mousemove", "b-dot", e => {
        if (!matchMedia("(hover: hover)").matches) return;
        const b = byB[e.features[0].properties.id]; if (!b) return;
        const names = b.companies.slice(0, 4).map(i => esc(byC[i]?.name)).join(", ") + (b.companies.length > 4 ? ` +${b.companies.length - 4}` : "");
        pop.setLngLat([b.lon, b.lat]).setHTML(`<b>${esc(bName(b))}</b><br>${names}`).addTo(map);
      });
    }
    mapReady = true;
    setSelected(selected);
  }

  function refreshMap() { if (mapReady) map.getSource("pts")?.setData(ptsGeo()); }
  function setSelected(ids) {
    selected = ids; if (!mapReady) return;
    const f = ["in", ["get", "id"], ["literal", ids]];
    map.setFilter("b-halo", f); map.setFilter("fp-sel", f); map.setFilter("fp-3d", ["!", f]);
    map.setFilter("b-pill-sel", ["all", f, [">", ["get", "jobs"], 0]]); map.setFilter("b-sel-dot", ["all", f, ["==", ["get", "jobs"], 0]]);
  }
  function sheetPad() {
    if (isDesk()) return { top: 40, bottom: 40, left: 40, right: 40 };
    const top = ($(".chips")?.getBoundingClientRect().bottom || 110) + 10;
    const navH = $("#nav")?.offsetHeight || 64;
    const vis = Math.max(120, sheet.offsetHeight - (curY ?? sheet.offsetHeight * .5));
    return { top, bottom: Math.max(40, Math.min(vis + navH + 10, window.innerHeight - top - 80)), left: 24, right: 24 };
  }
  function flyTo(b) {
    if (!mapReady) return map?.once("idle", () => flyTo(b));
    map.flyTo({ center: [b.lon, b.lat], zoom: Math.max(map.getZoom(), 16.3), pitch: b.fp ? 48 : 0, padding: sheetPad(), duration: reduceMotion ? 0 : 1100, essential: true });
  }
  function fit(bs, maxZoom = 15.5) {
    if (!mapReady) return;
    const lons = bs.map(b => b.lon), lats = bs.map(b => b.lat);
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: sheetPad(), maxZoom, pitch: 0, duration: reduceMotion ? 0 : 800 });
  }

  // ---------- bottom sheet (phone) ----------
  const sheet = $("#sheet");
  let snap = "half", curY = null;
  function snapY(s) {
    const H = sheet.offsetHeight;
    const full = Math.round(($(".top")?.getBoundingClientRect().bottom || 60) + 8);
    return { full, half: Math.round(H * .5), peek: H - 150 }[s];
  }
  function setY(y) { curY = y; sheet.style.setProperty("--y", y + "px"); }
  function setSnap(s, ease = true) {
    if (isDesk()) return;
    snap = s; sheet.dataset.snap = s; setY(snapY(s));
    if (ease && mapReady) setTimeout(() => { if (S.detail) { const b = byB[S.detail.id] || officeBs(byC[S.detail.id] || { offices: [] })[0]; if (b) map.easeTo({ center: [b.lon, b.lat], padding: sheetPad(), duration: 350 }); } }, 50);
  }
  (() => {
    let startY = 0, startSheetY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false;
    const zone = $("#grab");
    const down = e => {
      if (isDesk()) return;
      dragging = true; startY = lastY = e.clientY; lastT = performance.now(); startSheetY = curY ?? snapY(snap);
      sheet.classList.add("dragging"); zone.setPointerCapture?.(e.pointerId);
    };
    const move = e => {
      if (!dragging) return;
      const now = performance.now(); vel = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
      setY(Math.max(snapY("full") - 20, Math.min(snapY("peek") + 40, startSheetY + (e.clientY - startY))));
    };
    const up = e => {
      if (!dragging) return; dragging = false; sheet.classList.remove("dragging");
      const moved = Math.abs(e.clientY - startY);
      const order = ["full", "half", "peek"];
      let target;
      if (moved < 6) target = snap === "full" ? "half" : "full";
      else if (Math.abs(vel) > .5) target = order[Math.max(0, Math.min(2, order.indexOf(snap) + (vel > 0 ? 1 : -1)))];
      else target = order.reduce((a, s) => (Math.abs(snapY(s) - curY) < Math.abs(snapY(a) - curY) ? s : a), "half");
      setSnap(target); vibrate(8);
    };
    zone.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    zone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSnap(snap === "full" ? "half" : "full"); } });
    window.addEventListener("resize", () => { if (!isDesk()) setSnap(snap, false); map?.resize(); });
    setSnap("half", false);
  })();

  // ---------- near me ----------
  function nearMe() {
    store.set("intro", true);
    if (!navigator.geolocation) { toast(t("locDenied")); return; }
    navigator.geolocation.getCurrentPosition(p => {
      S.me = { lat: p.coords.latitude, lon: p.coords.longitude };
      if (mapReady) {
        if (!meMarker) { const el = document.createElement("div"); el.className = "me"; meMarker = new maplibregl.Marker({ element: el }); }
        meMarker.setLngLat([S.me.lon, S.me.lat]).addTo(map);
      }
      if (metres([S.me.lat, S.me.lon], [CENTER[1], CENTER[0]]) < 9000) {
        S.sort = "near";
        map?.flyTo({ center: [S.me.lon, S.me.lat], zoom: 15.3, padding: sheetPad(), duration: reduceMotion ? 0 : 900 });
      } else toast(t("nearOutside"));
      if (!S.detail && S.view === "explore") render();
    }, () => toast(t("locDenied")), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  const JUMP = { "Mindspace": [78.3815, 17.4425, 15.4], "HITEC City": [78.3770, 17.4480, 15], "Financial District": [78.3430, 17.4170, 14.8], "Gachibowli": [78.3500, 17.4405, 14.8] };

  // ---------- theme + language ----------
  function applyTheme() {
    const th = store.get("theme", "");
    if (th) document.documentElement.dataset.theme = th; else delete document.documentElement.dataset.theme;
    $('meta[name="theme-color"]').content = darkNow() ? "#0E151C" : "#F45B35";
  }
  function toggleTheme() {
    store.set("theme", darkNow() ? "light" : "dark"); applyTheme();
    if (map) { mapReady = false; map.setStyle(styleUrl()); }
    render();
  }
  function applyLang() {
    document.documentElement.lang = lang;
    $("#lang").textContent = lang === "te" ? "EN" : "తె";
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    renderChips();
    if (mapReady) map.setLayoutProperty("cl-n", "text-field", ["case", [">", ["get", "jobs"], 0], ["format", ["to-string", ["get", "jobs"]], {}, "\n", {}, t("jobsWord"), { "font-scale": .68 }], ["to-string", ["get", "point_count"]]]);
    render();
  }

  // ---------- events ----------
  $("#lang").addEventListener("click", () => { lang = lang === "en" ? "te" : "en"; store.set("lang", lang); applyLang(); });
  const q = $("#q");
  q.addEventListener("focus", () => { if (S.view !== "search" || S.detail) go("search"); });
  q.addEventListener("input", () => {
    S.query = q.value; $("#qclear").hidden = !q.value;
    clearTimeout(searchTimer); searchTimer = setTimeout(() => { if (S.view !== "search" || S.detail) go("search"); else renderSearch(); }, 140);
  });
  q.addEventListener("keydown", e => { if (e.key === "Enter") { remember(q.value); q.blur(); } if (e.key === "Escape") { q.value = ""; S.query = ""; q.blur(); go(""); } });
  $("#qclear").addEventListener("click", () => { q.value = ""; S.query = ""; $("#qclear").hidden = true; q.focus(); renderSearch(); });
  $("#cam").addEventListener("click", openCamera);

  document.addEventListener("change", e => {
    if (e.target.id === "area") { S.area = e.target.value; renderChips(); refreshMap(); if (S.area) zoomToArea(S.area); go(""); if (!S.detail) render(); }
  });
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-c],[data-b],[data-back],[data-f],[data-near],[data-jump],[data-intro-x],[data-save],[data-share],[data-sort],[data-jf],[data-q],[data-park],[data-clear],[data-theme-toggle],[data-job],[data-install]");
    if (!el) return;
    const d = el.dataset;
    if (d.job != null) { viewed.add(d.job); store.set("viewed", [...viewed].slice(-600)); el.classList.add("seen"); return; }
    if (d.c != null) { if (S.view === "search") remember(q.value); return go("c=" + d.c); }
    if (d.b != null) { if (S.view === "search") remember(q.value); return go("b=" + d.b); }
    if (d.back != null) return goBack();
    if (d.f) { S.filters.has(d.f) ? S.filters.delete(d.f) : S.filters.add(d.f); vibrate(8); renderChips(); refreshMap(); if (S.detail || S.view !== "explore") go(""); else render(); return; }
    if (d.near != null) return nearMe();
    if (d.jump) { store.set("intro", true); const [lo, la, z] = JUMP[d.jump]; map?.flyTo({ center: [lo, la], zoom: z, padding: sheetPad(), duration: reduceMotion ? 0 : 1000 }); render(); return; }
    if (d.introX != null) { store.set("intro", true); render(); return; }
    if (d.save) { const [k, id] = d.save.split(/:(.+)/); return toggleSave(k, id); }
    if (d.share) { const [k, id] = d.share.split(/:(.+)/); return share(k, id); }
    if (d.sort) { S.sort = d.sort; return render(); }
    if (d.jf) { S.jobFilter = d.jf; return render(); }
    if (d.q) { q.value = d.q; S.query = d.q; $("#qclear").hidden = false; return renderSearch(); }
    if (d.park) { S.area = D.buildings.find(b => b.park === d.park) ? d.park : ""; renderChips(); refreshMap(); zoomToArea(d.park); return go(""); }
    if (d.clear != null) { S.filters.clear(); S.area = ""; renderChips(); refreshMap(); return render(); }
    if (d.themeToggle != null) return toggleTheme();
    if (d.install != null && installEvt) {
      installEvt.prompt();
      installEvt.userChoice.finally(() => { installEvt = null; softRender(); });
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && S.detail && document.activeElement !== q) goBack(); });
  window.addEventListener("offline", () => { toast(t("offline"), 4000); softRender(); });
  window.addEventListener("online", () => { softRender(); });

  // ---------- install + offline (service worker) ----------
  // Re-draw the list (for the offline banner or install button) without losing the reader's place.
  function softRender() { if (!D || S.detail || S.view !== "explore") return; const b = $("#body"), y = b.scrollTop; render(); b.scrollTop = y; }
  let installEvt = null;
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; softRender(); });
  window.addEventListener("appinstalled", () => { installEvt = null; toast(t("installed")); });
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (!store.get("theme", "")) { applyTheme(); if (map) { mapReady = false; map.setStyle(styleUrl()); } } });

  function zoomToArea(name) {
    const p = D.parks.find(x => x.name === name);
    if (p && mapReady) { const lo = p.outline.map(x => x[1]), la = p.outline.map(x => x[0]); map.fitBounds([[Math.min(...lo), Math.min(...la)], [Math.max(...lo), Math.max(...la)]], { padding: sheetPad(), maxZoom: 16.5 }); return; }
    const bs = D.buildings.filter(b => placeOf(b) === name); if (bs.length) fit(bs);
  }

  // ---------- camera (loaded only when asked) ----------
  function openCamera() {
    const start = () => window.MaploCamera.open({
      buildings: D.buildings, byC, t, lang, BRAND, bName, placeOf, bJobs, bPartial, nfmt, esc, icon, toast,
      pick: id => go("b=" + id), shareFile: async (file, title, text) => {
        if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title, text }); return; } catch (e) { if (e.name === "AbortError") return; } }
        showCard(file);
      },
    });
    if (window.MaploCamera) return start();
    const s = document.createElement("script"); s.src = "camera.js"; s.onload = start; s.onerror = () => toast(t("camUnsupported")); document.head.appendChild(s);
  }
})();
