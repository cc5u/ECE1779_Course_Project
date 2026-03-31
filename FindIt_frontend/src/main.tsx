import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
// This is the entry point of your application. 
// It renders the App component into the root element in the HTML. 
// You can also add any global styles or providers here if needed.
