/* Countries for the contact form's phone picker (contact.js). Local data only, no network.
   CF_CC: ISO code | name | country calling code, one country per ';'. Countries that share a code (+1, +7, +44 ...) each have their own row.
   CF_LEN: for the common countries, how many digits a national number has (min, max), without the leading 0. Others get a loose check.
   CF_TRUNK: countries where people write a leading 0 at home that is dropped after the country code.
   CF_MAIN: the main country for a shared code, when a typed +code has to pick one.
   CF_TZ: time zones that point to one country, to guess where the visitor is. */
window.CF_CC = 'AF|Afghanistan|93;AX|Åland Islands|358;AL|Albania|355;DZ|Algeria|213;AS|American Samoa|1;AD|Andorra|376;AO|Angola|244;AI|Anguilla|1;AG|Antigua and Barbuda|1;AR|Argentina|54;AM|Armenia|374;AW|Aruba|297;AU|Australia|61;AT|Austria|43;AZ|Azerbaijan|994;' +
  'BS|Bahamas|1;BH|Bahrain|973;BD|Bangladesh|880;BB|Barbados|1;BY|Belarus|375;BE|Belgium|32;BZ|Belize|501;BJ|Benin|229;BM|Bermuda|1;BT|Bhutan|975;BO|Bolivia|591;BA|Bosnia and Herzegovina|387;BW|Botswana|267;BR|Brazil|55;IO|British Indian Ocean Territory|246;VG|British Virgin Islands|1;BN|Brunei|673;BG|Bulgaria|359;BF|Burkina Faso|226;BI|Burundi|257;' +
  'KH|Cambodia|855;CM|Cameroon|237;CA|Canada|1;CV|Cape Verde|238;BQ|Caribbean Netherlands|599;KY|Cayman Islands|1;CF|Central African Republic|236;TD|Chad|235;CL|Chile|56;CN|China|86;CX|Christmas Island|61;CC|Cocos (Keeling) Islands|61;CO|Colombia|57;KM|Comoros|269;CG|Congo|242;CD|Congo (DRC)|243;CK|Cook Islands|682;CR|Costa Rica|506;CI|Côte d’Ivoire|225;HR|Croatia|385;CU|Cuba|53;CW|Curaçao|599;CY|Cyprus|357;CZ|Czechia|420;' +
  'DK|Denmark|45;DJ|Djibouti|253;DM|Dominica|1;DO|Dominican Republic|1;EC|Ecuador|593;EG|Egypt|20;SV|El Salvador|503;GQ|Equatorial Guinea|240;ER|Eritrea|291;EE|Estonia|372;SZ|Eswatini|268;ET|Ethiopia|251;' +
  'FK|Falkland Islands|500;FO|Faroe Islands|298;FJ|Fiji|679;FI|Finland|358;FR|France|33;GF|French Guiana|594;PF|French Polynesia|689;GA|Gabon|241;GM|Gambia|220;GE|Georgia|995;DE|Germany|49;GH|Ghana|233;GI|Gibraltar|350;GR|Greece|30;GL|Greenland|299;GD|Grenada|1;GP|Guadeloupe|590;GU|Guam|1;GT|Guatemala|502;GG|Guernsey|44;GN|Guinea|224;GW|Guinea-Bissau|245;GY|Guyana|592;' +
  'HT|Haiti|509;HN|Honduras|504;HK|Hong Kong|852;HU|Hungary|36;IS|Iceland|354;IN|India|91;ID|Indonesia|62;IR|Iran|98;IQ|Iraq|964;IE|Ireland|353;IM|Isle of Man|44;IL|Israel|972;IT|Italy|39;JM|Jamaica|1;JP|Japan|81;JE|Jersey|44;JO|Jordan|962;' +
  'KZ|Kazakhstan|7;KE|Kenya|254;KI|Kiribati|686;XK|Kosovo|383;KW|Kuwait|965;KG|Kyrgyzstan|996;LA|Laos|856;LV|Latvia|371;LB|Lebanon|961;LS|Lesotho|266;LR|Liberia|231;LY|Libya|218;LI|Liechtenstein|423;LT|Lithuania|370;LU|Luxembourg|352;' +
  'MO|Macao|853;MG|Madagascar|261;MW|Malawi|265;MY|Malaysia|60;MV|Maldives|960;ML|Mali|223;MT|Malta|356;MH|Marshall Islands|692;MQ|Martinique|596;MR|Mauritania|222;MU|Mauritius|230;YT|Mayotte|262;MX|Mexico|52;FM|Micronesia|691;MD|Moldova|373;MC|Monaco|377;MN|Mongolia|976;ME|Montenegro|382;MS|Montserrat|1;MA|Morocco|212;MZ|Mozambique|258;MM|Myanmar|95;' +
  'NA|Namibia|264;NR|Nauru|674;NP|Nepal|977;NL|Netherlands|31;NC|New Caledonia|687;NZ|New Zealand|64;NI|Nicaragua|505;NE|Niger|227;NG|Nigeria|234;NU|Niue|683;NF|Norfolk Island|672;KP|North Korea|850;MK|North Macedonia|389;MP|Northern Mariana Islands|1;NO|Norway|47;OM|Oman|968;' +
  'PK|Pakistan|92;PW|Palau|680;PS|Palestine|970;PA|Panama|507;PG|Papua New Guinea|675;PY|Paraguay|595;PE|Peru|51;PH|Philippines|63;PL|Poland|48;PT|Portugal|351;PR|Puerto Rico|1;QA|Qatar|974;RE|Réunion|262;RO|Romania|40;RU|Russia|7;RW|Rwanda|250;' +
  'BL|Saint Barthélemy|590;SH|Saint Helena|290;KN|Saint Kitts and Nevis|1;LC|Saint Lucia|1;MF|Saint Martin|590;PM|Saint Pierre and Miquelon|508;VC|Saint Vincent and the Grenadines|1;WS|Samoa|685;SM|San Marino|378;ST|São Tomé and Príncipe|239;SA|Saudi Arabia|966;SN|Senegal|221;RS|Serbia|381;SC|Seychelles|248;SL|Sierra Leone|232;SG|Singapore|65;SX|Sint Maarten|1;SK|Slovakia|421;SI|Slovenia|386;SB|Solomon Islands|677;SO|Somalia|252;ZA|South Africa|27;KR|South Korea|82;SS|South Sudan|211;ES|Spain|34;LK|Sri Lanka|94;SD|Sudan|249;SR|Suriname|597;SJ|Svalbard and Jan Mayen|47;SE|Sweden|46;CH|Switzerland|41;SY|Syria|963;' +
  'TW|Taiwan|886;TJ|Tajikistan|992;TZ|Tanzania|255;TH|Thailand|66;TL|Timor-Leste|670;TG|Togo|228;TK|Tokelau|690;TO|Tonga|676;TT|Trinidad and Tobago|1;TN|Tunisia|216;TR|Türkiye|90;TM|Turkmenistan|993;TC|Turks and Caicos Islands|1;TV|Tuvalu|688;' +
  'VI|U.S. Virgin Islands|1;UG|Uganda|256;UA|Ukraine|380;AE|United Arab Emirates|971;GB|United Kingdom|44;US|United States|1;UY|Uruguay|598;UZ|Uzbekistan|998;VU|Vanuatu|678;VA|Vatican City|39;VE|Venezuela|58;VN|Vietnam|84;WF|Wallis and Futuna|681;EH|Western Sahara|212;YE|Yemen|967;ZM|Zambia|260;ZW|Zimbabwe|263';
window.CF_LEN = {
  IN: [10, 10], GB: [9, 10], AE: [8, 9], SA: [8, 9], QA: [8, 8], KW: [8, 8], OM: [8, 8], BH: [8, 8], SG: [8, 8], HK: [8, 8], MO: [8, 8], MY: [8, 10], AU: [9, 9], NZ: [8, 10],
  PK: [9, 10], BD: [8, 10], LK: [9, 9], NP: [8, 10], BT: [7, 8], MV: [7, 7], FR: [9, 9], ES: [9, 9], NL: [9, 9], BE: [8, 9], CH: [9, 9], IE: [7, 9], PT: [9, 9], PL: [9, 9],
  NO: [8, 8], DK: [8, 8], SE: [7, 9], IT: [6, 11], DE: [6, 13], ZA: [9, 9], NG: [8, 10], KE: [9, 9], EG: [9, 10], CN: [10, 11], JP: [9, 10], KR: [8, 10], ID: [9, 12],
  PH: [10, 10], TH: [8, 9], VN: [9, 10], TR: [10, 10], RU: [10, 10], KZ: [10, 10], BR: [10, 11], MX: [10, 10], IL: [8, 9]
};
window.CF_TRUNK = 'IN GB AU NZ AE SA PK BD LK NP MY ID PH TH VN CN JP KR TR ZA NG KE EG DE FR NL BE CH AT IE SE FI IL BR';
window.CF_MAIN = { 1: 'US', 7: 'RU', 39: 'IT', 44: 'GB', 47: 'NO', 61: 'AU', 212: 'MA', 262: 'RE', 290: 'SH', 358: 'FI', 590: 'GP', 599: 'CW' };
window.CF_TZ = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM', 'Asia/Bahrain': 'BH',
  'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
  'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP', 'Asia/Katmandu': 'NP', 'Asia/Thimphu': 'BT', 'Indian/Maldives': 'MV', 'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL', 'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Kabul': 'AF', 'Asia/Tashkent': 'UZ', 'Asia/Almaty': 'KZ',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA', 'Europe/Bucharest': 'RO', 'Europe/Budapest': 'HU', 'Europe/Sofia': 'BG', 'Europe/Belgrade': 'RS', 'Europe/Zagreb': 'HR', 'Europe/Luxembourg': 'LU',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Hobart': 'AU',
  'Australia/Darwin': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Fiji': 'FJ',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'America/Detroit': 'US', 'Pacific/Honolulu': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA', 'America/Winnipeg': 'CA',
  'America/Halifax': 'CA', 'America/St_Johns': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
  'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Caracas': 'VE', 'America/Puerto_Rico': 'PR', 'America/Jamaica': 'JM',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA', 'Africa/Accra': 'GH', 'Africa/Addis_Ababa': 'ET',
  'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Indian/Mauritius': 'MU'
};
