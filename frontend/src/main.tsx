import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { configureHttp } from "./api/http";
import { store } from "./app/store";
import { sessionRefreshed } from "./features/auth/authSlice";
import "./index.css";

// Connect the Axios client to the store, without importing the store inside it
configureHttp({
  onSessionRefreshed: (session) => store.dispatch(sessionRefreshed(session)),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
