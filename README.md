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

## Çalıştırma

Derleme gerekmez. GitHub Pages ile yayınlamak için: **Settings → Pages → Branch: `main` / root**.
Yerelde denemek için:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Bilinen sınırlar (prototip)

- Web bildirimleri uygulama açıkken veya arka planda açık dururken gelir; uygulama tamamen kapalıyken garanti değildir. iPhone'da bildirim için uygulamayı ana ekrana eklemek gerekir (iOS 16.4+). Kapalıyken de kesin bildirim için ileride Capacitor ile yerel (native) uygulamaya çevrilebilir.
- Veriler cihazlar arasında senkronize olmaz.

## Dosyalar

| Dosya | Görev |
|---|---|
| `index.html` | Sayfa iskeleti |
| `styles.css` | Tasarım |
| `app.js` | Tüm uygulama mantığı (takvim, vakitler, bildirim, hedefler) |
| `sw.js` | Çevrimdışı çalışma ve bildirim tıklaması |
| `manifest.webmanifest`, `icons/` | Ana ekrana kurulum |
