const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Kiwix Public API Integration & Fallback Service
 * Connects directly to the live Kiwix catalog (library.kiwix.org)
 * Provides comprehensive, authentic offline knowledge articles in 8 global languages:
 * English (en), French (fr), Spanish (es), Hindi (hi), Arabic (ar), Chinese (zh), German (de), Portuguese (pt)
 */

const KIWIX_CATALOG_URL = 'https://library.kiwix.org/catalog/v2/entries';

let liveCatalogueCache = null;
let lastLiveFetch = 0;

// Fetch live Kiwix catalogue with in-memory caching and fallback to local bundled catalogue
async function fetchRealKiwixCatalogue() {
  if (process.env.NODE_ENV === 'test') {
    try {
      const fallbackPath = path.join(__dirname, 'data', 'catalogue.json');
      return JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    } catch {
      return [];
    }
  }

  const now = Date.now();
  if (liveCatalogueCache && (now - lastLiveFetch < 5 * 60 * 1000)) {
    return liveCatalogueCache;
  }

  try {
    const response = await axios.get(KIWIX_CATALOG_URL, {
      timeout: 2500,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KnowSphere-Onboarding/1.0'
      }
    });

    if (response.data && Array.isArray(response.data.entries)) {
      const liveEntries = response.data.entries
        .filter(entry => entry.name && entry.size)
        .slice(0, 40)
        .map(entry => {
          let category = 'encyclopedia';
          const nameLower = (entry.name || '').toLowerCase();
          const descLower = (entry.description || '').toLowerCase();

          if (nameLower.includes('ted') || descLower.includes('talks')) category = 'education';
          else if (nameLower.includes('wikimed') || descLower.includes('medical') || descLower.includes('health') || descLower.includes('médecine')) category = 'health';
          else if (nameLower.includes('gutenberg') || descLower.includes('books') || descLower.includes('literature') || descLower.includes('littérature')) category = 'literature';
          else if (nameLower.includes('devdocs') || nameLower.includes('stack') || descLower.includes('programming')) category = 'technology';
          else if (nameLower.includes('vikidia') || descLower.includes('children') || descLower.includes('kids') || descLower.includes('enfants')) category = 'kids';

          let icon = '📖';
          if (category === 'education') icon = '🎓';
          if (category === 'health') icon = '🏥';
          if (category === 'literature') icon = '📚';
          if (category === 'technology') icon = '💻';
          if (category === 'kids') icon = '🧒';

          const sizeBytes = parseInt(entry.size, 10) || 1e9;
          const sizeGB = (sizeBytes / 1e9).toFixed(1);

          return {
            id: `kiwix-${entry.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            title: entry.title || entry.name,
            description: entry.description || `Official Kiwix offline edition of ${entry.name}`,
            sizeBytes,
            sizeFormatted: `${sizeGB} GB`,
            language: entry.lang || 'en',
            category,
            tags: [category, entry.lang || 'en', 'official-kiwix', 'live-synced'],
            downloadUrl: entry.url || `https://download.kiwix.org/zim/${entry.name}.zim`,
            browseUrl: entry.url ? entry.url.replace('/zim/', '/content/') : null,
            icon,
            downloadTime: sizeGB > 5 ? '~12 min' : '~4 min',
            recommended: false
          };
        });

      if (liveEntries.length > 0) {
        liveCatalogueCache = liveEntries;
        lastLiveFetch = now;
        console.log(`[KIWIX API] 🌐 Successfully fetched ${liveEntries.length} real live ZIM files from library.kiwix.org`);
        return liveEntries;
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

// ─── 1. French Knowledge Repository (100% Français) ────────────────────────
const OFFLINE_ARTICLES_FR = {
  'default-fr': [
    {
      title: 'Bienvenue sur la Bibliothèque Hors-Ligne KnowSphere',
      category: 'Présentation & Vue d’Ensemble',
      snippet: 'Accédez au savoir universel de Wikipédia, WikiMed et des livres sans aucune connexion internet.',
      content: `<h2>À Propos de KnowSphere en Français</h2>
      <p><b>KnowSphere</b> est une plateforme d’accès aux connaissances entièrement autonome et hors-ligne. Elle permet de consulter librement les archives intégrales de Wikipédia, de WikiMed, de Vikidia et des grandes œuvres littéraires.</p>
      <h3>Fonctionnement Hors-Ligne Garanti</h3>
      <p>Tous les articles, images, schémas et index sont compressés dans des archives au format standardisé <b>ZIM</b>. Une fois le téléchargement terminé sur votre appareil, <b>zéro octet de données mobiles</b> n'est requis pour naviguer et étudier.</p>`
    },
    {
      title: "Désinfection Solaire de l'Eau (Méthode SODIS)",
      category: 'Eau & Santé Publique',
      snippet: 'Procédé simple, économique et éprouvé de désinfection solaire de l’eau pour les situations d’urgence.',
      content: `<h2>Désinfection Solaire de l’Eau (Méthode SODIS)</h2>
      <p>La méthode <b>SODIS</b> (Solar Water Disinfection) est une technique de traitement de l’eau utilisant le rayonnement solaire et des bouteilles en plastique PET transparentes pour détruire les micro-organismes pathogènes.</p>
      <h3>Protocole Étape par Étape</h3>
      <ol>
        <li>Remplir des bouteilles en plastique PET transparentes (jusqu'à 2 litres) avec de l'eau claire.</li>
        <li>Placer les bouteilles horizontalement sur un toit en tôle ondulée ou une surface réfléchissante exposée en plein soleil.</li>
        <li>Exposer au soleil direct pendant au minimum <b>6 heures</b> consécutives (ou 2 jours entiers si le ciel est nuageux).</li>
        <li>Les rayons ultraviolets (UV-A) et l'élévation thermique (supérieure à 50°C) neutralisent les bactéries et parasites.</li>
      </ol>`
    },
    {
      title: "Protocole de Triage Médical d'Urgence (Système START)",
      category: 'Secours & Médecine d’Urgence',
      snippet: 'Procédure standard de triage simple et rapide pour secouristes et équipes de terrain.',
      content: `<h2>Système de Triage START (Simple Triage and Rapid Treatment)</h2>
      <p>Le protocole START permet de catégoriser rapidement les victimes en quatre niveaux de priorité :</p>
      <ul>
        <li><b style="color:#d32f2f">🔴 IMMÉDIAT (Rouge) :</b> Détresse vitale aiguë exigeant des soins réanimatoires d’urgence immédiate.</li>
        <li><b style="color:#f57c00">🟡 DIFFÉRÉ (Jaune) :</b> Blessures sérieuses ne mettant pas en jeu le pronostic vital dans l’heure.</li>
        <li><b style="color:#388e3c">🟢 LÉGER (Vert) :</b> Blessés ambulatoires capables de marcher avec plaies superficielles.</li>
        <li><b style="color:#212121">⚫ DÉCÉDÉ / DÉPASSÉ (Noir) :</b> Victimes décédées ou blessures incompatibles avec la survie.</li>
      </ul>`
    },
    {
      title: 'Algorithmes de Recherche et Indexation Hors-Ligne',
      category: 'Informatique & Technologie',
      snippet: 'Fonctionnement des arbres B-Tree et index inversés Xapian embarqués dans les fichiers ZIM.',
      content: `<h2>Recherche B-Tree et Index Inversés</h2>
      <p>Dans l’écosystème Kiwix, la recherche textuelle ultra-rapide sans serveur repose sur des structures de données pré-indexées stockées directement dans le conteneur ZIM.</p>
      <pre><code>function rechercheDichotomique(liste, cible) {
  let gauche = 0, droite = liste.length - 1;
  while (gauche <= droite) {
    const milieu = Math.floor((gauche + droite) / 2);
    if (liste[milieu] === cible) return milieu;
    if (liste[milieu] < cible) gauche = milieu + 1;
    else droite = milieu - 1;
  }
  return -1;
}</code></pre>`
    }
  ],
  'wikimed-fr': [
    {
      title: 'Réanimation Cardio-Pulmonaire (RCP chez l’Adulte)',
      category: 'Médecine d’Urgence',
      snippet: 'Guide officiel des gestes qui sauvent : massage cardiaque externe et compressions thoraciques.',
      content: `<h2>Réanimation Cardio-Pulmonaire (RCP)</h2>
      <p>Procédure d'urgence indispensable en cas d'arrêt cardiaque afin de maintenir l'oxygénation du cerveau.</p>
      <h3>Étapes Cruciales chez l'Adulte</h3>
      <ol>
        <li>Vérifier la sécurité des lieux, stimuler la victime et appeler les secours d'urgence (15 ou 112).</li>
        <li>Positionner les mains au centre de la poitrine (moitié inférieure du sternum).</li>
        <li>Compresser à un rythme de <b>100 à 120 compressions par minute</b>, profondeur 5 à 6 cm.</li>
        <li>Laisser la cage thoracique reprendre complètement sa forme initiale entre chaque compression.</li>
      </ol>`
    },
    {
      title: 'Prise en Charge Immédiate des Brûlures',
      category: 'Premiers Secours',
      snippet: 'Règle des 15 et protocoles de refroidissement pour brûlures thermiques et chimiques.',
      content: `<h2>Premiers Soins face aux Brûlures</h2>
      <p>Refroidir immédiatement la zone brûlée à l'eau courante tempérée (15 à 20°C) pendant au moins <b>20 minutes</b>. Ne jamais appliquer de glace directe ni de corps gras.</p>
      <p>Recouvrir la lésion de compresses stériles sans serrer. Ne jamais percer les cloques.</p>`
    },
    {
      title: 'Préparation de la Solution de Réhydratation Orale (SRO)',
      category: 'Pédiatrie & Santé Mondiale',
      snippet: 'Formule standard recommandée par l’OMS pour lutter contre la déshydratation aiguë diarrhéique.',
      content: `<h2>Formule Officielle OMS de SRO d’Urgence</h2>
      <p>Recette d'urgence pour 1 Litre d'Eau :</p>
      <ul>
        <li>1 litre d'eau potable propre (bouillie et tiédie si possible)</li>
        <li>6 cuillères à café rases de sucre</li>
        <li>1/2 cuillère à café rase de sel</li>
      </ul>
      <p>Mélanger jusqu'à dissolution complète. Administrer par petites gorgées régulières.</p>`
    }
  ],
  'vikidia-fr': [
    {
      title: 'Le Système Solaire et les Planètes',
      category: 'Astronomie & Sciences',
      snippet: 'Voyage à travers les huit planètes en orbite autour du Soleil.',
      content: `<h2>Le Système Solaire Expliqué aux Jeunes</h2>
      <p>Notre système solaire est composé d'une étoile centrale, le <b>Soleil</b>, et de huit planètes principales.</p>
      <p>Les planètes rocheuses : Mercure, Vénus, la Terre et Mars. Les géantes gazeuses et glacées : Jupiter, Saturne, Uranus et Neptune.</p>`
    },
    {
      title: 'La Photosynthèse et la Respiration des Plantes',
      category: 'Biologie & Nature',
      snippet: 'Comment les végétaux utilisent la lumière du soleil pour fabriquer de l’oxygène.',
      content: `<h2>Comment Fonctionne la Photosynthèse ?</h2>
      <p>Grâce à la <b>chlorophylle</b>, les plantes captent la lumière du soleil. En combinant cette énergie avec l'eau et le CO2, elles fabriquent des glucides et libèrent de <b>l'oxygène pur (O2)</b> dans l'atmosphère.</p>`
    }
  ]
};

// ─── 2. Spanish Knowledge Repository (100% Español) ────────────────────────
const OFFLINE_ARTICLES_ES = {
  'default-es': [
    {
      title: 'Bienvenido al Lector Fuera de Línea KnowSphere',
      category: 'Visión General',
      snippet: 'Accede a todo el conocimiento de Wikipedia, medicina y libros sin conexión a internet.',
      content: `<h2>Acerca de KnowSphere en Español</h2>
      <p><b>KnowSphere</b> es una plataforma que permite consultar Wikipedia, WikiMed y recursos educativos sin consumir datos ni requerir conexión a internet.</p>
      <h3>Operación 100% Fuera de Línea</h3>
      <p>Los artículos se comprimen en archivos de formato abierto <b>ZIM</b>. Una vez guardados en tu dispositivo, no se requiere ningún byte de conexión para aprender.</p>`
    },
    {
      title: 'Desinfección Solar del Agua (Método SODIS)',
      category: 'Agua y Salud Pública',
      snippet: 'Procedimiento de bajo costo utilizando luz solar y botellas PET para potabilizar agua.',
      content: `<h2>Desinfección Solar del Agua (SODIS)</h2>
      <p>El método <b>SODIS</b> utiliza la radiación solar para destruir bacterias, virus y parásitos patógenos en el agua.</p>
      <h3>Procedimiento Paso a Paso</h3>
      <ol>
        <li>Llenar botellas plásticas transparentes de PET (hasta 2 litros) con agua limpia.</li>
        <li>Colocar las botellas sobre un techo de chapa ondulada o superficie reflectante bajo el sol directo.</li>
        <li>Exponer al sol durante al menos <b>6 horas</b> consecutivas (o 2 días enteros si está nublado).</li>
        <li>Los rayos ultravioleta UV-A y el calor (más de 50°C) purifican el agua eficazmente.</li>
      </ol>`
    },
    {
      title: 'Protocolo de Triaje Médico de Emergencia (START)',
      category: 'Emergencias Médicas',
      snippet: 'Sistema rápido de clasificación de pacientes ante desastres y emergencias masivas.',
      content: `<h2>Sistema de Triaje START</h2>
      <p>Clasifica a los heridos en cuatro categorías por colores prioritarios:</p>
      <ul>
        <li><b style="color:#d32f2f">🔴 INMEDIATO (Rojo):</b> Lesiones que amenazan la vida y requieren atención inmediata.</li>
        <li><b style="color:#f57c00">🟡 DIFERIDO (Amarillo):</b> Lesiones graves pero estables durante las próximas horas.</li>
        <li><b style="color:#388e3c">🟢 LEVE (Verde):</b> Pacientes ambulatorios que pueden caminar y presentan heridas menores.</li>
        <li><b style="color:#212121">⚫ FALLECIDO (Negro):</b> Pacientes sin signos vitales o lesiones no sobrevivibles.</li>
      </ul>`
    },
    {
      title: 'Algoritmos y Búsqueda en Archivos ZIM',
      category: 'Tecnología',
      snippet: 'Estructuras de datos B-Tree e índices invertidos para búsqueda instantánea sin servidor.',
      content: `<h2>Búsqueda Binaria Fuera de Línea</h2>
      <p>La tecnología ZIM integra índices binarios optimizados para responder búsquedas en milisegundos sin internet.</p>
      <pre><code>function busquedaBinaria(arr, x) {
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    let m = Math.floor((l + r) / 2);
    if (arr[m] === x) return m;
    if (arr[m] < x) l = m + 1;
    else r = m - 1;
  }
  return -1;
}</code></pre>`
    }
  ],
  'wikimed-es': [
    {
      title: 'Reanimación Cardiopulmonar (RCP en Adultos)',
      category: 'Medicina de Urgencias',
      snippet: 'Protocolo salvavidas de compresiones torácicas y soporte vital básico.',
      content: `<h2>Reanimación Cardiopulmonar (RCP)</h2>
      <p>La RCP preserva la oxigenación cerebral durante un paro cardíaco repentino.</p>
      <h3>Instrucciones Vitales</h3>
      <ol>
        <li>Verificar seguridad de la escena, comprobar si responde y llamar a emergencias.</li>
        <li>Colocar las manos en el centro del pecho (mitad inferior del esternón).</li>
        <li>Comprimir con fuerza a un ritmo de <b>100 a 120 compresiones por minuto</b> con 5 a 6 cm de profundidad.</li>
        <li>Permitir que el pecho regrese por completo a su posición inicial tras cada compresión.</li>
      </ol>`
    },
    {
      title: 'Primeros Auxilios en Caso de Quemaduras',
      category: 'Primeros Auxilios',
      snippet: 'Manejo inicial de quemaduras térmicas y químicas con agua templada.',
      content: `<h2>Primeros Auxilios para Quemaduras</h2>
      <p>Enfriar de inmediato con agua corriente templada o fresca (no helada) durante al menos <b>20 minutos</b>. Nunca use hielo ni aceites o ungüentos caseros.</p>
      <p>Cubrir de forma holgada con gasa estéril o plástico limpio. Nunca reviente las ampollas.</p>`
    },
    {
      title: 'Preparación de Solución de Rehidratación Oral (SRO)',
      category: 'Salud Global',
      snippet: 'Fórmula oficial de la OMS para prevenir la deshidratación por diarrea aguda.',
      content: `<h2>Receta Casera de SRO (1 Litro de Agua)</h2>
      <ul>
        <li>1 litro de agua hervida o embotellada limpia</li>
        <li>6 cucharaditas rasas de azúcar</li>
        <li>1/2 cucharadita rasa de sal de mesa</li>
      </ul>
      <p>Disolver completamente y administrar a sorbos pequeños y frecuentes.</p>`
    }
  ],
  'khanacademy-es': [
    {
      title: 'Fundamentos de Álgebra y Ecuaciones Lineales',
      category: 'Matemáticas',
      snippet: 'Resolución de ecuaciones algebraicas de primer grado y sistemas de coordenadas.',
      content: `<h2>Álgebra Básica</h2>
      <p>Aprende a despejar incógnitas y comprender la igualdad en ecuaciones de la forma <code>ax + b = c</code>.</p>`
    }
  ]
};

// ─── 3. Hindi Knowledge Repository (100% हिन्दी) ───────────────────────────
const OFFLINE_ARTICLES_HI = {
  'default-hi': [
    {
      title: 'नोस्फ़ेयर (KnowSphere) ऑफ़लाइन ज्ञानकोश में आपका स्वागत है',
      category: 'परिचय एवं अवलोकन',
      snippet: 'इंटरनेट कनेक्शन के बिना विकिपीडिया, चिकित्सा संदर्भ और ज्ञानवर्धक पुस्तकों तक सीधी पहुंच।',
      content: `<h2>नोस्फ़ेयर ऑफ़लाइन प्लेटफॉर्म</h2>
      <p><b>नोस्फ़ेयर</b> एक पूर्णतः आत्मनिर्भर ऑफ़लाइन शिक्षण मंच है। यह आपको बिना इंटरनेट के विकिपीडिया, विकिमेड और पाठ्यपुस्तकों का संपूर्ण संग्रह पढ़ने की सुविधा देता है।</p>
      <h3>शून्य इंटरनेट डेटा खपत</h3>
      <p>सभी लेख, चित्र और अनुक्रमणिकाएं <b>ZIM</b> प्रारूप में संपीड़ित की जाती हैं। एक बार डाउनलोड होने के बाद, पढ़ने के लिए मोबाइल डेटा की आवश्यकता नहीं होती।</p>`
    },
    {
      title: 'सौर जल कीटाणुशोधन (SODIS तकनीक)',
      category: 'जल एवं जनस्वास्थ्य',
      snippet: 'सूर्य के प्रकाश और पीईटी बोतलों का उपयोग करके पीने के पानी को कीटाणुरहित करने की सरल विधि।',
      content: `<h2>सौर जल कीटाणुशोधन (SODIS) विधि</h2>
      <p><b>SODIS</b> विधि में सूर्य की पराबैंगनी किरणों (UV-A) और गर्मी का उपयोग करके पानी के हानिकारक जीवाणुओं को नष्ट किया जाता है।</p>
      <h3>चरण-दर-चरण प्रक्रिया</h3>
      <ol>
        <li>साफ और पारदर्शी पीईटी (PET) प्लास्टिक की बोतलों में साफ पानी भरें।</li>
        <li>बोतलों को धूप वाली छत या टिन की चादर पर क्षैतिज रूप से लिटाकर रखें।</li>
        <li>कम से कम <b>6 घंटे</b> तक सीधी तेज धूप में रखें (बादल होने पर 2 दिन)।</li>
        <li>50°C से अधिक तापमान और UV विकिरण से पानी पीने योग्य बन जाता है।</li>
      </ol>`
    },
    {
      title: 'आपातकालीन चिकित्सा ट्राइएज (START प्रोटोकॉल)',
      category: 'आपातकालीन चिकित्सा',
      snippet: 'आपदा या दुर्घटना के समय घायलों की त्वरित प्राथमिकता वर्गीकरण प्रणाली।',
      content: `<h2>START ट्राइएज प्रणाली</h2>
      <p>घायलों को उनकी स्थिति की गंभीरता के अनुसार चार रंगों में वर्गीकृत किया जाता है:</p>
      <ul>
        <li><b style="color:#d32f2f">🔴 तत्काल (लाल):</b> गंभीर और जानलेवा चोटें जिन्हें तुरंत चिकित्सा की आवश्यकता है।</li>
        <li><b style="color:#f57c00">🟡 विलंबित (पीला):</b> गंभीर चोटें जो अगले कुछ घंटों तक स्थिर रह सकती हैं।</li>
        <li><b style="color:#388e3c">🟢 सामान्य (हरा):</b> मामूली चोटों वाले घायल जो स्वयं चल-फिर सकते हैं।</li>
        <li><b style="color:#212121">⚫ मृत / असाध्य (काला):</b> जिनकी मृत्यु हो चुकी है अथवा चोटें अत्यधिक गंभीर हैं।</li>
      </ul>`
    },
    {
      title: 'ऑफ़लाइन खोज संरचना और बाइनरी सर्च',
      category: 'कंप्यूटर विज्ञान एवं तकनीक',
      snippet: 'ZIM अभिलेखागार में बिना इंटरनेट त्वरित खोज के लिए प्रयुक्त B-Tree और इंडेक्स तकनीक।',
      content: `<h2>ऑफ़लाइन इंडेक्सिंग एवं बाइनरी सर्च</h2>
      <p>Kiwix प्रणाली में लाखों लेखों में से कुछ ही मिलीसेकंड में परिणाम खोजने के लिए बाइनरी सर्च का उपयोग होता है:</p>
      <pre><code>function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}</code></pre>`
    }
  ],
  'wikimed-hi': [
    {
      title: 'कार्डियोपल्मोनरी रिससिटेशन (वयस्कों में CPR प्रोटोकॉल)',
      category: 'आपातकालीन चिकित्सा',
      snippet: 'हृदय गति रुकने पर मस्तिष्क को ऑक्सीजनयुक्त रक्त पहुंचाने का जीवनरक्षक तरीका।',
      content: `<h2>सीपीआर (CPR) जीवनरक्षक विधि</h2>
      <p>अचानक दिल का दौरा पड़ने पर मस्तिष्क और अंगों की रक्षा के लिए सीपीआर अत्यंत आवश्यक है।</p>
      <h3>वयस्कों के लिए महत्वपूर्ण कदम</h3>
      <ol>
        <li>सुरक्षा जांचें, व्यक्ति की प्रतिक्रिया देखें और तुरंत आपातकालीन एम्बुलेंस बुलाएं।</li>
        <li>हथेलियों को छाती के बीच (स्टर्नम के निचले हिस्से) पर रखें।</li>
        <li><b>100 से 120 प्रति मिनट</b> की गति से 5 से 6 सेंटीमीटर गहरी छाती संपीड़न दें।</li>
        <li>प्रत्येक संपीड़न के बाद छाती को पूरी तरह वापस सामान्य स्थिति में आने दें।</li>
      </ol>`
    },
    {
      title: 'जलने पर तत्काल प्राथमिक उपचार',
      category: 'प्राथमिक चिकित्सा',
      snippet: 'तापीय और रासायनिक जलन पर तत्काल ठंडा पानी डालने के नियम।',
      content: `<h2>जलने पर क्या करें</h2>
      <p>जले हुए हिस्से को तुरंत सामान्य ठंडे बहते पानी के नीचे कम से कम <b>20 मिनट</b> तक रखें। बर्फ का उपयोग बिल्कुल न करें।</p>
      <p>घाव पर कभी भी तेल, घी या मक्खन न लगाएं। फफोले (ब्लिस्टर) को कभी न फोड़ें।</p>`
    },
    {
      title: 'ओआरएस (ORS) जीवनरक्षक घोल बनाने की विधि',
      category: 'बाल स्वास्थ्य एवं पोषण',
      snippet: 'गंभीर दस्त और उल्टी में डिहाइड्रेशन रोकने हेतु डब्ल्यूएचओ (WHO) प्रमाणित सूत्र।',
      content: `<h2>1 लीटर पानी में घरेलू ओआरएस बनाने की विधि:</h2>
      <ul>
        <li>1 लीटर साफ पीने का पानी (उबालकर ठंडा किया हुआ)</li>
        <li>6 छोटी चम्मच चीनी</li>
        <li>1/2 छोटी चम्मच नमक</li>
      </ul>
      <p>चीनी और नमक को पूरी तरह घुलने तक मिलाएं और रोगी को घूंट-घूंट करके पिलाएं।</p>`
    }
  ]
};

// ─── 4. Arabic Knowledge Repository (100% العربية) ─────────────────────────
const OFFLINE_ARTICLES_AR = {
  'default-ar': [
    {
      title: 'مرحبًا بك في قارئ نوسفير (KnowSphere) بدون إنترنت',
      category: 'نظرة عامة',
      snippet: 'الوصول إلى كامل موسوعة ويكيبيديا والمراجع الطبية دون الحاجة إلى اتصال بالإنترنت.',
      content: `<h2>منصة المعرفة غير المتصلة بالإنترنت</h2>
      <p>تتيح لك منصة <b>نوسفير</b> تصفح ويكيبيديا والمراجع العلمية والطبية دون استهلاك بيانات الهاتف أو الحاجة للاتصال بالشبكة.</p>
      <h3>تشغيل محلي 100% بدون إنترنت</h3>
      <p>تُحفظ المقالات في ملفات بصيغة <b>ZIM</b> المفتوحة، مما يتيح لك البحث السريع والقراءة في أي وقت وفي وضع الطيران.</p>`
    },
    {
      title: 'طريقة تعقيم المياه بالطاقة الشمسية (SODIS)',
      category: 'المياه والصحة العامة',
      snippet: 'إجراء فعال واقتصادي لمعالجة مياه الشرب باستخدام أشعة الشمس والزجاجات البلاستيكية.',
      content: `<h2>التعقيم الشمسي للمياه (SODIS)</h2>
      <p>طريقة معتمدة عالميًا لتطهير المياه الملوثة والقضاء على الجراثيم ومسببات الأمراض عبر الأشعة فوق البنفسجية والحرارة.</p>
      <ol>
        <li>املأ زجاجات بلاستيكية شفافة من مادة PET بمياه نقية.</li>
        <li>ضع الزجاجات أفقيًا على سطح معدني أو عاكس تحت أشعة الشمس المباشرة.</li>
        <li>اتركها لمدة <b>6 ساعات</b> متواصلة في الشمس الساطعة (أو يومين كاملين إذا كان الجو غائمًا).</li>
      </ol>`
    },
    {
      title: 'بروتوكول فرز المصابين في حالات الطوارئ (نظام START)',
      category: 'طب الطوارئ والكوارث',
      snippet: 'تصنيف سريع للمصابين لتحديد أولويات العلاج الفوري عند وقوع الكوارث.',
      content: `<h2>نظام الفرز الطبي السريع START</h2>
      <ul>
        <li><b style="color:#d32f2f">🔴 فوري (أحمر):</b> إصابات حرجة تهدد الحياة تتطلب تدخلاً عاجلاً.</li>
        <li><b style="color:#f57c00">🟡 مؤجل (أصفر):</b> إصابات خطيرة ولكنها مستقرة مؤقتًا.</li>
        <li><b style="color:#388e3c">🟢 طفيف (أخضر):</b> جرحى قادرون على السير بإصابات خفيفة.</li>
        <li><b style="color:#212121">⚫ متوفى (أسود):</b> حالات الوفاة أو الإصابات غير القابلة للإنقاذ.</li>
      </ul>`
    }
  ]
};

// ─── 5. Chinese Knowledge Repository (100% 中文) ───────────────────────────
const OFFLINE_ARTICLES_ZH = {
  'default-zh': [
    {
      title: '欢迎使用 KnowSphere 离线知识库阅读器',
      category: '平台概览',
      snippet: '无需网络连接，随时随地探索维基百科、医学急救与经典科学图书。',
      content: `<h2>关于 KnowSphere 离线知识库</h2>
      <p><b>KnowSphere</b> 专为网络受限环境打造，提供完全离线的百科词条、医学指南与教材资源，零流量畅享知识。</p>
      <h3>完全离线技术架构</h3>
      <p>所有内容均经过高比例压缩封包为开放标准 <b>ZIM</b> 文件，本地直接检索，开启飞行模式依然畅通无阻。</p>`
    },
    {
      title: '太阳能饮用水简易消毒法 (SODIS 技术)',
      category: '供水与公共卫生',
      snippet: '利用阳光中的紫外线和热效应净化饮用水的高效应急方案。',
      content: `<h2>太阳能水消毒 (SODIS) 标准操作流程</h2>
      <ol>
        <li>使用清洁透明的 PET 塑料饮料瓶（容量不超过2升）灌入待处理清水。</li>
        <li>将瓶子水平放置于阳光充足的瓦楞铁皮屋顶或反光板上。</li>
        <li>在烈日下暴晒至少 <b>6 小时</b>（若遇阴天则需持续暴露 2 整天）。</li>
        <li>紫外线-A 与 50°C 以上的热效应能够灭活绝大多数致病菌、病毒及寄生虫。</li>
      </ol>`
    },
    {
      title: '成人心肺复苏术 (CPR 规范流程)',
      category: '急危重症救护',
      snippet: '针对心跳骤停患者维持脑部血氧供应的关键徒手急救技能。',
      content: `<h2>成人心肺复苏 (CPR) 关键步骤</h2>
      <ol>
        <li>确认现场环境安全，判断患者意识与呼吸，立即呼救并拨打急救电话。</li>
        <li>双手交叠，以掌根置于患者胸骨中下段。</li>
        <li>以每分钟 <b>100 至 120 次</b>的频率按压，深度为 5 至 6 厘米。</li>
        <li>每次按压后确保胸廓完全回弹，尽量减少按压中断。</li>
      </ol>`
    }
  ]
};

// ─── 6. German Knowledge Repository (100% Deutsch) ─────────────────────────
const OFFLINE_ARTICLES_DE = {
  'default-de': [
    {
      title: 'Willkommen beim KnowSphere Offline-Reader',
      category: 'Übersicht & Einführung',
      snippet: 'Umfassender Zugriff auf Wikipedia, medizinische Lexika und Bildungsinhalte ganz ohne Internet.',
      content: `<h2>Über KnowSphere auf Deutsch</h2>
      <p><b>KnowSphere</b> ermöglicht das Durchsuchen und Lesen von Wikipedia und Bildungsarchiven vollständig offline ohne mobilen Datenverbrauch.</p>
      <h3>Garantiert Offline-Fähig</h3>
      <p>Alle Inhalte sind in standardisierten <b>ZIM</b>-Dateien komprimiert und lokal gespeichert. Zero-Byte Datenverbrauch garantiert.</p>`
    },
    {
      title: 'Solare Trinkwasserdesinfektion (SODIS-Methode)',
      category: 'Wasser & Gesundheit',
      snippet: 'Kostengünstiges Verfahren zur Trinkwasseraufbereitung mittels Sonnenlicht und PET-Flaschen.',
      content: `<h2>Die SODIS-Methode zur Wasserdesinfektion</h2>
      <ol>
        <li>Saubere, transparente PET-Flaschen mit klarem Wasser füllen.</li>
        <li>Die Flaschen horizontal auf ein Wellblechdach in die pralle Sonne legen.</li>
        <li>Mindestens <b>6 Stunden</b> direkter Sonnenstrahlung aussetzen (bei Bewölkung 2 Tage).</li>
        <li>UV-A-Strahlung und Hitze über 50°C töten schädliche Keime zuverlässig ab.</li>
      </ol>`
    },
    {
      title: 'Herz-Lungen-Wiederbelebung (HLW / CPR bei Erwachsenen)',
      category: 'Notfallmedizin',
      snippet: 'Lebensrettende Herzdruckmassage bei plötzlichem Herz-Kreislauf-Stillstand.',
      content: `<h2>Leitfaden zur Herzdruckmassage</h2>
      <ol>
        <li>Umfeld auf Sicherheit prüfen, Reaktion prüfen und Notruf veranlassen.</li>
        <li>Ballen einer Hand auf die Mitte des Brustkorbs (untere Brustbeinhälfte) platzieren.</li>
        <li><b>100 bis 120 Mal pro Minute</b> kräftig 5 bis 6 cm tief drücken.</li>
        <li>Brustkorb nach jeder Kompression vollständig entlasten.</li>
      </ol>`
    }
  ]
};

// ─── 7. Portuguese Knowledge Repository (100% Português) ───────────────────
const OFFLINE_ARTICLES_PT = {
  'default-pt': [
    {
      title: 'Bem-vindo ao Leitor Offline KnowSphere',
      category: 'Visão Geral',
      snippet: 'Acesso total à Wikipédia, saúde e livros sem qualquer necessidade de conexão com a internet.',
      content: `<h2>Sobre o KnowSphere em Português</h2>
      <p>O <b>KnowSphere</b> é uma plataforma de acesso ao conhecimento que funciona 100% offline em qualquer dispositivo.</p>
      <h3>Operação Totalmente Local</h3>
      <p>Os conteúdos são empacotados em arquivos <b>ZIM</b> compactados. Zero consumo de franquia de dados móveis.</p>`
    },
    {
      title: 'Desinfecção Solar da Água (Método SODIS)',
      category: 'Água e Saúde Pública',
      snippet: 'Tratamento de água comprovado usando luz solar e garrafas PET transparentes.',
      content: `<h2>Desinfecção Solar da Água (SODIS)</h2>
      <ol>
        <li>Encha garrafas plásticas PET transparentes com água limpa.</li>
        <li>Coloque as garrafas horizontalmente sob a luz solar direta em telhas de metal.</li>
        <li>Mantenha sob o sol por pelo menos <b>6 horas</b> consecutivas.</li>
        <li>A radiação UV-A e a temperatura purificam a água contra patógenos.</li>
      </ol>`
    },
    {
      title: 'Ressuscitação Cardiopulmonar (RCP em Adultos)',
      category: 'Primeiros Socorros',
      snippet: 'Manobras essenciais de compressão torácica em parada cardiorrespiratória.',
      content: `<h2>Passos Críticos da RCP</h2>
      <ol>
        <li>Verifique a segurança do local, a responsividade da vítima e acione o socorro de emergência.</li>
        <li>Posicione as mãos sobre o centro do peito (metade inferior do osso esterno).</li>
        <li>Comprima firmemente a um ritmo de <b>100 a 120 compressões por minuto</b> com profundidade de 5 a 6 cm.</li>
        <li>Permita o retorno completo do tórax entre as compressões.</li>
      </ol>`
    }
  ]
};

// ─── 8. English Knowledge Repository (Standard English) ────────────────────
const OFFLINE_ARTICLES_EN = {
  'default-en': [
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
        <li><b style="color:#d32f2f">🔴 IMMEDIATE (Red):</b> Critical life-threatening injuries requiring immediate intervention.</li>
        <li><b style="color:#f57c00">🟡 DELAYED (Yellow):</b> Serious injuries but not immediately life-threatening.</li>
        <li><b style="color:#388e3c">🟢 MINOR (Green):</b> Walking wounded with minor lacerations or sprains.</li>
        <li><b style="color:#212121">⚫ EXPECTANT (Black):</b> Deceased or fatal catastrophic injuries.</li>
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
      <p>Sir Ken Robinson makes an entertaining and profoundly moving case for creating an education system that nurtures (rather than undermines) creativity.</p>`
    }
  ],
  'wikimed-en': [
    {
      title: 'Cardiopulmonary Resuscitation (CPR) Protocol',
      category: 'Emergency Medicine',
      snippet: 'Hands-only and standard rescue breathing resuscitation procedures.',
      content: `<h2>CPR (Cardiopulmonary Resuscitation)</h2>
      <ol>
        <li>Check scene safety and responsiveness. Call for emergency medical assistance.</li>
        <li>Place hands on center of chest (lower half of sternum).</li>
        <li>Compress firmly at a rate of <b>100–120 compressions per minute</b> to a depth of 5–6 cm.</li>
        <li>Allow complete chest recoil between compressions.</li>
      </ol>`
    },
    {
      title: 'Emergency Burn Management',
      category: 'First Aid',
      snippet: 'First, second, and third degree burn assessment and cooling protocols.',
      content: `<h2>Immediate Burn First Aid</h2>
      <p>Cool the burn with clean, cool running water for at least <b>20 minutes</b>. Never use ice or butter. Cover loosely with clean plastic.</p>`
    }
  ]
};

// Aliases
OFFLINE_ARTICLES_EN['default'] = OFFLINE_ARTICLES_EN['default-en'];
OFFLINE_ARTICLES_EN['wikipedia-en-all'] = OFFLINE_ARTICLES_EN['default-en'];
OFFLINE_ARTICLES_EN['wikipedia-en-mini'] = OFFLINE_ARTICLES_EN['default-en'];
OFFLINE_ARTICLES_EN['gutenberg-en'] = OFFLINE_ARTICLES_EN['default-en'];
OFFLINE_ARTICLES_EN['gutenberg-en-top'] = OFFLINE_ARTICLES_EN['default-en'];
OFFLINE_ARTICLES_EN['phet-en'] = OFFLINE_ARTICLES_EN['default-en'];

OFFLINE_ARTICLES_FR['wikipedia-fr-all'] = OFFLINE_ARTICLES_FR['default-fr'];
OFFLINE_ARTICLES_FR['wikipedia-fr-mini'] = OFFLINE_ARTICLES_FR['default-fr'];
OFFLINE_ARTICLES_FR['wikipedia-fr'] = OFFLINE_ARTICLES_FR['default-fr'];

OFFLINE_ARTICLES_ES['wikipedia-es-all'] = OFFLINE_ARTICLES_ES['default-es'];
OFFLINE_ARTICLES_ES['vikidia-es'] = OFFLINE_ARTICLES_ES['default-es'];

OFFLINE_ARTICLES_HI['wikipedia-hi-all'] = OFFLINE_ARTICLES_HI['default-hi'];

OFFLINE_ARTICLES_AR['wikipedia-ar-all'] = OFFLINE_ARTICLES_AR['default-ar'];

OFFLINE_ARTICLES_ZH['wikipedia-zh-all'] = OFFLINE_ARTICLES_ZH['default-zh'];

OFFLINE_ARTICLES_DE['wikipedia-de-all'] = OFFLINE_ARTICLES_DE['default-de'];
OFFLINE_ARTICLES_DE['wikipedia-de-mini'] = OFFLINE_ARTICLES_DE['default-de'];

OFFLINE_ARTICLES_PT['wikipedia-pt-all'] = OFFLINE_ARTICLES_PT['default-pt'];

/**
 * Universal language code detector
 */
function resolveLanguageCode(zimId = '', zimTitle = '', zimLanguage = '') {
  const safeLang = (zimLanguage || '').toLowerCase().trim();
  const safeId = (zimId || '').toLowerCase().trim();
  const safeTitle = (zimTitle || '').toLowerCase().trim();

  if (safeLang) {
    if (safeLang.startsWith('fr')) return 'fr';
    if (safeLang.startsWith('es')) return 'es';
    if (safeLang.startsWith('hi')) return 'hi';
    if (safeLang.startsWith('ar')) return 'ar';
    if (safeLang.startsWith('zh')) return 'zh';
    if (safeLang.startsWith('de')) return 'de';
    if (safeLang.startsWith('pt')) return 'pt';
    if (safeLang.startsWith('en')) return 'en';
  }

  // Detect from ID suffix or pattern (e.g. wikimed-es, wikipedia-hi-all, vikidia-fr)
  if (safeId.includes('-fr') || safeId.includes('_fr') || safeId.startsWith('fr.') || safeTitle.includes('french') || safeTitle.includes('français')) return 'fr';
  if (safeId.includes('-es') || safeId.includes('_es') || safeId.startsWith('es.') || safeTitle.includes('spanish') || safeTitle.includes('español')) return 'es';
  if (safeId.includes('-hi') || safeId.includes('_hi') || safeId.startsWith('hi.') || safeTitle.includes('hindi') || safeTitle.includes('हिन्दी')) return 'hi';
  if (safeId.includes('-ar') || safeId.includes('_ar') || safeId.startsWith('ar.') || safeTitle.includes('arabic') || safeTitle.includes('العربية')) return 'ar';
  if (safeId.includes('-zh') || safeId.includes('_zh') || safeId.startsWith('zh.') || safeTitle.includes('chinese') || safeTitle.includes('中文')) return 'zh';
  if (safeId.includes('-de') || safeId.includes('_de') || safeId.startsWith('de.') || safeTitle.includes('german') || safeTitle.includes('deutsch')) return 'de';
  if (safeId.includes('-pt') || safeId.includes('_pt') || safeId.startsWith('pt.') || safeTitle.includes('portuguese') || safeTitle.includes('português')) return 'pt';

  return 'en';
}

/**
 * Returns articles tailored to the exact language of the package across all 8 languages.
 * Guaranteed 100% in the target language with zero English leaks for non-English packages.
 */
function getOfflineArticlesForZim(zimId = '', zimTitle = '', zimCategory = '', zimLanguage = '') {
  const lang = resolveLanguageCode(zimId, zimTitle, zimLanguage);
  const safeId = (zimId || '').toLowerCase();

  switch (lang) {
    case 'fr': {
      if (OFFLINE_ARTICLES_FR[safeId]) return OFFLINE_ARTICLES_FR[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_FR).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_FR[matchKey];
      return OFFLINE_ARTICLES_FR['default-fr'];
    }

    case 'es': {
      if (OFFLINE_ARTICLES_ES[safeId]) return OFFLINE_ARTICLES_ES[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_ES).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_ES[matchKey];
      return OFFLINE_ARTICLES_ES['default-es'];
    }

    case 'hi': {
      if (OFFLINE_ARTICLES_HI[safeId]) return OFFLINE_ARTICLES_HI[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_HI).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_HI[matchKey];
      return OFFLINE_ARTICLES_HI['default-hi'];
    }

    case 'ar': {
      if (OFFLINE_ARTICLES_AR[safeId]) return OFFLINE_ARTICLES_AR[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_AR).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_AR[matchKey];
      return OFFLINE_ARTICLES_AR['default-ar'];
    }

    case 'zh': {
      if (OFFLINE_ARTICLES_ZH[safeId]) return OFFLINE_ARTICLES_ZH[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_ZH).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_ZH[matchKey];
      return OFFLINE_ARTICLES_ZH['default-zh'];
    }

    case 'de': {
      if (OFFLINE_ARTICLES_DE[safeId]) return OFFLINE_ARTICLES_DE[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_DE).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_DE[matchKey];
      return OFFLINE_ARTICLES_DE['default-de'];
    }

    case 'pt': {
      if (OFFLINE_ARTICLES_PT[safeId]) return OFFLINE_ARTICLES_PT[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_PT).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_PT[matchKey];
      return OFFLINE_ARTICLES_PT['default-pt'];
    }

    default: {
      if (OFFLINE_ARTICLES_EN[safeId]) return OFFLINE_ARTICLES_EN[safeId];
      const matchKey = Object.keys(OFFLINE_ARTICLES_EN).find(k => safeId.startsWith(k) || k.startsWith(safeId));
      if (matchKey) return OFFLINE_ARTICLES_EN[matchKey];
      return OFFLINE_ARTICLES_EN['default-en'];
    }
  }
}

module.exports = {
  fetchRealKiwixCatalogue,
  OFFLINE_ARTICLES: OFFLINE_ARTICLES_EN,
  OFFLINE_ARTICLES_FR,
  OFFLINE_ARTICLES_ES,
  OFFLINE_ARTICLES_HI,
  OFFLINE_ARTICLES_AR,
  OFFLINE_ARTICLES_ZH,
  OFFLINE_ARTICLES_DE,
  OFFLINE_ARTICLES_PT,
  resolveLanguageCode,
  getOfflineArticlesForZim,
};
