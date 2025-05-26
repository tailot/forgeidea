// Angular Core
import { Injectable } from '@angular/core';

// RxJS
import { BehaviorSubject, Observable } from 'rxjs';

export interface LanguageDefinition {
  code: string;
  backendName: string;
  displayName: string;
  bcp47Tag: string;
}
export const SUPPORTED_LANGUAGES_MAP: Record<string, LanguageDefinition> = {
  'aa': { code: 'aa', backendName: 'AFAR', displayName: 'Afaraf', bcp47Tag: 'aa' },
  'ab': { code: 'ab', backendName: 'ABKHAZIAN', displayName: 'Аҧсуа бызшәа', bcp47Tag: 'ab' },
  'ae': { code: 'ae', backendName: 'AVESTAN', displayName: 'Avesta', bcp47Tag: 'ae' },
  'af': { code: 'af', backendName: 'AFRIKAANS', displayName: 'Afrikaans', bcp47Tag: 'af-ZA' },
  'ak': { code: 'ak', backendName: 'AKAN', displayName: 'Akan', bcp47Tag: 'ak' },
  'am': { code: 'am', backendName: 'AMHARIC', displayName: 'አማርኛ', bcp47Tag: 'am-ET' },
  'an': { code: 'an', backendName: 'ARAGONESE', displayName: 'Aragonés', bcp47Tag: 'an' },
  'ar': { code: 'ar', backendName: 'ARABIC', displayName: 'العربية', bcp47Tag: 'ar-SA' },
  'as': { code: 'as', backendName: 'ASSAMESE', displayName: 'অসমীয়া', bcp47Tag: 'as-IN' },
  'av': { code: 'av', backendName: 'AVARIC', displayName: 'Авар мацӀ', bcp47Tag: 'av' },
  'ay': { code: 'ay', backendName: 'AYMARA', displayName: 'Aymar aru', bcp47Tag: 'ay' },
  'az': { code: 'az', backendName: 'AZERBAIJANI', displayName: 'Azərbaycan dili', bcp47Tag: 'az-AZ' },
  'ba': { code: 'ba', backendName: 'BASHKIR', displayName: 'Башҡорт теле', bcp47Tag: 'ba' },
  'be': { code: 'be', backendName: 'BELARUSIAN', displayName: 'Беларуская мова', bcp47Tag: 'be-BY' },
  'bg': { code: 'bg', backendName: 'BULGARIAN', displayName: 'Български език', bcp47Tag: 'bg-BG' },
  'bh': { code: 'bh', backendName: 'BIHARI', displayName: 'भोजपुरी', bcp47Tag: 'bh' },
  'bi': { code: 'bi', backendName: 'BISLAMA', displayName: 'Bislama', bcp47Tag: 'bi' },
  'bm': { code: 'bm', backendName: 'BAMBARA', displayName: 'Bamanankan', bcp47Tag: 'bm' },
  'bn': { code: 'bn', backendName: 'BENGALI', displayName: 'বাংলা', bcp47Tag: 'bn-BD' },
  'bo': { code: 'bo', backendName: 'TIBETAN', displayName: 'བོད་ཡིག', bcp47Tag: 'bo-CN' },
  'br': { code: 'br', backendName: 'BRETON', displayName: 'Brezhoneg', bcp47Tag: 'br-FR' },
  'bs': { code: 'bs', backendName: 'BOSNIAN', displayName: 'Bosanski jezik', bcp47Tag: 'bs-BA' },
  'ca': { code: 'ca', backendName: 'CATALAN', displayName: 'Català', bcp47Tag: 'ca-ES' },
  'ce': { code: 'ce', backendName: 'CHECHEN', displayName: 'Нохчийн мотт', bcp47Tag: 'ce' },
  'ch': { code: 'ch', backendName: 'CHAMORRO', displayName: 'Chamoru', bcp47Tag: 'ch' },
  'co': { code: 'co', backendName: 'CORSICAN', displayName: 'Corsu', bcp47Tag: 'co-FR' },
  'cr': { code: 'cr', backendName: 'CREE', displayName: 'ᓀᐦᐃᔭᐍᐏᐣ', bcp47Tag: 'cr' },
  'cs': { code: 'cs', backendName: 'CZECH', displayName: 'Čeština', bcp47Tag: 'cs-CZ' },
  'cu': { code: 'cu', backendName: 'CHURCH SLAVONIC', displayName: 'Ѩзыкъ словѣньскъ', bcp47Tag: 'cu' },
  'cv': { code: 'cv', backendName: 'CHUVASH', displayName: 'Чӑваш чӗлхи', bcp47Tag: 'cv' },
  'cy': { code: 'cy', backendName: 'WELSH', displayName: 'Cymraeg', bcp47Tag: 'cy-GB' },
  'da': { code: 'da', backendName: 'DANISH', displayName: 'Dansk', bcp47Tag: 'da-DK' },
  'de': { code: 'de', backendName: 'GERMAN', displayName: 'Deutsch', bcp47Tag: 'de-DE' },
  'dv': { code: 'dv', backendName: 'DIVEHI', displayName: 'ދިވެހި', bcp47Tag: 'dv-MV' },
  'dz': { code: 'dz', backendName: 'DZONGKHA', displayName: 'རྫོང་ཁ', bcp47Tag: 'dz-BT' },
  'ee': { code: 'ee', backendName: 'EWE', displayName: 'Eʋegbe', bcp47Tag: 'ee-GH' }, // Ghana or Togo
  'el': { code: 'el', backendName: 'GREEK', displayName: 'Ελληνικά', bcp47Tag: 'el-GR' },
  'en': { code: 'en', backendName: 'ENGLISH', displayName: 'English', bcp47Tag: 'en-US' },
  'eo': { code: 'eo', backendName: 'ESPERANTO', displayName: 'Esperanto', bcp47Tag: 'eo' },
  'es': { code: 'es', backendName: 'SPANISH', displayName: 'Español', bcp47Tag: 'es-ES' },
  'et': { code: 'et', backendName: 'ESTONIAN', displayName: 'Eesti keel', bcp47Tag: 'et-EE' },
  'eu': { code: 'eu', backendName: 'BASQUE', displayName: 'Euskara', bcp47Tag: 'eu-ES' },
  'fa': { code: 'fa', backendName: 'PERSIAN', displayName: 'فارسی', bcp47Tag: 'fa-IR' },
  'ff': { code: 'ff', backendName: 'FULAH', displayName: 'Fulfulde', bcp47Tag: 'ff' },
  'fi': { code: 'fi', backendName: 'FINNISH', displayName: 'Suomi', bcp47Tag: 'fi-FI' },
  'fj': { code: 'fj', backendName: 'FIJIAN', displayName: 'Vosa Vakaviti', bcp47Tag: 'fj-FJ' },
  'fo': { code: 'fo', backendName: 'FAROESE', displayName: 'Føroyskt', bcp47Tag: 'fo-FO' },
  'fr': { code: 'fr', backendName: 'FRENCH', displayName: 'Français', bcp47Tag: 'fr-FR' },
  'fy': { code: 'fy', backendName: 'WESTERN FRISIAN', displayName: 'Frysk', bcp47Tag: 'fy-NL' },
  'ga': { code: 'ga', backendName: 'IRISH', displayName: 'Gaeilge', bcp47Tag: 'ga-IE' },
  'gd': { code: 'gd', backendName: 'SCOTTISH GAELIC', displayName: 'Gàidhlig', bcp47Tag: 'gd-GB' },
  'gl': { code: 'gl', backendName: 'GALICIAN', displayName: 'Galego', bcp47Tag: 'gl-ES' },
  'gn': { code: 'gn', backendName: 'GUARANI', displayName: 'Avañe\'ẽ', bcp47Tag: 'gn-PY' },
  'gu': { code: 'gu', backendName: 'GUJARATI', displayName: 'ગુજરાતી', bcp47Tag: 'gu-IN' },
  'gv': { code: 'gv', backendName: 'MANX', displayName: 'Gaelg', bcp47Tag: 'gv-IM' },
  'ha': { code: 'ha', backendName: 'HAUSA', displayName: 'هَوُسَ', bcp47Tag: 'ha-NG' }, // Nigeria, Niger, etc.
  'he': { code: 'he', backendName: 'HEBREW', displayName: 'עברית', bcp47Tag: 'he-IL' },
  'hi': { code: 'hi', backendName: 'HINDI', displayName: 'हिन्दी', bcp47Tag: 'hi-IN' },
  'ho': { code: 'ho', backendName: 'HIRI MOTU', displayName: 'Hiri Motu', bcp47Tag: 'ho' },
  'hr': { code: 'hr', backendName: 'CROATIAN', displayName: 'Hrvatski jezik', bcp47Tag: 'hr-HR' },
  'ht': { code: 'ht', backendName: 'HAITIAN CREOLE', displayName: 'Kreyòl ayisyen', bcp47Tag: 'ht-HT' },
  'hu': { code: 'hu', backendName: 'HUNGARIAN', displayName: 'Magyar', bcp47Tag: 'hu-HU' },
  'hy': { code: 'hy', backendName: 'ARMENIAN', displayName: 'Հայերեն', bcp47Tag: 'hy-AM' },
  'hz': { code: 'hz', backendName: 'HERERO', displayName: 'Otjiherero', bcp47Tag: 'hz' },
  'ia': { code: 'ia', backendName: 'INTERLINGUA', displayName: 'Interlingua', bcp47Tag: 'ia' },
  'id': { code: 'id', backendName: 'INDONESIAN', displayName: 'Bahasa Indonesia', bcp47Tag: 'id-ID' },
  'ie': { code: 'ie', backendName: 'INTERLINGUE', displayName: 'Interlingue', bcp47Tag: 'ie' },
  'ig': { code: 'ig', backendName: 'IGBO', displayName: 'Asụsụ Igbo', bcp47Tag: 'ig-NG' },
  'ii': { code: 'ii', backendName: 'SICHUAN YI', displayName: 'ꆈꌠ꒿ Nuosuhxop', bcp47Tag: 'ii-CN' },
  'ik': { code: 'ik', backendName: 'INUPIAQ', displayName: 'Iñupiaq', bcp47Tag: 'ik' },
  'io': { code: 'io', backendName: 'IDO', displayName: 'Ido', bcp47Tag: 'io' },
  'is': { code: 'is', backendName: 'ICELANDIC', displayName: 'Íslenska', bcp47Tag: 'is-IS' },
  'it': { code: 'it', backendName: 'ITALIAN', displayName: 'Italiano', bcp47Tag: 'it-IT' },
  'iu': { code: 'iu', backendName: 'INUKTITUT', displayName: 'ᐃᓄᒃᑎᑐᑦ', bcp47Tag: 'iu-CA' },
  'ja': { code: 'ja', backendName: 'JAPANESE', displayName: '日本語', bcp47Tag: 'ja-JP' },
  'jv': { code: 'jv', backendName: 'JAVANESE', displayName: 'Basa Jawa', bcp47Tag: 'jv-ID' },
  'ka': { code: 'ka', backendName: 'GEORGIAN', displayName: 'ქართული', bcp47Tag: 'ka-GE' },
  'kg': { code: 'kg', backendName: 'KONGO', displayName: 'Kikongo', bcp47Tag: 'kg' },
  'ki': { code: 'ki', backendName: 'KIKUYU', displayName: 'Gĩkũyũ', bcp47Tag: 'ki-KE' },
  'kj': { code: 'kj', backendName: 'KWANYAMA', displayName: 'Kuanyama', bcp47Tag: 'kj' },
  'kk': { code: 'kk', backendName: 'KAZAKH', displayName: 'Қазақ тілі', bcp47Tag: 'kk-KZ' },
  'kl': { code: 'kl', backendName: 'KALAALLISUT', displayName: 'Kalaallisut', bcp47Tag: 'kl-GL' },
  'km': { code: 'km', backendName: 'KHMER', displayName: 'ភាសាខ្មែរ', bcp47Tag: 'km-KH' },
  'kn': { code: 'kn', backendName: 'KANNADA', displayName: 'ಕನ್ನಡ', bcp47Tag: 'kn-IN' },
  'ko': { code: 'ko', backendName: 'KOREAN', displayName: '한국어', bcp47Tag: 'ko-KR' },
  'kr': { code: 'kr', backendName: 'KANURI', displayName: 'Kanuri', bcp47Tag: 'kr' },
  'ks': { code: 'ks', backendName: 'KASHMIRI', displayName: 'कश्मीरी', bcp47Tag: 'ks-IN' },
  'ku': { code: 'ku', backendName: 'KURDISH', displayName: 'Kurdî', bcp47Tag: 'ku-TR' }, // Kurmanji in Turkey
  'kv': { code: 'kv', backendName: 'KOMI', displayName: 'Коми кыв', bcp47Tag: 'kv' },
  'kw': { code: 'kw', backendName: 'CORNISH', displayName: 'Kernewek', bcp47Tag: 'kw-GB' },
  'ky': { code: 'ky', backendName: 'KYRGYZ', displayName: 'Кыргызча', bcp47Tag: 'ky-KG' },
  'la': { code: 'la', backendName: 'LATIN', displayName: 'Latine', bcp47Tag: 'la' },
  'lb': { code: 'lb', backendName: 'LUXEMBOURGISH', displayName: 'Lëtzebuergesch', bcp47Tag: 'lb-LU' },
  'lg': { code: 'lg', backendName: 'GANDA', displayName: 'Luganda', bcp47Tag: 'lg-UG' },
  'li': { code: 'li', backendName: 'LIMBURGISH', displayName: 'Limburgs', bcp47Tag: 'li-NL' }, // or li-BE
  'ln': { code: 'ln', backendName: 'LINGALA', displayName: 'Lingála', bcp47Tag: 'ln-CD' }, // Congo
  'lo': { code: 'lo', backendName: 'LAO', displayName: 'ພາສາລາວ', bcp47Tag: 'lo-LA' },
  'lt': { code: 'lt', backendName: 'LITHUANIAN', displayName: 'Lietuvių kalba', bcp47Tag: 'lt-LT' },
  'lu': { code: 'lu', backendName: 'LUBA-KATANGA', displayName: 'Tshiluba', bcp47Tag: 'lu-CD' },
  'lv': { code: 'lv', backendName: 'LATVIAN', displayName: 'Latviešu valoda', bcp47Tag: 'lv-LV' },
  'mg': { code: 'mg', backendName: 'MALAGASY', displayName: 'Malagasy fiteny', bcp47Tag: 'mg-MG' },
  'mh': { code: 'mh', backendName: 'MARSHALLESE', displayName: 'Kajin M̧ajeļ', bcp47Tag: 'mh-MH' },
  'mi': { code: 'mi', backendName: 'MAORI', displayName: 'Te reo Māori', bcp47Tag: 'mi-NZ' },
  'mk': { code: 'mk', backendName: 'MACEDONIAN', displayName: 'Македонски јазик', bcp47Tag: 'mk-MK' },
  'ml': { code: 'ml', backendName: 'MALAYALAM', displayName: 'മലയാളം', bcp47Tag: 'ml-IN' },
  'mn': { code: 'mn', backendName: 'MONGOLIAN', displayName: 'Монгол хэл', bcp47Tag: 'mn-MN' },
  'mr': { code: 'mr', backendName: 'MARATHI', displayName: 'मराठी', bcp47Tag: 'mr-IN' },
  'ms': { code: 'ms', backendName: 'MALAY', displayName: 'Bahasa Melayu', bcp47Tag: 'ms-MY' },
  'mt': { code: 'mt', backendName: 'MALTESE', displayName: 'Malti', bcp47Tag: 'mt-MT' },
  'my': { code: 'my', backendName: 'BURMESE', displayName: 'ဗမာစာ', bcp47Tag: 'my-MM' },
  'na': { code: 'na', backendName: 'NAURU', displayName: 'Ekakairũ Naoero', bcp47Tag: 'na-NR' },
  'nb': { code: 'nb', backendName: 'NORWEGIAN BOKMAL', displayName: 'Norsk bokmål', bcp47Tag: 'nb-NO' },
  'nd': { code: 'nd', backendName: 'NORTH NDEBELE', displayName: 'IsiNdebele', bcp47Tag: 'nd-ZW' },
  'ne': { code: 'ne', backendName: 'NEPALI', displayName: 'नेपाली', bcp47Tag: 'ne-NP' },
  'ng': { code: 'ng', backendName: 'NDONGA', displayName: 'Owambo', bcp47Tag: 'ng' },
  'nl': { code: 'nl', backendName: 'DUTCH', displayName: 'Nederlands', bcp47Tag: 'nl-NL' },
  'nn': { code: 'nn', backendName: 'NORWEGIAN NYNORSK', displayName: 'Norsk nynorsk', bcp47Tag: 'nn-NO' },
  'no': { code: 'no', backendName: 'NORWEGIAN', displayName: 'Norsk', bcp47Tag: 'no-NO' }, // Generic Norwegian, nb-NO is more specific
  'nr': { code: 'nr', backendName: 'SOUTH NDEBELE', displayName: 'IsiNdebele', bcp47Tag: 'nr-ZA' },
  'nv': { code: 'nv', backendName: 'NAVAJO', displayName: 'Diné bizaad', bcp47Tag: 'nv-US' },
  'ny': { code: 'ny', backendName: 'CHICHEWA', displayName: 'ChiCheŵa', bcp47Tag: 'ny-MW' }, // Malawi
  'oc': { code: 'oc', backendName: 'OCCITAN', displayName: 'Occitan', bcp47Tag: 'oc-FR' },
  'oj': { code: 'oj', backendName: 'OJIBWA', displayName: 'ᐊᓂᔑᓈᐯᒧᐎᓐ', bcp47Tag: 'oj' },
  'om': { code: 'om', backendName: 'OROMO', displayName: 'Afaan Oromoo', bcp47Tag: 'om-ET' }, // Ethiopia or Kenya
  'or': { code: 'or', backendName: 'ORIYA', displayName: 'ଓଡ଼ିଆ', bcp47Tag: 'or-IN' },
  'os': { code: 'os', backendName: 'OSSETIAN', displayName: 'Ирон æвзаг', bcp47Tag: 'os-GE' }, // or os-RU
  'pa': { code: 'pa', backendName: 'PUNJABI', displayName: 'ਪੰਜਾਬੀ', bcp47Tag: 'pa-IN' }, // Gurmukhi script
  'pi': { code: 'pi', backendName: 'PALI', displayName: 'पाऴि', bcp47Tag: 'pi' },
  'pl': { code: 'pl', backendName: 'POLISH', displayName: 'Polski', bcp47Tag: 'pl-PL' },
  'ps': { code: 'ps', backendName: 'PASHTO', displayName: 'پښتو', bcp47Tag: 'ps-AF' },
  'pt': { code: 'pt', backendName: 'PORTUGUESE', displayName: 'Português', bcp47Tag: 'pt-PT' },
  'qu': { code: 'qu', backendName: 'QUECHUA', displayName: 'Runa Simi', bcp47Tag: 'qu-PE' }, // Peru, Bolivia, Ecuador
  'rm': { code: 'rm', backendName: 'ROMANSH', displayName: 'Rumantsch grischun', bcp47Tag: 'rm-CH' },
  'rn': { code: 'rn', backendName: 'RUNDI', displayName: 'Ikirundi', bcp47Tag: 'rn-BI' },
  'ro': { code: 'ro', backendName: 'ROMANIAN', displayName: 'Română', bcp47Tag: 'ro-RO' },
  'ru': { code: 'ru', backendName: 'RUSSIAN', displayName: 'Русский язык', bcp47Tag: 'ru-RU' },
  'rw': { code: 'rw', backendName: 'KINYARWANDA', displayName: 'Ikinyarwanda', bcp47Tag: 'rw-RW' },
  'sa': { code: 'sa', backendName: 'SANSKRIT', displayName: 'संस्कृतम्', bcp47Tag: 'sa-IN' },
  'sc': { code: 'sc', backendName: 'SARDINIAN', displayName: 'Sardu', bcp47Tag: 'sc-IT' },
  'sd': { code: 'sd', backendName: 'SINDHI', displayName: 'सिन्धी', bcp47Tag: 'sd-PK' }, // or sd-IN
  'se': { code: 'se', backendName: 'NORTHERN SAMI', displayName: 'Davvisámegiella', bcp47Tag: 'se-NO' }, // Norway, Sweden, Finland
  'sg': { code: 'sg', backendName: 'SANGO', displayName: 'Yângâ tî sängö', bcp47Tag: 'sg-CF' },
  'si': { code: 'si', backendName: 'SINHALA', displayName: 'සිංහල', bcp47Tag: 'si-LK' },
  'sk': { code: 'sk', backendName: 'SLOVAK', displayName: 'Slovenčina', bcp47Tag: 'sk-SK' },
  'sl': { code: 'sl', backendName: 'SLOVENIAN', displayName: 'Slovenščina', bcp47Tag: 'sl-SI' },
  'sm': { code: 'sm', backendName: 'SAMOAN', displayName: 'Gagana fa\'a Samoa', bcp47Tag: 'sm-WS' },
  'sn': { code: 'sn', backendName: 'SHONA', displayName: 'ChiShona', bcp47Tag: 'sn-ZW' },
  'so': { code: 'so', backendName: 'SOMALI', displayName: 'Soomaaliga', bcp47Tag: 'so-SO' },
  'sq': { code: 'sq', backendName: 'ALBANIAN', displayName: 'Shqip', bcp47Tag: 'sq-AL' },
  'sr': { code: 'sr', backendName: 'SERBIAN', displayName: 'Српски језик', bcp47Tag: 'sr-RS' },
  'ss': { code: 'ss', backendName: 'SWATI', displayName: 'SiSwati', bcp47Tag: 'ss-SZ' }, // Swaziland (Eswatini) or South Africa
  'st': { code: 'st', backendName: 'SOUTHERN SOTHO', displayName: 'Sesotho', bcp47Tag: 'st-LS' }, // Lesotho or South Africa
  'su': { code: 'su', backendName: 'SUNDANESE', displayName: 'Basa Sunda', bcp47Tag: 'su-ID' },
  'sv': { code: 'sv', backendName: 'SWEDISH', displayName: 'Svenska', bcp47Tag: 'sv-SE' },
  'sw': { code: 'sw', backendName: 'SWAHILI', displayName: 'Kiswahili', bcp47Tag: 'sw-TZ' }, // Tanzania, Kenya, etc.
  'ta': { code: 'ta', backendName: 'TAMIL', displayName: 'தமிழ்', bcp47Tag: 'ta-IN' }, // India, Sri Lanka, Singapore, Malaysia
  'te': { code: 'te', backendName: 'TELUGU', displayName: 'తెలుగు', bcp47Tag: 'te-IN' },
  'tg': { code: 'tg', backendName: 'TAJIK', displayName: 'Тоҷикӣ', bcp47Tag: 'tg-TJ' },
  'th': { code: 'th', backendName: 'THAI', displayName: 'ไทย', bcp47Tag: 'th-TH' },
  'ti': { code: 'ti', backendName: 'TIGRINYA', displayName: 'ትግርኛ', bcp47Tag: 'ti-ER' }, // Eritrea or Ethiopia
  'tk': { code: 'tk', backendName: 'TURKMEN', displayName: 'Türkmençe', bcp47Tag: 'tk-TM' },
  'tl': { code: 'tl', backendName: 'TAGALOG', displayName: 'Wikang Tagalog', bcp47Tag: 'tl-PH' },
  'tn': { code: 'tn', backendName: 'TSWANA', displayName: 'Setswana', bcp47Tag: 'tn-BW' }, // Botswana or South Africa
  'to': { code: 'to', backendName: 'TONGAN', displayName: 'Faka Tonga', bcp47Tag: 'to-TO' },
  'tr': { code: 'tr', backendName: 'TURKISH', displayName: 'Türkçe', bcp47Tag: 'tr-TR' },
  'ts': { code: 'ts', backendName: 'TSONGA', displayName: 'Xitsonga', bcp47Tag: 'ts-ZA' },
  'tt': { code: 'tt', backendName: 'TATAR', displayName: 'Татар теле', bcp47Tag: 'tt-RU' },
  'tw': { code: 'tw', backendName: 'TWI', displayName: 'Twi', bcp47Tag: 'tw-GH' }, // Akan Twi
  'ty': { code: 'ty', backendName: 'TAHITIAN', displayName: 'Reo Tahiti', bcp47Tag: 'ty-PF' },
  'ug': { code: 'ug', backendName: 'UYGHUR', displayName: 'ئۇيغۇرچە‎', bcp47Tag: 'ug-CN' },
  'uk': { code: 'uk', backendName: 'UKRAINIAN', displayName: 'Українська мова', bcp47Tag: 'uk-UA' },
  'ur': { code: 'ur', backendName: 'URDU', displayName: 'اردو', bcp47Tag: 'ur-PK' }, // Pakistan or India
  'uz': { code: 'uz', backendName: 'UZBEK', displayName: 'Oʻzbekcha', bcp47Tag: 'uz-UZ' }, // Latin script
  've': { code: 've', backendName: 'VENDA', displayName: 'Tshivenḓa', bcp47Tag: 've-ZA' },
  'vi': { code: 'vi', backendName: 'VIETNAMESE', displayName: 'Tiếng Việt', bcp47Tag: 'vi-VN' },
  'vo': { code: 'vo', backendName: 'VOLAPUK', displayName: 'Volapük', bcp47Tag: 'vo' },
  'wa': { code: 'wa', backendName: 'WALLOON', displayName: 'Walon', bcp47Tag: 'wa-BE' },
  'wo': { code: 'wo', backendName: 'WOLOF', displayName: 'Wollof', bcp47Tag: 'wo-SN' },
  'xh': { code: 'xh', backendName: 'XHOSA', displayName: 'IsiXhosa', bcp47Tag: 'xh-ZA' },
  'yi': { code: 'yi', backendName: 'YIDDISH', displayName: 'ייִדיש', bcp47Tag: 'yi-US' }, // Often US or IL, but can be generic
  'yo': { code: 'yo', backendName: 'YORUBA', displayName: 'Yorùbá', bcp47Tag: 'yo-NG' },
  'za': { code: 'za', backendName: 'ZHUANG', displayName: 'Saɯ cueŋƅ', bcp47Tag: 'za-CN' },
  'zh': { code: 'zh', backendName: 'CHINESE', displayName: '中文', bcp47Tag: 'zh-CN' }, // Simplified Chinese, Mainland
  'zu': { code: 'zu', backendName: 'ZULU', displayName: 'IsiZulu', bcp47Tag: 'zu-ZA' },
};

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = Object.values(SUPPORTED_LANGUAGES_MAP);
export const SUPPORTED_LANGUAGE_CODES: string[] = Object.keys(SUPPORTED_LANGUAGES_MAP);
export const DEFAULT_LANGUAGE_CODE: string = 'en';

const LANGUAGE_STORAGE_KEY = 'app_language_code';

@Injectable({
  providedIn: 'root'
})
/**
 * Service responsible for managing the application's language settings.
 * It handles language detection, selection, and persistence, providing
 * observables for language changes.
 */
export class LanguageService {

  private currentLanguageCodeSubject: BehaviorSubject<string>;
  /** Observable that emits the current language code whenever it changes. */
  public currentLanguageCode$: Observable<string>;

  /**
   * Initializes the LanguageService.
   * Determines the initial language based on browser settings, local storage,
   * or a default value, and sets up the language change observable.
   */
  constructor() {
    const initialLanguageCode = this.determineInitialLanguage();

    this.currentLanguageCodeSubject = new BehaviorSubject<string>(initialLanguageCode);
    this.currentLanguageCode$ = this.currentLanguageCodeSubject.asObservable();

    console.log(`LanguageService initialized. Initial language determined as: ${initialLanguageCode}. Backend name: ${this.getCurrentLanguageBackendName()}`);
  }

  /**
   * Determines the initial language for the application.
   * It prioritizes:
   * 1. Best supported browser language.
   * 2. Language code stored in localStorage.
   * 3. Default language code (`DEFAULT_LANGUAGE_CODE`).
   * 4. The first language in the `SUPPORTED_LANGUAGE_CODES` list if the default is invalid.
   * 5. Falls back to 'en' if no supported languages are defined (should not happen in normal operation).
   * @returns The determined initial language code (e.g., 'en', 'es').
   * @private
   */
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

  /**
   * Sets the application's current language.
   * If the provided language code is supported and different from the current language,
   * it updates the language, stores it in localStorage, and notifies subscribers.
   * @param languageCode The ISO 639-1 code of the language to set (e.g., 'en', 'es').
   */
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

  /**
   * Gets the currently active language code.
   * @returns The ISO 639-1 code of the current language (e.g., 'en', 'es').
   */
  getCurrentLanguageCode(): string {
    return this.currentLanguageCodeSubject.getValue();
  }

  /**
   * Gets the backend-specific name for the current language.
   * This is often an uppercase version of the language code or a specific enum name
   * used in API requests.
   * @returns The backend name for the current language (e.g., 'ENGLISH', 'SPANISH').
   *          Falls back to the uppercase language code if no specific backend name is defined.
   */
  getCurrentLanguageBackendName(): string {
    const currentCode = this.getCurrentLanguageCode();
    const definition = SUPPORTED_LANGUAGES_MAP[currentCode];
    return definition ? definition.backendName : currentCode.toUpperCase();
  }

  /**
   * Gets the display name for the current language.
   * This is a human-readable name, often in the language itself.
   * @returns The display name for the current language (e.g., 'English', 'Español').
   *          Falls back to the language code if no display name is defined.
   */
  getCurrentLanguageDisplayName(): string {
    const currentCode = this.getCurrentLanguageCode();
    const definition = SUPPORTED_LANGUAGES_MAP[currentCode];
    return definition ? definition.displayName : currentCode;
  }

  /**
   * Gets the BCP47 language tag for the current language.
   * This tag is typically used for internationalization purposes (e.g., setting `lang` attribute in HTML).
   * @returns The BCP47 tag for the current language (e.g., 'en-US', 'es-ES').
   *          Falls back to the language code if no BCP47 tag is defined.
   */
  getCurrentLanguageBcp47Tag(): string {
    const currentCode = this.getCurrentLanguageCode();
    const definition = SUPPORTED_LANGUAGES_MAP[currentCode];
    return definition ? definition.bcp47Tag : currentCode; // Fallback to code if not found
  }

  /**
   * Gets a list of all supported language definitions.
   * @returns An array of `LanguageDefinition` objects, each representing a supported language.
   *          The returned array is a copy to prevent direct modification of the source.
   */
  getSupportedLanguages(): LanguageDefinition[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Retrieves the language definition for a specific language code.
   * @param languageCode The ISO 639-1 code of the language (e.g., 'en', 'es').
   * @returns The `LanguageDefinition` object for the given code, or `undefined` if the code is not supported.
   */
  getLanguageDefinition(languageCode: string): LanguageDefinition | undefined {
    return SUPPORTED_LANGUAGES_MAP[languageCode];
  }
}