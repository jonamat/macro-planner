import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./providers/AuthProvider";
import { theme } from "./theme";
import initializeLocales from "./i18n/initializeLocales";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

initializeLocales();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChakraProvider value={theme}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
