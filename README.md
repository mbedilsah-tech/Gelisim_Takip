# Gelişim Takip

Günlük 5 vakit namaz, opsiyonel günlük hedefler (spor vb.), kişisel program ve haftalık/aylık hedef takibi için basit bir web uygulaması (PWA). Telefonda “Ana ekrana ekle” ile uygulama gibi kurulabilir.

## Özellikler

- **Takvim:** Güne tıkla → kıldığın namazları ve opsiyonel hedefleri işaretle, program ekle, not yaz.
- **Renkler (kılınan vakit sayısı):** 0 beyaz → 1 açık yeşil → 2 koyu yeşil → 3 açık mavi → 4 koyu mavi → 5 **mor** 💜
- **Yıldızlar:** O gün tamamlanan her opsiyonel hedef günün üstüne bir ★ ekler.
- **Opsiyonel hedefler:** Spor setleri vb. eklenip çıkarılabilir, istenirse hatırlatma saati verilir.
- **Canlı namaz vakti (sağ üst):** Sıradaki vakit ve geri sayım. Tıklayınca günün tüm vakitleri.
  - İnternet varsa [aladhan.com](https://aladhan.com) üzerinden **Diyanet hesaplama yöntemi** (method=13) ile alınır ve aylık önbelleğe yazılır.
  - İnternet yoksa aynı yöntemle cihazda hesaplanır (±1–2 dk).
- **Bildirimler:** Her namaz için ayrı ayrı: ezandan önce “Ezana X dk kaldı” ve “Namazı kıldın mı?” sorusu: ezandan X dk sonra, vakit çıkmadan X dk önce ya da belirli bir saatte (her biri açılıp kapatılabilir, süreler seçilebilir; telefonda “Kıldım ✅” düğmesiyle işaretlenir). Kılınan namaz için soru gelmez.
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

**Otomatik güncelleme:** APK her açılışta GitHub'daki en son `app.js`, `styles.css` ve `index.html`'i indirir (`loader.js`). Arayüz ve özellik değişiklikleri için yeni APK gerekmez; yalnızca Android tarafı (izinler, yerel eklentiler) değişirse yeni APK kurulur. İndirilen sürüm açılmazsa APK içindeki sürüme dönülür.

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
