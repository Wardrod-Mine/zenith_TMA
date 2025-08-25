// ============ Telegram Web Apps boot ============
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.enableClosingConfirmation();
  tg.BackButton.show();
  tg.BackButton.onClick(() => goHome());
}

// --- стабилизируем высоту и safe-area в Telegram WebView ---
function applyViewportVars() {
  const h = tg?.viewportStableHeight || window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${h}px`);
  const inset = Math.max(0, (tg?.viewportHeight || h) - h);
  document.documentElement.style.setProperty('--safe-bottom', `${inset}px`);
}
applyViewportVars();
tg?.onEvent?.('viewportChanged', applyViewportVars);
window.addEventListener('resize', applyViewportVars);


// ============ Конфигурация карты ============
const MAP_URL =
  // можно заменить на свой файл в репозитории
  "./gazprom_arena_scheme.png";

// упрощённые "координаты" (в процентах от картинки) для секторов и POI
const SECTORS = {
  // 1 ярус
  "1:101": { x: 18, y: 65 }, "1:102": { x: 28, y: 74 }, "1:103": { x: 39, y: 78 },
  "1:104": { x: 50, y: 80 }, "1:105": { x: 61, y: 78 }, "1:106": { x: 72, y: 74 },
  "1:107": { x: 82, y: 65 }, "1:108": { x: 86, y: 52 }, "1:109": { x: 86, y: 40 },
  "1:110": { x: 82, y: 27 }, "1:111": { x: 72, y: 18 }, "1:112": { x: 61, y: 14 },
  "1:113": { x: 50, y: 12 }, "1:114": { x: 39, y: 14 }, "1:115": { x: 28, y: 18 },
  "1:116": { x: 18, y: 27 }, "1:117": { x: 14, y: 40 }, "1:118": { x: 14, y: 52 },
  // 2 ярус 
  "2:201": { x: 22, y: 70 }, "2:202": { x: 33, y: 77 }, "2:203": { x: 50, y: 83 },
  "2:210": { x: 79, y: 30 }, "2:217": { x: 20, y: 30 }
};

const POI = {
  toilet: [
    { name: "Туалет T1", x: 32, y: 68 }, { name: "Туалет T2", x: 68, y: 68 },
    { name: "Туалет T3", x: 68, y: 32 }, { name: "Туалет T4", x: 32, y: 32 },
  ],
  food: [
    { name: "Фудкорт F1", x: 50, y: 88 }, { name: "Фудкорт F2", x: 88, y: 50 },
    { name: "Фудкорт F3", x: 50, y: 12 }, { name: "Фудкорт F4", x: 12, y: 50 },
  ],
  shop: [
    { name: "Фан‑шоп S1", x: 50, y: 95 }, { name: "Фан‑шоп S2", x: 95, y: 50 },
    { name: "Фан‑шоп S3", x: 50, y: 5 },  { name: "Фан‑шоп S4", x: 5,  y: 50 },
  ]
};

// ============ Элементы ============
const $home = document.getElementById("home");
const $screen = document.getElementById("seat");
const $back = document.getElementById("backBtn");
const $tier = document.getElementById("tier");
const $sector = document.getElementById("sector");
const $row = document.getElementById("row");
const $seatNum = document.getElementById("seatNum");
const $arenaMap = document.getElementById("arenaMap");
const $overlay = document.getElementById("overlay");
const $hint = document.getElementById("hint");

// ============ Навигация экранов ============
document.querySelectorAll("[data-open]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.open;
    if (target === "seat") openSeat();
    else {
      openSeat();
      toast("Откроем «Моё место», чтобы подсказать ближайший " + btn.querySelector(".label").textContent.toLowerCase());
    }
  });
});
$back.addEventListener("click", () => goHome());

function openSeat() {
  $home.classList.add("hidden");
  $screen.classList.remove("hidden");
  if (tg) tg.BackButton.show();
}
function goHome() {
  $screen.classList.add("hidden");
  $home.classList.remove("hidden");
  if (tg) tg.BackButton.hide();
}

// ============ Инициализация формы ============
populateSectors();
$tier.addEventListener("change", populateSectors);

function populateSectors() {
  const tier = $tier.value;
  const items = Object.keys(SECTORS).filter(k => k.startsWith(tier + ":"));
  $sector.innerHTML = "";
  items
    .map(k => parseInt(k.split(":")[1], 10))
    .sort((a,b)=>a-b)
    .forEach(n => {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      $sector.appendChild(o);
    });
}
document.querySelectorAll("[data-find]").forEach(btn => {
  btn.addEventListener("click", () => findNearest(btn.dataset.find));
});

// ============ Карта и рисование ============
$arenaMap.src = MAP_URL;
$arenaMap.onload = resizeCanvas;
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  const r = $arenaMap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  $overlay.width = r.width * dpr;
  $overlay.height = r.height * dpr;
  $overlay.style.width = `${r.width}px`;
  $overlay.style.height = `${r.height}px`;

  const ctx = $overlay.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 

  drawDot(ctx, px(18, $overlay.width), px(65, $overlay.height), 4, "#000");          
  drawDot(ctx, px(32, $overlay.width), px(68, $overlay.height), 7, "#000", "#fff");   
}

    

function px(percent, size) { return (percent / 100) * size; }

function drawMarkers(from=null, to=null) {
  const ctx = $overlay.getContext("2d");
  ctx.clearRect(0,0,$overlay.width,$overlay.height);

  Object.values(POI).flat().forEach(p => {
    dot(ctx, px(p.x,$overlay.width), px(p.y,$overlay.height), 5, 5)
  });
  // Отображаем цель и пользователя разными стилями
  if (from && to) {
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(px(from.x, $overlay.width), px(from.y, $overlay.height));
    ctx.lineTo(px(to.x, $overlay.width), px(to.y, $overlay.height));
    ctx.strokeStyle = "#1f6feb";
    ctx.stroke();

    drawDot(ctx, px(from.x, $overlay.width), px(from.y, $overlay.height), 4, "#000");
    drawDot(ctx, px(to.x, $overlay.width), px(to.y, $overlay.height), 7, "#000", "#fff");
  }

}

function drawDot(ctx, x, y, r = 6, fill = "#000", stroke = null) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.restore();
}

// ============ Логика «найти рядом» ============
function findNearest(type) {
  const tier = $tier.value;
  const sector = $sector.value;
  const key = `${tier}:${sector}`;
  const from = SECTORS[key];
  if (!from) {
    toast("Сектор не поддержан в текущей схеме. Выбери другой или обнови карту.");
    return;
  }
  const list = POI[type] || [];
  if (!list.length) return;

  let best = null, bestD = Infinity;
  list.forEach(p => {
    const dx = p.x - from.x, dy = p.y - from.y;
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = p; }
  });

  drawMarkers(from, best);

  const approxMeters = Math.round(bestD * 1.8); 

  $hint.textContent =
    `От сектора ${sector}: ближайший ${labelFor(type)} — «${best.name}», ~${approxMeters} м. См. синий маршрут.`;

  safeSendToBot({
    action: "nearest",
    type,
    tier,
    sector,
    row: $row.value || null,
    seat: $seatNum.value || null,
    target: best.name,
    distance_units: "m",
    approx_distance: approxMeters
  });
}

function labelFor(type){
  return type === "toilet" ? "туалет" : type === "food" ? "фудкорт" : "фан‑шоп";
}

// ============ Отправка данных в бот (опционально и безопасно) ============
// 1) Если WebApp открыт из reply-клавиатуры — сработает sendData (обработчик: update.message.web_app_data)
// 2) Если открыт из inline-кнопки — нужен backend и answerWebAppQuery (query_id из initDataUnsafe)
// Мы шлём только компактное событие без персональных данных.
function safeSendToBot(data) {
  if (tg && typeof tg.sendData === "function") {
    tg.sendData(JSON.stringify(data));
  } else {
    console.warn("Telegram WebApp not available, cannot send data:", data);
  }
}

// ============ Удобные мелочи ============
function toast(text){
  if (tg?.showPopup) tg.showPopup({message: text});
  else alert(text);
}

window.addEventListener("popstate", () => goHome());


