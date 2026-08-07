import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initGoogleAnalytics, initGoogleTagManager } from "./app/lib/googleAnalytics";

initGoogleTagManager();
initGoogleAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
