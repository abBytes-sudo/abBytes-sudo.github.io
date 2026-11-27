/* Real Estate Platform website, "Let them type": the 40 listings the hero search runs over, written for this page.
   Codes use the masked AB- prefix. Photos are Unsplash images from the Fieldwise photo set, copied to
   img/real-estate-website/u-<name>.webp.

   REW_LOCS: [key, name as shown, the words a person might type (a regular expression)]
   REW_HOMES: [code, locality key, bedrooms, type, floor, sq ft, furnishing, rent|sale, price in rupees
               (a month for rent), days since the team's last check (null = check pending), photo] */
window.REW_LOCS = [
  ['vv', 'Vasant Vihar', 'vasant\\s*vih?aa?r'],
  ['an', 'Anand Niketan', 'anand\\s*nik[ei]tan'],
  ['se', 'Safdarjung Enclave', 'safdarj[au]ng(?:\\s*enc(?:lave)?)?|sj\\s*enclave'],
  ['gp', 'Green Park', 'green\\s*park'],
  ['hk', 'Hauz Khas', 'hauz\\s*kh?as'],
  ['pp', 'Panchsheel Park', 'panch\\s*sh?(?:ee|i)la?(?:\\s*park)?'],
  ['mn', 'Malviya Nagar', 'malviya(?:\\s*nagar)?'],
  ['sk', 'Saket', 'saket'],
  ['g1', 'Greater Kailash 1', '(?:gk|greater\\s*kailash)[\\s-]*(?:part[\\s-]*)?(?:1|i|one)(?![\\w])'],
  ['g2', 'Greater Kailash 2', '(?:gk|greater\\s*kailash)[\\s-]*(?:part[\\s-]*)?(?:2|ii|two)(?![\\w])'],
  ['cp', 'Chittaranjan Park', 'c\\.?\\s*r\\.?\\s*park|chitt?a?ranjan\\s*park'],
  ['dc', 'Defence Colony', 'defen[cs]e\\s*colony|def(?:ence)?\\.?\\s*col(?:ony)?|dc']
];

window.REW_HOMES = [
  ['AB-VV-031', 'vv', 3, 'Builder floor', '2nd floor', 1650, 'Semi-furnished', 'rent', 145000, 6, 'liv-05'],
  ['AB-VV-044', 'vv', 3, 'Apartment', '1st floor', 1520, 'Furnished', 'rent', 120000, 12, 'liv-10'],
  ['AB-VV-018', 'vv', 3, 'Builder floor', 'Ground floor', 1800, 'Unfurnished', 'rent', 138000, null, 'liv-14'],
  ['AB-VV-052', 'vv', 3, 'Builder floor', '3rd floor', 2050, 'Semi-furnished', 'rent', 165000, 3, 'liv-04'],
  ['AB-VV-009', 'vv', 4, 'House', 'Ground + 1st', 3600, 'Semi-furnished', 'rent', 320000, 9, 'ext-12'],
  ['AB-VV-061', 'vv', 2, 'Builder floor', '3rd floor', 1100, 'Furnished', 'rent', 85000, 20, 'bed-03'],
  ['AB-VV-070', 'vv', 3, 'Builder floor', '1st floor', 2000, 'Semi-furnished', 'sale', 95000000, 15, 'ext-09'],
  ['AB-AN-014', 'an', 4, 'Builder floor', '1st floor', 3000, 'Semi-furnished', 'rent', 290000, 8, 'liv-02'],
  ['AB-AN-022', 'an', 3, 'Builder floor', '2nd floor', 2200, 'Furnished', 'rent', 185000, 4, 'liv-11'],
  ['AB-AN-030', 'an', 4, 'Builder floor', 'Ground floor', 3200, 'Semi-furnished', 'sale', 125000000, 21, 'ext-08'],
  ['AB-SE-011', 'se', 3, 'Builder floor', '2nd floor', 1700, 'Semi-furnished', 'rent', 110000, 5, 'liv-06'],
  ['AB-SE-019', 'se', 2, 'Apartment', '1st floor', 1000, 'Furnished', 'rent', 62000, 11, 'bed-05'],
  ['AB-SE-027', 'se', 3, 'Builder floor', 'Ground floor', 1800, 'Unfurnished', 'rent', 95000, 2, 'liv-09'],
  ['AB-SE-033', 'se', 3, 'Builder floor', '3rd floor', 1800, 'Semi-furnished', 'sale', 52000000, 30, 'ext-16'],
  ['AB-GP-008', 'gp', 2, 'Builder floor', '2nd floor', 1050, 'Semi-furnished', 'rent', 58000, 7, 'bed-01'],
  ['AB-GP-015', 'gp', 3, 'Builder floor', '1st floor', 1500, 'Furnished', 'rent', 105000, 13, 'liv-07'],
  ['AB-GP-024', 'gp', 3, 'Builder floor', '3rd floor', 1600, 'Semi-furnished', 'rent', 92000, null, 'liv-13'],
  ['AB-HK-019', 'hk', 3, 'Builder floor', '1st floor', 1750, 'Semi-furnished', 'rent', 130000, 6, 'liv-03'],
  ['AB-HK-026', 'hk', 2, 'Apartment', '2nd floor', 1150, 'Furnished', 'rent', 78000, 10, 'bed-02'],
  ['AB-HK-035', 'hk', 4, 'Builder floor', 'Ground floor', 2600, 'Unfurnished', 'rent', 210000, 18, 'kit-08'],
  ['AB-PP-011', 'pp', 3, 'Builder floor', '2nd floor', 2000, 'Semi-furnished', 'rent', 148000, 9, 'liv-12'],
  ['AB-PP-020', 'pp', 4, 'Builder floor', '1st floor', 2700, 'Furnished', 'rent', 240000, 14, 'bed-07'],
  ['AB-PP-029', 'pp', 4, 'Builder floor', '2nd floor', 2700, 'Semi-furnished', 'sale', 88000000, 25, 'ext-10'],
  ['AB-MN-027', 'mn', 2, 'Builder floor', '1st floor', 900, 'Semi-furnished', 'rent', 34000, 4, 'kit-07'],
  ['AB-MN-033', 'mn', 3, 'Builder floor', '2nd floor', 1250, 'Unfurnished', 'rent', 48000, 8, 'kit-06'],
  ['AB-MN-040', 'mn', 3, 'Builder floor', '3rd floor', 1300, 'Semi-furnished', 'sale', 19000000, 33, 'bed-08'],
  ['AB-SK-016', 'sk', 3, 'Apartment', '4th floor', 1650, 'Semi-furnished', 'rent', 82000, 6, 'bal-03'],
  ['AB-SK-023', 'sk', 2, 'Apartment', '2nd floor', 1100, 'Furnished', 'rent', 52000, 12, 'bed-08'],
  ['AB-SK-031', 'sk', 4, 'Apartment', '6th floor', 2400, 'Semi-furnished', 'rent', 135000, 16, 'liv-04'],
  ['AB-GK-141', 'g1', 3, 'Builder floor', '2nd floor', 1800, 'Semi-furnished', 'rent', 125000, 5, 'liv-11'],
  ['AB-GK-152', 'g1', 2, 'Builder floor', '1st floor', 1100, 'Furnished', 'rent', 68000, 9, 'bed-02'],
  ['AB-GK-163', 'g1', 2, 'Builder floor', '3rd floor', 1000, 'Semi-furnished', 'rent', 62000, 3, 'bed-05'],
  ['AB-GK-214', 'g2', 3, 'Builder floor', '1st floor', 1750, 'Semi-furnished', 'rent', 112000, 7, 'liv-02'],
  ['AB-GK-226', 'g2', 2, 'Builder floor', '2nd floor', 1050, 'Furnished', 'rent', 60000, null, 'bed-01'],
  ['AB-CP-102', 'cp', 2, 'Builder floor', '2nd floor', 1000, 'Semi-furnished', 'rent', 42000, 6, 'bed-07'],
  ['AB-CP-108', 'cp', 3, 'Builder floor', '1st floor', 1400, 'Unfurnished', 'rent', 58000, 10, 'liv-14'],
  ['AB-CP-115', 'cp', 2, 'Builder floor', '3rd floor', 950, 'Furnished', 'rent', 38000, 4, 'bed-03'],
  ['AB-DC-041', 'dc', 3, 'Builder floor', '2nd floor', 1900, 'Semi-furnished', 'rent', 155000, 8, 'liv-03'],
  ['AB-DC-048', 'dc', 4, 'Builder floor', '1st floor', 2500, 'Furnished', 'rent', 225000, 12, 'liv-07'],
  ['AB-DC-060', 'dc', 4, 'Builder floor', 'Ground floor', 2600, 'Semi-furnished', 'sale', 115000000, 22, 'ext-12']
];
