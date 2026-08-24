# Crystal Mobile — Evidencija prodaje

Mobilna web-aplikacija (PWA) za evidenciju kupovine/prodaje telefona, kalendar i statistiku zarade.
Radi potpuno u browseru — bez servera, bez baze — svi podaci se čuvaju lokalno na telefonu (u Safariju).

## Kako postaviti na GitHub Pages

1. Napravi novi **javni** repozitorijum na GitHub-u (npr. `crystal-mobile-app`).
2. Ubaci u njega sve fajlove iz ovog foldera (`index.html`, `style.css`, `app.js`, `manifest.json`,
   `service-worker.js`, logo `.jpg`).
3. Idi u repo → **Settings → Pages**.
4. Pod "Build and deployment" izaberi **Deploy from a branch**, granu `main`, folder `/ (root)` → Save.
5. Za par minuta aplikacija će biti dostupna na adresi tipa:
   `https://<tvoj-github-username>.github.io/crystal-mobile-app/`

## Kako drugar instalira ikonicu na iPhone (Safari)

1. Otvori taj link u **Safariju** (mora Safari, ne Chrome, da bi instalacija radila na iPhone-u).
2. Klikni na dugme **Podijeli** (kvadrat sa strelicom nagore, na dnu ekrana).
3. Izaberi **"Dodaj na Home Screen" / "Add to Home Screen"**.
4. Potvrdi naziv (npr. "Crystal Mobile") i klikni **Dodaj**.
5. Ikonica sa logom će se pojaviti na početnom ekranu i otvarati aplikaciju preko cijelog ekrana,
   kao prava aplikacija.

## Bitna napomena o podacima

Svi uneseni telefoni čuvaju se **lokalno u Safariju na tom telefonu** (nema centralne baze/servera).
To znači:

- Aplikacija radi i bez interneta (nakon prvog otvaranja).
- Ako se obriše Safari keš/podaci ("Clear History and Website Data") ili se promijeni telefon,
  evidencija se gubi.
- **Zbog toga postoji dugme "Izvezi backup (JSON)"** u meniju (☰ gore desno) — preporuka je da
  drugar s vremena na vrijeme (npr. jednom sedmično) uradi export i sačuva fajl (npr. pošalje sebi
  na email ili u iCloud Drive). Taj fajl se kasnije može vratiti preko "Uvezi backup (JSON)".
- Dugme "Izvezi u Excel (CSV)" pravi tabelu čitljivu u Excelu/Google Sheets za knjigovodstvo ili
  dijeljenje s nekim drugim.

## Šta aplikacija radi

- **Evidencija** — dodavanje telefona (model, datum i cijena kupovine, mjesto kupovine, napomena/IMEI),
  označavanje kao prodato (datum i cijena prodaje → automatski se računa zarada), pretraga i filter
  (Sve / U prodaji / Prodato), upozorenje kad telefon stoji u zalihi 30+ dana.
- **Kalendar** — mjesečni prikaz sa oznakama dana kupovine (plava tačka) i prodaje (zelena tačka),
  klik na dan prikazuje detalje.
- **Statistika** — ukupna zarada, zarada ovog mjeseca, ove sedmice, prosjek po telefonu, broj u
  zalihi, broj prodatih, prosječno dana do prodaje, grafikon zarade po mjesecima (zadnjih 6 mjeseci)
  i top 5 najprofitabilnijih modela.

## Ideje za dalje nadogradnje

Vidi poruku u razgovoru za detaljnu listu prijedloga (fotografije telefona, PIN zaključavanje,
IMEI provjera, praćenje dodatnih troškova, više prodavaca, itd.).
