# Gelişim Takip

Günlük 5 vakit namaz, 2 set spor (10 dk barfiks + şınav), kişisel program ve haftalık/aylık hedef takibi için basit bir web uygulaması (PWA). Telefonda “Ana ekrana ekle” ile uygulama gibi kurulabilir.

## Özellikler

- **Takvim:** Güne tıkla → kıldığın namazları ve yaptığın spor setlerini işaretle, program ekle, not yaz.
- **Renkler:** 7/7 tamamlanan gün **sarı** ⭐, yarısı (4/7) geçen gün **yeşil**, başlanmış gün açık gri.
- **Canlı namaz vakti (sağ üst):** Sıradaki vakit ve geri sayım. Tıklayınca günün tüm vakitleri.
  - İnternet varsa [aladhan.com](https://aladhan.com) üzerinden **Diyanet hesaplama yöntemi** (method=13) ile alınır ve aylık önbelleğe yazılır.
  - İnternet yoksa aynı yöntemle cihazda hesaplanır (±1–2 dk).
- **Bildirimler:** Namaz vakitlerinde (veya 5–30 dk önce) ve spor saatlerinde hatırlatma. Zaten işaretlediysen hatırlatmaz.
- **Hedefler:** Haftalık (“Mülk suresini oku”) ve aylık (“Bir kitap bitir”) hedef listeleri.
- **Özet:** Aylık tam gün sayısı, üst üste tam gün serisi, namaz yüzdesi, spor seti sayısı.
- **Yedek:** Ayarlar → Yedeği indir / Yedek yükle (JSON).

Tüm veriler tarayıcının `localStorage`'ında, yani sadece kullandığın cihazda durur.

## Android uygulaması (APK)

`main` dalına her gönderimde GitHub Actions APK'yı otomatik derler ve **Releases** sayfasına koyar
(`.github/workflows/android.yml`, Capacitor 7).

1. Telefondan repodaki **Releases** bölümünü aç, en üstteki sürümden `GelisimTakip.apk`'yı indir.
2. Kurarken “Bilinmeyen kaynaklardan yükleme” izni istenirse ver.
3. İlk açılışta Ayarlar → Namaz vakti bildirimleri'ni aç, izin ver; ardından **⏰ Tam zamanında bildirim** iznini aç.

APK'da bildirimler uygulama kapalıyken de gelir (önümüzdeki 7 gün her açılışta yeniden kurulur).
Yeni sürümler hep aynı anahtarla imzalandığı için eskisinin üzerine kurulur, veriler silinmez.

## Çalıştırma

Derleme gerekmez. GitHub Pages ile yayınlamak için: **Settings → Pages → Branch: `main` / root**.
Yerelde denemek için:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Bilinen sınırlar (prototip)

- (Web sürümü) Web bildirimleri uygulama açıkken veya arka planda açık dururken gelir; uygulama tamamen kapalıyken garanti değildir. iPhone'da bildirim için uygulamayı ana ekrana eklemek gerekir (iOS 16.4+). Kapalıyken bildirim için Android APK'yı kullan.
- Veriler cihazlar arasında senkronize olmaz.

## Dosyalar

| Dosya | Görev |
|---|---|
| `index.html` | Sayfa iskeleti |
| `styles.css` | Tasarım |
| `app.js` | Tüm uygulama mantığı (takvim, vakitler, bildirim, hedefler) |
| `sw.js` | Çevrimdışı çalışma ve bildirim tıklaması |
| `manifest.webmanifest`, `icons/` | Ana ekrana kurulum |
