import { SplashScreen } from "@capacitor/splash-screen";
import { createRoot } from "react-dom/client";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import App from "./App.tsx";
import "./i18n";
import "./index.css";

const init = async () => {
  // show splash manually (optional control)
  await SplashScreen.show({
    autoHide: true,
    showDuration: 2000,
  });
};

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

init();
