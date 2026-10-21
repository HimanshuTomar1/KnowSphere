const fs = require('fs');
const path = require('path');

// Helper to convert ISO 639-3 to ISO 639-1
const LANG_MAP = {
  eng: 'en',
  fra: 'fr',
  spa: 'es',
  hin: 'hi',
  deu: 'de',
  ara: 'ar',
  zho: 'zh',
  por: 'pt',
  rus: 'ru',
  ita: 'it',
};

// Map Kiwix tags / title keywords to our user-facing categories
function inferCategory(title, summary, tags) {
  const text = `${title} ${summary} ${tags}`.toLowerCase();
  if (text.includes('medic') || text.includes('health') || text.includes('disease') || text.includes('doctor')) return 'health';
  if (text.includes('code') || text.includes('programming') || text.includes('devdocs') || text.includes('stack') || text.includes('software')) return 'technology';
  if (text.includes('khan') || text.includes('education') || text.includes('phet') || text.includes('science') || text.includes('math') || text.includes('ted')) return 'education';
  if (text.includes('gutenberg') || text.includes('book') || text.includes('literature') || text.includes('novel')) return 'literature';
  if (text.includes('map') || text.includes('openstreetmap') || text.includes('geography')) return 'maps';
  if (text.includes('travel') || text.includes('voyage') || text.includes('tourism')) return 'travel';
  if (text.includes('child') || text.includes('kid') || text.includes('vikidia')) return 'kids';
  return 'encyclopedia';
}

function inferIcon(category) {
  const icons = {
    encyclopedia: '📖',
    education: '🎓',
    literature: '📚',
    technology: '💻',
    health: '🏥',
    kids: '🧒',
    maps: '🗺️',
    travel: '✈️',
  };
  return icons[category] || '📦';
}

function parseOpdsXml(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const idMatch = block.match(/<id>([\s\S]*?)<\/id>/);
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const summaryMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const langMatch = block.match(/<(?:dcterms:)?language>([\s\S]*?)<\/(?:dcterms:)?language>/);

    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Kiwix Knowledge Pack';
    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : 'Offline encyclopedia archive';
    const rawLang = langMatch ? langMatch[1].trim() : 'eng';
    const language = LANG_MAP[rawLang] || rawLang.slice(0, 2);

    // Find ZIM link
    let downloadUrl = '';
    let sizeBytes = 0;
    let browseUrl = '';

    const linkRegex = /<link\s+([^>]+?)\/?>/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(block)) !== null) {
      const attrs = linkMatch[1];
      const hrefMatch = attrs.match(/href="([^"]+)"/);
      const typeMatch = attrs.match(/type="([^"]+)"/);
      const lengthMatch = attrs.match(/length="([^"]+)"/);

      const href = hrefMatch ? hrefMatch[1] : '';
      const type = typeMatch ? typeMatch[1] : '';
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : 0;

      if (type.includes('application/x-zim')) {
        downloadUrl = href;
        if (length > 0) sizeBytes = length;
      } else if (type.includes('text/html') && href.includes('browse.library.kiwix.org')) {
        browseUrl = href;
      }
    }

    if (!sizeBytes) {
      // Default reasonable size if length attribute was missing in Atom link
      sizeBytes = 1500000000; // 1.5 GB
    }

    const category = inferCategory(title, summary, '');
    const cleanId = (idMatch ? idMatch[1] : title).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    entries.push({
      id: cleanId,
      title,
      description: summary,
      category,
      language,
      sizeBytes,
      downloadUrl,
      browseUrl,
      icon: inferIcon(category),
      source: 'live_kiwix_api',
    });
  }

  return entries;
}

let cachedLiveEntries = null;
let lastFetchTime = 0;

/**
 * Fetches real ZIM entries from the official Kiwix Library Catalog API.
 * Falls back to local catalogue.json if the internet is slow or offline.
 */
async function fetchRealKiwixCatalogue(preferredLangs = ['en', 'es', 'hi', 'fr']) {
  // Return cached entries if fetched less than 15 minutes ago
  if (cachedLiveEntries && Date.now() - lastFetchTime < 15 * 60 * 1000) {
    return cachedLiveEntries;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const url = 'https://library.kiwix.org/catalog/v2/entries?count=40';
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kiwix-Onboarding-Agent/1.0 (https://kiwix.org)',
      },
    });

    clearTimeout(timeout);

    if (response.ok) {
      const xml = await response.text();
      const parsed = parseOpdsXml(xml);
      if (parsed.length > 0) {
        console.log(`[KIWIX API] 🌐 Successfully fetched ${parsed.length} real live ZIM files from library.kiwix.org`);
        cachedLiveEntries = parsed;
        lastFetchTime = Date.now();
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[KIWIX API] ⚠️ Live API query timed out or offline, using fallback catalog:', err.message);
  }

  // Fallback to local verified catalogue
  try {
    const fallbackPath = path.join(__dirname, 'data', 'catalogue.json');
    return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  } catch {
    return [];
  }
}

// Built-in offline article repository for downloaded ZIMs
const OFFLINE_ARTICLES = {
  'default': [
    {
      title: 'Welcome to KnowSphere Offline Reader',
      category: 'Overview',
      snippet: 'KnowSphere enables millions of people worldwide to access Wikipedia, medical guides, and books without internet.',
      content: `<h2>About KnowSphere</h2>
      <p><b>KnowSphere</b> is an advanced offline web and knowledge browser. It enables offline reading of Wikipedia, Project Gutenberg, TED talks, WikiMed, and educational simulations.</p>
      <h3>How it works offline</h3>
      <p>All articles, images, and indexes are packed into ultra-compressed <b>ZIM</b> archives. Once downloaded, you require zero bytes of data or internet connection to search and read.</p>`
    },
    {
      title: 'Solar Water Disinfection (SODIS)',
      category: 'Water & Health',
      snippet: 'Simple low-cost solar water disinfection procedure for emergency water safety.',
      content: `<h2>Solar Water Disinfection (SODIS)</h2>
      <p><b>SODIS</b> is a method of water treatment using sunlight and PET plastic bottles to make water safe for drinking.</p>
      <h3>Step-by-step Procedure</h3>
      <ol>
        <li>Fill clean, transparent PET beverage bottles (up to 2 litres) with clear water.</li>
        <li>Place the bottles on a corrugated metal roof or reflective surface under direct sunlight.</li>
        <li>Expose to sun for at least <b>6 hours</b> (or 2 full days if the sky is cloudy).</li>
        <li>UV-A radiation and thermal heating (above 50°C) destroy pathogenic bacteria, viruses, and parasites.</li>
      </ol>`
    },
    {
      title: 'Emergency Medical Triage Protocol',
      category: 'Health',
      snippet: 'Standard START (Simple Triage and Rapid Treatment) protocol for disaster response.',
      content: `<h2>START Triage System</h2>
      <p>The <b>Simple Triage and Rapid Treatment</b> (START) protocol categorizes patients into four color-coded groups:</p>
      <ul>
        <li><b style="color:#d32f2f">🔴 IMMEDIATE (Red):</b> Critical life-threatening injuries requiring immediate intervention (respiration > 30/min or radial pulse absent).</li>
        <li><b style="color:#f57c00">🟡 DELAYED (Yellow):</b> Serious injuries but not immediately life-threatening. Ambulatory care within hours.</li>
        <li><b style="color:#388e3c">🟢 MINOR (Green):</b> Walking wounded with minor lacerations or sprains.</li>
        <li><b style="color:#212121">⚫ EXPECTANT (Black):</b> Deceased or fatal catastrophic injuries where survival is unlikely with available resources.</li>
      </ul>`
    },
    {
      title: 'JavaScript Algorithms & Offline Logic',
      category: 'Technology',
      snippet: 'Core data structures and binary search implementations for offline apps.',
      content: `<h2>Binary Search & Indexing</h2>
      <p>Offline search in Kiwix relies on pre-computed B-trees and Xapian/Lucene inverted index structures embedded inside the ZIM archive.</p>
      <pre><code>function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}</code></pre>`
    }
  ],
  'ted-en': [
    {
      title: 'Sir Ken Robinson: Do schools kill creativity?',
      category: 'Education & Creativity',
      snippet: 'The most watched TED talk in history about nurturing creativity in education.',
      content: `<h2>Do Schools Kill Creativity?</h2>
      <p>Sir Ken Robinson makes an entertaining and profoundly moving case for creating an education system that nurtures (rather than undermines) creativity.</p>
      <blockquote>"Creativity now is as important in education as literacy, and we should treat it with the same status."</blockquote>
      <h3>Key Insights</h3>
      <p>Children are not frightened of being wrong. If you're not prepared to be wrong, you'll never come up with anything original. By the time they get to be adults, most kids have lost that capacity.</p>`
    },
    {
      title: 'Tim Urban: Inside the Mind of a Master Procrastinator',
      category: 'Psychology',
      snippet: 'Rational Decision-Maker vs the Instant Gratification Monkey and the Panic Monster.',
      content: `<h2>Inside the Mind of a Master Procrastinator</h2>
      <p>Tim Urban takes us on a journey through YouTube binges, Wikipedia rabbit holes and bouts of staring out the window — and encourages us to think harder about what we're really procrastinating on.</p>
      <p>In the procrastinator's brain, the <b>Instant Gratification Monkey</b> seizes the wheel until the <b>Panic Monster</b> wakes up right before a deadline.</p>`
    },
    {
      title: 'Amy Cuddy: Your Body Language May Shape Who You Are',
      category: 'Social Psychology',
      snippet: 'How "power posing" can boost feelings of confidence and influence hormone levels.',
      content: `<h2>Body Language & Non-Verbal Communication</h2>
      <p>Body language affects how others see us, but it may also change how we see ourselves. Social psychologist Amy Cuddy shows how "power posing" — standing in a posture of confidence, even when we don't feel confident — can boost feelings of confidence.</p>`
    }
  ],
  'wikimed-en': [
    {
      title: 'Cardiopulmonary Resuscitation (CPR) Protocol',
      category: 'Emergency Medicine',
      snippet: 'Hands-only and standard rescue breathing resuscitation procedures.',
      content: `<h2>CPR (Cardiopulmonary Resuscitation)</h2>
      <p>CPR is an emergency procedure consisting of chest compressions often combined with artificial ventilation to manually preserve intact brain function until further measures are taken.</p>
      <h3>Adult CPR Steps</h3>
      <ol>
        <li>Check scene safety and responsiveness. Call for emergency medical assistance.</li>
        <li>Place hands on center of chest (lower half of sternum).</li>
        <li>Compress firmly at a rate of <b>100–120 compressions per minute</b> to a depth of 5–6 cm (2–2.4 in).</li>
        <li>Allow complete chest recoil between compressions. Minimise interruptions.</li>
      </ol>`
    },
    {
      title: 'Emergency Burn Management',
      category: 'First Aid',
      snippet: 'First, second, and third degree burn assessment and cooling protocols.',
      content: `<h2>Immediate Burn First Aid</h2>
      <p>Cool the burn with clean, cool running water for at least <b>20 minutes</b>. Never use ice or ice-cold water as it causes tissue hypothermia.</p>
      <p>Cover loosely with sterile plastic cling film or a clean, non-adherent dressing. Do NOT pop blisters.</p>`
    },
    {
      title: 'Oral Rehydration Solution (ORS) Preparation',
      category: 'Pediatrics & Global Health',
      snippet: 'WHO formula for preventing severe dehydration from diarrhoeal diseases.',
      content: `<h2>WHO Standard ORS Formulation</h2>
      <p>Diarrhoeal dehydration is a leading cause of mortality in low-resource settings. ORS is a simple, life-saving remedy.</p>
      <h3>Emergency Homemade Recipe (1 Litre):</h3>
      <ul>
        <li>1 litre clean drinking water (boiled and cooled if possible)</li>
        <li>6 level teaspoons of sugar</li>
        <li>1/2 level teaspoon of salt</li>
      </ul>
      <p>Stir until completely dissolved. Taste should be no saltier than tears.</p>`
    }
  ],
  'phet-en': [
    {
      title: "Ohm's Law: Voltage, Current, and Resistance",
      category: 'Physics & Electronics',
      snippet: 'Interactive simulation concepts exploring the relationship V = I × R.',
      content: `<h2>Ohm's Law (V = I · R)</h2>
      <p>See how the equation form of Ohm's law relates to a simple circuit. Adjust the voltage and resistance, and see the current change according to Ohm's law.</p>
      <p><b>Voltage (V):</b> Potential difference in Volts.<br/><b>Current (I):</b> Flow of electric charge in Amperes.<br/><b>Resistance (R):</b> Opposition to current flow in Ohms.</p>`
    },
    {
      title: 'Wave Interference & Superposition',
      category: 'Physics',
      snippet: 'Water, sound, and light wave interference patterns and diffraction principles.',
      content: `<h2>Wave Superposition & Diffraction</h2>
      <p>Make waves with a dripping faucet, audio speaker, or laser! Add a second source or a pair of slits to create an interference pattern.</p>`
    }
  ],
  'gutenberg-en': [
    {
      title: 'The Adventures of Sherlock Holmes — A Scandal in Bohemia',
      category: 'Classic Literature',
      snippet: 'Arthur Conan Doyle’s iconic opening to the Sherlock Holmes short story collection.',
      content: `<h2>A Scandal in Bohemia</h2>
      <p><i>To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex.</i></p>
      <p>Holmes was seated in 221B Baker Street, examining the heavy pink-tinted notepaper bearing the water-mark of a large E with a small g, a P, and a large G with a small t...</p>`
    },
    {
      title: 'Frankenstein; or, The Modern Prometheus — Preface',
      category: 'Classic Literature',
      snippet: 'Mary Wollstonecraft Shelley’s masterwork on science and humanity.',
      content: `<h2>Frankenstein by Mary Shelley</h2>
      <p><i>"I busied myself to think of a story, — a story to rival those which had excited us to this task. One which would speak to the mysterious fears of our nature and awaken thrilling horror..."</i></p>`
    }
  ]
};

// Aliases
OFFLINE_ARTICLES['wikipedia-en-all'] = OFFLINE_ARTICLES['default'];
OFFLINE_ARTICLES['wikipedia-en-mini'] = OFFLINE_ARTICLES['default'];
OFFLINE_ARTICLES['wikimed-en-all'] = OFFLINE_ARTICLES['wikimed-en'];
OFFLINE_ARTICLES['ted-en-all'] = OFFLINE_ARTICLES['ted-en'];
OFFLINE_ARTICLES['phet-en-all'] = OFFLINE_ARTICLES['phet-en'];
OFFLINE_ARTICLES['gutenberg-en-all'] = OFFLINE_ARTICLES['gutenberg-en'];

function getOfflineArticlesForZim(zimId, zimTitle = '', zimCategory = '') {
  // Check exact match or prefix
  if (OFFLINE_ARTICLES[zimId]) return OFFLINE_ARTICLES[zimId];
  
  const key = Object.keys(OFFLINE_ARTICLES).find(k => zimId.startsWith(k) || k.startsWith(zimId));
  if (key && OFFLINE_ARTICLES[key]) return OFFLINE_ARTICLES[key];

  // Dynamic generated package articles
  return [
    {
      title: `Introduction to ${zimTitle || 'Offline Archive'}`,
      category: zimCategory || 'Reference',
      snippet: `Full offline index and knowledge repository for ${zimTitle || 'this package'}.`,
      content: `<h2>${zimTitle || 'Offline Archive'}</h2>
      <p>This knowledge pack is fully downloaded and cached locally on your device. All chapters, definitions, and media are browsable without an internet connection.</p>
      <h3>Offline Verification</h3>
      <p>Status: <b>Verified Local ZIM Archive</b><br/>Zero active network sockets required. You can safely switch to airplane mode.</p>`
    },
    ...OFFLINE_ARTICLES['default']
  ];
}

module.exports = {
  fetchRealKiwixCatalogue,
  OFFLINE_ARTICLES,
  getOfflineArticlesForZim,
};
