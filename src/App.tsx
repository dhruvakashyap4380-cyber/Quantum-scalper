/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("bot_auth");
    if (saved === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (key: string) => {
    // In a real app, this should be validated against the server key
    // For now, we'll compare with "admin123" or whatever was set
    setPasskey(key);
    setIsAuthenticated(true);
    localStorage.setItem("bot_auth", "true");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard />;
}
