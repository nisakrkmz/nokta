# Nokta Expert Bridge & Stuck Heuristics Documentation

Bu belge, otonom onarım (Forge) döngüsünün tıkanması durumunda devreye giren **Stuck Heuristics** kurallarını ve canlı **WebRTC Uzman Köprüsü (Bridge)** entegrasyonunun detaylarını ve çağrı günlüklerini içerir.

---

## 💡 Stuck Detection Heuristics (Tıkanma Heuristiği)

Onarım döngüsünde (Forge loop), aynı modül üzerinde veya ilişkili dosyalarda arka arkaya yapılan denemelerde kilitlenme tespit edilirse "Uzman Köprüsü" tetiklenir:
1. **Ardışık Başarısızlık Eşiği:** Bir hipotez / onarım cycle'ı üst üste **2 kez FAIL** veya **ROLLBACK** durumuna düşerse, sistem otonom olarak `STUCK` bayrağını kaldırır.
2. **Kriter Eşleşmesi:**
   * Hata mesajının (Error Log) aynı dosyadaki benzer satırları işaret etmesi.
   * Expo derleme sürecinin syntax hatasını giderememesi.
3. **Eylem:** AI Asistanı durumun tıkandığını sesli olarak bildirir ve arayüzde Canlı WebRTC görüntülü arama arayüzünü (Jitsi Meet WebView) açar.

---

## 📞 WebRTC Uzman Çağrı Günlüğü (Transcript)

* **Tarih:** 11 Haziran 2026, 21:53
* **Kanal:** WebRTC (Jitsi Meet)
* **Katılımcılar:** Nisa Naz Korkmaz (Öğrenci) & Sınıf Arkadaşı (Uzman)
* **Süre:** 65 saniye (Ekran paylaşımlı)

### Konuşma Transkripti:

> **[00:05] Nisa:** Merhaba, sesim geliyor mu? Şu an ekranı paylaşıyorum.
> 
> **[00:12] Uzman:** Evet, gayet net geliyor sesin ve ekranın da geldi. Sorun nedir?
> 
> **[00:20] Nisa:** Avatar dudak senkronizasyonu ve kilitlenme (stuck) tespiti algoritmalarındaki gecikme hedefini 200ms'nin altına çekmeye çalışıyoruz. Ancak ardışık rollback döngüsü sonrasında sistem kilitlendi, agent çözemiyor.
> 
> **[00:35] Uzman:** Anladım. `Avatar.js` içerisindeki morph target interpolasyonundaki lerp katsayısını `0.2`'den `0.15`'e çekebilirsin, bu geçişi yumuşatır ve gecikme hissini azaltır. Ayrıca WebView donanım hızlandırma modunun açık olduğundan emin ol.
> 
> **[00:48] Nisa:** Harika öneri, lerp katsayısını optimize edeceğim. Bir de WebView'da donanım hızlandırma aktif görünüyor.
> 
> **[00:55] Uzman:** Tamamdır, bu düzenlemeyle animasyon daha akıcı olacaktır. Kolay gelsin!
> 
> **[01:02] Nisa:** Çok teşekkür ederim desteğin için. Görüşmek üzere!

---

## 🔄 Sonraki Döngülere Feed-Forward (Besleme)
* **Alınan Karar:** `Avatar.js` içerisindeki morphTarget lerp katsayısı `0.15` olarak güncellenecektir.
* **Sonuç:** Görüşme transkriptinden elde edilen bu veri bir sonraki Forge onarım cycle'ına bağlam (context) olarak aktarılmıştır.
