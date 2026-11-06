import type { Messages } from './types'

/**
 * Türkçe. Sprachregister: höflich-neutral („seçin“).
 *
 * Bewusst keine Sätze, in die ein Datum oder eine Zahl eingebaut wird: Türkische
 * Suffixe richten sich nach dem Klang der Zahl („2019’dan“, „2020’den“), das
 * lässt sich nicht fehlerfrei per Platzhalter lösen. Deshalb stehen Bezeichnung
 * und Wert getrennt („Üyelik başlangıcı“ + „Nisan 2019“).
 *
 * Wichtig für die Darstellung: `text-transform: uppercase` setzt nur dann
 * i → İ und ı → I, wenn das `lang`-Attribut auf `tr` steht.
 */
export const tr: Messages = {
  'meta.title': 'Profilim – WBG Mieterschutz eG',
  'a11y.skip': 'İçeriğe geç',
  'nav.home': 'Ana sayfaya dön',
  'lang.switch': 'Dil seçin',
  'demo.badge': 'Örnek veriler',

  'profile.eyebrow': 'Üye alanı',
  'profile.title': 'Profilim',
  'profile.status': 'Aktif üye',
  'profile.memberNo': 'Üye numarası',
  'profile.since': 'Üyelik başlangıcı',
  'profile.district': 'Semt',

  'stats.title': 'Bir bakışta',
  'stats.shares': 'Kooperatif payları',
  'stats.years': 'Üyelik yılı',
  'stats.area': 'Yaşam alanı',
  'stats.requests': 'Açık talepler',

  'home.title': 'Dairem',
  'home.floor': '2. kat',
  'home.hint': 'Planda vurgulamak için bir oda seçin.',
  'room.living': 'Oturma ve yemek alanı',
  'room.kitchen': 'Mutfak',
  'room.bedroom': 'Yatak odası',
  'room.kids': 'Çocuk odası',
  'room.bath': 'Banyo',
  'room.hall': 'Koridor',

  'contact.title': 'İletişim',
  'contact.email': 'E-posta',
  'contact.phone': 'Telefon',
  'contact.address': 'Adres',
  'contact.copy': 'Kopyala',
  'contact.copied': 'Kopyalandı',

  'settings.title': 'Ayarlar',
  'settings.language': 'Dil',
  'settings.languageHint': 'Bu sayfa için geçerlidir.',
  'settings.notifications': 'Bildirimler',
  'settings.notifyMail': 'E-posta ile haberler',
  'settings.notifyPost': 'Önemli yazışmalar posta ile',
  'settings.notifyRepair': 'Onarım taleplerinin durumu',

  'activity.title': 'Son etkinlikler',
  'activity.bill': '2025 yılı yan gider hesabı hazır',
  'activity.repair': '“Banyo musluğu” onarım talebi tamamlandı',
  'activity.share': 'Kooperatif payı kaydedildi',

  'footer.note': 'Bu sayfadaki tüm bilgiler örnek verilerdir.',
}
