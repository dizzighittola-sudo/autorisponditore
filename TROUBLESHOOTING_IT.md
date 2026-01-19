# 🔧 Troubleshooting - Risoluzione Problemi

> **Guida completa per risolvere i problemi più comuni del sistema**

---

## 🚨 Problemi Critici (Blocco Totale)

### 1. Sistema Non Elabora NESSUNA Email

**Sintomi:**
- Nessuna etichetta "IA" applicata
- Nessuna email in "Verifica" o "Errore"
- Inbox piena di email non lette

**Diagnosi:**

```javascript
function diagnoseNoProcessing() {
  console.log('🔍 DIAGNOSI: Nessuna elaborazione');
  
  // 1. Trigger attivo?
  const triggers = ScriptApp.getProjectTriggers();
  const mainTrigger = triggers.find(t => t.getHandlerFunction() === 'main');
  
  if (!mainTrigger) {
    console.error('❌ Trigger "main" NON trovato!');
    console.log('Soluzione: Esegui setupTrigger()');
    return;
  }
  
  console.log('✓ Trigger attivo');
  
  // 2. Ultime esecuzioni?
  console.log('\nControlla manualmente:');
  console.log('Apps Script → Esecuzioni → Guarda se "main" è stato eseguito');
  
  // 3. Orario sospensione?
  if (isInSuspensionTime()) {
    console.warn('⚠️ SIAMO IN ORARIO DI SOSPENSIONE');
    console.log('Il sistema riprenderà fuori orari ufficio');
    return;
  }
  
  console.log('✓ Non in sospensione');
  
  // 4. Email non lette presenti?
  const unread = GmailApp.getInboxThreads(0, 5);
  console.log(`\n📬 Email non lette: ${unread.filter(t => t.isUnread()).length}`);
}
```

**Soluzioni:**

| Causa | Soluzione |
|-------|-----------|
| Trigger mancante | Esegui `setupTrigger()` |
| Trigger disabilitato | Apps Script → Trigger → Abilita |
| Autorizzazioni scadute | Re-esegui `setupTrigger()` e autorizza |
| Orario sospensione | Attendi fine orario ufficio o modifica SUSPENSION_HOURS |
| Script bloccato | Controlla "Esecuzioni" per errori |

---

### 2. Errore "API Key Non Valida"

**Sintomo:**
```
Error: 401 Unauthorized - GEMINI_API_KEY invalid
```

**Diagnosi:**

```javascript
function testApiKey() {
  const apiKey = PropertiesService.getScriptProperties()
    .getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    console.error('❌ API Key NON configurata!');
    return;
  }
  
  console.log('API Key presente:', apiKey.substring(0, 10) + '...');
  
  // Test connessione
  const gemini = new GeminiService();
  const test = gemini.testConnection();
  
  if (test.connectionOk) {
    console.log('✓ API Key VALIDA');
  } else {
    console.error('❌ API Key INVALIDA');
    console.log('Errori:', test.errors);
  }
}
```

**Soluzioni:**

1. **Verifica API Key:**
   - Vai su: https://aistudio.google.com/apikey
   - Controlla che la chiave esista e sia attiva
   - Se invalida, genera nuova chiave

2. **Re-configura in Script Properties:**
   ```
   Apps Script → ⚙️ Impostazioni Progetto
   → Script Properties
   → Modifica "GEMINI_API_KEY"
   → Incolla nuova chiave
   ```

3. **Verifica quota non esaurita:**
   - Vai su: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Controlla quota giornaliera

---

### 3. Errore "Spreadsheet Non Trovato"

**Sintomo:**
```
Error: Cannot find spreadsheet with ID: 1ABC...
```

**Diagnosi:**

```javascript
function testSpreadsheetAccess() {
  const sheetId = CONFIG.SPREADSHEET_ID;
  
  if (!sheetId || sheetId.includes('YOUR_')) {
    console.error('❌ SPREADSHEET_ID non configurato!');
    console.log('Vai in gas_config.js e sostituisci YOUR_SPREADSHEET_ID_HERE');
    return;
  }
  
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    console.log('✓ Spreadsheet accessibile:', ss.getName());
    
    // Verifica fogli
    const sheets = {
      'Istruzioni': ss.getSheetByName('Istruzioni'),
      'AI_CORE_LITE': ss.getSheetByName('AI_CORE_LITE'),
      'AI_CORE': ss.getSheetByName('AI_CORE'),
      'Dottrina': ss.getSheetByName('Dottrina')
    };
    
    for (const [name, sheet] of Object.entries(sheets)) {
      if (!sheet) {
        console.error(`❌ Foglio "${name}" mancante!`);
      } else {
        console.log(`✓ Foglio "${name}" presente`);
      }
    }
    
  } catch (e) {
    console.error('❌ Errore accesso spreadsheet:', e.message);
  }
}
```

**Soluzioni:**

1. **Verifica ID corretto:**
   - Apri il foglio Google
   - URL: `https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit`
   - La parte `1ABC...XYZ` è l'ID

2. **Verifica permessi:**
   - Foglio deve essere condiviso con l'account Gmail della parrocchia
   - Permesso minimo: "Editor"

3. **Verifica fogli esistono:**
   - Devono esistere: Istruzioni, AI_CORE_LITE, AI_CORE, Dottrina

---

## ⚠️ Problemi Frequenti

### 4. Troppe Email Marcate "Verifica"

**Sintomo:**
- >30% delle email finiscono in "Verifica"
- Anche email semplici richiedono revisione

**Causa:**
Soglia validazione troppo alta

**Diagnosi:**

```javascript
function analyzeValidationScores() {
  const verifyLabel = GmailApp.getUserLabelByName('Verifica');
  if (!verifyLabel) {
    console.log('Nessuna email in Verifica');
    return;
  }
  
  const threads = verifyLabel.getThreads(0, 20);
  console.log(`\n📊 Analisi ${threads.length} email in Verifica:`);
  console.log('Controlla i log delle esecuzioni per vedere i validation scores');
  console.log('\nCerca righe tipo: "Validazione FALLITA (punteggio: 0.XX)"');
}
```

**Soluzioni:**

**Temporanea (test):**
```javascript
// In gas_config.js
CONFIG.VALIDATION_MIN_SCORE = 0.5;  // Era 0.6 (abbassato)
```

**Permanente:**
1. Analizza gli errori comuni nei log
2. Se errori su:
   - **Lunghezza** → Risposte troppo corte? Arricchisci KB
   - **Lingua** → Email miste IT/EN? Migliora detection
   - **Firma** → Controlla pattern firma in ResponseValidator
   - **Allucinazioni** → Dati mancanti in KB

---

### 5. Risposte in Lingua Sbagliata

**Sintomo:**
- Email in italiano → Risposta in inglese
- Email multilingua → Lingua casuale

**Diagnosi:**

```javascript
function testLanguageDetection() {
  const classifier = new Classifier();
  
  const tests = [
    { text: 'Buongiorno, vorrei informazioni', expected: 'it' },
    { text: 'Hello, I would like information', expected: 'en' },
    { text: 'Hola, me gustaría información', expected: 'es' }
  ];
  
  tests.forEach(test => {
    const detected = classifier.detectEmailLanguage(test.text, '');
    const match = detected.lang === test.expected ? '✓' : '❌';
    console.log(`${match} "${test.text.substring(0, 30)}..." → ${detected.lang} (atteso: ${test.expected})`);
  });
}
```

**Soluzioni:**

1. **Email veramente mista (es. "Grazie / Thank you"):**
   - Sistema sceglie lingua prevalente
   - È comportamento corretto
   - Utente dovrebbe scrivere in una sola lingua

2. **Detection sbagliata:**
   ```javascript
   // In gas_classifier.js, aumenta peso marker lingua
   // Oppure in gas_gemini_service.js:
   
   _resolveLanguage(geminiLang, localLang, localSafetyGrade) {
     // Fidati sempre di Gemini per lingue esotiche
     const supportedLangs = ['it', 'en', 'es'];
     if (!supportedLangs.includes(geminiLang)) {
       return geminiLang;  // ← Gemini priorità
     }
     // ...
   }
   ```

---

### 6. Sistema Risponde a Newsletter/Spam

**Sintomo:**
- Email da "noreply@..." elaborate
- Newsletter ricevono risposta automatica

**Diagnosi:**

```javascript
function testSpamFilter() {
  const classifier = new Classifier();
  
  const spamTests = [
    'noreply@marketing.com',
    'newsletter@service.com',
    'do-not-reply@auto.com'
  ];
  
  spamTests.forEach(email => {
    const shouldIgnore = classifier._shouldIgnoreEmail({
      senderEmail: email,
      subject: 'Test',
      body: 'Test message'
    });
    
    const status = shouldIgnore ? '✓ FILTRATO' : '❌ PASSA';
    console.log(`${status}: ${email}`);
  });
}
```

**Soluzioni:**

```javascript
// In gas_config.js, aggiungi domini alla blacklist:

CONFIG.IGNORE_DOMAINS = [
  'noreply', 'no-reply', 'newsletter', 'marketing',
  'promo', 'ads', 'notifications',
  // Aggiungi domini specifici che vedi passare:
  'mailchimp', 'sendgrid', 'constantcontact'
];

// Aggiungi keyword:
CONFIG.IGNORE_KEYWORDS = [
  'unsubscribe', 'opt-out', 'newsletter',
  'marketing', 'promotional'
];
```

---

### 7. Allucinazioni (Dati Inventati)

**Sintomo:**
- Sistema inventa orari non in KB
- Fornisce email/telefoni inesistenti

**Esempio:**
```
Email utente: "A che ora è la messa?"
Risposta AI: "La messa è alle 17:30"  ← INVENTATO (KB dice 18:00)
```

**Diagnosi:**

```javascript
function checkHallucinations(response, knowledgeBase) {
  const validator = new ResponseValidator();
  
  // Test manuale
  const validation = validator.validateResponse(
    response,
    'it',
    knowledgeBase,
    '',  // emailBody
    '',  // emailSubject
    'full'  // salutationMode
  );
  
  if (validation.details.hallucinations) {
    console.error('❌ ALLUCINAZIONI RILEVATE:');
    console.log(validation.details.hallucinations);
  } else {
    console.log('✓ Nessuna allucinazione');
  }
}
```

**Soluzioni:**

1. **Arricchisci Knowledge Base:**
   - Se l'orario non è in KB, aggiungilo
   - Sii specifico: "Messa feriale inverno: 18:00" (non solo "18:00")

2. **Verifica validazione funziona:**
   ```javascript
   // In gas_response_validator.js, cerca:
   _checkHallucinations(response, knowledgeBase) {
     // Deve estrarre orari da response
     // e confrontarli con KB
   }
   ```

3. **Aumenta severità validazione:**
   ```javascript
   CONFIG.VALIDATION_STRICT_MODE = true;  // Blocca anche dubbi
   ```

---

### 8. Memoria Non Funziona

**Sintomo:**
- Sistema ripete info già fornite
- Non ricorda conversazioni precedenti

**Diagnosi:**

```javascript
function testMemory() {
  const memory = new MemoryService();
  
  if (!memory.isHealthy()) {
    console.error('❌ MemoryService NON inizializzato');
    return;
  }
  
  // Crea test
  const testThreadId = 'test_' + Date.now();
  
  memory.updateMemoryAtomic(testThreadId, {
    language: 'it',
    category: 'test'
  }, ['orari_messe']);
  
  // Recupera
  const retrieved = memory.getMemory(testThreadId);
  
  if (retrieved.language === 'it') {
    console.log('✓ Memoria funziona');
    console.log('Dati:', retrieved);
  } else {
    console.error('❌ Memoria NON funziona');
  }
}
```

**Soluzioni:**

1. **Verifica foglio Memoria esiste:**
   - Deve esistere foglio "ConversationMemory"
   - Con colonne: threadId, language, category, tone, providedInfo, lastUpdated, messageCount, version

2. **Verifica permessi:**
   - Script deve avere accesso al foglio

3. **Forza pulizia cache:**
   ```javascript
   const memory = new MemoryService();
   memory.clearCache();
   ```

---

## 🐛 Problemi Specifici Parrocchiali

### 9. Tono Inappropriato per Situazioni Pastorali

**Sintomo:**
- Risposta fredda a richiesta di supporto spirituale
- Tono burocratico per lutto/malattia

**Esempio:**
```
Email: "Mio padre è morto ieri, vorrei informazioni sul funerale"
Risposta AI: "Per i funerali servono questi documenti: ..." ← FREDDO
```

**Soluzione:**

Arricchisci foglio **AI_CORE**:

```
| Principio | Istruzione |
|-----------|-----------|
| Lutto | Per lutti: esprimi subito vicinanza ("Le siamo vicini in questo momento"), POI fornisci info pratiche |
| Malattie gravi | Rispondi con empatia, offri supporto spirituale (cappellano, visita sacerdote) |
| Situazioni delicate | NON dare solo info tecniche, mostra umanità |
```

E nel foglio **Istruzioni**, aggiungi:

```
| Categoria | Informazione | Dettagli |
|-----------|--------------|----------|
| Funerali | Cosa fare | In caso di lutto, chiamare SUBITO segreteria 06-XXX. Siamo disponibili per supporto |
| Cappellano | Contatto | Don Marco 333-XXX per visite a malati |
```

---

### 10. Non Riconosce Indirizzi del Territorio

**Sintomo:**
- "Abito in Via Roma 10" → Sistema non verifica
- Risposta generica senza conferma territorio

**Diagnosi:**

```javascript
function testTerritoryValidation() {
  const validator = new TerritoryValidator();
  
  const tests = [
    'Abito in Via Flaminia 150',
    'Sono di Piazza Marina 30',
    'Via inventata 999'
  ];
  
  tests.forEach(text => {
    const result = validator.analyzeEmailForAddress(text, '');
    console.log(`\n📍 "${text}"`);
    if (result.addressFound) {
      console.log(`  Indirizzo: ${result.street} ${result.civic}`);
      console.log(`  Territorio: ${result.verification.inParish ? 'SI' : 'NO'}`);
    } else {
      console.log('  ❌ Indirizzo non estratto');
    }
  });
}
```

**Soluzioni:**

1. **Aggiungi via mancante:**
   ```javascript
   // In gas_territory_validator.js
   this.territory = {
     'via roma': { tutti: true },  // ← AGGIUNGI
     'via flaminia': { dispari: [109, 217] },
     // ...
   };
   ```

2. **Verifica formato indirizzo:**
   - Sistema cerca: "via [nome] [numero]"
   - NON "v. [nome]" o "v.le [nome]"
   - Aggiungi alias se necessario

---

### 11. Sistema Non Gestisce Festività

**Sintomo:**
- Risponde durante Natale/Pasqua quando dovrebbe sospendersi
- Orari messe feriali forniti in giorno festivo

**Soluzione:**

Verifica in **gas_main.js**:

```javascript
// Festività fisse devono essere presenti
const ALWAYS_OPERATING_DAYS = [
  [MONTH.DEC, 25],  // Natale
  [MONTH.DEC, 26],  // Santo Stefano
  [MONTH.JAN, 1],   // Capodanno
  [MONTH.JAN, 6],   // Epifania
  // ... AGGIUNGI MANCANTI
];
```

Per **orari messe speciali** in festivi infrasettimanali:

```javascript
// In gas_main.js, in getSpecialMassTimeRule()
const giorniFissiSpeciali = [
  [4, 25],   // 25 Aprile
  [5, 1],    // 1 Maggio
  [6, 2],    // 2 Giugno (se parrocchia celebra)
  [12, 26]   // Santo Stefano
];
```

---

## 🔍 Strumenti di Diagnostica

### Dashboard Completo

```javascript
function fullDiagnostic() {
  console.log('═══════════════════════════════════════════');
  console.log('🔍 DIAGNOSTICA COMPLETA SISTEMA');
  console.log('═══════════════════════════════════════════\n');
  
  // 1. Configurazione
  console.log('📋 CONFIGURAZIONE:');
  console.log(`  API Key: ${CONFIG.GEMINI_API_KEY ? '✓ Presente' : '❌ Mancante'}`);
  console.log(`  Spreadsheet ID: ${CONFIG.SPREADSHEET_ID ? '✓ Presente' : '❌ Mancante'}`);
  console.log(`  Validazione: ${CONFIG.VALIDATION_ENABLED ? '✓ Abilitata' : '⚠️ Disabilitata'}`);
  console.log(`  DRY RUN: ${CONFIG.DRY_RUN ? '⚠️ ATTIVO (non invia email)' : '✓ Disattivo'}`);
  
  // 2. Trigger
  console.log('\n🔄 TRIGGER:');
  const triggers = ScriptApp.getProjectTriggers();
  console.log(`  Trigger totali: ${triggers.length}`);
  triggers.forEach(t => {
    console.log(`    - ${t.getHandlerFunction()} (${t.getEventType()})`);
  });
  
  // 3. Health Check
  console.log('\n🏥 HEALTH CHECK:');
  const health = healthCheck();
  console.log(`  Status: ${health.status}`);
  for (const [component, status] of Object.entries(health.components)) {
    const icon = status.status === 'OK' ? '✓' : '❌';
    console.log(`    ${icon} ${component}`);
  }
  
  // 4. Rate Limits
  console.log('\n📊 RATE LIMITS:');
  if (CONFIG.USE_RATE_LIMITER) {
    const limiter = new GeminiRateLimiter();
    const stats = limiter.getUsageStats();
    console.log(`  Data: ${stats.date}`);
    for (const [model, data] of Object.entries(stats.models)) {
      console.log(`  ${model}: RPD ${data.rpd.used}/${data.rpd.limit} (${data.rpd.percent}%)`);
    }
  } else {
    console.log('  ⚠️ Rate Limiter DISABILITATO');
  }
  
  // 5. Email Recenti
  console.log('\n📬 EMAIL (ultime 24h):');
  const labels = ['IA', 'Verifica', 'Errore'];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  labels.forEach(labelName => {
    const label = GmailApp.getUserLabelByName(labelName);
    if (label) {
      const threads = label.getThreads().filter(t => 
        t.getLastMessageDate() >= yesterday
      );
      console.log(`  ${labelName}: ${threads.length}`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════');
}
```

### Test Specifico Email

```javascript
function testSpecificEmail(subject, body) {
  console.log('🧪 TEST EMAIL SPECIFICA\n');
  console.log(`Oggetto: ${subject}`);
  console.log(`Corpo: ${body.substring(0, 100)}...\n`);
  
  // 1. Classification
  const classifier = new Classifier();
  const classification = classifier.classifyEmail(subject, body);
  console.log('📊 Classificazione:');
  console.log(`  Rispondere: ${classification.shouldReply}`);
  console.log(`  Categoria: ${classification.category}`);
  console.log(`  Confidenza: ${classification.confidence}\n`);
  
  // 2. Language
  const gemini = new GeminiService();
  const detection = gemini.detectEmailLanguage(body, subject);
  console.log('🌍 Lingua:');
  console.log(`  Rilevata: ${detection.lang}`);
  console.log(`  Confidenza: ${detection.confidence}\n`);
  
  // 3. Request Type
  const rtc = new RequestTypeClassifier();
  const requestType = rtc.classify(subject, body);
  console.log('🎯 Tipo Richiesta:');
  console.log(`  Tipo: ${requestType.type}`);
  console.log(`  Needs Discernment: ${requestType.needsDiscernment}`);
  console.log(`  Needs Doctrine: ${requestType.needsDoctrine}\n`);
}

// Esempio uso:
testSpecificEmail(
  'Orari messe',
  'Buongiorno, vorrei sapere gli orari delle messe domenicali. Grazie'
);
```

---

## 📞 Quando Contattare il Supporto

**Contatta supporto SE:**
- ✅ Hai seguito tutte le soluzioni in questa guida
- ✅ Hai eseguito `fullDiagnostic()` e raccolto log
- ✅ Il problema persiste da >24 ore
- ✅ Impatta >50% delle email

**NON contattare supporto per:**
- ❌ Problemi risolti in questa guida
- ❌ Configurazione iniziale (usa SETUP_GUIDE)
- ❌ Domande su come funziona (usa documentazione)

**Informazioni da fornire:**
1. Descrizione problema dettagliata
2. Output di `fullDiagnostic()`
3. Log ultimi 3 errori da "Esecuzioni"
4. Esempi email problematiche (anonimizzate)

**Contatti:**
- 📧 support@exnovobots.com
- 💬 GitHub Issues: github.com/yourrepo/issues

---

**Buona risoluzione! 🔧**