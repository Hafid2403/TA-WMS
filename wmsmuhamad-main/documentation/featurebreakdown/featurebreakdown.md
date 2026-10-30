# WMS Feature Breakdown

Dokumen ini menyediakan penjelasan menyeluruh mengenai fitur, alur kerja, dan model otorisasi yang diterapkan di dalam Warehouse Management System (WMS).

## User Authentication and Access Management

Subsistem autentikasi menangani akses pengguna yang aman, manajemen sesi, dan pemulihan credentials. Subsistem ini mengamankan semua transfer data dan akses rute di seluruh SPA klien dan REST API menggunakan otorisasi berbasis token.

### Login and Session Termination
Pengguna melakukan autentikasi dengan memasukkan alamat email terdaftar dan kata sandi mereka. Backend menghasilkan token Laravel Sanctum yang aman setelah autentikasi berhasil, yang disimpan di sisi klien untuk mengotorisasi permintaan API berikutnya. Permintaan logout akan membatalkan token Sanctum yang aktif baik di sisi klien maupun backend, sehingga menghapus data sesi.

### Profile Settings and Password Modification
Pengguna yang terautentikasi dapat mengakses informasi profil mereka, yang menampilkan detail seperti nama lengkap, alamat email, peran, dan gudang yang ditugaskan. Pengguna dapat mengubah kata sandi mereka dengan memasukkan kata sandi saat ini dan mengonfirmasi kata sandi baru. Backend memvalidasi kekuatan kata sandi baru dan melakukan enkripsi secara kriptografis sebelum menyimpannya.

### Password Recovery Requests and Approvals
Ketika seorang pengguna lupa kata sandi mereka, mereka dapat mengajukan permintaan reset kata sandi dari layar login dengan memasukkan alamat email mereka. Tindakan ini membuat catatan permintaan tertunda di dalam sistem. Pengguna dengan peran Master dapat melihat daftar permintaan reset yang tertunda. Pengguna Master dapat menyetujui permintaan tersebut, yang memicu pembuatan kata sandi sementara yang aman. Kata sandi sementara ini ditampilkan kepada pengguna Master untuk disampaikan kepada pemohon reset.

---

## Authorization Roles and Access Matrix

Sistem menerapkan mekanisme kontrol akses berbasis peran untuk menegakkan batas keamanan dan memisahkan tugas operasional. Terdapat empat peran pengguna yang berbeda, masing-masing dengan hak akses yang telah ditentukan.

### Peran Super Admin
Super Admin adalah peran administratif tertinggi di dalam sistem. Peran ini beroperasi secara global di semua gudang dan departemen. Pengguna Super Admin memiliki akses ke Dasbor Superadmin khusus yang memantau statistik global. Kemampuan utama meliputi aktivasi dan penolakan pengguna yang baru terdaftar, pembuatan dan pembaruan gudang secara penuh, pengelolaan semua akun pengguna di seluruh platform, serta kemampuan untuk memperbarui detail Goods Receipt.

### Peran Master
Peran Master bertindak sebagai administrator operasional untuk cabang gudang lokal. Pengguna Master mengelola data master lokal termasuk kategori, produk, vendor, departemen, dan pengguna lokal. Pengguna Master memiliki otoritas eksklusif untuk menyetujui atau menolak Material Request departemen, menyetujui rekonsiliasi audit stock opname untuk menyesuaikan inventaris fisik, membuat Purchase Order, dan melihat log aktivitas di seluruh sistem.

### Peran PIC
Peran PIC ditujukan bagi operator gudang yang mengelola tugas logistik harian. Pengguna PIC memulai pengiriman masuk dengan membuat Goods Receipt, mengajukan Material Request keluar untuk penggunaan departemen, dan memulai sesi perhitungan stock opname untuk memasukkan jumlah fisik barang. Mereka juga memiliki wewenang untuk mencatat zona penempatan barang (Putaway) dan membuat Goods Issue.

### Peran QC
Peran QC dikhususkan untuk inspektur penjaminan mutu. Pengguna QC melakukan inspeksi Quality Control masuk pada Goods Receipt yang tertunda. Mereka mencatat jumlah barang yang diterima dan ditolak, mencatat alasan penolakan, dan menulis catatan inspeksi yang terperinci. Pengguna QC memiliki akses baca-saja terhadap tingkat stok barang.

---

## Master Data Management

Master Data membentuk fondasi WMS, mendefinisikan sumber daya, entitas, dan parameter yang digunakan dalam operasi inventaris harian.

### Warehouse Registry
Sistem mencatat gudang dengan bidang untuk nama, alamat, kota, dan status aktif. Ini memungkinkan pemetaan pengguna ke gudang tertentu untuk membatasi akses data operasional.

### Department Registry
Departemen mewakili unit konsumsi internal yang meminta material dari gudang. Sistem mengelola nama departemen, kepala departemen yang ditugaskan, dan status aktif.

### Vendor and Supplier Management
Vendor memasok barang ke gudang. Sistem mencatat nama vendor, narahubung, nomor telepon, email, alamat, dan status aktif. Sistem ini juga melacak hubungan antara vendor dan produk tertentu, termasuk kode produk khusus vendor dan harga satuan.

### Product Catalog and Classification
Produk diklasifikasikan di bawah kategori. Sistem menyimpan nama produk, kode internal yang unik, unit pengukuran, deskripsi, batas stok minimum, dan status aktif. Sistem ini juga mengonfigurasi gudang mana yang mengelola masing-masing produk.

### User Account Administration
Akun pengguna lokal dikelola dengan bidang untuk nama, email, penugasan peran, penugasan gudang, dan status aktif. Pengguna Master dapat membuat, mengedit, atau menonaktifkan akun pengguna.

### Document Signature Configuration
Fitur ini memungkinkan penyesuaian kolom tanda tangan dokumen. Untuk setiap gudang, pengguna dapat mengonfigurasi kotak tanda tangan khusus untuk berbagai jenis dokumen termasuk Goods Receipt, Putaway, Stock Opname, Material Request, dan Goods Issue. Konfigurasi ini menentukan urutan tanda tangan, label kolom, peran terkait, nama pejabat yang menandatangani, dan jabatan resmi.

---

## Inbound Logistics and Quality Control

Alur masuk mengelola penerimaan produk dari vendor dan menerapkan pemeriksaan Quality Control sebelum barang dimasukkan ke dalam inventaris aktif.

### Purchase Order
Fitur Purchase Order memungkinkan pengguna Master untuk menyusun draf pesanan pembelian kepada vendor. Pengguna PIC atau Master dapat menerima pengiriman berdasarkan Purchase Order tersebut, memastikan bahwa jumlah yang masuk sesuai dengan jumlah yang dipesan.

### Goods Receipt Registration
Ketika pengiriman tiba di gudang, operator PIC membuat Goods Receipt. Dokumen tersebut mencatat gudang, vendor, petugas penerima, tanggal penerimaan, jenis penerimaan, dan item baris tertentu dengan jumlah yang diterima. Sistem menetapkan status awal berupa penangguhan Quality Control dan belum memperbarui tingkat inventaris.

### Quality Control Inspection
Inspektur QC meninjau Goods Receipt yang tertunda. Inspektur memasukkan jumlah barang yang lolos dan barang yang ditolak untuk setiap baris. Mereka menambahkan alasan penolakan dan catatan umum. Setelah dikirimkan, sistem mengubah status Goods Receipt menjadi lolos, sebagian lolos, atau ditolak berdasarkan jumlah tersebut.

### Inventory Mutation and Vendor Returns
Pengiriman inspeksi Quality Control memicu transaksi database yang melakukan dua tugas utama:
Pertama, jumlah barang yang diterima ditambahkan ke tingkat inventaris produk target di gudang tersebut.
Kedua, catatan pengembalian dibuat dalam tabel retur barang untuk setiap jumlah yang ditolak, menangkap detail vendor, kuantitas, alasan penolakan, dan status pengembalian.

---

## Outbound Logistics and Material Consumption

Alur keluar mengontrol bagaimana inventaris diminta oleh dan dikeluarkan untuk departemen internal.

### Material Request Submission
Operator PIC mengajukan Material Request ketika sebuah departemen perlu menarik stok. Permintaan tersebut menentukan gudang target, departemen yang meminta, nama pemohon, tanggal permintaan, dan daftar item yang diminta beserta jumlahnya. Permintaan dibuat dalam status tertunda.

### Review and Authorization Gate
Pengguna Master meninjau Material Request yang tertunda. Master dapat menyetujui atau menolak permintaan tersebut. Penolakan memerlukan pengisian alasan untuk pencatatan administratif.

### Pessimistic Inventory Deduction
Setelah persetujuan Material Request, sistem mengeksekusi transaksi database yang aman. Sistem menggunakan mekanisme penguncian pesimis untuk mengunci baris stok target guna mencegah race condition. Sistem memeriksa apakah jumlah yang tersedia cukup untuk semua item yang diminta. Jika cukup, sistem memotong jumlah tersebut dari stok yang tersedia dan menandai permintaan sebagai disetujui. Jika ada item yang kehabisan stok, transaksi akan dibatalkan, dan kesalahan akan dikembalikan.

### Goods Issue Registration
Fitur ini mencatat pengeluaran fisik dan pengiriman barang dari gudang ke departemen yang meminta, menyelesaikan siklus logistik keluar.

---

## Inventory Placements (Putaway)

Subsistem Putaway melacak lokasi fisik barang yang diterima di dalam tata letak gudang untuk mengoptimalkan waktu pengambilan barang di kemudian hari.

### Location Mapping
Untuk setiap produk di dalam gudang, sistem mencatat detail penempatan khusus termasuk zona, rak, dan wadah (bin).

### Putaway Recording
Operator PIC mencatat transaksi Putaway untuk mendokumentasikan bahwa barang telah dipindahkan dari area penerimaan ke slot penyimpanan yang ditentukan. Ini memastikan bahwa personel gudang dapat dengan mudah menemukan barang.

---

## Inventory Audit and Stock Opname

Modul Stock Opname menyediakan alur kerja audit untuk merekonsiliasi perbedaan antara catatan sistem dan inventaris fisik secara nyata.

### Session Initialization
Operator PIC memulai sesi Stock Opname untuk gudang tertentu. Sistem menghasilkan header opname dan mengatur status sesi menjadi sedang berlangsung.

### Physical Count Intake
Operator PIC melakukan perhitungan fisik barang di gudang dan memasukkan jumlahnya ke dalam sistem. Untuk setiap barang, sistem mengambil kuantitas sistem saat ini dan menghitung selisihnya. Status sesi kemudian diperbarui menjadi selesai.

### Master Reconciliation and Adjustments
Pengguna Master meninjau sesi opname yang telah selesai dan perbedaan yang dihitung. Master dapat menyetujui atau menolak temuan tersebut. Setelah disetujui, sistem membuat entri audit permanen di tabel penyesuaian stok. Sistem kemudian menulis ulang kuantitas inventaris di tabel stok agar sesuai dengan hitungan fisik yang diverifikasi, mengoreksi pembukuan.

---

## Reports and Audit Trail

Modul pelaporan menyediakan log untuk melacak aktivitas sistem dan pergerakan inventaris guna akuntabilitas kerja.

### System Activity Logs
Sistem mencatat tindakan pengguna termasuk login, logout, pembuatan, pembaruan, penghapusan, dan perubahan status. Pengguna Master dapat melihat log ini untuk melacak tindakan kembali ke pengguna tertentu.

### Stock Movement History
Laporan pergerakan stok melacak setiap mutasi inventaris. Laporan ini mencatat tanggal, produk, gudang, jenis transaksi, perubahan kuantitas, dan nomor dokumen referensi. Hal ini memungkinkan pengguna untuk melacak siklus hidup item stok apa pun.
