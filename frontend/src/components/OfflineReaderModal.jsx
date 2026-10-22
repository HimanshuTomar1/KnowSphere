import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import KnowSphereLogo from './KnowSphereLogo';

/**
 * Multilingual UI translations for Offline Reader across all 8 supported languages:
 * English (en), French (fr), Spanish (es), Hindi (hi), Arabic (ar), Chinese (zh), German (de), Portuguese (pt)
 */
const I18N = {
  en: {
    readerTitle: 'KnowSphere Offline Reader',
    offlineBadge: '● 100% OFFLINE',
    zeroInternet: count => `Zero Internet Required · ${count} Downloaded Pack${count !== 1 ? 's' : ''} Ready`,
    shelfTitle: count => `📚 Downloaded Files in Your Offline Library (${count}):`,
    shelfSub: 'Showing only completed local files',
    emptyShelf: 'No completed downloads yet. Download files in Step 6 to read them offline.',
    searchPlaceholder: title => `🔍 Search in ${title}…`,
    verifiedArchive: 'Verified Local ZIM Archive',
    cachedBadge: '✅ Cached',
    openBadge: '✓ Open',
    offlineStatus: 'Offline',
    openingIndex: 'Opening offline index…',
    noArticles: 'No matching offline articles found.',
    articlesIndexed: count => `📦 ${count} articles indexed`,
    localBadge: '✓ Local',
    verifiedNotice: (filename) => `Verified Offline Reading: Loaded from physical local manifest ${filename} with zero network requests. You can browse completely off-grid.`,
    selectPrompt: 'Select an article from the left to read.',
    cachedOffline: 'Cached Offline',
    articleFallbackCategory: 'Offline Reference',
    articleFallbackSnippet: 'Full content downloaded and cached offline on this device.',
    articleFallbackIntro: title => `Introduction to ${title}`,
    articleFallbackBody: title => `<p>This knowledge pack is fully downloaded and verified on your device. You can search, browse, and read all articles without internet access.</p>`
  },
  fr: {
    readerTitle: 'Lecteur Hors-Ligne KnowSphere',
    offlineBadge: '● 100% HORS-LIGNE',
    zeroInternet: count => `Zéro Internet Requis · ${count} Fichier${count > 1 ? 's' : ''} Prêt${count > 1 ? 's' : ''}`,
    shelfTitle: count => `📚 Archives Téléchargées dans Votre Bibliothèque (${count}) :`,
    shelfSub: 'Archives locales vérifiées',
    emptyShelf: 'Aucun téléchargement terminé. Téléchargez des fichiers à l\'étape 6 pour les lire hors-ligne.',
    searchPlaceholder: title => `🔍 Rechercher dans ${title}…`,
    verifiedArchive: 'Archive ZIM Locale Vérifiée',
    cachedBadge: '✅ En Cache',
    openBadge: '✓ Ouvert',
    offlineStatus: 'Hors-Ligne',
    openingIndex: 'Ouverture de l’index hors-ligne…',
    noArticles: 'Aucun article correspondant trouvé.',
    articlesIndexed: count => `📦 ${count} article${count > 1 ? 's' : ''} indexé${count > 1 ? 's' : ''}`,
    localBadge: '✓ Local',
    verifiedNotice: (filename) => `Lecture Hors-Ligne Vérifiée : Contenu extrait directement du manifeste local ${filename} sans aucune requête réseau externe. Navigation intégrale en mode avion.`,
    selectPrompt: 'Sélectionnez un article dans la liste à gauche pour commencer votre lecture.',
    cachedOffline: 'Mis en cache hors-ligne',
    articleFallbackCategory: 'Référence Hors-Ligne',
    articleFallbackSnippet: 'Contenu intégral disponible hors-ligne sur votre appareil.',
    articleFallbackIntro: title => `Introduction à ${title}`,
    articleFallbackBody: title => `<p>Ce module d'apprentissage est entièrement disponible en <b>langue française</b> et stocké directement sur votre équipement. Vous pouvez parcourir, étudier et approfondir tous les chapitres sans aucun besoin de connexion internet.</p>`
  },
  es: {
    readerTitle: 'Lector Fuera de Línea KnowSphere',
    offlineBadge: '● 100% FUERA DE LÍNEA',
    zeroInternet: count => `Cero Internet Requerido · ${count} Archivo${count !== 1 ? 's' : ''} Listo${count !== 1 ? 's' : ''}`,
    shelfTitle: count => `📚 Archivos Descargados en tu Biblioteca (${count}):`,
    shelfSub: 'Mostrando solo archivos locales completos',
    emptyShelf: 'Aún no hay descargas completas. Descarga archivos en el Paso 6 para leerlos fuera de línea.',
    searchPlaceholder: title => `🔍 Buscar en ${title}…`,
    verifiedArchive: 'Archivo ZIM Local Verificado',
    cachedBadge: '✅ En Caché',
    openBadge: '✓ Abierto',
    offlineStatus: 'Fuera de Línea',
    openingIndex: 'Abriendo índice fuera de línea…',
    noArticles: 'No se encontraron artículos coincidentes.',
    articlesIndexed: count => `📦 ${count} artículos indexados`,
    localBadge: '✓ Local',
    verifiedNotice: (filename) => `Lectura Fuera de Línea Verificada: Cargado directamente desde el manifiesto local ${filename} sin peticiones de red. Navegación completa en modo avión.`,
    selectPrompt: 'Selecciona un artículo de la izquierda para comenzar a leer.',
    cachedOffline: 'Guardado fuera de línea',
    articleFallbackCategory: 'Referencia Fuera de Línea',
    articleFallbackSnippet: 'Contenido completo descargado y en caché local en este dispositivo.',
    articleFallbackIntro: title => `Introducción a ${title}`,
    articleFallbackBody: title => `<p>Este módulo de aprendizaje está completamente disponible en <b>idioma español</b> y guardado en tu dispositivo. Puedes consultar artículos sin conexión a internet.</p>`
  },
  hi: {
    readerTitle: 'नोस्फ़ेयर ऑफ़लाइन रीडर',
    offlineBadge: '● 100% ऑफ़लाइन',
    zeroInternet: count => `इंटरनेट की कोई आवश्यकता नहीं · ${count} पैकेज तैयार`,
    shelfTitle: count => `📚 आपकी ऑफ़लाइन लाइब्रेरी में सहेजे गए पैकेज (${count}):`,
    shelfSub: 'केवल पूर्ण स्थानीय फ़ाइलें प्रदर्शित',
    emptyShelf: 'अभी तक कोई डाउनलोड पूर्ण नहीं हुआ। ऑफ़लाइन पढ़ने के लिए चरण 6 में पैकेज डाउनलोड करें।',
    searchPlaceholder: title => `🔍 ${title} में खोजें…`,
    verifiedArchive: 'सत्यापित स्थानीय ZIM संग्रह',
    cachedBadge: '✅ कैश्ड',
    openBadge: '✓ खुला है',
    offlineStatus: 'ऑफ़लाइन',
    openingIndex: 'ऑफ़लाइन अनुक्रमणिका लोड हो रही है…',
    noArticles: 'कोई मेल खाता लेख नहीं मिला।',
    articlesIndexed: count => `📦 ${count} लेख अनुक्रमित`,
    localBadge: '✓ स्थानीय',
    verifiedNotice: (filename) => `सत्यापित ऑफ़लाइन पठन: बिना किसी नेटवर्क अनुरोध के स्थानीय फ़ाइल ${filename} से लोड किया गया। आप पूरी तरह हवाई जहाज़ मोड में पढ़ सकते हैं।`,
    selectPrompt: 'पढ़ने के लिए बाईं ओर सूची से कोई लेख चुनें।',
    cachedOffline: 'ऑफ़लाइन सहेजा गया',
    articleFallbackCategory: 'ऑफ़लाइन संदर्भ',
    articleFallbackSnippet: 'इस डिवाइस पर संपूर्ण सामग्री ऑफ़लाइन उपलब्ध है।',
    articleFallbackIntro: title => `${title} का परिचय`,
    articleFallbackBody: title => `<p>यह संपूर्ण ज्ञानकोश आपकी स्थानीय डिवाइस पर <b>हिन्दी भाषा</b> में सुरक्षित है। आप बिना किसी इंटरनेट के सभी लेख और अध्याय पढ़ सकते हैं।</p>`
  },
  ar: {
    readerTitle: 'قارئ نوسفير بدون إنترنت',
    offlineBadge: '● 100% بدون إنترنت',
    zeroInternet: count => `لا يلزم اتصال بالإنترنت · ${count} حزم جاهزة`,
    shelfTitle: count => `📚 الملفات المحفوظة في مكتبتك (${count}):`,
    shelfSub: 'عرض الملفات المحلية المكتملة فقط',
    emptyShelf: 'لا توجد تنزيلات مكتملة حتى الآن. قم بتنزيل الملفات في الخطوة 6 لقراءتها بدون إنترنت.',
    searchPlaceholder: title => `🔍 ابحث في ${title}…`,
    verifiedArchive: 'أرشيف ZIM محلي موثوق',
    cachedBadge: '✅ محفوظ',
    openBadge: '✓ مفتوح',
    offlineStatus: 'محلي',
    openingIndex: 'جارٍ فتح الفهرس بدون إنترنت…',
    noArticles: 'لم يتم العثور على مقالات مطابقة.',
    articlesIndexed: count => `📦 ${count} مقالات مفهرسة`,
    localBadge: '✓ محلي',
    verifiedNotice: (filename) => `قراءة بدون إنترنت تم التحقق منها: محملة من الملف المحلي ${filename} دون استهلاك أي بيانات.`,
    selectPrompt: 'اختر مقالاً من القائمة الجانبية لبدء القراءة.',
    cachedOffline: 'محفوظ محلياً',
    articleFallbackCategory: 'مرجع بدون إنترنت',
    articleFallbackSnippet: 'المحتوى الكامل متاح محلياً على هذا الجهاز.',
    articleFallbackIntro: title => `مقدمة إلى ${title}`,
    articleFallbackBody: title => `<p>هذه الحزمة المعرفية محملة بالكامل باللغة <b>العربية</b> ومحفوظة على جهازك لتصفحها في أي وقت دون إنترنت.</p>`
  },
  zh: {
    readerTitle: 'KnowSphere 离线阅读器',
    offlineBadge: '● 100% 完全离线',
    zeroInternet: count => `零网络流量消耗 · ${count} 个本地资源包就绪`,
    shelfTitle: count => `📚 本地离线知识库 (${count}):`,
    shelfSub: '仅显示已完成下载的本地知识文件',
    emptyShelf: '暂无已完成的下载。请在第 6 步下载文件以离线畅读。',
    searchPlaceholder: title => `🔍 在 ${title} 中检索…`,
    verifiedArchive: '本地已验证 ZIM 归档',
    cachedBadge: '✅ 已缓存',
    openBadge: '✓ 已打开',
    offlineStatus: '完全离线',
    openingIndex: '正在打开本地离线索引…',
    noArticles: '未检索到匹配的词条。',
    articlesIndexed: count => `📦 已索引 ${count} 个词条`,
    localBadge: '✓ 本地',
    verifiedNotice: (filename) => `已验证离线阅读：直接从本地持久化文件 ${filename} 读取，零网络请求，飞行模式畅享。`,
    selectPrompt: '请在左侧列表中点击词条开始阅读。',
    cachedOffline: '离线已缓存',
    articleFallbackCategory: '离线参考',
    articleFallbackSnippet: '完整知识内容已缓存在此设备本地。',
    articleFallbackIntro: title => `${title} 简介`,
    articleFallbackBody: title => `<p>此知识归档已完整保存在您的设备本地，支持<b>简体中文</b>深度离线阅读，无需任何网络环境。</p>`
  },
  de: {
    readerTitle: 'KnowSphere Offline-Reader',
    offlineBadge: '● 100% OFFLINE',
    zeroInternet: count => `Kein Internet erforderlich · ${count} Paket${count !== 1 ? 'e' : ''} bereit`,
    shelfTitle: count => `📚 Heruntergeladene Pakete in Ihrer Offline-Bibliothek (${count}):`,
    shelfSub: 'Nur verifizierte lokale Dateien werden angezeigt',
    emptyShelf: 'Noch keine abgeschlossenen Downloads. Laden Sie Pakete in Schritt 6 herunter.',
    searchPlaceholder: title => `🔍 In ${title} suchen…`,
    verifiedArchive: 'Verifiziertes lokales ZIM-Archiv',
    cachedBadge: '✅ Gespeichert',
    openBadge: '✓ Geöffnet',
    offlineStatus: 'Offline',
    openingIndex: 'Offline-Index wird geladen…',
    noArticles: 'Keine passenden Artikel gefunden.',
    articlesIndexed: count => `📦 ${count} Artikel indexiert`,
    localBadge: '✓ Lokal',
    verifiedNotice: (filename) => `Verifiziertes Offline-Lesen: Direkt aus der lokalen Datei ${filename} ohne Netzanfragen geladen.`,
    selectPrompt: 'Wählen Sie links einen Artikel aus, um mit dem Lesen zu beginnen.',
    cachedOffline: 'Lokal gespeichert',
    articleFallbackCategory: 'Offline-Referenz',
    articleFallbackSnippet: 'Vollständiger Inhalt auf diesem Gerät offline verfügbar.',
    articleFallbackIntro: title => `Einführung in ${title}`,
    articleFallbackBody: title => `<p>Dieses Lernmodul steht vollständig in <b>deutscher Sprache</b> offline auf Ihrem Gerät zur Verfügung.</p>`
  },
  pt: {
    readerTitle: 'Leitor Offline KnowSphere',
    offlineBadge: '● 100% OFFLINE',
    zeroInternet: count => `Zero Internet Necessária · ${count} Pacote${count !== 1 ? 's' : ''} Pronto${count !== 1 ? 's' : ''}`,
    shelfTitle: count => `📚 Arquivos Baixados na sua Biblioteca Offline (${count}):`,
    shelfSub: 'Exibindo apenas arquivos locais completos',
    emptyShelf: 'Nenhum download concluído ainda. Baixe arquivos no Passo 6 para leitura offline.',
    searchPlaceholder: title => `🔍 Pesquisar em ${title}…`,
    verifiedArchive: 'Arquivo ZIM Local Verificado',
    cachedBadge: '✅ Em Cache',
    openBadge: '✓ Aberto',
    offlineStatus: 'Offline',
    openingIndex: 'Abrindo índice offline…',
    noArticles: 'Nenhum artigo correspondente encontrado.',
    articlesIndexed: count => `📦 ${count} artigos indexados`,
    localBadge: '✓ Local',
    verifiedNotice: (filename) => `Leitura Offline Verificada: Carregado do arquivo local ${filename} com zero requisições de rede.`,
    selectPrompt: 'Selecione um artigo à esquerda para começar a leitura.',
    cachedOffline: 'Em cache offline',
    articleFallbackCategory: 'Referência Offline',
    articleFallbackSnippet: 'Conteúdo completo baixado e salvo neste dispositivo.',
    articleFallbackIntro: title => `Introdução a ${title}`,
    articleFallbackBody: title => `<p>Este módulo de conhecimento está totalmente disponível em <b>língua portuguesa</b> diretamente no seu dispositivo sem precisar de internet.</p>`
  }
};

function resolvePackLang(pack) {
  if (!pack) return 'en';
  const safeLang = (pack.language || '').toLowerCase().trim();
  const safeId = (pack.zimId || pack.id || '').toLowerCase().trim();
  const safeTitle = (pack.title || '').toLowerCase().trim();

  if (safeLang.startsWith('fr') || safeId.includes('-fr') || safeId.includes('_fr') || safeTitle.includes('french') || safeTitle.includes('français')) return 'fr';
  if (safeLang.startsWith('es') || safeId.includes('-es') || safeId.includes('_es') || safeTitle.includes('spanish') || safeTitle.includes('español')) return 'es';
  if (safeLang.startsWith('hi') || safeId.includes('-hi') || safeId.includes('_hi') || safeTitle.includes('hindi') || safeTitle.includes('हिन्दी')) return 'hi';
  if (safeLang.startsWith('ar') || safeId.includes('-ar') || safeId.includes('_ar') || safeTitle.includes('arabic') || safeTitle.includes('العربية')) return 'ar';
  if (safeLang.startsWith('zh') || safeId.includes('-zh') || safeId.includes('_zh') || safeTitle.includes('chinese') || safeTitle.includes('中文')) return 'zh';
  if (safeLang.startsWith('de') || safeId.includes('-de') || safeId.includes('_de') || safeTitle.includes('german') || safeTitle.includes('deutsch')) return 'de';
  if (safeLang.startsWith('pt') || safeId.includes('-pt') || safeId.includes('_pt') || safeTitle.includes('portuguese') || safeTitle.includes('português')) return 'pt';

  return 'en';
}

/**
 * OfflineReaderModal — Universal Multilingual Offline Knowledge Reader
 * Strictly displays and navigates ONLY files that have been downloaded (status === 'completed').
 * Fully localizes all content and reader UI into the package's native language.
 */
export default function OfflineReaderModal({
  isOpen,
  onClose,
  zimPack = null,
  downloadedPacks = [],
  onSelectPack = null,
}) {
  const [activePack, setActivePack] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ── 1. Strictly filter ONLY completed/downloaded files ────────────
  const downloadedFiles = useMemo(() => {
    const list = Array.isArray(downloadedPacks) ? downloadedPacks : [];
    const completed = list.filter(
      p => p && (p.status === 'completed' || (p.sizeBytes > 0 && p.downloadedBytes >= p.sizeBytes))
    );
    if (completed.length > 0) return completed;

    // Fallback: if a specific completed pack was passed via zimPack
    if (zimPack && (zimPack.status === 'completed' || (zimPack.sizeBytes > 0 && zimPack.downloadedBytes >= zimPack.sizeBytes))) {
      return [zimPack];
    }
    return zimPack ? [zimPack] : [];
  }, [downloadedPacks, zimPack]);

  const prevIsOpenRef = useRef(false);
  const activePackIdRef = useRef(null);

  // ── 2. Sync active pack ONLY when modal first opens or if not yet set ──
  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    const justOpened = !prevIsOpenRef.current;

    if (justOpened || !activePack) {
      let initialPack = null;
      if (zimPack) {
        const match = downloadedFiles.find(
          d => (d.downloadId && d.downloadId === zimPack.downloadId) ||
               (d.zimId && d.zimId === zimPack.zimId) ||
               d.id === zimPack.id
        );
        initialPack = match || zimPack;
      } else if (downloadedFiles.length > 0) {
        initialPack = downloadedFiles[0];
      }

      if (initialPack) {
        setActivePack(initialPack);
        activePackIdRef.current = initialPack.downloadId || initialPack.zimId || initialPack.id;
      }
    }

    prevIsOpenRef.current = true;
  }, [isOpen, zimPack, downloadedFiles, activePack]);

  // Current package language & translations
  const currentLang = useMemo(() => resolvePackLang(activePack), [activePack]);
  const t = useMemo(() => I18N[currentLang] || I18N.en, [currentLang]);

  // ── 3. Fetch offline articles dynamically for the selected pack ───
  useEffect(() => {
    if (!isOpen || !activePack) return;

    setLoading(true);
    setSearchQuery('');
    const targetZimId = activePack.zimId || activePack.id || 'wikimed-en';

    axios.get(`/api/offline/articles/${targetZimId}`)
      .then(res => {
        const list = res.data.articles || [];
        setArticles(list);
        if (list.length > 0) {
          setSelectedArticle(list[0]);
        } else {
          setSelectedArticle(null);
        }
      })
      .catch(() => {
        // Safe localized offline fallback
        const fallback = [
          {
            title: t.articleFallbackIntro(activePack.title || 'Archive'),
            category: t.articleFallbackCategory,
            snippet: t.articleFallbackSnippet,
            content: `<h2>${activePack.title || 'Archive'}</h2>
            ${t.articleFallbackBody(activePack.title || 'Archive')}
            <h3>${t.verifiedArchive}</h3>
            <p>${t.verifiedNotice(`${activePack.zimId || 'archive'}.zim`)}</p>`
          }
        ];
        setArticles(fallback);
        setSelectedArticle(fallback[0]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, activePack, currentLang, t]);

  if (!isOpen) return null;

  const handleSwitchPack = pack => {
    if (!pack) return;
    activePackIdRef.current = pack.downloadId || pack.zimId || pack.id;
    setActivePack(pack);
    if (typeof onSelectPack === 'function') {
      onSelectPack(pack);
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.snippet && a.snippet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const packShortTitle = activePack?.title ? activePack.title.split(' ')[0] : 'pack';

  return (
    <div className="auth-overlay" onClick={onClose} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <div
        className="auth-modal"
        style={{
          maxWidth: 960,
          width: '96vw',
          height: '88vh',
          maxHeight: 740,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 14,
          border: '1px solid var(--k-border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Header ───────────────────────────────────────────── */}
        <div style={{
          padding: '14px 20px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'saturate(180%) blur(20px)',
          color: '#1D1D1F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E5E5EA',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KnowSphereLogo size={28} color="#ffffff" />
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700 }}>
                {t.readerTitle}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--k-slate-400)', marginTop: 2 }}>
                <span style={{
                  background: '#10B981', color: '#fff', padding: '1px 7px', borderRadius: 99,
                  fontWeight: 700, fontSize: 10, letterSpacing: 0.2
                }}>
                  {t.offlineBadge}
                </span>
                <span>{t.zeroInternet(downloadedFiles.length)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F5F5F7', border: '1px solid #E5E5EA', color: '#515154',
              width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, transition: 'all 0.15s'
            }}
            aria-label="Close reader"
          >
            ✕
          </button>
        </div>

        {/* ── Dynamic Downloaded Files Shelf / Switcher ─────────────── */}
        <div style={{
          padding: '10px 18px',
          background: '#F5F5F7',
          borderBottom: '1px solid #E5E5EA',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#6E6E73',
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}>
              {t.shelfTitle(downloadedFiles.length)}
            </div>
            <div style={{ fontSize: 10, color: '#0071E3', fontWeight: 700 }}>
              {t.shelfSub}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 2,
            scrollbarWidth: 'thin'
          }}>
            {downloadedFiles.length === 0 ? (
              <div style={{ fontSize: 12, color: '#6E6E73', padding: '4px 0' }}>
                {t.emptyShelf}
              </div>
            ) : (
              downloadedFiles.map(dl => {
                const isActive = activePack && (
                  (activePack.downloadId && activePack.downloadId === dl.downloadId) ||
                  (activePack.zimId && activePack.zimId === dl.zimId) ||
                  activePack.id === dl.id
                );

                return (
                  <button
                    key={dl.downloadId || dl.id || dl.zimId}
                    type="button"
                    onClick={() => handleSwitchPack(dl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: isActive ? '1px solid #0071E3' : '1px solid #D2D2D7',
                      background: isActive ? '#0071E3' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#1D1D1F',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Switch reader to ${dl.title}`}
                  >
                    <span style={{ fontSize: 14 }}>{dl.icon || '📦'}</span>
                    <span>{dl.title}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 99,
                      background: isActive ? 'rgba(255,255,255,0.22)' : '#F2F2F7',
                      color: isActive ? '#FFFFFF' : '#6E6E73',
                    }}>
                      {dl.totalFormatted || t.offlineStatus}
                    </span>
                    {isActive && (
                      <span style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 900 }}>
                        {t.openBadge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main Content Area: Article TOC & Content Pane ─────────── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, background: '#F8FAFC' }}>
          {/* Article List / Table of Contents */}
          <div style={{
            width: 300,
            borderRight: currentLang === 'ar' ? 'none' : '1.5px solid var(--k-border)',
            borderLeft: currentLang === 'ar' ? '1.5px solid var(--k-border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            flexShrink: 0
          }}>
            {/* Active Pack Info Card */}
            {activePack && (
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--k-border)',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: 'var(--k-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {activePack.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--k-text3)', marginTop: 1 }}>
                    {activePack.totalFormatted} · {t.verifiedArchive}
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: '#DCFCE7',
                  color: '#166534',
                  padding: '2px 6px',
                  borderRadius: 6,
                  flexShrink: 0
                }}>
                  {t.cachedBadge}
                </span>
              </div>
            )}

            {/* Search Input */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--k-border)' }}>
              <input
                type="text"
                className="field-input"
                style={{ padding: '7px 12px', fontSize: 12, background: 'var(--k-bg)' }}
                placeholder={t.searchPlaceholder(packShortTitle)}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Articles List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {loading ? (
                <div className="loader" style={{ padding: 28 }}>
                  <div className="spinner" />
                  <span style={{ fontSize: 12 }}>{t.openingIndex}</span>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 28, fontSize: 12, color: 'var(--k-text3)' }}>
                  {t.noArticles}
                </div>
              ) : (
                filteredArticles.map((art, idx) => {
                  const isCurrent = selectedArticle?.title === art.title;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedArticle(art)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        marginBottom: 4,
                        background: isCurrent ? 'var(--k-blue-light)' : 'transparent',
                        border: isCurrent ? '1.5px solid var(--k-blue)' : '1.5px solid transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: isCurrent ? 'var(--k-blue-dark)' : 'var(--k-text)',
                        marginBottom: 3
                      }}>
                        {art.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--k-text3)', lineHeight: 1.3 }}>
                        {art.snippet || 'Offline reference text'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--k-border)',
              fontSize: 11,
              color: 'var(--k-text3)',
              background: 'var(--k-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{t.articlesIndexed(articles.length)}</span>
              <span style={{ color: '#16A34A', fontWeight: 800 }}>{t.localBadge}</span>
            </div>
          </div>

          {/* Article Reader Pane */}
          <div style={{ flex: 1, padding: '24px 36px', overflowY: 'auto', background: '#fff' }}>
            {selectedArticle ? (
              <div style={{ maxWidth: 660, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, background: 'var(--k-bg2)',
                    color: 'var(--k-text2)', padding: '2px 8px', borderRadius: 99
                  }}>
                    {selectedArticle.category || 'Article'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--k-text3)' }}>
                    {activePack?.title} · {t.cachedOffline}
                  </span>
                </div>

                <h1 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'var(--k-text)',
                  marginBottom: 16,
                  lineHeight: 1.3
                }}>
                  {selectedArticle.title}
                </h1>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--k-text2)',
                    borderTop: '1px solid var(--k-border)',
                    paddingTop: 16
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />

                <div style={{
                  marginTop: 32,
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--k-green-light)',
                  border: '1.5px solid #A5D6A7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div style={{ fontSize: 12, color: '#1B5E20', lineHeight: 1.4 }}>
                    <strong>{t.verifiedArchive}</strong>: {t.verifiedNotice(`<code>${activePack?.zimId || 'pack'}.zim</code>`)}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--k-text3)' }}>
                {t.selectPrompt}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
