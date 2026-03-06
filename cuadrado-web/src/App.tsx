import { useState } from 'react'
import viteLogo from '/vite.svg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <h1>Demo Autenticación</h1>

          <div style={{ marginBottom: "20px" }}>
              <button >Login</button>

              <button style={{ marginLeft: "10px" }}>Registro</button>

              <button style={{ marginLeft: "10px" }}>
                Cambiar contraseña
              </button>
          </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App

// PÁGINA POR DEFECTO COMENTADA

// puede que haya que hacer este comando la primera vez que lo vayas a ejecutar: npm install react-router-dom

/*

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <div style={{ padding: "20px" }}>
          
          <h1>Demo Autenticación</h1>

          <div style={{ marginBottom: "20px" }}>
            <Link to="/login">
              <button>Login</button>
            </Link>

            <Link to="/register">
              <button style={{ marginLeft: "10px" }}>Registro</button>
            </Link>

            <Link to="/change-password">
              <button style={{ marginLeft: "10px" }}>
                Cambiar contraseña
              </button>
            </Link>
          </div>

          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Routes>

        </div>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
*/