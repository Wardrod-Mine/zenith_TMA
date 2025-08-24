// кнопка "Назад"
document.getElementById("backBtn").addEventListener("click", () => {
  // если есть история — вернёмся, иначе на главную
  if (history.length > 1) history.back();
  else location.href = "./";
});

// навигация по плиткам (заглушки)
document.querySelectorAll(".tile").forEach(btn => {
  btn.addEventListener("click", () => {
    const scr = btn.dataset.screen;
    alert("Откроем экран: " + scr);
    // здесь можно делать SPA-навигацию (заменой контента) или переходом по hash
  });
});
