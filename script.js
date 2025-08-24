// Простейший мемо-роутер
const $ = (sel) => document.querySelector(sel);
const screens = {
  home: $("#screen-home"),
  nav: $("#screen-nav"),
  fanshop: $("#screen-fanshop"),
  foodcourt: $("#screen-foodcourt"),
  toilet: $("#screen-toilet"),
  myseat: $("#screen-myseat"),
  news: $("#screen-news"),
  matches: $("#screen-matches"),
  promos: $("#screen-promos"),
  faq: $("#screen-faq")
};
const title = $("#screen-title");

function show(route) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  (screens[route] || screens.home).classList.add("active");
  // Заголовок
  const titles = {
    home: "Навигация на стадионе",
    nav: "Общая навигация",
    fanshop: "Фан-шоп",
    foodcourt: "Фудкорт",
    toilet: "Туалет",
    myseat: "Моё место",
    news: "Новости",
    matches: "Матчи",
    promos: "Акции",
    faq: "FAQ"
  };
  title.textContent = titles[route] || titles.home;
  history.replaceState({}, "", `#/${route}`);
}

function bindRouting(){
  document.body.addEventListener("click", (e)=>{
    const t = e.target.closest("[data-route]");
    if (t) { e.preventDefault(); show(t.dataset.route); }
  });
  // начальный маршрут
  const hash = location.hash.replace("#/","");
  show(hash || "home");
}
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html"; // возвращаем на главную
});

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "index.html"; // возвращаем на главную
});


bindRouting();
