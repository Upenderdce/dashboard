import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DataInput from "./DataInput";
import Dashboard from "./Dashboard";
import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="App">
        <nav className="nav-bar">
          <Link to="/">Data Input</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DataInput />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
