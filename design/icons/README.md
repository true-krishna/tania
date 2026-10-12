# TANIA Pulse icons

16 ikon outline 2 px, ujung membulat, grid 24 px. Satu detail violet atau mint per ikon.

## Pilihan 1: SVG sprite (HTML biasa)
Sisipkan isi `tania-icons.svg` di awal <body>, lalu:

    <svg width="24" height="24" aria-hidden="true"><use href="#tania-idp"/></svg>

## Pilihan 2: React
    import TaniaIcon from "./TaniaIcon";
    <TaniaIcon name="idp" size={20} />

## Warna (CSS)
    :root { --tania-primary:#875bf7; --tania-mint:#027a48; }
    @media (prefers-color-scheme: dark) { :root { --tania-mint:#6ce9a6; } }
    .icon { color: #212121; } /* garis utama */

Nama ikon: beranda, dashboard, profil, chapter, timesheet, workload, feasibility, budget, assignment, idp, evaluasi, profil-cv, master-data, jejak-audit, ask-tania, sinyal, notifikasi
