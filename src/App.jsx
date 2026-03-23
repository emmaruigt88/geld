import { useState, useMemo, useEffect, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

var MO = ["Jan","Feb","Mrt","Apr","Mei","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

var WISH_DEFS = [
  { id: "hond", name: "Hond", monthly: 200, oneTime: 0, icon: "🐕", desc: "200/mnd" },
  { id: "remarkable", name: "Remarkable", monthly: 0, oneTime: 200, icon: "📝", desc: "200 eenmalig" },
  { id: "xteink", name: "Xteink reader", monthly: 0, oneTime: 100, icon: "📖", desc: "100 eenmalig" },
  { id: "ozempic", name: "Ozempic", monthly: 200, oneTime: 0, icon: "💊", desc: "200/mnd, 5 mnd", dur: 5 },
  { id: "switch", name: "Nintendo Switch", monthly: 0, oneTime: 200, icon: "🎮", desc: "200 eenmalig" }
];

var CC = { wonen:"#e87461", vervoer:"#f4a83d", eten:"#7bc67e", gezondheid:"#64b5f6", vast:"#ab8ed4", variabel:"#f48fb1", airbnb:"#ffb74d", wensen:"#ce93d8", custom:"#80cbc4" };
var CL = { wonen:"Wonen", vervoer:"Vervoer", eten:"Eten", gezondheid:"Gezondheid", vast:"Abonnementen", variabel:"Variabel", airbnb:"Airbnb", wensen:"Wensen", custom:"Aangepast" };

var STORAGE_KEY = "mijn-geld-data";

// ─── Data calculation ────────────────────────────────────────────────────────
// Each expense/income item: { name, amount, cat, src }
// src: "fixed" = hardcoded, "custom" = user-added, "wish" = from wishlist, "airbnb" = airbnb

function calc(ab, customs, wishes, overrides) {
  var fx = [["Claude",22],["F1 TV",13],["Plum Village",13],["Cloud/Gmail",20],["Spotify",13],["Telefoon",12],["DUO",310],["Zorgverzekering",160],["Eigen risico",40],["Autoverzekering",44],["Wegenbelasting",33]];
  var bot = Math.round(125 * 4 / 12);
  var vb = [["Drogist",50],["Kleding",200],["Leuke dingen",500]];
  var wpm = ab.en ? ab.wny / 7 : 0;
  var ms = [];
  var run = 2073;
  var ov = overrides || {};

  function amt(name, base) {
    return ov[name] !== undefined ? ov[name] : base;
  }

  for (var y = 2026; y <= 2027; y++) {
    for (var m = (y === 2026 ? 3 : 0); m <= 11; m++) {
      var o = { m: m, y: y, k: y + "-" + m, l: MO[m] + " " + y, inc: [], exp: [], ot: [], nt: [], ai: 0, ae: 0 };

      // Income
      o.inc.push({ name: "Salaris", amount: amt("Salaris", 3213), src: "fixed" });
      o.inc.push({ name: "Reiskosten", amount: amt("Reiskosten", 400), src: "fixed" });
      if (m === 4) o.inc.push({ name: "Vakantiegeld", amount: amt("Vakantiegeld", 2400), src: "fixed" });
      if (m === 5 && y === 2026) o.inc.push({ name: "Belastingteruggave", amount: amt("Belastingteruggave", 2500), src: "fixed" });
      if (m === 11) o.inc.push({ name: "13e maand", amount: amt("13e maand", 2400), src: "fixed" });

      // Airbnb
      if (ab.en && (y > 2026 || (y === 2026 && m >= 5))) {
        var ri = ab.rn * ab.rp, wi = Math.round(wpm * ab.wp);
        if (ri > 0) o.inc.push({ name: "Airbnb kamer", amount: ri, src: "airbnb" });
        if (wi > 0) o.inc.push({ name: "Airbnb woning", amount: wi, src: "airbnb" });
        o.ai = ri + wi;
        if (o.ai > 0) {
          o.exp.push({ name: "Schoonmaak", amount: ab.cp, cat: "airbnb", src: "airbnb" });
          o.exp.push({ name: "Supplies", amount: 30, cat: "airbnb", src: "airbnb" });
          o.ae = ab.cp + 30;
        }
      }

      // Housing
      if (y === 2026 && m === 3) {
        o.exp.push({ name: "Gezamenlijk", amount: amt("Gezamenlijk-nw", 670), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Huur/energie", amount: amt("Huur/energie", 100), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Psycholoog", amount: amt("Psycholoog", 200), cat: "gezondheid", src: "fixed" });
        o.exp.push({ name: "Benzine/OV", amount: amt("Benzine/OV-nw", 480), cat: "vervoer", src: "fixed" });
        o.nt.push("Nederweert");
      } else {
        o.exp.push({ name: "Huur", amount: amt("Huur", 1000), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Gas/licht", amount: amt("Gas/licht", 130), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Water", amount: amt("Water", 30), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Internet", amount: amt("Internet", 33), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Woonverz.", amount: amt("Woonverz.", 11), cat: "wonen", src: "fixed" });
        o.exp.push({ name: "Gezamenlijk", amount: amt("Gezamenlijk", 100), cat: "wonen", src: "fixed" });
        if ((y === 2026 && m >= 8) || y === 2027) o.exp.push({ name: "Parkeren", amount: amt("Parkeren", 10), cat: "vervoer", src: "fixed" });
        o.exp.push({ name: "Benzine/OV", amount: amt("Benzine/OV", 300), cat: "vervoer", src: "fixed" });
        o.exp.push({ name: "Eten", amount: amt("Eten", 300), cat: "eten", src: "fixed" });
      }
      if (y === 2027) o.exp.push({ name: "Gem.belasting", amount: amt("Gem.belasting", 35), cat: "wonen", src: "fixed" });

      // Fixed subscriptions
      for (var fi = 0; fi < fx.length; fi++) {
        o.exp.push({ name: fx[fi][0], amount: amt(fx[fi][0], fx[fi][1]), cat: "vast", src: "fixed" });
      }
      o.exp.push({ name: "Botox", amount: amt("Botox", bot), cat: "gezondheid", src: "fixed" });

      // Variable
      for (var vi = 0; vi < vb.length; vi++) {
        o.exp.push({ name: vb[vi][0], amount: amt(vb[vi][0], vb[vi][1]), cat: "variabel", src: "fixed" });
      }
      o.exp.push({ name: "Sport", amount: amt("Sport", (y === 2026 && m <= 5) ? 90 : 30), cat: "gezondheid", src: "fixed" });

      // Quarterly
      if (m === 0 || m === 3 || m === 6 || m === 9) o.ot.push({ name: "Tandarts", amount: amt("Tandarts", 75), src: "fixed" });

      // 2026 one-offs
      if (y === 2026) {
        if (m === 3) { o.ot.push({ name: "Klarna", amount: 353, src: "fixed" }); o.ot.push({ name: "Riverty", amount: 30, src: "fixed" }); o.ot.push({ name: "Bol.com", amount: 117, src: "fixed" }); o.ot.push({ name: "Zalando", amount: 100, src: "fixed" }); }
        if (m === 4) { o.ot.push({ name: "Bed", amount: 100, src: "fixed" }); o.ot.push({ name: "Matras", amount: 180, src: "fixed" }); o.ot.push({ name: "Beddengoed", amount: 100, src: "fixed" }); o.ot.push({ name: "Verf", amount: 150, src: "fixed" }); o.ot.push({ name: "IKEA", amount: 200, src: "fixed" }); o.ot.push({ name: "Hout meubels", amount: 200, src: "fixed" }); o.ot.push({ name: "Verhuizing", amount: 200, src: "fixed" }); o.ot.push({ name: "Med.rek.", amount: 569, src: "fixed" }); o.ot.push({ name: "Ymere", amount: 376, src: "fixed" }); o.nt.push("Verhuismaand!"); }
        if (m === 8) o.ot.push({ name: "Vakantie", amount: 1000, src: "fixed" });
        if (m === 10) o.ot.push({ name: "APK", amount: 600, src: "fixed" });
      }

      // Wishes
      for (var wi2 = 0; wi2 < wishes.length; wi2++) {
        var w = wishes[wi2];
        var def = WISH_DEFS.find(function (d) { return d.id === w.id; });
        if (!def) continue;
        var ws = w.sy * 12 + w.sm, cn = y * 12 + m;
        if (cn < ws) continue;
        if (cn === ws && def.oneTime > 0) o.ot.push({ name: def.name, amount: def.oneTime, src: "wish" });
        if (def.monthly > 0) { var ms2 = cn - ws; if (!def.dur || ms2 < def.dur) o.exp.push({ name: def.name, amount: def.monthly, cat: "wensen", src: "wish" }); }
      }

      // Customs
      for (var ci = 0; ci < customs.length; ci++) {
        var c = customs[ci];
        if (c.y === y && c.m === m) {
          if (c.t === "inc") o.inc.push({ name: c.n, amount: c.a, src: "custom", cid: c.id });
          else o.ot.push({ name: c.n, amount: c.a, src: "custom", cid: c.id });
        }
        if (c.rec && c.t === "exp") {
          var cs2 = c.y * 12 + c.m;
          if (y * 12 + m >= cs2) o.exp.push({ name: c.n, amount: c.a, cat: "custom", src: "custom", cid: c.id });
        }
      }

      // Filter out zero-amount items (overridden to 0 = removed)
      o.exp = o.exp.filter(function (e) { return e.amount > 0; });
      o.ot = o.ot.filter(function (e) { return e.amount > 0; });
      o.inc = o.inc.filter(function (e) { return e.amount > 0; });

      o.ti = 0; for (var ii = 0; ii < o.inc.length; ii++) o.ti += o.inc[ii].amount;
      o.to = 0; for (var oi = 0; oi < o.ot.length; oi++) o.to += o.ot[oi].amount;
      o.te = 0; for (var ei = 0; ei < o.exp.length; ei++) o.te += o.exp[ei].amount;
      o.te += o.to;
      o.net = o.ti - o.te;
      o.sb = run;
      run += o.net;
      o.eb = run;
      ms.push(o);
    }
  }
  return ms;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) { return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n); }
function loadState() { try { var r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {} }

// ─── Chart ───────────────────────────────────────────────────────────────────

function Chrt({ months, comp }) {
  var all = months.map(function (m) { return m.eb; });
  if (comp) for (var i = 0; i < comp.length; i++) all.push(comp[i].eb);
  var mx = Math.max.apply(null, all.concat([1]));
  var mn = Math.min.apply(null, all.concat([0]));
  var rn = mx - mn || 1;
  function pts(d) {
    return d.map(function (m, i) { return (i / (d.length - 1)) * 100 + "," + (100 - ((m.eb - mn) / rn) * 72 - 14); }).join(" ");
  }
  var gy = 100 - ((10000 - mn) / rn) * 72 - 14;
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: 90 }} preserveAspectRatio="none">
      <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7bc67e" stopOpacity="0.2" /><stop offset="100%" stopColor="#7bc67e" stopOpacity="0" /></linearGradient></defs>
      {mx >= 10000 && <line x1="0" y1={gy} x2="100" y2={gy} stroke="#ce93d8" strokeWidth="0.7" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity="0.4" />}
      {comp && <polyline points={pts(comp)} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
      <polygon points={"0,100 " + pts(months) + " 100,100"} fill="url(#gf)" />
      <polyline points={pts(months)} fill="none" stroke="#7bc67e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ item, onSave, onDelete, onClose }) {
  var _a = useState(String(item.amount)); var val = _a[0], setVal = _a[1];
  var _n = useState(item.name); var name = _n[0], setName = _n[1];
  var canDelete = item.src === "custom";
  var canRename = item.src === "custom";

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#1e2a4a", borderRadius: 14, padding: 18, width: "100%", maxWidth: 320, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bewerken</div>

        {canRename ? (
          <input value={name} onChange={function (e) { setName(e.target.value); }} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#eee", fontSize: 12, marginBottom: 8, boxSizing: "border-box" }} />
        ) : (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8, padding: "7px 0" }}>{item.name}</div>
        )}

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Bedrag</div>
        <input value={val} onChange={function (e) { setVal(e.target.value); }} type="number" autoFocus style={{ width: "100%", padding: "8px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#eee", fontSize: 14, marginBottom: 6, boxSizing: "border-box" }} />

        {!canDelete && (
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
            Tip: zet op 0 om deze post te verbergen. Origineel: {fmt(item.original || item.amount)}.
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {canDelete && (
            <button onClick={function () { onDelete(item); }} style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(232,116,97,0.3)", background: "rgba(232,116,97,0.1)", color: "#e87461", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Verwijder</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>Annuleer</button>
          <button onClick={function () { onSave(item, name, Number(val) || 0); }} style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "#7bc67e", color: "#1a1a2e", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

// ─── Expense Row ─────────────────────────────────────────────────────────────

function ExpRow({ item, color, onEdit, isOverridden }) {
  return (
    <div onClick={function () { onEdit(item); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
      <span style={{ flex: 1, fontSize: 11, color: isOverridden ? "#80cbc4" : "rgba(255,255,255,0.5)" }}>
        {item.name}
        {isOverridden && <span style={{ fontSize: 8, marginLeft: 4, color: "rgba(128,203,196,0.5)" }}>aangepast</span>}
        {item.src === "custom" && <span style={{ fontSize: 8, marginLeft: 4, color: "rgba(128,203,196,0.4)" }}>+</span>}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: color || "#eee" }}>{fmt(item.amount)}</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginLeft: 2 }}>&#9998;</span>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  var saved = useRef(loadState()).current;

  var _v = useState("dash"); var vw = _v[0], setVw = _v[1];
  var _s = useState(0); var si = _s[0], setSi = _s[1];
  var _ab = useState(saved?.ab || { en: false, rn: 8, rp: 70, wny: 20, wp: 130, cp: 120 });
  var ab = _ab[0], sAb = _ab[1];
  var _w = useState(saved?.w || []); var wishes = _w[0], sW = _w[1];
  var _c = useState(saved?.c || []); var customs = _c[0], sC = _c[1];
  var _ov = useState(saved?.ov || {}); var overrides = _ov[0], sOv = _ov[1];

  // Modals
  var _sa = useState(false); var showAdd = _sa[0], sSa = _sa[1];
  var _ed = useState(null); var editItem = _ed[0], sEd = _ed[1];
  var _an = useState(""); var an = _an[0], sAn = _an[1];
  var _aa = useState(""); var aa = _aa[0], sAa = _aa[1];
  var _at = useState("exp"); var at = _at[0], sAt = _at[1];
  var _am = useState(3); var am = _am[0], sAm = _am[1];
  var _ay = useState(2026); var ay = _ay[0], sAy = _ay[1];
  var _ar = useState(false); var ar = _ar[0], sAr = _ar[1];
  var fileRef = useRef(null);

  // Expanded categories in detail view
  var _expanded = useState({}); var expanded = _expanded[0], sExpanded = _expanded[1];
  function toggleCat(cat) { sExpanded(function (p) { var n = {}; for (var k in p) n[k] = p[k]; n[cat] = !p[cat]; return n; }); }

  // Auto-save
  useEffect(function () {
    saveState({ ab: ab, w: wishes, c: customs, ov: overrides });
  }, [ab, wishes, customs, overrides]);

  function uAb(k, v) { sAb(function (p) { var n = {}; for (var x in p) n[x] = p[x]; n[k] = v; return n; }); }

  var ms = useMemo(function () { return calc(ab, customs, wishes, overrides); }, [ab, customs, wishes, overrides]);
  var msNo = useMemo(function () { var a = {}; for (var x in ab) a[x] = ab[x]; a.en = false; return calc(a, customs, wishes, overrides); }, [ab, customs, wishes, overrides]);

  var cur = ms[si] || ms[0];
  var ey = ms[ms.length - 1];
  var eyNo = msNo[msNo.length - 1];
  var low = Infinity, lowM = ms[0];
  for (var i = 0; i < ms.length; i++) { if (ms[i].eb < low) { low = ms[i].eb; lowM = ms[i]; } }
  var goalM = null;
  for (var i2 = 0; i2 < ms.length; i2++) { if (ms[i2].eb >= 10000) { goalM = ms[i2]; break; } }
  var abNet = 0; for (var i3 = 0; i3 < ms.length; i3++) abNet += ms[i3].ai - ms[i3].ae;

  // ─── Edit/Delete handlers ──────────────────────────────────────────────────

  function handleEditSave(item, newName, newAmount) {
    if (item.src === "custom" && item.cid) {
      // Update custom item
      sC(function (p) {
        return p.map(function (c) {
          if (c.id === item.cid) {
            var updated = {}; for (var k in c) updated[k] = c[k];
            updated.n = newName;
            updated.a = newAmount;
            return updated;
          }
          return c;
        });
      });
    } else {
      // Override built-in item
      sOv(function (p) {
        var n = {}; for (var k in p) n[k] = p[k];
        // Use the override key from the item, or its name
        var key = item.ovKey || item.name;
        if (newAmount === (item.original || item.amount) && !item.ovKey) {
          delete n[key]; // Reset to default
        } else {
          n[key] = newAmount;
        }
        return n;
      });
    }
    sEd(null);
  }

  function handleEditDelete(item) {
    if (item.src === "custom" && item.cid) {
      sC(function (p) { return p.filter(function (c) { return c.id !== item.cid; }); });
    }
    sEd(null);
  }

  function addC() {
    if (!an || !aa) return;
    sC(function (p) { return p.concat([{ n: an, a: Number(aa), t: at, m: am, y: ay, rec: ar, id: Date.now() }]); });
    sAn(""); sAa(""); sSa(false); sAr(false);
  }

  // ─── Export / Import ───────────────────────────────────────────────────────

  function exportData() {
    var data = { version: 2, exported: new Date().toISOString(), airbnb: ab, wishes: wishes, customs: customs, overrides: overrides };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "mijn-geld-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importData(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (d.airbnb) sAb(d.airbnb);
        if (d.wishes) sW(d.wishes);
        if (d.customs) sC(d.customs);
        if (d.overrides) sOv(d.overrides);
        alert("Import gelukt!");
      } catch (err) { alert("Kon bestand niet lezen."); }
    };
    reader.readAsText(file); e.target.value = "";
  }

  function resetData() {
    if (!confirm("Weet je zeker dat je alles wilt wissen?")) return;
    sAb({ en: false, rn: 8, rp: 70, wny: 20, wp: 130, cp: 120 });
    sW([]); sC([]); sOv({});
    localStorage.removeItem(STORAGE_KEY);
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  var S = { background: "rgba(255,255,255,0.045)", borderRadius: 12, padding: "13px 15px", border: "1px solid rgba(255,255,255,0.055)" };

  function pill(a, orange) {
    return {
      padding: "5px 10px", borderRadius: 14, fontSize: 11, fontWeight: a ? 700 : 400,
      background: a ? (orange ? "rgba(255,183,77,0.15)" : "rgba(123,198,126,0.15)") : "rgba(255,255,255,0.03)",
      color: a ? (orange ? "#ffb74d" : "#7bc67e") : "rgba(255,255,255,0.35)",
      border: "1px solid " + (a ? (orange ? "rgba(255,183,77,0.2)" : "rgba(123,198,126,0.2)") : "transparent"),
      cursor: "pointer"
    };
  }

  // ─── Group expenses by category ────────────────────────────────────────────

  function groupByCat(expenses) {
    var groups = {};
    expenses.forEach(function (e) {
      var c = e.cat || "variabel";
      if (!groups[c]) groups[c] = { items: [], total: 0 };
      groups[c].items.push(e);
      groups[c].total += e.amount;
    });
    return Object.entries(groups).sort(function (a, b) { return b[1].total - a[1].total; });
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: "linear-gradient(150deg,#1a1a2e,#16213e,#1a1a2e)", color: "#eee", minHeight: "100vh", padding: "16px 12px", maxWidth: 480, margin: "0 auto" }}>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 2px", background: "linear-gradient(135deg,#7bc67e,#64b5f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mijn Geld</h1>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Apr 2026 - Dec 2027</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {[["dash", "Overzicht"], ["det", "Maand"], ["fc", "Prognose"], ["ab", "Airbnb"], ["wl", "Wensen"], ["data", "Data"]].map(function (x) {
          return <button key={x[0]} onClick={function () { setVw(x[0]); }} style={pill(vw === x[0], x[0] === "ab" || x[0] === "wl" || x[0] === "data")}>{x[1]}</button>;
        })}
        <button onClick={function () { sSa(true); }} style={{ padding: "5px 10px", borderRadius: 14, fontSize: 11, background: "rgba(128,203,196,0.12)", color: "#80cbc4", border: "1px solid rgba(128,203,196,0.18)", cursor: "pointer" }}>+ Nieuw</button>
      </div>

      {/* === DASHBOARD === */}
      {vw === "dash" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "linear-gradient(135deg,rgba(206,147,216,0.07),rgba(123,198,126,0.07))", borderRadius: 12, padding: "13px 15px", border: "1px solid rgba(206,147,216,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Emergency Fund</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: goalM ? "#7bc67e" : "#ce93d8" }}>{fmt(Math.min(Math.max(ey.eb, 0), 10000))} / {fmt(10000)}</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: Math.min(100, Math.max(0, ey.eb / 100)) + "%", height: "100%", borderRadius: 3, background: goalM ? "#7bc67e" : "#ce93d8" }} />
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>
            {goalM ? "Doel bereikt " + goalM.l + "! " + fmt(ey.eb - 10000) + " beschikbaar voor ETF." : "Prognose eind 2027: " + fmt(ey.eb)}
          </div>
        </div>

        <div style={S}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Rekening</div><div style={{ fontSize: 17, fontWeight: 800 }}>{fmt(0)}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Spaargeld</div><div style={{ fontSize: 17, fontWeight: 800, color: "#7bc67e" }}>{fmt(2073)}</div></div>
          </div>
        </div>

        <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Inzichten</div>
          {[
            ["⚡", "Laagste: " + fmt(low), lowM.l],
            ["📈", "Eind 2027: " + fmt(ey.eb), ab.en ? "Incl. Airbnb" : ""],
            goalM ? ["🎯", "10k in " + goalM.l, "Daarna ETF"] : null,
            ab.en ? ["🏠", "Airbnb: +" + fmt(abNet), "Netto"] : null,
            Object.keys(overrides).length > 0 ? ["✏️", Object.keys(overrides).length + " post(en) aangepast", ""] : null
          ].filter(Boolean).map(function (x, i) {
            return <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{x[0]}</span>
              <div><div style={{ fontSize: 11, fontWeight: 600 }}>{x[1]}</div>{x[2] && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{x[2]}</div>}</div>
            </div>;
          })}
        </div>

        <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Saldo-verloop</div>
          <Chrt months={ms} comp={ab.en ? msNo : null} />
        </div>

        {customs.length > 0 && <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Aangepaste posten</div>
          {customs.map(function (c) {
            return <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{c.n} <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{MO[c.m] + " " + c.y}{c.rec ? " (mnd)" : ""}</span></span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontWeight: 600, color: c.t === "inc" ? "#7bc67e" : "#e87461" }}>{c.t === "inc" ? "+" : "-"}{fmt(c.a)}</span>
                <button onClick={function () { var id = c.id; sC(function (p) { return p.filter(function (x) { return x.id !== id; }); }); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 13, padding: 0 }}>x</button>
              </div>
            </div>;
          })}
        </div>}
      </div>}

      {/* === DETAIL === */}
      {vw === "det" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 3 }}>
          {ms.map(function (m, i) {
            var lb = MO[m.m].substring(0, 1) + (m.m === 0 ? "27" : "");
            return <button key={i} onClick={function () { setSi(i); }} style={{ padding: "4px 7px", borderRadius: 8, fontSize: 10, fontWeight: si === i ? 700 : 400, background: si === i ? "rgba(123,198,126,0.14)" : "rgba(255,255,255,0.02)", color: si === i ? "#7bc67e" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", flexShrink: 0 }}>{lb}</button>;
          })}
        </div>

        {/* Month summary */}
        <div style={{ background: cur.net >= 0 ? "rgba(123,198,126,0.05)" : "rgba(232,116,97,0.05)", borderRadius: 12, padding: "13px 15px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{cur.l}</div>
          {cur.nt.map(function (n, i) { return <div key={i} style={{ fontSize: 10, color: "#f4a83d", fontStyle: "italic" }}>{"⚠ " + n}</div>; })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
            <div><div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>In</div><div style={{ fontSize: 14, fontWeight: 700, color: "#7bc67e" }}>{fmt(cur.ti)}</div></div>
            <div><div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Uit</div><div style={{ fontSize: 14, fontWeight: 700, color: "#e87461" }}>{fmt(cur.te)}</div></div>
            <div><div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Netto</div><div style={{ fontSize: 14, fontWeight: 700, color: cur.net >= 0 ? "#7bc67e" : "#e87461" }}>{fmt(cur.net)}</div></div>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "rgba(255,255,255,0.35)" }}>Start</span><span>{fmt(cur.sb)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ color: "rgba(255,255,255,0.35)" }}>Eind</span><span style={{ fontWeight: 700, color: cur.eb >= 10000 ? "#ce93d8" : "#7bc67e" }}>{fmt(cur.eb)}{cur.eb >= 10000 ? " 🎯" : ""}</span></div>
          </div>
        </div>

        {/* Income - all items visible */}
        <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5, color: "#7bc67e" }}>Inkomen</div>
          {cur.inc.map(function (x, i) {
            var isOv = x.src === "fixed" && overrides[x.name] !== undefined;
            return <ExpRow key={i} item={x} color={x.src === "airbnb" ? "#ffb74d" : "#7bc67e"} isOverridden={isOv} onEdit={function (item) { sEd(item); }} />;
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
            <span style={{ fontWeight: 700 }}>Totaal</span>
            <span style={{ fontWeight: 700, color: "#7bc67e" }}>{fmt(cur.ti)}</span>
          </div>
        </div>

        {/* Expenses - grouped by category, expandable, showing items */}
        <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: "#e87461" }}>Uitgaven</div>
          {groupByCat(cur.exp).map(function (pair) {
            var cat = pair[0], group = pair[1];
            var isOpen = expanded[cat];
            var clr = CC[cat] || "#888";
            var label = CL[cat] || cat;
            var total = group.total;
            var allTotal = cur.exp.reduce(function (a, e) { return a + e.amount; }, 0);
            return (
              <div key={cat} style={{ marginBottom: 6 }}>
                <div onClick={function () { toggleCat(cat); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "4px 0" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: clr, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{fmt(total)}</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", width: 26, textAlign: "right" }}>{Math.round(total / allTotal * 100)}%</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 2, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>&#9656;</span>
                </div>
                {isOpen && (
                  <div style={{ marginLeft: 13, borderLeft: "1px solid rgba(255,255,255,0.04)", paddingLeft: 10, marginTop: 2 }}>
                    {group.items.map(function (item, j) {
                      var isOv = item.src === "fixed" && overrides[item.name] !== undefined;
                      return <ExpRow key={j} item={item} color={CC[cat]} isOverridden={isOv} onEdit={function (it) { sEd(it); }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
            <span style={{ fontWeight: 700 }}>Totaal maandelijks</span>
            <span style={{ fontWeight: 700, color: "#e87461" }}>{fmt(cur.exp.reduce(function (a, e) { return a + e.amount; }, 0))}</span>
          </div>
        </div>

        {/* One-time expenses - all items visible */}
        {cur.ot.length > 0 && <div style={{ ...S, border: "1px solid rgba(244,168,61,0.12)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5, color: "#f4a83d" }}>Eenmalige uitgaven</div>
          {cur.ot.map(function (x, i) {
            return <ExpRow key={i} item={x} color="#f4a83d" isOverridden={false} onEdit={function (it) { sEd(it); }} />;
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
            <span style={{ fontWeight: 700 }}>Totaal eenmalig</span>
            <span style={{ fontWeight: 700, color: "#f4a83d" }}>{fmt(cur.to)}</span>
          </div>
        </div>}
      </div>}

      {/* === FORECAST === */}
      {vw === "fc" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={S}><Chrt months={ms} comp={ab.en ? msNo : null} /></div>
        {ms.map(function (m, i) {
          return <div key={i} style={{ ...S, cursor: "pointer" }} onClick={function () { setSi(i); setVw("det"); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{m.l}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                  {m.ai > 0 && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 4, background: "rgba(255,183,77,0.1)", color: "#ffb74d" }}>Airbnb</span>}
                  {m.to > 0 && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 4, background: "rgba(244,168,61,0.1)", color: "#f4a83d" }}>{fmt(m.to)}</span>}
                  {m.eb >= 10000 && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 4, background: "rgba(206,147,216,0.1)", color: "#ce93d8" }}>🎯</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: m.net >= 0 ? "#7bc67e" : "#e87461" }}>{m.net >= 0 ? "+" : ""}{fmt(m.net)}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{fmt(m.eb)}</div>
              </div>
            </div>
          </div>;
        })}
      </div>}

      {/* === AIRBNB === */}
      {vw === "ab" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...S, border: ab.en ? "1px solid rgba(255,183,77,0.2)" : S.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>Airbnb</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Amsterdam Noord</div></div>
            <button onClick={function () { uAb("en", !ab.en); }} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: ab.en ? "#ffb74d" : "rgba(255,255,255,0.1)", position: "relative" }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: ab.en ? 23 : 3, transition: "left 0.3s", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
            </button>
          </div>
        </div>
        {[
          ["Kamer nachten/mnd", "rn", 0, 20, 1, "nachten"],
          ["Kamer prijs/nacht", "rp", 40, 120, 5, "eur"],
          ["Woning nachten/jaar", "wny", 0, 30, 1, "nachten"],
          ["Woning prijs/nacht", "wp", 80, 200, 5, "eur"],
          ["Schoonmaak/mnd", "cp", 0, 300, 10, "eur"]
        ].map(function (s) {
          var col = s[0].indexOf("Schoonmaak") >= 0 ? "#e87461" : "#ffb74d";
          return <div key={s[1]} style={{ ...S, opacity: ab.en ? 1 : 0.3, pointerEvents: ab.en ? "auto" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{s[0]}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{s[5] === "eur" ? fmt(ab[s[1]]) : ab[s[1]] + " " + s[5]}</span>
            </div>
            <input type="range" min={s[2]} max={s[3]} step={s[4]} value={ab[s[1]]} onChange={function (e) { uAb(s[1], Number(e.target.value)); }} style={{ width: "100%", accentColor: col, height: 4, cursor: "pointer" }} />
          </div>;
        })}
        {ab.en && <div style={{ ...S, background: "rgba(255,183,77,0.06)", border: "1px solid rgba(255,183,77,0.15)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Impact</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Netto winst</div><div style={{ fontSize: 16, fontWeight: 800, color: "#7bc67e" }}>{fmt(abNet)}</div></div>
            <div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Extra eind 2027</div><div style={{ fontSize: 16, fontWeight: 800, color: "#ffb74d" }}>+{fmt(ey.eb - eyNo.eb)}</div></div>
          </div>
          <div style={{ marginTop: 8 }}><Chrt months={ms} comp={msNo} /></div>
        </div>}
      </div>}

      {/* === WISHES === */}
      {vw === "wl" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={S}><div style={{ fontSize: 12, fontWeight: 700 }}>Wensenlijst</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Toggle aan/uit om impact te zien</div></div>
        {WISH_DEFS.map(function (d) {
          var active = wishes.find(function (w) { return w.id === d.id; });
          return <div key={d.id} style={{ ...S, border: active ? "1px solid rgba(206,147,216,0.18)" : S.border, background: active ? "rgba(206,147,216,0.05)" : S.background }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{d.name}</div><div style={{ fontSize: 10, color: "#ce93d8" }}>{d.desc}</div></div>
              </div>
              <button onClick={function () { var id = d.id; sW(function (p) { if (p.find(function (w) { return w.id === id; })) return p.filter(function (w) { return w.id !== id; }); return p.concat([{ id: id, sm: 8, sy: 2026 }]); }); }} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: active ? "#ce93d8" : "rgba(255,255,255,0.1)", position: "relative" }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 3, left: active ? 21 : 3, transition: "left 0.3s" }} />
              </button>
            </div>
          </div>;
        })}
        {wishes.length > 0 && <div style={{ ...S, background: "rgba(206,147,216,0.05)", border: "1px solid rgba(206,147,216,0.12)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Impact op eindsaldo 2027</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{fmt(ey.eb)}</div>
        </div>}
      </div>}

      {/* === DATA === */}
      {vw === "data" && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={S}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Data beheer</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Exporteer, importeer of reset je data.</div>
        </div>
        <div style={S}>
          <button onClick={exportData} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#7bc67e", color: "#1a1a2e", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Exporteer als JSON</button>
        </div>
        <div style={S}>
          <input ref={fileRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
          <button onClick={function () { fileRef.current && fileRef.current.click(); }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(100,181,246,0.3)", background: "rgba(100,181,246,0.1)", color: "#64b5f6", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Importeer JSON</button>
        </div>
        <div style={S}>
          <button onClick={resetData} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(232,116,97,0.3)", background: "rgba(232,116,97,0.1)", color: "#e87461", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Alles wissen</button>
        </div>
        {Object.keys(overrides).length > 0 && <div style={S}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Aangepaste bedragen</div>
          {Object.entries(overrides).map(function (pair) {
            return <div key={pair[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{pair[0]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontWeight: 600, color: "#80cbc4" }}>{fmt(pair[1])}</span>
                <button onClick={function () { var k = pair[0]; sOv(function (p) { var n = {}; for (var x in p) n[x] = p[x]; delete n[k]; return n; }); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, padding: 0 }}>reset</button>
              </div>
            </div>;
          })}
        </div>}
        <div style={S}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
            Airbnb: {ab.en ? "Aan" : "Uit"} | Wensen: {wishes.length} | Posten: {customs.length} | Overrides: {Object.keys(overrides).length}
          </div>
        </div>
      </div>}

      {/* === ADD MODAL === */}
      {showAdd && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }} onClick={function (e) { if (e.target === e.currentTarget) sSa(false); }}>
        <div style={{ background: "#1e2a4a", borderRadius: 14, padding: 18, width: "100%", maxWidth: 340, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Toevoegen</div>
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <button onClick={function () { sAt("exp"); }} style={{ flex: 1, padding: "6px", borderRadius: 7, border: "none", cursor: "pointer", background: at === "exp" ? "rgba(232,116,97,0.18)" : "rgba(255,255,255,0.04)", color: at === "exp" ? "#e87461" : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600 }}>Uitgave</button>
            <button onClick={function () { sAt("inc"); }} style={{ flex: 1, padding: "6px", borderRadius: 7, border: "none", cursor: "pointer", background: at === "inc" ? "rgba(123,198,126,0.18)" : "rgba(255,255,255,0.04)", color: at === "inc" ? "#7bc67e" : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600 }}>Inkomst</button>
          </div>
          <input value={an} onChange={function (e) { sAn(e.target.value); }} placeholder="Beschrijving" style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#eee", fontSize: 12, marginBottom: 6, boxSizing: "border-box" }} />
          <input value={aa} onChange={function (e) { sAa(e.target.value); }} placeholder="Bedrag" type="number" style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#eee", fontSize: 12, marginBottom: 6, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
            <select value={am} onChange={function (e) { sAm(Number(e.target.value)); }} style={{ flex: 1, padding: "7px 5px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#eee", fontSize: 11 }}>
              {MO.map(function (n, i) { return <option key={i} value={i}>{n}</option>; })}
            </select>
            <select value={ay} onChange={function (e) { sAy(Number(e.target.value)); }} style={{ padding: "7px 5px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#eee", fontSize: 11 }}>
              <option value={2026}>2026</option><option value={2027}>2027</option>
            </select>
          </div>
          {at === "exp" && <label style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <input type="checkbox" checked={ar} onChange={function (e) { sAr(e.target.checked); }} style={{ accentColor: "#7bc67e" }} />Maandelijks terugkerend
          </label>}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={function () { sSa(false); }} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11 }}>Annuleer</button>
            <button onClick={addC} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "none", background: "#7bc67e", color: "#1a1a2e", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Opslaan</button>
          </div>
        </div>
      </div>}

      {/* === EDIT MODAL === */}
      {editItem && <EditModal item={editItem} onSave={handleEditSave} onDelete={handleEditDelete} onClose={function () { sEd(null); }} />}

      <div style={{ textAlign: "center", marginTop: 14, fontSize: 9, color: "rgba(255,255,255,0.1)" }}>Tik op een post om te bewerken</div>
    </div>
  );
}
