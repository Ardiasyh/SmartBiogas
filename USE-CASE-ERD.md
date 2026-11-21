# Use Case dan ERD Smart Biogas

Dokumen ini menggambarkan fitur dan struktur data yang benar-benar digunakan oleh aplikasi saat ini. Sistem memakai Firebase Authentication untuk akun, Cloud Firestore untuk profil pengguna, dan Firebase Realtime Database untuk telemetri perangkat.

## Use Case Diagram

```mermaid
flowchart LR
  visitor["👤 Pengunjung"]
  pending["👤 User Pending"]
  user["👤 User Aktif"]
  admin["👤 Administrator"]
  device["📟 Perangkat IoT"]

  subgraph system["Sistem Monitoring Smart Biogas"]
    direction TB

    subgraph public["Akses publik dan akun"]
      UC01([Melihat landing page])
      UC02([Mendaftar akun])
      UC03([Login])
      UC04([Verifikasi email])
      UC05([Reset password])
      UC06([Melengkapi profil])
      UC07([Melihat status persetujuan])
    end

    subgraph user_features["Fitur user aktif"]
      UC08([Melihat status perangkat])
      UC09([Melihat telemetri realtime])
      UC10([Melihat grafik histori])
      UC11([Memilih rentang 7 hari, 1 bulan, atau 3 bulan])
      UC12([Melihat estimasi dampak substitusi LPG])
      UC13([Mengunduh Excel data lengkap])
      UC14([Mengunduh PDF dan ringkasan])
      UC15([Melihat lokasi instalasi])
      UC16([Melihat dan memperbarui nama profil])
    end

    subgraph admin_features["Fitur administrator"]
      UC17([Melihat ringkasan seluruh sistem])
      UC18([Melihat agregasi energi, flowrate, dan tekanan])
      UC19([Melihat peta perangkat online dan offline])
      UC20([Mencari, menyortir, dan memfilter user])
      UC21([Memeriksa akun dan status verifikasi email])
      UC22([Mengubah data user])
      UC23([Menetapkan Device ID dan lokasi instalasi])
      UC24([Mengaktifkan akun user])
      UC25([Melihat detail realtime dan histori perangkat])
      UC26([Memfilter histori berdasarkan preset atau tanggal])
      UC27([Mengunduh laporan perangkat])
    end

    subgraph telemetry["Akuisisi data"]
      UC28([Mengirim telemetri realtime])
      UC29([Menyimpan log telemetri])
    end
  end

  visitor --> UC01
  visitor --> UC02
  visitor --> UC03
  visitor --> UC04
  visitor --> UC05

  pending --> UC03
  pending --> UC04
  pending --> UC06
  pending --> UC07

  user --> UC03
  user --> UC05
  user --> UC08
  user --> UC09
  user --> UC10
  user --> UC12
  user --> UC13
  user --> UC14
  user --> UC15
  user --> UC16
  UC10 -. "include" .-> UC11

  admin --> UC03
  admin --> UC17
  admin --> UC18
  admin --> UC19
  admin --> UC20
  admin --> UC21
  admin --> UC22
  admin --> UC23
  admin --> UC24
  admin --> UC25
  admin --> UC27
  UC24 -. "include" .-> UC21
  UC24 -. "include" .-> UC23
  UC25 -. "include" .-> UC26

  device --> UC28
  device --> UC29
```

### Aturan akses utama

- User baru dibuat dengan `role = user` dan `status = pending`.
- User hanya memperoleh akses dashboard setelah profil lengkap dan status akun menjadi `active`.
- Aktivasi user mensyaratkan `deviceId`, latitude, dan longitude telah ditetapkan administrator.
- User hanya dapat membaca data perangkat yang tercantum pada claim `deviceId` miliknya.
- Administrator dapat membaca semua profil pengguna dan telemetri perangkat.
- Perangkat IoT hanya dapat menulis ke node realtime dan log dengan `deviceId` yang sama seperti claim perangkat.

## Entity Relationship Diagram

ERD berikut merupakan model konseptual dari penyimpanan NoSQL aplikasi. `DEVICE` direpresentasikan oleh key `deviceId` pada Realtime Database, sedangkan kepemilikannya disimpan melalui atribut `users.deviceId` di Firestore.

```mermaid
erDiagram
  AUTH_ACCOUNT ||--|| USER_PROFILE : "memiliki profil"
  USER_PROFILE ||--o| DEVICE : "ditetapkan ke"
  DEVICE ||--o| REALTIME_TELEMETRY : "memiliki snapshot"
  DEVICE ||--o{ TELEMETRY_LOG : "menghasilkan"

  AUTH_ACCOUNT {
    string uid PK
    string email UK
    boolean emailVerified
  }

  USER_PROFILE {
    string uid PK, FK
    string fullname
    string email
    string role "admin | user"
    string status "active | pending | disabled"
    boolean profileCompleted
    string province
    string city
    string address
    string deviceId FK "opsional"
    string locationName "opsional"
    number lat "opsional"
    number lng "opsional"
    timestamp createdAt
  }

  DEVICE {
    string deviceId PK
  }

  REALTIME_TELEMETRY {
    string deviceId PK, FK
    number timestamp
    number energy "legacy field carrying instantaneous power in kW"
    number flowrate
    number pressure
    number temperature
    number mass "kg/h, optional"
    string status "opsional"
  }

  TELEMETRY_LOG {
    string logId PK
    string deviceId FK
    number timestamp
    number energy "legacy field carrying instantaneous power in kW"
    number flowrate
    number pressure
    number temperature
    number mass "kg/h, optional"
    string status "opsional"
  }
```

## Pemetaan ke Firebase

| Entitas | Lokasi penyimpanan | Kunci |
|---|---|---|
| `AUTH_ACCOUNT` | Firebase Authentication | `uid` |
| `USER_PROFILE` | Cloud Firestore `users/{uid}` | `uid` |
| `DEVICE` | Firebase Realtime Database `biogasData/{deviceId}` | `deviceId` |
| `REALTIME_TELEMETRY` | `biogasData/{deviceId}/realtime` | `deviceId` dari parent node |
| `TELEMETRY_LOG` | `biogasData/{deviceId}/logs/{logId}` | `logId` |

Firmware menggunakan key RTDB `energy` untuk nilai daya sesaat dalam kW. Web menormalisasikannya sebagai `powerKw`, dan tetap membaca `energy` agar sesuai dengan payload perangkat. `deviceId` adalah ID string yang ditetapkan per alat pada profil Firestore; nilai firmware dan profil harus sama persis. Field `mass` bersifat opsional dan berisi laju massa kg/jam.

## Kardinalitas

- Satu akun autentikasi memiliki tepat satu profil pengguna.
- Satu profil user dapat belum memiliki perangkat atau memiliki satu perangkat.
- Satu perangkat ditetapkan kepada satu user pada model aplikasi saat ini.
- Satu perangkat mempunyai satu snapshot realtime dan dapat menghasilkan banyak log histori.
- Administrator tetap disimpan pada entitas `USER_PROFILE`; pembeda aksesnya adalah nilai `role`.
