(function () {
  "use strict";

  var STORAGE_KEY = "crystalmobile_phones_v1";
  var MODEL_SUGGESTIONS = [
    "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17", "iPhone 16 Pro Max", "iPhone 16 Pro",
    "iPhone 16 Plus", "iPhone 16", "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro Max",
    "iPhone 14", "iPhone 13", "iPhone SE",
    "Samsung Galaxy S25 Ultra", "Samsung Galaxy S25+", "Samsung Galaxy S25", "Samsung Galaxy S24 Ultra",
    "Samsung Galaxy S24+", "Samsung Galaxy S24", "Samsung Galaxy Z Fold6", "Samsung Galaxy Z Flip6",
    "Samsung Galaxy A55", "Samsung Galaxy A35",
    "Xiaomi 14", "Xiaomi Redmi Note 13", "Google Pixel 9 Pro", "Google Pixel 9", "OnePlus 12", "Huawei P60 Pro"
  ];

  var state = {
    phones: loadPhones(),
    activeTab: "evidencija",
    statusFilter: "sve",
    searchQuery: "",
    calendarDate: new Date(),
    selectedDay: null
  };

  // ---------- STORAGE ----------
  function loadPhones() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Greška pri učitavanju podataka", e);
      return [];
    }
  }

  function savePhones() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.phones));
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  // ---------- HELPERS ----------
  function formatKM(n) {
    n = Number(n) || 0;
    return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " KM";
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[2] + "." + parts[1] + "." + parts[0] + ".";
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    var d1 = new Date(a + "T00:00:00");
    var d2 = new Date(b + "T00:00:00");
    return Math.round((d2 - d1) / 86400000);
  }

  function profitOf(p) {
    if (p.status !== "prodato") return null;
    return (Number(p.salePrice) || 0) - (Number(p.purchasePrice) || 0);
  }

  function getStartOfWeek(d) {
    var date = new Date(d);
    var day = date.getDay();
    var diff = (day === 0 ? -6 : 1) - day; // Monday as start
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // ---------- TAB NAVIGATION ----------
  document.querySelectorAll(".nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.activeTab = btn.dataset.tab;
      document.querySelectorAll(".nav-btn").forEach(function (b) { b.classList.toggle("active", b === btn); });
      document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.hidden = panel.id !== "tab-" + state.activeTab;
      });
      if (state.activeTab === "kalendar") renderCalendar();
      if (state.activeTab === "statistika") renderStats();
    });
  });

  // ---------- MENU SHEET ----------
  var menuSheet = document.getElementById("menuSheet");
  document.getElementById("menuBtn").addEventListener("click", function () { menuSheet.classList.add("open"); });
  document.getElementById("closeMenuBtn").addEventListener("click", function () { menuSheet.classList.remove("open"); });
  menuSheet.addEventListener("click", function (e) { if (e.target === menuSheet) menuSheet.classList.remove("open"); });

  document.getElementById("exportJsonBtn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(state.phones, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "crystal-mobile-backup-" + todayISO() + ".json";
    a.click();
    URL.revokeObjectURL(url);
    menuSheet.classList.remove("open");
  });

  document.getElementById("importJsonBtn").addEventListener("click", function () {
    document.getElementById("importFileInput").click();
  });

  document.getElementById("importFileInput").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Neispravan format");
        if (confirm("Uvoz će DODATI " + data.length + " unosa postojećoj evidenciji. Nastaviti?")) {
          state.phones = state.phones.concat(data);
          savePhones();
          renderAll();
        }
      } catch (err) {
        alert("Greška pri čitanju fajla: " + err.message);
      }
      menuSheet.classList.remove("open");
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("exportCsvBtn").addEventListener("click", function () {
    var rows = [["Model", "Datum kupovine", "Cijena kupovine", "Mjesto kupovine", "Status", "Datum prodaje", "Cijena prodaje", "Zarada", "Napomena"]];
    state.phones.forEach(function (p) {
      rows.push([
        p.model, p.purchaseDate, p.purchasePrice, p.purchaseLocation || "",
        p.status === "prodato" ? "Prodato" : "U prodaji",
        p.saleDate || "", p.salePrice || "", p.status === "prodato" ? profitOf(p) : "", p.notes || ""
      ]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "crystal-mobile-evidencija-" + todayISO() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    menuSheet.classList.remove("open");
  });

  document.getElementById("clearAllBtn").addEventListener("click", function () {
    if (confirm("Ovo će trajno obrisati SVE podatke iz evidencije. Preporučuje se prvo napraviti backup. Da li si siguran?")) {
      state.phones = [];
      savePhones();
      renderAll();
      menuSheet.classList.remove("open");
    }
  });

  // ---------- MODEL SUGGESTIONS ----------
  var datalist = document.getElementById("modelSuggestions");
  MODEL_SUGGESTIONS.forEach(function (m) {
    var opt = document.createElement("option");
    opt.value = m;
    datalist.appendChild(opt);
  });

  // ---------- PHONE MODAL ----------
  var phoneModal = document.getElementById("phoneModal");
  var phoneForm = document.getElementById("phoneForm");
  var soldSection = document.getElementById("soldSection");
  var soldFields = document.getElementById("soldFields");
  var isSoldCheckbox = document.getElementById("isSoldCheckbox");
  var deletePhoneBtn = document.getElementById("deletePhoneBtn");

  function openPhoneModal(phone) {
    phoneForm.reset();
    document.getElementById("phoneId").value = phone ? phone.id : "";
    document.getElementById("phoneModalTitle").textContent = phone ? "Izmijeni telefon" : "Nova nabavka";
    document.getElementById("model").value = phone ? phone.model : "";
    document.getElementById("purchaseDate").value = phone ? phone.purchaseDate : todayISO();
    document.getElementById("purchasePrice").value = phone ? phone.purchasePrice : "";
    document.getElementById("purchaseLocation").value = phone ? (phone.purchaseLocation || "") : "";
    document.getElementById("notes").value = phone ? (phone.notes || "") : "";

    soldSection.hidden = !phone;
    deletePhoneBtn.hidden = !phone;

    var isSold = !!(phone && phone.status === "prodato");
    isSoldCheckbox.checked = isSold;
    soldFields.hidden = !isSold;
    document.getElementById("saleDate").value = phone && phone.saleDate ? phone.saleDate : todayISO();
    document.getElementById("salePrice").value = phone && phone.salePrice ? phone.salePrice : "";
    updateProfitPreview();

    phoneModal.classList.add("open");
  }

  function closePhoneModal() {
    phoneModal.classList.remove("open");
  }

  document.getElementById("addBtn").addEventListener("click", function () { openPhoneModal(null); });
  document.getElementById("closePhoneModalBtn").addEventListener("click", closePhoneModal);
  phoneModal.addEventListener("click", function (e) { if (e.target === phoneModal) closePhoneModal(); });

  isSoldCheckbox.addEventListener("change", function () {
    soldFields.hidden = !isSoldCheckbox.checked;
    updateProfitPreview();
  });

  ["input"].forEach(function (evt) {
    document.getElementById("salePrice").addEventListener(evt, updateProfitPreview);
    document.getElementById("purchasePrice").addEventListener(evt, updateProfitPreview);
  });

  function updateProfitPreview() {
    var el = document.getElementById("profitPreview");
    if (isSoldCheckbox.hidden || !isSoldCheckbox.checked) { el.textContent = ""; return; }
    var purchase = Number(document.getElementById("purchasePrice").value) || 0;
    var sale = Number(document.getElementById("salePrice").value) || 0;
    var profit = sale - purchase;
    el.textContent = "Zarada: " + formatKM(profit);
    el.className = "profit-preview " + (profit >= 0 ? "profit-pos" : "profit-neg");
  }

  phoneForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var id = document.getElementById("phoneId").value;
    var isSold = !soldSection.hidden && isSoldCheckbox.checked;

    var data = {
      id: id || uid(),
      model: document.getElementById("model").value.trim(),
      purchaseDate: document.getElementById("purchaseDate").value,
      purchasePrice: Number(document.getElementById("purchasePrice").value) || 0,
      purchaseLocation: document.getElementById("purchaseLocation").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      status: isSold ? "prodato" : "u_prodaji",
      saleDate: isSold ? document.getElementById("saleDate").value : null,
      salePrice: isSold ? (Number(document.getElementById("salePrice").value) || 0) : null
    };

    if (id) {
      var idx = state.phones.findIndex(function (p) { return p.id === id; });
      if (idx > -1) state.phones[idx] = data;
    } else {
      state.phones.push(data);
    }
    savePhones();
    closePhoneModal();
    renderAll();
  });

  deletePhoneBtn.addEventListener("click", function () {
    var id = document.getElementById("phoneId").value;
    if (!id) return;
    if (confirm("Obrisati ovaj unos iz evidencije?")) {
      state.phones = state.phones.filter(function (p) { return p.id !== id; });
      savePhones();
      closePhoneModal();
      renderAll();
    }
  });

  // ---------- EVIDENCIJA LIST ----------
  document.getElementById("searchInput").addEventListener("input", function (e) {
    state.searchQuery = e.target.value.toLowerCase();
    renderPhoneList();
  });

  document.querySelectorAll("#statusFilter .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.statusFilter = chip.dataset.filter;
      document.querySelectorAll("#statusFilter .chip").forEach(function (c) { c.classList.toggle("active", c === chip); });
      renderPhoneList();
    });
  });

  function getFilteredPhones() {
    return state.phones
      .filter(function (p) {
        if (state.statusFilter !== "sve" && p.status !== state.statusFilter) return false;
        if (state.searchQuery) {
          var haystack = (p.model + " " + (p.purchaseLocation || "")).toLowerCase();
          if (haystack.indexOf(state.searchQuery) === -1) return false;
        }
        return true;
      })
      .sort(function (a, b) { return b.purchaseDate.localeCompare(a.purchaseDate); });
  }

  function renderPhoneList() {
    var list = document.getElementById("phoneList");
    var items = getFilteredPhones();
    list.innerHTML = "";
    document.getElementById("emptyState").hidden = state.phones.length !== 0;

    items.forEach(function (p) {
      var card = document.createElement("div");
      card.className = "phone-card";
      card.addEventListener("click", function () { openPhoneModal(p); });

      var badgeHtml;
      if (p.status === "prodato") {
        badgeHtml = '<span class="badge sold">Prodato</span>';
      } else {
        var days = daysBetween(p.purchaseDate, todayISO());
        var aging = days >= 30;
        badgeHtml = '<span class="badge ' + (aging ? "aging" : "in-stock") + '">' +
          (aging ? days + " dana u zalihi" : "U prodaji") + "</span>";
      }

      var bottomHtml = "";
      if (p.status === "prodato") {
        var profit = profitOf(p);
        bottomHtml =
          '<div class="phone-card-bottom">' +
          '<span>Prodato ' + formatDate(p.saleDate) + " za " + formatKM(p.salePrice) + "</span>" +
          '<span class="' + (profit >= 0 ? "profit-pos" : "profit-neg") + '">' + (profit >= 0 ? "+" : "") + formatKM(profit) + "</span>" +
          "</div>";
      }

      card.innerHTML =
        '<div class="phone-card-top">' +
        '<div><div class="phone-model">' + escapeHtml(p.model) + '</div>' +
        '<div class="phone-sub">Kupljen ' + formatDate(p.purchaseDate) + " za " + formatKM(p.purchasePrice) +
        (p.purchaseLocation ? " · " + escapeHtml(p.purchaseLocation) : "") + "</div></div>" +
        badgeHtml +
        "</div>" + bottomHtml;

      list.appendChild(card);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // ---------- CALENDAR ----------
  var MONTH_NAMES = ["Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
  var DOW_NAMES = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  document.getElementById("prevMonthBtn").addEventListener("click", function () {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    state.selectedDay = null;
    renderCalendar();
  });
  document.getElementById("nextMonthBtn").addEventListener("click", function () {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    state.selectedDay = null;
    renderCalendar();
  });

  function eventsForDay(iso) {
    var evts = [];
    state.phones.forEach(function (p) {
      if (p.purchaseDate === iso) evts.push({ type: "buy", phone: p });
      if (p.saleDate === iso) evts.push({ type: "sell", phone: p });
    });
    return evts;
  }

  function renderCalendar() {
    var d = state.calendarDate;
    var year = d.getFullYear(), month = d.getMonth();
    document.getElementById("calendarMonthLabel").textContent = MONTH_NAMES[month] + " " + year;

    var grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";
    DOW_NAMES.forEach(function (name) {
      var el = document.createElement("div");
      el.className = "cal-dow";
      el.textContent = name;
      grid.appendChild(el);
    });

    var firstDay = new Date(year, month, 1);
    var startOffset = (firstDay.getDay() + 6) % 7; // Monday=0
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = todayISO();

    for (var i = 0; i < startOffset; i++) {
      var empty = document.createElement("div");
      empty.className = "cal-day empty";
      grid.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var iso = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
      var cell = document.createElement("div");
      cell.className = "cal-day";
      if (iso === today) cell.classList.add("today");
      if (iso === state.selectedDay) cell.classList.add("selected");

      var evts = eventsForDay(iso);
      var dotsHtml = "";
      if (evts.length) {
        dotsHtml = '<div class="cal-dots">';
        if (evts.some(function (e) { return e.type === "buy"; })) dotsHtml += '<span class="dot dot-buy"></span>';
        if (evts.some(function (e) { return e.type === "sell"; })) dotsHtml += '<span class="dot dot-sell"></span>';
        dotsHtml += "</div>";
      }
      cell.innerHTML = "<span>" + day + "</span>" + dotsHtml;
      cell.addEventListener("click", function (isoDay) {
        return function () {
          state.selectedDay = isoDay;
          renderCalendar();
        };
      }(iso));
      grid.appendChild(cell);
    }

    renderAgenda();
  }

  function renderAgenda() {
    var agenda = document.getElementById("calendarAgenda");
    if (!state.selectedDay) {
      agenda.innerHTML = '<p class="agenda-empty">Klikni na dan da vidiš detalje.</p>';
      return;
    }
    var evts = eventsForDay(state.selectedDay);
    if (!evts.length) {
      agenda.innerHTML = '<p class="agenda-empty">Nema događaja za ' + formatDate(state.selectedDay) + ".</p>";
      return;
    }
    agenda.innerHTML = "";
    evts.forEach(function (evt) {
      var row = document.createElement("div");
      row.className = "agenda-item";
      row.addEventListener("click", function () { openPhoneModal(evt.phone); });
      if (evt.type === "buy") {
        row.innerHTML = "<span>🛒 Kupljen: " + escapeHtml(evt.phone.model) + "</span><span>" + formatKM(evt.phone.purchasePrice) + "</span>";
      } else {
        row.innerHTML = "<span>💰 Prodat: " + escapeHtml(evt.phone.model) + "</span><span>" + formatKM(evt.phone.salePrice) + "</span>";
      }
      agenda.appendChild(row);
    });
  }

  // ---------- STATISTIKA ----------
  function renderStats() {
    var sold = state.phones.filter(function (p) { return p.status === "prodato"; });
    var totalProfit = sold.reduce(function (sum, p) { return sum + profitOf(p); }, 0);

    var now = new Date();
    var monthProfit = sold.filter(function (p) {
      var d = new Date(p.saleDate + "T00:00:00");
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).reduce(function (sum, p) { return sum + profitOf(p); }, 0);

    var weekStart = getStartOfWeek(now);
    var weekProfit = sold.filter(function (p) {
      var d = new Date(p.saleDate + "T00:00:00");
      return d >= weekStart;
    }).reduce(function (sum, p) { return sum + profitOf(p); }, 0);

    var avgProfit = sold.length ? totalProfit / sold.length : 0;
    var inStockCount = state.phones.filter(function (p) { return p.status === "u_prodaji"; }).length;

    var avgDays = sold.length
      ? sold.reduce(function (sum, p) { return sum + daysBetween(p.purchaseDate, p.saleDate); }, 0) / sold.length
      : null;

    document.getElementById("statTotal").textContent = formatKM(totalProfit);
    document.getElementById("statMonth").textContent = formatKM(monthProfit);
    document.getElementById("statWeek").textContent = formatKM(weekProfit);
    document.getElementById("statAvg").textContent = sold.length ? formatKM(avgProfit) : "-";
    document.getElementById("statInStock").textContent = inStockCount;
    document.getElementById("statSoldCount").textContent = sold.length;
    document.getElementById("statAvgDays").textContent = avgDays !== null ? Math.round(avgDays) + " dana" : "-";

    renderMonthChart(sold);
    renderTopModels(sold);
  }

  function renderMonthChart(sold) {
    var container = document.getElementById("monthChart");
    var months = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), total: 0 });
    }
    sold.forEach(function (p) {
      var d = new Date(p.saleDate + "T00:00:00");
      months.forEach(function (m) {
        if (m.year === d.getFullYear() && m.month === d.getMonth()) m.total += profitOf(p);
      });
    });
    var max = Math.max.apply(null, months.map(function (m) { return Math.abs(m.total); }).concat([1]));
    container.innerHTML = "";
    months.forEach(function (m) {
      var col = document.createElement("div");
      col.className = "bar-col";
      var heightPct = Math.max(2, Math.round((Math.abs(m.total) / max) * 100));
      col.innerHTML =
        '<div class="bar-fill" style="height:' + heightPct + '%;' + (m.total < 0 ? "background:var(--red);" : "") + '"></div>' +
        '<span class="bar-label">' + MONTH_NAMES[m.month].slice(0, 3) + "</span>";
      col.title = formatKM(m.total);
      container.appendChild(col);
    });
  }

  function renderTopModels(sold) {
    var container = document.getElementById("topModels");
    if (!sold.length) {
      container.innerHTML = '<p class="no-data">Još nema prodatih telefona.</p>';
      return;
    }
    var byModel = {};
    sold.forEach(function (p) {
      byModel[p.model] = (byModel[p.model] || 0) + profitOf(p);
    });
    var ranked = Object.keys(byModel).map(function (m) { return { model: m, total: byModel[m] }; })
      .sort(function (a, b) { return b.total - a.total; })
      .slice(0, 5);

    container.innerHTML = "";
    ranked.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "top-list-item";
      row.innerHTML =
        '<span><span class="rank">#' + (i + 1) + "</span>" + escapeHtml(item.model) + "</span>" +
        '<span class="' + (item.total >= 0 ? "profit-pos" : "profit-neg") + '">' + formatKM(item.total) + "</span>";
      container.appendChild(row);
    });
  }

  // ---------- RENDER ALL ----------
  function renderAll() {
    renderPhoneList();
    if (state.activeTab === "kalendar") renderCalendar();
    if (state.activeTab === "statistika") renderStats();
  }

  renderAll();

  // ---------- SERVICE WORKER ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function (err) {
        console.warn("Service worker registracija neuspješna:", err);
      });
    });
  }
})();
