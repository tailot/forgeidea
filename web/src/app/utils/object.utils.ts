/**
 * Pulisce ricorsivamente un oggetto o valore JSON, mantenendo solo le proprietà
 * degli oggetti le cui chiavi sono stringhe numeriche (es. "0", "1", "123").
 * Mantiene la struttura (oggetti/array) necessaria per contenere i valori rimanenti.
 * Rimuove le proprietà con chiavi non numeriche e le strutture vuote risultanti.
 *
 * @param data Il dato di input (oggetto, array o primitivo).
 * @returns La struttura dati ripulita contenente solo proprietà con chiavi numeriche,
 *          o undefined se non rimangono dati validi.
 */
export function filterJsonByNumericKeys(data: unknown): unknown {
    // Caso Base 1: Gestisce null e tipi primitivi diversi da 'object'
    if (data === null || typeof data !== 'object') {
      return data;
    }
  
    // Passo Ricorsivo 1: Gestisce gli Array
    if (Array.isArray(data)) {
      const resultArray = data
        .map(element => filterJsonByNumericKeys(element))
        .filter(cleanedElement => cleanedElement !== undefined);
      return resultArray.length > 0 ? resultArray : undefined;
    }
  
    // Passo Ricorsivo 2: Gestisce gli Oggetti
    const resultObject: { [key: string]: unknown } = {};
    let hasContent = false;
  
    for (const [key, value] of Object.entries(data)) {
      if (/^\d+$/.test(key)) {
        const cleanedValue = filterJsonByNumericKeys(value);
        if (cleanedValue !== undefined && value !== undefined) {
          resultObject[key] = cleanedValue;
          hasContent = true;
        }
      }
    }
  
    return hasContent ? resultObject : undefined;
  }  