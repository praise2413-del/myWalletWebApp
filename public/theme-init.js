(function () {
  try {
    var stored = JSON.parse(localStorage.getItem("mywallet-theme"));
    var mode = stored && stored.state ? stored.state.mode : "system";
    var isDark =
      mode === "dark" ||
      (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch {}
})();
