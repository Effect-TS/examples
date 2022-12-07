import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <div>
    <StrictMode>
      <App />
    </StrictMode>
  </div>
);
