# ✉️ Template Email HTML Resmi - Soodap POS (Lengkap 6 Template)

Berikut adalah **6 Template Email HTML Resmi Soodap POS** (termasuk Invite User & Reauthentication) yang sudah siap disalin ke Supabase Dashboard (**Authentication > Email Templates**):

---

## 1. Template 1: Konfirmasi Pendaftaran Resto Baru (Confirm Signup)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Confirm Signup`  
**Subject**: `Konfirmasi Pendaftaran Resto Anda - Soodap POS 🏪`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pendaftaran Resto - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <!-- Official Soodap POS Logo Image -->
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Selamat Datang di Soodap POS! 🎉
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Terima kasih telah mendaftarkan resto Anda. Satu langkah lagi untuk mengaktifkan akun resto dan membuka sistem kasir real-time Anda.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Silakan klik tombol di bawah ini untuk mengonfirmasi alamat email Anda:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #FF5722;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #FF5722;">
                      Konfirmasi Akun Resto ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F4F5; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #71717A; line-height: 1.5;">
                    💡 <strong>Catatan:</strong> Link konfirmasi ini berlaku selama 24 jam. Jika tombol di atas tidak dapat diklik, salin dan tempelkan link berikut pada browser Anda:<br>
                    <a href="{{ .ConfirmationURL }}" style="color: #FF5722; word-break: break-all; font-size: 11px;">{{ .ConfirmationURL }}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.<br>
                Jika Anda tidak merasa mendaftar di Soodap POS, silakan abaikan email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Template 2: Undangan Pengguna / Staf (Invite User)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Invite user`  
**Subject**: `Undangan Bergabung ke Tim Resto - Soodap POS 🤝`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Undangan Resto - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <!-- Official Soodap POS Logo Image -->
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Anda Diundang Bergabung! 🤝
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Anda telah diundang untuk bergabung ke dalam tim manajemen dan operasional resto di platform Soodap POS.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Silakan klik tombol di bawah ini untuk menerima undangan dan mengaktifkan akun tim Anda:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #FF5722;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #FF5722;">
                      Terima Undangan Tim ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Note Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F4F5; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #71717A; line-height: 1.5;">
                    💡 <strong>Info Tambahan:</strong> Setelah menerima undangan, Anda dapat langsung mengelola pesanan, produk, atau transaksi sesuai hak akses peran Anda.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Template 3: Lupa / Atur Ulang Password (Reset Password)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Reset Password`  
**Subject**: `Atur Ulang Password Resto Anda - Soodap POS 🔑`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Ulang Password - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Permintaan Atur Ulang Password 🔐
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Kami menerima permintaan untuk mengatur ulang password akun resto Anda di Soodap POS.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Klik tombol di bawah ini untuk membuat password baru yang aman:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #FF5722;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #FF5722;">
                      Buat Password Baru 🔑
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FEF2F2; border-radius: 10px; border: 1px solid #FEE2E2; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #991B1B; line-height: 1.5;">
                    ⚠️ <strong>Peringatan Keamanan:</strong> Jika Anda tidak melakukan permintaan atur ulang password ini, harap abaikan email ini. Password Anda akan tetap aman.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.<br>
                Email keamanan otomatis dikirimkan dari sistem Soodap POS.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Template 4: Magic Link / Kode OTP Masuk Cepat (Magic Link)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Magic Link`  
**Subject**: `Link Masuk Cepat & Verifikasi - Soodap POS ⚡`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuk Cepat - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Link Masuk Cepat ⚡
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Gunakan tombol di bawah ini untuk langsung masuk ke sistem aplikasi Soodap POS tanpa perlu mengetikkan password:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #FF5722;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #FF5722;">
                      Masuk Aplikasi POS ➔
                    </a>
                  </td>
                </tr>
              </table>

              <!-- OTP Token Display -->
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #71717A; text-align: center;">
                Atau gunakan Kode Verifikasi OTP ini:
              </p>
              <div style="background-color: #FAFAFA; border: 1px dashed #D4D4D8; border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 26px; font-weight: 900; letter-spacing: 6px; color: #FF5722; font-family: monospace;">{{ .Token }}</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.<br>
                Jangan berikan kode verifikasi ini kepada siapapun demi keamanan resto Anda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Template 5: Perubahan Alamat Email (Change Email Address)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Change Email Address`  
**Subject**: `Konfirmasi Perubahan Email Resto - Soodap POS ✉️`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perubahan Email - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <!-- Official Soodap POS Logo Image -->
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Konfirmasi Email Baru ✉️
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Anda mengajukan perubahan alamat email untuk akun Soodap POS Anda. Silakan klik tombol di bawah ini untuk mengonfirmasi email baru:
              </p>

              <!-- Primary Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #FF5722;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #FFFFFF; text-decoration: none; border-radius: 12px; background-color: #FF5722;">
                      Konfirmasi Email Baru ➔
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Template 6: Otentikasi Ulang (Reauthentication)

**Lokasi di Supabase**: `Authentication` > `Email Templates` > `Reauthentication`  
**Subject**: `{{ .Token }} adalah kode otentikasi keamanan resto Anda - Soodap POS`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Otentikasi Keamanan - Soodap POS</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAFA; font-family:'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAFAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#FFFFFF; border-radius: 20px; border: 1px solid #E4E4E7; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #FFF5F2; padding: 32px 24px; border-bottom: 1px solid #FFE4DD;">
              <!-- Official Soodap POS Logo Image -->
              <img src="https://lh3.googleusercontent.com/d/1_tkN7OIkzVSikvXLu363-hklyvDIpgDF" alt="Soodap POS" style="height: 54px; width: auto; max-width: 220px; display: block; margin: 0 auto;" />
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #71717A;">
                Bisnis Resto Lancar, Senyum Lebar
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #18181B;">
                Kode Otentikasi Keamanan 🛡️
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #52525B;">
                Gunakan kode verifikasi keamanan berikut untuk memverifikasi identitas dan tindakan pada akun resto Anda:
              </p>

              <!-- OTP Token Display -->
              <div style="background-color: #FFF5F2; border: 2px dashed #FF5722; border-radius: 14px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 30px; font-weight: 900; letter-spacing: 8px; color: #FF5722; font-family: monospace;">{{ .Token }}</span>
              </div>

              <!-- Warning Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F4F5; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #71717A; line-height: 1.5;">
                    🔒 <strong>Keamanan:</strong> Kode ini berlaku dalam waktu singkat. Jangan berikan kode ini kepada siapapun demi keamanan resto Anda.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAFAFA; padding: 20px 24px; border-top: 1px solid #F4F4F5;">
              <p style="margin: 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                &copy; Soodap POS — Platform Kasir & Manajemen Restoran Modern.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
