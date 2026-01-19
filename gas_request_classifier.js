/**
 * RequestTypeClassifier.gs - Classificazione Tecnica/Pastorale/Mista
 * 
 * TIPI RICHIESTA:
 * - TECHNICAL: domande procedurali ("si può", "quanti", "quando")
 * - PASTORAL: coinvolgimento personale ("mi sento", emozioni, ferite)
 * - MIXED: entrambi gli aspetti
 * - DOCTRINAL: richieste spiegazione teologica/dottrinale
 * 
 * LOGICA ATTIVAZIONE KB:
 * - AI-Core Lite: Solo quando needsDiscernment || needsDoctrine
 * - AI-Core: Solo quando needsDiscernment = true
 * - Dottrina: Solo quando needsDoctrine = true
 */
class RequestTypeClassifier {
  constructor() {
    console.log('📊 Inizializzazione RequestTypeClassifier...');

    // ========================================================================
    // INDICATORI TECNICI
    // Domande procedurali, normative, su numeri, condizioni formali
    // ========================================================================
    this.TECHNICAL_INDICATORS = [
      // Possibilità/obbligo (peso 2)
      { pattern: /\bsi può\b/i, weight: 2 },
      { pattern: /\bnon si può\b/i, weight: 2 },
      { pattern: /\bè possibile\b/i, weight: 2 },
      { pattern: /\bè obbligatorio\b/i, weight: 2 },
      { pattern: /\bbisogna\b/i, weight: 2 },
      { pattern: /\bdeve\b/i, weight: 1 },
      { pattern: /\bdevono\b/i, weight: 1 },

      // Domande su numeri/quantità (peso 2)
      { pattern: /\bquanti\b/i, weight: 2 },
      { pattern: /\bquante\b/i, weight: 2 },
      { pattern: /\bquanto costa\b/i, weight: 2 },

      // Domande temporali (peso 1-2)
      { pattern: /\bquando\b/i, weight: 1 },
      { pattern: /\ba che ora\b/i, weight: 2 },
      { pattern: /\borari\b/i, weight: 2 },

      // Domande procedurali (peso 2)
      { pattern: /\bcome (?:si )?fa\b/i, weight: 2 },
      { pattern: /\bcome funziona\b/i, weight: 2 },
      { pattern: /\bqual è la procedura\b/i, weight: 2 },
      { pattern: /\bche documenti?\b/i, weight: 2 },

      // Riferimenti a ruoli formali (peso 1-2)
      { pattern: /\bpadrino\b/i, weight: 1 },
      { pattern: /\bmadrina\b/i, weight: 1 },
      { pattern: /\btestimone\b/i, weight: 1 },
      { pattern: /\bcertificato\b/i, weight: 2 },
      { pattern: /\bdocument\w+\b/i, weight: 1 },
      { pattern: /\bmodulo\b/i, weight: 1 },
      { pattern: /\biscrizione\b/i, weight: 1 }
    ];

    // ========================================================================
    // INDICATORI PASTORALI
    // Prima persona, emozioni, situazioni di vita, richieste di senso
    // ========================================================================
    this.PASTORAL_INDICATORS = [
      // Prima persona emotiva (peso 3)
      { pattern: /\bmi sento\b/i, weight: 3 },
      { pattern: /\bmi pesa\b/i, weight: 3 },
      { pattern: /\bmi sono sentit[oa]\b/i, weight: 3 },
      { pattern: /\bnon mi sento\b/i, weight: 3 },

      // Emozioni (peso 2)
      { pattern: /\bsoffr\w+\b/i, weight: 2 },
      { pattern: /\bdifficolt[àa]\b/i, weight: 2 },
      { pattern: /\bferit[oa]\b/i, weight: 2 },
      { pattern: /\besclus[oa]\b/i, weight: 2 },
      { pattern: /\bsol[oa]\b/i, weight: 2 },
      { pattern: /\bpaura\b/i, weight: 2 },
      { pattern: /\bansia\b/i, weight: 2 },
      { pattern: /\btristezza\b/i, weight: 2 },
      { pattern: /\bcolpa\b/i, weight: 2 },
      { pattern: /\bvergogna\b/i, weight: 2 },

      // Incomprensione (peso 2)
      { pattern: /\bnon capisco\b/i, weight: 2 },
      { pattern: /\bnon riesco a capire\b/i, weight: 2 },

      // Situazioni di vita complesse - ITALIANO (peso 2)
      { pattern: /\bdivorziat[oa]\b/i, weight: 2 },
      { pattern: /\bseparat[oa]\b/i, weight: 2 },
      { pattern: /\brisposat[oa]\b/i, weight: 2 },
      { pattern: /\bconvivente\b/i, weight: 2 },
      { pattern: /\blutto\b/i, weight: 2 },
      { pattern: /\bdefunt[oa]\b/i, weight: 2 },
      { pattern: /\bmalattia\b/i, weight: 2 },

      // Situazioni di vita complesse - ENGLISH (peso 2)
      { pattern: /\bdivorced\b/i, weight: 2 },
      { pattern: /\bseparated\b/i, weight: 2 },
      { pattern: /\bremarried\b/i, weight: 2 },
      { pattern: /\bcohabiting\b/i, weight: 2 },
      { pattern: /\banglican\b/i, weight: 2 },
      { pattern: /\bprotestant\b/i, weight: 2 },
      { pattern: /\bprevious marriage\b/i, weight: 2 },

      // Richieste di senso (peso 3)
      { pattern: /\bperché la chiesa\b/i, weight: 3 },
      { pattern: /\bperché dio\b/i, weight: 3 },
      { pattern: /\bche senso ha\b/i, weight: 3 },
      { pattern: /\bcome vivere\b/i, weight: 3 },
      { pattern: /\bcome affrontare\b/i, weight: 2 }
    ];

    // ========================================================================
    // INDICATORI DOTTRINALI ESPLICITI
    // ========================================================================
    this.DOCTRINE_INDICATORS = [
      { pattern: /\bspiegazione\b/i, weight: 2 },
      { pattern: /\bspiegami\b/i, weight: 2 },
      { pattern: /\bperché la chiesa (?:insegna|dice|crede)\b/i, weight: 3 },
      { pattern: /\bfondamento teologic\w+\b/i, weight: 3 },
      { pattern: /\bdottrina\b/i, weight: 2 },
      { pattern: /\bmagistero\b/i, weight: 3 },
      { pattern: /\bcatechismo\b/i, weight: 2 },
      { pattern: /\binsegnamento della chiesa\b/i, weight: 3 }
    ];

    console.log('✓ RequestTypeClassifier inizializzato');
  }

  /**
   * Classifica la richiesta email
   * Supporta override da classificazione Gemini (approccio ibrido)
   */
  classify(subject, body, externalHint = null) {
    // Smart Truncation (primi 1500 + ultimi 1500 caratteri)
    const MAX_ANALYSIS_LENGTH = 3000;
    const fullText = `${subject} ${body}`;
    const text = fullText.length > MAX_ANALYSIS_LENGTH
      ? (
        fullText.substring(0, 1500) +
        ' ... ' +
        fullText.substring(fullText.length - 1500)
      ).toLowerCase()
      : fullText.toLowerCase();

    // Calcola punteggi
    const technicalResult = this._calculateScore(text, this.TECHNICAL_INDICATORS);
    const pastoralResult = this._calculateScore(text, this.PASTORAL_INDICATORS);
    const doctrineResult = this._calculateScore(text, this.DOCTRINE_INDICATORS);

    const technicalScore = technicalResult.score;
    const pastoralScore = pastoralResult.score;
    const doctrineScore = doctrineResult.score;

    // Determina tipo (Logica Ibrida)
    let requestType = 'technical';
    let source = 'regex';

    if (externalHint && externalHint.category && externalHint.confidence >= 0.75) {
      // Usa classificazione Gemini se disponibile e confidente
      requestType = externalHint.category.toLowerCase();
      source = 'gemini';
      console.log(`   🤖 Classificatore ibrido: Usato risultato Gemini (${requestType.toUpperCase()}, conf=${externalHint.confidence})`);
    } else {
      // Fallback a Regex
      if (doctrineScore >= 3) {
        requestType = 'doctrinal';
      } else if (pastoralScore >= 3 && pastoralScore > technicalScore) {
        requestType = 'pastoral';
      } else if (technicalScore >= 2 && pastoralScore <= 1) {
        requestType = 'technical';
      } else if (pastoralScore >= 2 && technicalScore >= 2) {
        requestType = 'mixed';
      } else {
        requestType = 'technical';
      }
      source = 'regex';
    }

    // Flag di attivazione
    const needsDiscernment = requestType === 'pastoral' || requestType === 'mixed';
    const needsDoctrine = requestType === 'doctrinal' || (doctrineScore >= 2 && requestType !== 'technical');

    const result = {
      type: requestType,
      source: source,
      technicalScore: technicalScore,
      pastoralScore: pastoralScore,
      doctrineScore: doctrineScore,
      needsDiscernment: needsDiscernment,
      needsDoctrine: needsDoctrine,
      detectedIndicators: [
        ...technicalResult.matched,
        ...pastoralResult.matched,
        ...doctrineResult.matched
      ]
    };

    console.log(`   📊 Classificazione richiesta: ${requestType.toUpperCase()} (Fonte: ${source})`);
    if (source === 'regex') {
      console.log(`      Tech=${technicalScore}, Pastor=${pastoralScore}, Dottr=${doctrineScore}`);
    }
    console.log(`      Discernimento=${needsDiscernment}, Dottrina=${needsDoctrine}`);

    return result;
  }

  /**
   * Calcola punteggio ponderato per set di indicatori
   */
  _calculateScore(text, indicators) {
    let total = 0;
    const matched = [];

    for (const indicator of indicators) {
      const matches = text.match(indicator.pattern);
      if (matches) {
        total += indicator.weight * matches.length;
        matched.push(indicator.pattern.source);
      }
    }

    return { score: total, matched: matched };
  }

  /**
   * Ottiene suggerimento tipo richiesta per iniezione nel prompt
   */
  getRequestTypeHint(requestType) {
    if (requestType === 'technical') {
      return `
🎯 TIPO RICHIESTA RILEVATO: TECNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Linee guida per la risposta:
- Rispondi in modo CHIARO e BREVE
- Fornisci l'informazione richiesta direttamente
- Non eccedere in empatia o moralizzazione
- Evita lunghe introduzioni emotive

📖 REGOLA DOTTRINALE (GAS-02):
Se il contenuto richiesto è dottrinale o canonico generale
e NON coinvolge una situazione personale o discernimento,
SPIEGA direttamente l'insegnamento della Chiesa.
NON rimandare al sacerdote per domande informative.
Il rinvio è riservato SOLO ai casi di discernimento personale.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (requestType === 'pastoral') {
      return `
🎯 TIPO RICHIESTA RILEVATO: PASTORALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Linee guida per la risposta:
- Rispondi in modo ACCOGLIENTE e PERSONALE
- Riconosci la situazione/sentimento espresso
- Accompagna la persona, non giudicare
- Non fermarti solo alla norma
- Invita al dialogo personale se opportuno
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (requestType === 'mixed') {
      return `
🎯 TIPO RICHIESTA RILEVATO: MISTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Linee guida per la risposta:
- Rispondi TECNICAMENTE (chiarezza) ma con TONO pastorale
- Non fermarti alla sola regola
- Non scivolare nel permissivismo
- Bilancia informazione e accoglienza
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    } else if (requestType === 'doctrinal') {
      return `
🎯 TIPO RICHIESTA RILEVATO: DOTTRINALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Linee guida per la risposta:
- RISPONDI DIRETTAMENTE alle domande di fede
- Spiega la dottrina in modo chiaro e accessibile
- Usa fonti: Catechismo, Magistero, Scrittura
- NON rimandare al sacerdote per domande informative

📖 REGOLA DOTTRINALE (GAS-02):
Questa è una richiesta di SPIEGAZIONE dottrinale generale.
✅ DEVI: Spiegare l'insegnamento della Chiesa
✅ DEVI: Essere chiaro, fedele, informativo
❌ NON: Rimandare al sacerdote per domande teoriche
❌ NON: Evitare di rispondere per "prudenza"

Il rinvio al sacerdote è riservato SOLO a:
- Situazioni personali concrete
- Discernimento su stati di vita
- Accompagnamento spirituale individuale
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    // Fallback predefinito
    return '';
  }
}

// Funzione factory
function createRequestTypeClassifier() {
  return new RequestTypeClassifier();
}