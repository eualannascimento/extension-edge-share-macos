const darkMediaQuery = matchMedia("(prefers-color-scheme: dark)");

function sendThemeDetection(isDark: boolean): void {
  chrome.runtime.sendMessage({ type: "theme-detected", isDark });
}

sendThemeDetection(darkMediaQuery.matches);
darkMediaQuery.addEventListener("change", (event) => sendThemeDetection(event.matches));
