import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Toaster } from "./components/shadcn/Sonner";
import "./index.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            error: "p-2 rounded-md flex gap-4 items-center bg-red-400 border",
            success: "p-2 rounded-md flex gap-4 items-center bg-green-400 border",
            warning: "text-yellow-400",
            info: "bg-blue-400",
          },
        }}
      />
    </GoogleOAuthProvider>
  </StrictMode>
);
