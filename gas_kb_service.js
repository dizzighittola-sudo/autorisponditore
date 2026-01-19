/**
 * KnowledgeBaseService.gs - Caricamento e gestione Knowledge Base
 */

class KnowledgeBaseService {
  constructor() {
    this.config = getConfig();
    this.logger = createLogger('KnowledgeBase');
    this.cache = CacheService.getScriptCache();
  }
  
  /**
   * Precarica tutte le KB in cache
   */
  preloadAll() {
    this.logger.info('Precaricamento KB...');
    
    this.loadKB('LITE');
    this.loadKB('STANDARD');
    this.loadKB('HEAVY');
    
    this.logger.info('KB precaricate');
  }
  
  /**
   * Carica KB di un livello specifico
   * @param {string} level - LITE, STANDARD, HEAVY
   * @returns {string} Contenuto KB
   */
  loadKB(level) {
    const cacheKey = this._getCacheKey(level);
    
    // Verifica cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('KB caricata da cache', { level });
      return cached;
    }
    
    // Carica da Sheet
    try {
      const content = this._loadFromSheet(level);
      
      // Salva in cache
      const cacheDuration = Math.floor(this.config.KB.CACHE_DURATION_MS / 1000);
      this.cache.put(cacheKey, content, cacheDuration);
      
      this.logger.info('KB caricata da Sheet', { 
        level, 
        size: content.length 
      });
      
      return content;
      
    } catch (e) {
      this.logger.error('Errore caricamento KB', { 
        level, 
        error: e.message 
      });
      return '';
    }
  }
  
  /**
   * Carica KB da Google Sheet
   * @private
   */
  _loadFromSheet(level) {
    const sheetId = this.config.KB.SHEET_ID;
    const sheetName = this.config.KB.SHEETS[level];
    
    if (!sheetName || sheetName.includes('[')) {
      throw new Error(`KB Sheet name not configured for level: ${level}`);
    }
    
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`KB Sheet not found: ${sheetName}`);
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Rimuovi header
    const rows = data.slice(1);
    
    // Formatta contenuto
    const content = this._formatKBContent(rows);
    
    return content;
  }
  
  /**
   * Formatta contenuto KB
   * @private
   */
  _formatKBContent(rows) {
    // Assumiamo formato: [Categoria, Domanda, Risposta]
    const sections = new Map();
    
    rows.forEach(row => {
      if (row.length < 3) return;
      
      const category = row[0] || 'Generale';
      const question = row[1];
      const answer = row[2];
      
      if (!question || !answer) return;
      
      if (!sections.has(category)) {
        sections.set(category, []);
      }
      
      sections.get(category).push({ question, answer });
    });
    
    // Formatta in testo
    let formatted = '';
    
    for (const [category, items] of sections.entries()) {
      formatted += `\n## ${category}\n\n`;
      
      items.forEach(item => {
        formatted += `Q: ${item.question}\n`;
        formatted += `A: ${item.answer}\n\n`;
      });
    }
    
    return formatted.trim();
  }
  
  /**
   * Ottiene chiave cache per livello KB
   * @private
   */
  _getCacheKey(level) {
    const mapping = {
      LITE: this.config.CACHE_KEYS.KB_LITE,
      STANDARD: this.config.CACHE_KEYS.KB_STANDARD,
      HEAVY: this.config.CACHE_KEYS.KB_HEAVY
    };
    
    return mapping[level] || this.config.CACHE_KEYS.KB_LITE;
  }
  
  /**
   * Invalida cache KB
   * @param {string} level - Opzionale, se non specificato invalida tutto
   */
  invalidateCache(level = null) {
    if (level) {
      const cacheKey = this._getCacheKey(level);
      this.cache.remove(cacheKey);
      this.logger.info('Cache KB invalidata', { level });
    } else {
      this.cache.removeAll([
        this.config.CACHE_KEYS.KB_LITE,
        this.config.CACHE_KEYS.KB_STANDARD,
        this.config.CACHE_KEYS.KB_HEAVY
      ]);
      this.logger.info('Cache KB completamente invalidata');
    }
  }
  
  /**
   * Statistiche KB
   * @returns {Object}
   */
  getStats() {
    const stats = {};
    
    ['LITE', 'STANDARD', 'HEAVY'].forEach(level => {
      try {
        const content = this.loadKB(level);
        const lines = content.split('\n').length;
        const size = content.length;
        
        stats[level] = {
          lines: lines,
          sizeBytes: size,
          cached: this.cache.get(this._getCacheKey(level)) !== null
        };
      } catch (e) {
        stats[level] = { error: e.message };
      }
    });
    
    return stats;
  }
}