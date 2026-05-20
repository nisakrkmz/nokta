Track: A
# Nokta Audit-Forge Mission — Nisa Naz Korkmaz

Nokta host uygulamasına `@xtatistix/mobile-audit` widget entegrasyonu tamamlanmış, tespit edilen arayüz ve mantık hataları otonom **Forge Döngüleri** koşturularak başarıyla çözülmüştür. 

Bu projede **Track A — Sadelik (drop-in primitive disiplini)** yolu tercih edilmiş olup, tüm audit süreçleri ana uygulamanın bütünlüğünü bozmadan, minimal kod değişikliğiyle yürütülmüştür.

---

## 📱 1. Uygulama ve Demo Bilgileri

* **Expo Go Linki:** [expo.dev/@nisakrkmz/nokta-audit-forge](https://expo.dev/@nisakrkmz/nokta-audit-forge)
* **Demo Videosu (< 60sn):** [YouTube Shorts — Nokta Audit Demo](https://youtube.com/shorts/nokta-audit-forge-demo)
* **Derlenmiş APK:** Uygulama kök klasöründeki [app-release.apk](app-release.apk) dosyası teslim edilmiştir.

---

## ⚙️ 2. Kullanılan Yapay Zeka Araçları
Tüm Forge döngülerinde **Antigravity (Gemini 3.5 Flash)** ve **Claude Code CLI** araçları entegre biçimde kullanılmıştır.

* **Cycle 1:** Antigravity AI
* **Cycle 2:** Antigravity AI
* **Cycle 3:** Antigravity AI
* **Cycle 4 (Rollback):** Antigravity AI

---

## 🧠 3. Karar Günlüğü (Decision Log)

### [Karar 1] Orijinal Basit Navigasyona Geri Dönüş
* **Bağlam:** Çalışma dizininde React Navigation (Stack) mimarisine geçiş denenmiş, fakat bu durum hem hata setlerini değiştirmiş hem de paket boyutu ve derleme aşamalarında risk oluşturmuştur.
* **Karar:** `FORGE.md` ve `audit-reports/` ile tam uyum sağlamak ve en güvenli derleme (safe compilation) garantisini almak için projenin kararlı tab-navigasyonlu orijinal haline geri dönülmüştür.

### [Karar 2] tsconfig.json'da skipLibCheck Aktifleştirilmesi
* **Bağlam:** `@xtatistix/mobile-audit` paketi içinde TypeScript derleme hatası (`Spread types may only be created from object types`) alınmaktaydı.
* **Karar:** Kendi kodumuzda hata olmamasına rağmen üçüncü parti kütüphanelerin tip kontrollerini atlamak için `tsconfig.json` dosyasında `skipLibCheck: true` seçeneği eklenmiştir.

### [Karar 3] Buton Renginde Kontrast Tercihi
* **Bağlam:** Settings sayfasındaki görünmez "Reset All" butonu için kontrast oluşturacak renk aranmaktaydı.
* **Karar:** Buton yıkıcı (destructive) bir eylemi temsil ettiğinden, küresel tasarım standartlarına uyularak `#ff3b30` (Apple kırmızı tonu) seçilmiştir.

---

## 👥 4. İnsan Müdahale Noktaları (Human Touch Points)

* **Toplam Müdahale Sayısı:** **1**
* **Detay:** Sadece **Cycle 4 (Rollback Testi)** sırasında, kasıtlı olarak eklenen yazım hatasının ardından rollback (git restore) komutunu tetiklemek ve doğrulama yapmak için 1 kez insan yönlendirmesi gerçekleşmiştir. Diğer tüm hata düzeltmeleri otonom hipotezler aracılığıyla yapılmıştır.
