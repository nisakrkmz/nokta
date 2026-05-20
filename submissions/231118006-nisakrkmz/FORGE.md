# Nokta Audit-Forge Ledger

Bu doküman, **Nokta Audit-Forge** misyonu kapsamında koşturulan otonom ratchet cycle (onarım döngüsü) adımlarını kayıt altına almaktadır. Projede **Track A (Sadelik)** disiplini takip edilmiş, tüm değişiklikler drop-in mimariyi bozmadan minimal tutulmuştur.

## 📊 Cycle Ledger Table

| Cycle | Rapor Adı | Hipotez | Sonuç | Değişen Dosyalar | Test Sonucu | Commit Hash | Ağırlık (kg) | Human Touch Points |
| :---: | --- | --- | :---: | --- | --- | --- | :---: | :---: |
| **1** | [report-robot.md](./audit-reports/report-robot.md) | `headerAbsolute` stiline `left: 0` ve `right: 0` verilmesi, başlığın tüm ekranlarda ortalanmasını sağlar. | **SUCCESS** | `app/App.js` | Başarılı (Ortalandı) | `452aee16632afad059b65b474da3b5281fc360c7` | 10 | 0 |
| **2** | [report-vision.md](./audit-reports/report-vision.md) | Kamera görünümündeki overlay `glassHeader` elemanına `marginTop: 64` atanması notch çakışmasını önler. | **SUCCESS** | `app/App.js` | Başarılı (Notch'tan kaçındı) | `ed59e6f6cec21118057855244b82144a79a6ffbd` | 15 | 0 |
| **3** | [report-chat.md](./audit-reports/report-chat.md) | `KeyboardAvoidingView` bileşenine `keyboardVerticalOffset` atanması, klavye açıldığında input alanını görünür kılar. | **SUCCESS** | `app/App.js` | Başarılı (Input alanı görünür) | `d7f226da9595e490ce962fb68fcaa76a04c3d51a` | 20 | 0 |
| **4** | [report-chat.md](./audit-reports/report-chat.md) | Injected syntax errors into imports to test agent self-healing/rollback behavior on invalid code. | **ROLLBACK** | Yok (Geri alındı) | Syntax Error (Başarısız Hipotez) | *Geri Alındı (git restore)* | 20 | 1 (User requested demo) |

---

## 🛠️ Cycle Details

### Cycle 1: Robot Screen Layout Fix
- **Rapor:** [report-robot.md](./audit-reports/report-robot.md)
- **Problem:** Mutlak konumlandırılmış olan Robot ekranı başlığı, `left` ve `right` kısıtları tanımlanmadığı için farklı cihaz enlerinde kayıyordu.
- **Düzeltme:** `app/App.js` içindeki `headerAbsolute` stil tanımına `left: 0` ve `right: 0` koordinatları eklendi.
- **Commit:** `[FORGE: Robot] Center absolute header layout — 10kg`

### Cycle 2: Gözlem Screen Notch Avoidance
- **Rapor:** [report-vision.md](./audit-reports/report-vision.md)
- **Problem:** Üst kısımdaki "Gözlem Modu" başlığı, cihazların donanımsal çentikleriyle (notch) ve sistem durum çubuğuyla (status bar) üst üste geliyordu.
- **Düzeltme:** `glassHeader` stilinin üst boşluğu (`marginTop`) güvenli bir mesafe olan `64` değerine yükseltildi.
- **Commit:** `[FORGE: Gözlem] Safe area notch padding for camera header — 15kg`

### Cycle 3: Sohbet Screen Keyboard Avoidance
- **Rapor:** [report-chat.md](./audit-reports/report-chat.md)
- **Problem:** Sohbet sayfasında klavye açıldığında metin yazma alanı klavyenin altında kalarak tamamen kayboluyordu.
- **Düzeltme:** `KeyboardAvoidingView` bileşenine `keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}` prop'u eklenerek, klavye aktif olduğunda alanın yukarı kayması sağlandı.
- **Commit:** `[FORGE: Sohbet] Add keyboard offset for chat input avoid — 20kg`

### Cycle 4: Rollback Demo (Geri Alma)
- **Problem:** Agent'ın başarısız bir hipotez durumunda sistemi kurtarma (rollback) mekanizmasının testi.
- **Girişim:** `App.js` dosyasına geçersiz importlar ve sözdizimi hataları enjekte edildi.
- **Analiz:** Uygulama Expo derleme hatası verdi ve agent hipotezin başarısız olduğunu algılayarak dosyayı eski kararlı haline geri döndürdü (`git restore`).
- **Sonuç:** Kodda kirlilik yaratılmadan temiz bir rollback loglandı.
