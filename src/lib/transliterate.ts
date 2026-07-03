export function transliterateArmenian(text: string, locale: 'en' | 'ru' | 'hy'): string {
  if (locale === 'hy' || !text) return text;
  
  // Custom dictionary for exact matches of major cities and regions for perfection
  const dictEn: Record<string, string> = {
    "Երևան": "Yerevan", "Շիրակ": "Shirak", "Լոռի": "Lori", "Տավուշ": "Tavush",
    "Արագածոտն": "Aragatsotn", "Կոտայք": "Kotayk", "Գեղարքունիք": "Gegharkunik",
    "Արմավիր": "Armavir", "Արարատ": "Ararat", "Վայոց Ձոր": "Vayots Dzor", "Սյունիք": "Syunik",
    "Գյումրի": "Gyumri", "Վանաձոր": "Vanadzor", "Էջմիածին": "Echmiadzin", "Աբովյան": "Abovyan",
    "Կապան": "Kapan", "Հրազդան": "Hrazdan", "Արտաշատ": "Artashat", "Իջևան": "Ijevan",
    "Գավառ": "Gavar", "Գորիս": "Goris", "Չարենցավան": "Charentsavan", "Արարատ (քաղաք)": "Ararat",
    "Սիսիան": "Sisian", "Սպիտակ": "Spitak", "Ալավերդի": "Alaverdi", "Ստեփանավան": "Stepanavan",
    "Դիլիջան": "Dilijan", "Սևան": "Sevan", "Ապարան": "Aparan", "Եղեգնաձոր": "Yeghegnadzor",
    "Ջերմուկ": "Jermuk", "Մեղրի": "Meghri", "Տաշիր": "Tashir"
  };

  const dictRu: Record<string, string> = {
    "Երևան": "Ереван", "Շիրակ": "Ширак", "Լոռի": "Лори", "Տավուշ": "Тавуш",
    "Արագածոտն": "Арагацотн", "Կոտայք": "Котайк", "Գեղարքունիք": "Гехаркуник",
    "Արմավիր": "Армавир", "Արարատ": "Арарат", "Վայոց Ձոր": "Вайоц Дзор", "Սյունիք": "Сюник",
    "Գյումրի": "Гюмри", "Վանաձոր": "Ванадзор", "Էջմիածին": "Эчмиадзин", "Աբովյան": "Абовян",
    "Կապան": "Капан", "Հրազդան": "Раздан", "Արտաշատ": "Арташат", "Իջևան": "Иджеван",
    "Գավառ": "Гавар", "Գորիս": "Горис", "Չարենցավան": "Чаренцаван", "Արարատ (քաղաք)": "Арарат",
    "Սիսիան": "Сисиан", "Սպիտակ": "Спитак", "Ալավերդի": "Алаверди", "Ստեփանավան": "Степанаван",
    "Դիլիջան": "Дилиджан", "Սևան": "Севан", "Ապարան": "Апаран", "Եղեգնաձոր": "Ехегнадзор",
    "Ջերմուկ": "Джермук", "Մեղրի": "Мегри", "Տաշիր": "Ташир"
  };

  // Check exact dictionary match first
  if (locale === 'en' && dictEn[text]) return dictEn[text];
  if (locale === 'ru' && dictRu[text]) return dictRu[text];

  // If text has parenthesis like "Ագարակ (Աշտարակ)", handle it
  const match = text.match(/^(.*?) \((.*?)\)$/);
  if (match) {
    const main = transliterateArmenian(match[1], locale);
    const sub = transliterateArmenian(match[2], locale);
    return `${main} (${sub})`;
  }

  // Generic transliteration rules
  const hyMapEn: Record<string, string> = {
    'ա':'a','բ':'b','գ':'g','դ':'d','ե':'e','զ':'z','է':'e','ը':'y','թ':'t','ժ':'zh',
    'ի':'i','լ':'l','խ':'kh','ծ':'ts','կ':'k','հ':'h','ձ':'dz','ղ':'gh','ճ':'ch','մ':'m',
    'յ':'y','ն':'n','շ':'sh','ո':'o','չ':'ch','պ':'p','ջ':'j','ռ':'r','ս':'s','վ':'v',
    'տ':'t','ր':'r','ց':'ts','ու':'u','փ':'p','ք':'k','և':'ev','օ':'o','ֆ':'f',
    'Ա':'A','Բ':'B','Գ':'G','Դ':'D','Ե':'Ye','Զ':'Z','Է':'E','Ը':'Y','Թ':'T','Ժ':'Zh',
    'Ի':'I','Լ':'L','Խ':'Kh','Ծ':'Ts','Կ':'K','Հ':'H','Ձ':'Dz','Ղ':'Gh','Ճ':'Ch','Մ':'M',
    'Յ':'Y','Ն':'N','Շ':'Sh','Ո':'Vo','Չ':'Ch','Պ':'P','Ջ':'J','Ռ':'R','Ս':'S','Վ':'V',
    'Տ':'T','Ր':'R','Ց':'Ts','ՈՒ':'U','Փ':'P','Ք':'K','ԵՎ':'Ev','Օ':'O','Ֆ':'F'
  };

  const hyMapRu: Record<string, string> = {
    'ա':'а','բ':'б','գ':'г','դ':'д','ե':'е','զ':'з','է':'э','ը':'ы','թ':'т','ժ':'ж',
    'ի':'и','լ':'л','խ':'х','ծ':'ц','կ':'к','հ':'г','ձ':'дз','ղ':'г','ճ':'ч','մ':'м',
    'յ':'й','ն':'н','շ':'ш','ո':'о','չ':'ч','պ':'п','ջ':'дж','ռ':'р','ս':'с','վ':'в',
    'տ':'т','ր':'р','ց':'ц','ու':'у','փ':'п','ք':'к','և':'ев','օ':'о','ֆ':'ф',
    'Ա':'А','Բ':'Б','Գ':'Г','Դ':'Д','Ե':'Е','Զ':'З','Է':'Э','Ը':'Ы','Թ':'Т','Ժ':'Ж',
    'Ի':'И','Լ':'Л','Խ':'Х','Ծ':'Ц','Կ':'К','Հ':'Г','Ձ':'Дз','Ղ':'Г','Ճ':'Ч','Մ':'М',
    'Յ':'Й','Ն':'Н','Շ':'Ш','Ո':'О','Չ':'Ч','Պ':'П','Ջ':'Дж','Ռ':'Р','Ս':'С','Վ':'В',
    'Տ':'Т','Ր':'Р','Ց':'Ц','ՈՒ':'У','Փ':'П','Ք':'К','ԵՎ':'Ев','Օ':'О','Ֆ':'Ф'
  };

  const map = locale === 'en' ? hyMapEn : hyMapRu;
  let res = "";
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Specific position rules
    if (locale === 'en') {
      if (char === 'ե' && i === 0) { res += 'Ye'; continue; }
      if (char === 'ո' && i === 0) { res += 'Vo'; continue; }
    } else if (locale === 'ru') {
      if (char === 'ե' && i === 0) { res += 'Е'; continue; } // Ye-revan -> Erevan
    }

    if (map[char]) {
      res += map[char];
    } else {
      res += char;
    }
  }

  // Capitalize first letter if it was missed
  if (res.length > 0) {
    res = res.charAt(0).toUpperCase() + res.slice(1);
  }

  return res;
}
