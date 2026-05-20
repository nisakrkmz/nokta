Track: A

# Nokta Audit-Forge — 231118006 Nisa Naz Korkmaz

Bu proje, **Nokta Audit-Forge Mission** kapsamında geliştirilen ve kullanıcının en çok sevdiği **mascot-based (Three.js/Robot) premium mobil AI asistanı** tabanına inşa edilen, `@xtatistix/mobile-audit` widget entegreli kuluçka ortamıdır. 

Uygulamada **Track A (Sadelik)** disiplini benimsenmiş olup, audit widget'ının drop-in yapısı host uygulamadan tamamen izole tutulmuş ve onarım işlemleri minimum kod müdahalesiyle tamamlanmıştır.

---

## 📝 Submission Info
- **Öğrenci No:** 231118006
- **Slug:** nokta-nisa
- **Track:** Track A — Sadelik (Drop-in Primitive Discipline)
- **Human Touch Points:** 1 (Sadece Rollback Demo talebindeki yönlendirme)

---

## ✅ Checklist
- [x] Yalnızca `submissions/231118006-nisakrkmz/` altında değişiklik yapıldı.
- [x] README'nin ilk satırında `Track: A` açıkça belirtildi.
- [x] `audit-reports/` altında en az 3 adet görsel kanıtlı Markdown raporu sunuldu.
- [x] `FORGE.md` ledger tablosu oluşturuldu (3 başarılı + 1 rollback cycle).
- [x] `app-release.apk` klasörde hazır halde teslim edildi.
- [x] README'de detaylı decision log, human touch points ve AI tool log mevcut.

---

## 🖼️ Ekran Görüntüleri

| 🤖 Robot Mascot (Analiz) | 📸 Gözlem Modu (Vision) | 🦾 Sohbet Modu (Geçmiş) |
|:---:|:---:|:---:|
| ![Robot Analiz](./assets/ss1.jpg) | ![Gözlem Modu](./assets/ss2.jpg) | ![Sohbet Modu](./assets/ss3.jpg) |

---

## 🎯 Proje Açıklaması & Audit Entegrasyonu

Nokta Vision, kullanıcıyı interaktif bir **Robot Mascot (Nokta Bot)** ile karşılayan, sesli ve görsel komutları kuluçkalayan yenilikçi bir AI asistanıdır. Fikirler, multimodal analiz (ses transkripsiyonu ve kamera görsel tanıma) kanallarıyla zenginleştirilir ve gerektiğinde uzman sistemlerine yönlendirilir.

### 🐞 Drop-in Audit Widget Entegrasyonu
Müşterinin/geliştiricinin görsel arayüz aksaklıklarını yakalaması ve otonom onarıma beslemesi için `@xtatistix/mobile-audit` paketi `app/App.js` dosyasına başarıyla monte edilmiştir. 
Widget, host uygulama sınırlarını ihlal etmeyecek şekilde tamamen dependency injection (`captureRef`, `captureScreen`, `writeFile`, `shareFile` ve `AsyncStorage` tabanlı `storage` köprüleri) ile beslenmektedir.

```javascript
/* Tek Satır Drop-in Mount */
<AuditWidget deps={auditDeps} currentScreen={view} />
```

---

## 📱 Expo QR & Demo Video

> **Expo Go ile test etmek için:**
> 🔗 [Expo Dev Build](https://expo.dev/@nisakrkmz/nokta-nisa)

> **Projenin 60 Saniyeden Kısa Tanıtım Videosu:**
> 📹 [NisaDot — Audit-Forge Demo Video](https://www.youtube.com/shorts/HrEOj4IpQmM)

---

## 📦 APK Bilgileri

> [!TIP]
> **app-release.apk** dosyası bu klasörün kök dizininde mevcuttur. Kurulum için APK dosyasını Android cihazınıza yükleyip "Bilinmeyen Kaynaklar" iznini onaylamanız yeterlidir.

---

## 📓 Decision Log

### 2026-05-20 — Mascot-Based Geri Dönüş ve Entegrasyon
- **Kullanıcı Tercihi:** Kullanıcının isteği üzerine sadeleştirilmiş temel tab gezintisi yerine robot maskotlu ve 3D tasarımlı özgün projeye dönülmesine karar verildi.
- **Audit Widget Kararlılığı:** Mascot uygulamasının JS tabanlı yapısına `@xtatistix/mobile-audit` sorunsuz şekilde entegre edildi.
- **Cycle 1 (Robot Layout):** Mutlak hizalanmış başlığın donanım genişliklerine göre ortalanamaması sorunu giderildi (`left: 0`, `right: 0` eklendi).
- **Cycle 2 (Gözlem Notch):** Gözlem modunda üst çentik çarpışmasını engellemek için `glassHeader` üst boşluğu `64` birime çekildi.
- **Cycle 3 (Sohbet Keyboard):** Sohbet arayüzünde klavye açılınca giriş alanının gizlenmesi engellendi (`keyboardVerticalOffset` eklendi).
- **Cycle 4 (Rollback Demo):** Hatalı kod enjeksiyonunun Expo derleyicisi tarafından reddedilmesi ve sistemin `git restore` ile hızlıca stabil haline geri döndürülmesi test edildi.

---

## 🛠️ AI Tool Log

| Tool | Kullanım Amacı | Ayrıntı |
| :---: | --- | --- |
| **Antigravity** | Kod Asistanı & Koordinatör | Proje dosyalarının checkout edilmesi, audit entegrasyonu, onarım döngüleri ve markdown belgelerinin oluşturulması. |
| **StitchMCP** | UI & Görsel Tasarım | Glassmorphism ve 3D robot maskotu uyumluluk analizi. |
| **Gemini 1.5 Flash** | Multimodal Zekâ | Proje içi ses/görüntü analizleri için kullanılan arka plan API'si. |

---

## 📂 Dosya Yapısı

```
submissions/231118006-nisakrkmz/
├── README.md            ← Bu dosya (Track A etiketiyle başlar)
├── FORGE.md             ← Otonom onarım ve geri alma kayıt defteri
├── app-release.apk      ← Önceden derlenmiş Android paketi
├── idea.md              ← Proje fikir detayları
├── app/                 ← Expo + Javascript kaynak kodları
│   ├── App.js           ← Kök bileşen ve Audit entegrasyonu
│   ├── assets/          ← Uygulama robot ve görsel varlıkları
│   ├── components/      ← 3D Avatar ve alt bileşenler
│   └── services/        ← Gemini entegrasyon servisleri
├── audit-reports/       ← Kusur raporları
│   ├── report-robot.md  ← Robot başlık sorunu
│   ├── report-vision.md ← Kamera çentik sorunu
│   └── report-chat.md   ← Klavye engel sorunu
└── assets/              ← Tanıtıcı ekran görüntüleri
```
