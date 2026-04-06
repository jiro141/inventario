// src/App.jsx
import React from "react";
import AppRouter from "./routers/AppRouter";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <AppRouter />
    </>
  );
};

export default App;
