import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LanguageDefinition {
  code: string;
  backendName: string;
  displayName: string;
}
export const SUPPORTED_LANGUAGES_MAP: Record<string, LanguageDefinition> = {
  'aa': { code: 'aa', backendName: 'AFAR', displayName: 'Afaraf' },
  'ab': { code: 'ab', backendName: 'ABKHAZIAN', displayName: 'Аҧсуа бызшәа' },
  'ae': { code: 'ae', backendName: 'AVESTAN', displayName: 'Avesta' },
  'af': { code: 'af', backendName: 'AFRIKAANS', displayName: 'Afrikaans' },
  'ak': { code: 'ak', backendName: 'AKAN', displayName: 'Akan' },
  'am': { code: 'am', backendName: 'AMHARIC', displayName: 'አማርኛ' },
  'an': { code: 'an', backendName: 'ARAGONESE', displayName: 'Aragonés' },
  'ar': { code: 'ar', backendName: 'ARABIC', displayName: 'العربية' },
  'as': { code: 'as', backendName: 'ASSAMESE', displayName: 'অসমীয়া' },
  'av': { code: 'av', backendName: 'AVARIC', displayName: 'Авар мацӀ' },
  'ay': { code: 'ay', backendName: 'AYMARA', displayName: 'Aymar aru' },
  'az': { code: 'az', backendName: 'AZERBAIJANI', displayName: 'Azərbaycan dili' },
  'ba': { code: 'ba', backendName: 'BASHKIR', displayName: 'Башҡорт теле' },
  'be': { code: 'be', backendName: 'BELARUSIAN', displayName: 'Беларуская мова' },
  'bg': { code: 'bg', backendName: 'BULGARIAN', displayName: 'Български език' },
  'bh': { code: 'bh', backendName: 'BIHARI', displayName: 'भोजपुरी' },
  'bi': { code: 'bi', backendName: 'BISLAMA', displayName: 'Bislama' },
  'bm': { code: 'bm', backendName: 'BAMBARA', displayName: 'Bamanankan' },
  'bn': { code: 'bn', backendName: 'BENGALI', displayName: 'বাংলা' },
  'bo': { code: 'bo', backendName: 'TIBETAN', displayName: 'བོད་ཡིག' },
  'br': { code: 'br', backendName: 'BRETON', displayName: 'Brezhoneg' },
  'bs': { code: 'bs', backendName: 'BOSNIAN', displayName: 'Bosanski jezik' },
  'ca': { code: 'ca', backendName: 'CATALAN', displayName: 'Català' },
  'ce': { code: 'ce', backendName: 'CHECHEN', displayName: 'Нохчийн мотт' },
  'ch': { code: 'ch', backendName: 'CHAMORRO', displayName: 'Chamoru' },
  'co': { code: 'co', backendName: 'CORSICAN', displayName: 'Corsu' },
  'cr': { code: 'cr', backendName: 'CREE', displayName: 'ᓀᐦᐃᔭᐍᐏᐣ' },
  'cs': { code: 'cs', backendName: 'CZECH', displayName: 'Čeština' },
  'cu': { code: 'cu', backendName: 'CHURCH SLAVONIC', displayName: 'Ѩзыкъ словѣньскъ' },
  'cv': { code: 'cv', backendName: 'CHUVASH', displayName: 'Чӑваш чӗлхи' },
  'cy': { code: 'cy', backendName: 'WELSH', displayName: 'Cymraeg' },
  'da': { code: 'da', backendName: 'DANISH', displayName: 'Dansk' },
  'de': { code: 'de', backendName: 'GERMAN', displayName: 'Deutsch' },
  'dv': { code: 'dv', backendName: 'DIVEHI', displayName: 'ދިވެހި' },
  'dz': { code: 'dz', backendName: 'DZONGKHA', displayName: 'རྫོང་ཁ' },
  'ee': { code: 'ee', backendName: 'EWE', displayName: 'Eʋegbe' },
  'el': { code: 'el', backendName: 'GREEK', displayName: 'Ελληνικά' },
  'en': { code: 'en', backendName: 'ENGLISH', displayName: 'English' },
  'eo': { code: 'eo', backendName: 'ESPERANTO', displayName: 'Esperanto' },
  'es': { code: 'es', backendName: 'SPANISH', displayName: 'Español' },
  'et': { code: 'et', backendName: 'ESTONIAN', displayName: 'Eesti keel' },
  'eu': { code: 'eu', backendName: 'BASQUE', displayName: 'Euskara' },
  'fa': { code: 'fa', backendName: 'PERSIAN', displayName: 'فارسی' },
  'ff': { code: 'ff', backendName: 'FULAH', displayName: 'Fulfulde' },
  'fi': { code: 'fi', backendName: 'FINNISH', displayName: 'Suomi' },
  'fj': { code: 'fj', backendName: 'FIJIAN', displayName: 'Vosa Vakaviti' },
  'fo': { code: 'fo', backendName: 'FAROESE', displayName: 'Føroyskt' },
  'fr': { code: 'fr', backendName: 'FRENCH', displayName: 'Français' },
  'fy': { code: 'fy', backendName: 'WESTERN FRISIAN', displayName: 'Frysk' },
  'ga': { code: 'ga', backendName: 'IRISH', displayName: 'Gaeilge' },
  'gd': { code: 'gd', backendName: 'SCOTTISH GAELIC', displayName: 'Gàidhlig' },
  'gl': { code: 'gl', backendName: 'GALICIAN', displayName: 'Galego' },
  'gn': { code: 'gn', backendName: 'GUARANI', displayName: 'Avañe\'ẽ' },
  'gu': { code: 'gu', backendName: 'GUJARATI', displayName: 'ગુજરાતી' },
  'gv': { code: 'gv', backendName: 'MANX', displayName: 'Gaelg' },
  'ha': { code: 'ha', backendName: 'HAUSA', displayName: 'هَوُسَ' },
  'he': { code: 'he', backendName: 'HEBREW', displayName: 'עברית' },
  'hi': { code: 'hi', backendName: 'HINDI', displayName: 'हिन्दी' },
  'ho': { code: 'ho', backendName: 'HIRI MOTU', displayName: 'Hiri Motu' },
  'hr': { code: 'hr', backendName: 'CROATIAN', displayName: 'Hrvatski jezik' },
  'ht': { code: 'ht', backendName: 'HAITIAN CREOLE', displayName: 'Kreyòl ayisyen' },
  'hu': { code: 'hu', backendName: 'HUNGARIAN', displayName: 'Magyar' },
  'hy': { code: 'hy', backendName: 'ARMENIAN', displayName: 'Հայերեն' },
  'hz': { code: 'hz', backendName: 'HERERO', displayName: 'Otjiherero' },
  'ia': { code: 'ia', backendName: 'INTERLINGUA', displayName: 'Interlingua' },
  'id': { code: 'id', backendName: 'INDONESIAN', displayName: 'Bahasa Indonesia' },
  'ie': { code: 'ie', backendName: 'INTERLINGUE', displayName: 'Interlingue' },
  'ig': { code: 'ig', backendName: 'IGBO', displayName: 'Asụsụ Igbo' },
  'ii': { code: 'ii', backendName: 'SICHUAN YI', displayName: 'ꆈꌠ꒿ Nuosuhxop' },
  'ik': { code: 'ik', backendName: 'INUPIAQ', displayName: 'Iñupiaq' },
  'io': { code: 'io', backendName: 'IDO', displayName: 'Ido' },
  'is': { code: 'is', backendName: 'ICELANDIC', displayName: 'Íslenska' },
  'it': { code: 'it', backendName: 'ITALIAN', displayName: 'Italiano' },
  'iu': { code: 'iu', backendName: 'INUKTITUT', displayName: 'ᐃᓄᒃᑎᑐᑦ' },
  'ja': { code: 'ja', backendName: 'JAPANESE', displayName: '日本語' },
  'jv': { code: 'jv', backendName: 'JAVANESE', displayName: 'Basa Jawa' },
  'ka': { code: 'ka', backendName: 'GEORGIAN', displayName: 'ქართული' },
  'kg': { code: 'kg', backendName: 'KONGO', displayName: 'Kikongo' },
  'ki': { code: 'ki', backendName: 'KIKUYU', displayName: 'Gĩkũyũ' },
  'kj': { code: 'kj', backendName: 'KWANYAMA', displayName: 'Kuanyama' },
  'kk': { code: 'kk', backendName: 'KAZAKH', displayName: 'Қазақ тілі' },
  'kl': { code: 'kl', backendName: 'KALAALLISUT', displayName: 'Kalaallisut' },
  'km': { code: 'km', backendName: 'KHMER', displayName: 'ភាសាខ្មែរ' },
  'kn': { code: 'kn', backendName: 'KANNADA', displayName: 'ಕನ್ನಡ' },
  'ko': { code: 'ko', backendName: 'KOREAN', displayName: '한국어' },
  'kr': { code: 'kr', backendName: 'KANURI', displayName: 'Kanuri' },
  'ks': { code: 'ks', backendName: 'KASHMIRI', displayName: 'कश्मीरी' },
  'ku': { code: 'ku', backendName: 'KURDISH', displayName: 'Kurdî' },
  'kv': { code: 'kv', backendName: 'KOMI', displayName: 'Коми кыв' },
  'kw': { code: 'kw', backendName: 'CORNISH', displayName: 'Kernewek' },
  'ky': { code: 'ky', backendName: 'KYRGYZ', displayName: 'Кыргызча' },
  'la': { code: 'la', backendName: 'LATIN', displayName: 'Latine' },
  'lb': { code: 'lb', backendName: 'LUXEMBOURGISH', displayName: 'Lëtzebuergesch' },
  'lg': { code: 'lg', backendName: 'GANDA', displayName: 'Luganda' },
  'li': { code: 'li', backendName: 'LIMBURGISH', displayName: 'Limburgs' },
  'ln': { code: 'ln', backendName: 'LINGALA', displayName: 'Lingála' },
  'lo': { code: 'lo', backendName: 'LAO', displayName: 'ພາສາລາວ' },
  'lt': { code: 'lt', backendName: 'LITHUANIAN', displayName: 'Lietuvių kalba' },
  'lu': { code: 'lu', backendName: 'LUBA-KATANGA', displayName: 'Tshiluba' },
  'lv': { code: 'lv', backendName: 'LATVIAN', displayName: 'Latviešu valoda' },
  'mg': { code: 'mg', backendName: 'MALAGASY', displayName: 'Malagasy fiteny' },
  'mh': { code: 'mh', backendName: 'MARSHALLESE', displayName: 'Kajin M̧ajeļ' },
  'mi': { code: 'mi', backendName: 'MAORI', displayName: 'Te reo Māori' },
  'mk': { code: 'mk', backendName: 'MACEDONIAN', displayName: 'Македонски јазик' },
  'ml': { code: 'ml', backendName: 'MALAYALAM', displayName: 'മലയാളം' },
  'mn': { code: 'mn', backendName: 'MONGOLIAN', displayName: 'Монгол хэл' },
  'mr': { code: 'mr', backendName: 'MARATHI', displayName: 'मराठी' },
  'ms': { code: 'ms', backendName: 'MALAY', displayName: 'Bahasa Melayu' },
  'mt': { code: 'mt', backendName: 'MALTESE', displayName: 'Malti' },
  'my': { code: 'my', backendName: 'BURMESE', displayName: 'ဗမာစာ' },
  'na': { code: 'na', backendName: 'NAURU', displayName: 'Ekakairũ Naoero' },
  'nb': { code: 'nb', backendName: 'NORWEGIAN BOKMAL', displayName: 'Norsk bokmål' },
  'nd': { code: 'nd', backendName: 'NORTH NDEBELE', displayName: 'IsiNdebele' },
  'ne': { code: 'ne', backendName: 'NEPALI', displayName: 'नेपाली' },
  'ng': { code: 'ng', backendName: 'NDONGA', displayName: 'Owambo' },
  'nl': { code: 'nl', backendName: 'DUTCH', displayName: 'Nederlands' },
  'nn': { code: 'nn', backendName: 'NORWEGIAN NYNORSK', displayName: 'Norsk nynorsk' },
  'no': { code: 'no', backendName: 'NORWEGIAN', displayName: 'Norsk' },
  'nr': { code: 'nr', backendName: 'SOUTH NDEBELE', displayName: 'IsiNdebele' },
  'nv': { code: 'nv', backendName: 'NAVAJO', displayName: 'Diné bizaad' },
  'ny': { code: 'ny', backendName: 'CHICHEWA', displayName: 'ChiCheŵa' },
  'oc': { code: 'oc', backendName: 'OCCITAN', displayName: 'Occitan' },
  'oj': { code: 'oj', backendName: 'OJIBWA', displayName: 'ᐊᓂᔑᓈᐯᒧᐎᓐ' },
  'om': { code: 'om', backendName: 'OROMO', displayName: 'Afaan Oromoo' },
  'or': { code: 'or', backendName: 'ORIYA', displayName: 'ଓଡ଼ିଆ' },
  'os': { code: 'os', backendName: 'OSSETIAN', displayName: 'Ирон æвзаг' },
  'pa': { code: 'pa', backendName: 'PUNJABI', displayName: 'ਪੰਜਾਬੀ' },
  'pi': { code: 'pi', backendName: 'PALI', displayName: 'पाऴि' },
  'pl': { code: 'pl', backendName: 'POLISH', displayName: 'Polski' },
  'ps': { code: 'ps', backendName: 'PASHTO', displayName: 'پښتو' },
  'pt': { code: 'pt', backendName: 'PORTUGUESE', displayName: 'Português' },
  'qu': { code: 'qu', backendName: 'QUECHUA', displayName: 'Runa Simi' },
  'rm': { code: 'rm', backendName: 'ROMANSH', displayName: 'Rumantsch grischun' },
  'rn': { code: 'rn', backendName: 'RUNDI', displayName: 'Ikirundi' },
  'ro': { code: 'ro', backendName: 'ROMANIAN', displayName: 'Română' },
  'ru': { code: 'ru', backendName: 'RUSSIAN', displayName: 'Русский язык' },
  'rw': { code: 'rw', backendName: 'KINYARWANDA', displayName: 'Ikinyarwanda' },
  'sa': { code: 'sa', backendName: 'SANSKRIT', displayName: 'संस्कृतम्' },
  'sc': { code: 'sc', backendName: 'SARDINIAN', displayName: 'Sardu' },
  'sd': { code: 'sd', backendName: 'SINDHI', displayName: 'सिन्धी' },
  'se': { code: 'se', backendName: 'NORTHERN SAMI', displayName: 'Davvisámegiella' },
  'sg': { code: 'sg', backendName: 'SANGO', displayName: 'Yângâ tî sängö' },
  'si': { code: 'si', backendName: 'SINHALA', displayName: 'සිංහල' },
  'sk': { code: 'sk', backendName: 'SLOVAK', displayName: 'Slovenčina' },
  'sl': { code: 'sl', backendName: 'SLOVENIAN', displayName: 'Slovenščina' },
  'sm': { code: 'sm', backendName: 'SAMOAN', displayName: 'Gagana fa\'a Samoa' },
  'sn': { code: 'sn', backendName: 'SHONA', displayName: 'ChiShona' },
  'so': { code: 'so', backendName: 'SOMALI', displayName: 'Soomaaliga' },
  'sq': { code: 'sq', backendName: 'ALBANIAN', displayName: 'Shqip' },
  'sr': { code: 'sr', backendName: 'SERBIAN', displayName: 'Српски језик' },
  'ss': { code: 'ss', backendName: 'SWATI', displayName: 'SiSwati' },
  'st': { code: 'st', backendName: 'SOUTHERN SOTHO', displayName: 'Sesotho' },
  'su': { code: 'su', backendName: 'SUNDANESE', displayName: 'Basa Sunda' },
  'sv': { code: 'sv', backendName: 'SWEDISH', displayName: 'Svenska' },
  'sw': { code: 'sw', backendName: 'SWAHILI', displayName: 'Kiswahili' },
  'ta': { code: 'ta', backendName: 'TAMIL', displayName: 'தமிழ்' },
  'te': { code: 'te', backendName: 'TELUGU', displayName: 'తెలుగు' },
  'tg': { code: 'tg', backendName: 'TAJIK', displayName: 'Тоҷикӣ' },
  'th': { code: 'th', backendName: 'THAI', displayName: 'ไทย' },
  'ti': { code: 'ti', backendName: 'TIGRINYA', displayName: 'ትግርኛ' },
  'tk': { code: 'tk', backendName: 'TURKMEN', displayName: 'Türkmençe' },
  'tl': { code: 'tl', backendName: 'TAGALOG', displayName: 'Wikang Tagalog' },
  'tn': { code: 'tn', backendName: 'TSWANA', displayName: 'Setswana' },
  'to': { code: 'to', backendName: 'TONGAN', displayName: 'Faka Tonga' },
  'tr': { code: 'tr', backendName: 'TURKISH', displayName: 'Türkçe' },
  'ts': { code: 'ts', backendName: 'TSONGA', displayName: 'Xitsonga' },
  'tt': { code: 'tt', backendName: 'TATAR', displayName: 'Татар теле' },
  'tw': { code: 'tw', backendName: 'TWI', displayName: 'Twi' },
  'ty': { code: 'ty', backendName: 'TAHITIAN', displayName: 'Reo Tahiti' },
  'ug': { code: 'ug', backendName: 'UYGHUR', displayName: 'ئۇيغۇرچە‎' },
  'uk': { code: 'uk', backendName: 'UKRAINIAN', displayName: 'Українська мова' },
  'ur': { code: 'ur', backendName: 'URDU', displayName: 'اردو' },
  'uz': { code: 'uz', backendName: 'UZBEK', displayName: 'Oʻzbekcha' },
  've': { code: 've', backendName: 'VENDA', displayName: 'Tshivenḓa' },
  'vi': { code: 'vi', backendName: 'VIETNAMESE', displayName: 'Tiếng Việt' },
  'vo': { code: 'vo', backendName: 'VOLAPUK', displayName: 'Volapük' },
  'wa': { code: 'wa', backendName: 'WALLOON', displayName: 'Walon' },
  'wo': { code: 'wo', backendName: 'WOLOF', displayName: 'Wollof' },
  'xh': { code: 'xh', backendName: 'XHOSA', displayName: 'IsiXhosa' },
  'yi': { code: 'yi', backendName: 'YIDDISH', displayName: 'ייִדיש' },
  'yo': { code: 'yo', backendName: 'YORUBA', displayName: 'Yorùbá' },
  'za': { code: 'za', backendName: 'ZHUANG', displayName: 'Saɯ cueŋƅ' },
  'zh': { code: 'zh', backendName: 'CHINESE', displayName: '中文' },
  'zu': { code: 'zu', backendName: 'ZULU', displayName: 'IsiZulu' },
};

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = Object.values(SUPPORTED_LANGUAGES_MAP);
export const SUPPORTED_LANGUAGE_CODES: string[] = Object.keys(SUPPORTED_LANGUAGES_MAP);
export const DEFAULT_LANGUAGE_CODE: string = 'en';

const LANGUAGE_STORAGE_KEY = 'app_language_code';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private currentLanguageCodeSubject: BehaviorSubject<string>;
  public currentLanguageCode$: Observable<string>;

  constructor() {
    const initialLanguageCode = this.determineInitialLanguage();

    this.currentLanguageCodeSubject = new BehaviorSubject<string>(initialLanguageCode);
    this.currentLanguageCode$ = this.currentLanguageCodeSubject.asObservable();

    console.log(`LanguageService initialized. Initial language determined as: ${initialLanguageCode}. Backend name: ${this.getCurrentLanguageBackendName()}`);
  }

  private determineInitialLanguage(): string {
    const browserLangCode = this.getBestSupportedBrowserLanguage();
    if (browserLangCode) {
      console.log(`LanguageService: Using detected browser language: ${browserLangCode}`);
      return browserLangCode;
    }

    const savedLanguageCode = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguageCode && SUPPORTED_LANGUAGE_CODES.includes(savedLanguageCode)) {
      console.log(`LanguageService: Using saved language from localStorage: ${savedLanguageCode}`);
      return savedLanguageCode;
    }

    console.log(`LanguageService: Falling back to default language: ${DEFAULT_LANGUAGE_CODE}`);
    if (SUPPORTED_LANGUAGE_CODES.includes(DEFAULT_LANGUAGE_CODE)) {
      return DEFAULT_LANGUAGE_CODE;
    } else if (SUPPORTED_LANGUAGE_CODES.length > 0) {
      console.warn(`LanguageService: Default language code "${DEFAULT_LANGUAGE_CODE}" is not in the supported list! Using the first available: ${SUPPORTED_LANGUAGE_CODES[0]}`);
      return SUPPORTED_LANGUAGE_CODES[0];
    } else {
      console.error("LanguageService: No supported languages defined in SUPPORTED_LANGUAGES_MAP!");
      return 'en';
    }
  }

  private getBestSupportedBrowserLanguage(): string | null {
    if (typeof navigator === 'undefined') {
      return null;
    }

    const browserLanguages = navigator.languages || [navigator.language];

    for (const langTag of browserLanguages) {
      if (langTag) {
        const baseCode = langTag.split('-')[0].toLowerCase();
        if (SUPPORTED_LANGUAGE_CODES.includes(baseCode)) {
          return baseCode;
        }
      }
    }

    return null;
  }

  setLanguage(languageCode: string): void {
    if (SUPPORTED_LANGUAGE_CODES.includes(languageCode)) {
      if (languageCode !== this.getCurrentLanguageCode()) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
        this.currentLanguageCodeSubject.next(languageCode);
        console.log(`Language explicitly set to: ${languageCode}. Backend name: ${this.getCurrentLanguageBackendName()}`);
      }
    } else {
      console.warn(`LanguageService: Attempted to set unsupported language code "${languageCode}".`);
    }
  }

  getCurrentLanguageCode(): string {
    return this.currentLanguageCodeSubject.getValue();
  }

  getCurrentLanguageBackendName(): string {
    const currentCode = this.getCurrentLanguageCode();
    const definition = SUPPORTED_LANGUAGES_MAP[currentCode];
    return definition ? definition.backendName : currentCode.toUpperCase();
  }

  getCurrentLanguageDisplayName(): string {
    const currentCode = this.getCurrentLanguageCode();
    const definition = SUPPORTED_LANGUAGES_MAP[currentCode];
    return definition ? definition.displayName : currentCode;
  }

  getSupportedLanguages(): LanguageDefinition[] {
    return [...SUPPORTED_LANGUAGES];
  }

  getLanguageDefinition(languageCode: string): LanguageDefinition | undefined {
    return SUPPORTED_LANGUAGES_MAP[languageCode];
  }
}