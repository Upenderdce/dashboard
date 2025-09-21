import React, { useState, useEffect } from "react";
import "./App.css";

const milestoneData = [
  { name: "Concept", offset: -55 },
  { name: "Sketch", offset: -52 },
  { name: "Model", offset: -40 },
  { name: "CAD", offset: -32.5 },
  { name: "Drawing", offset: -26 },
  { name: "DP", offset: -20 },
  { name: "PP", offset: -10 },
  { name: "MPP", offset: -5 },
  { name: "Pilot", offset: -1 },
  { name: "SOP", offset: 0 },
];

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function DataInput() {
  const [projectName, setProjectName] = useState("");
  const [SOP, setSOP] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [widgets, setWidgets] = useState({
    criticalIssues: [],
    sourcingStatus: [],
    drgRelease: [],
    feasibility: [],
    projectStatus: [],
  });

  const [newInputs, setNewInputs] = useState({
    criticalIssues: "",
    sourcingStatus: "",
    drgRelease: "",
    feasibility: "",
    projectStatus: "",
  });

  // --- Load from localStorage on mount ---
  useEffect(() => {
    const raw = localStorage.getItem("dashboardData");
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored.projectName) setProjectName(stored.projectName);
      if (stored.SOP) setSOP(stored.SOP);
      if (stored.milestones) setMilestones(stored.milestones);
      if (stored.widgets) setWidgets(stored.widgets);
    }
  }, []);

  // --- Add/Remove widgets ---
  const handleAdd = (key) => {
  if (!newInputs[key]) return;

  if (key === "sourcingStatus" || key === "drgRelease") {
    const { total, done, pending } = newInputs[key];
    if (!total || !done || !pending) return; // all fields required
    setWidgets((prev) => ({
      ...prev,
      [key]: [...prev[key], { total, done, pending }],
    }));
  } else {
    if (!newInputs[key].trim()) return;
    setWidgets((prev) => ({
      ...prev,
      [key]: [...prev[key], newInputs[key]],
    }));
  }

  setNewInputs((prev) => ({
    ...prev,
    [key]: key === "sourcingStatus" || key === "drgRelease" ? { total: "", done: "", pending: "" } : "",
  }));
};


  const handleRemove = (key, index) => {
    setWidgets((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  // --- Save everything ---
  const handleSubmit = (e) => {
    e.preventDefault();

    const sopDate = new Date(SOP);
    const milestones = milestoneData.map((m) => ({
      ...m,
      date: addMonths(sopDate, m.offset).toISOString().split("T")[0],
    }));

    const data = {
      projectName: projectName || "Project",
      SOP,
      milestones,
      widgets,
      widgetOrder: [
        "criticalIssues",
        "sourcingStatus",
        "drgRelease",
        "feasibility",
        "projectStatus",
      ],
    };

    localStorage.setItem("dashboardData", JSON.stringify(data));
    setMilestones(milestones); // update preview immediately
    alert("✅ Data + Widgets saved! Switch to Dashboard to view it.");
  };

  return (
    <div className="dashboard-container">
      <h2>Data Input</h2>

      {/* === Project Info === */}
      <div className="card">
        <h3>Project Info</h3>
        <label>Project Name:</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
        />
        <label>SOP Date:</label>
        <input
          type="date"
          value={SOP}
          onChange={(e) => setSOP(e.target.value)}
        />
      </div>

      {/* === Widgets === */}
      <div className="dnd-container">
        {Object.keys(widgets).map((key) => (
          <div className="widget card" key={key}>
            <h3>{key}</h3>

            {key === "sourcingStatus" || key === "drgRelease" ? (
              <div className="input-row">
                <input
                  type="number"
                  placeholder="Total"
                  value={newInputs[key]?.total || ""}
                  onChange={(e) =>
                    setNewInputs((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], total: e.target.value },
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder={key === "sourcingStatus" ? "Completed" : "Released"}
                  value={newInputs[key]?.done || ""}
                  onChange={(e) =>
                    setNewInputs((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], done: e.target.value },
                    }))
                  }
                />
                <input
                  type="number"
                  placeholder="Pending"
                  value={newInputs[key]?.pending || ""}
                  onChange={(e) =>
                    setNewInputs((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], pending: e.target.value },
                    }))
                  }
                />
                <button type="button" onClick={() => handleAdd(key)}>
                  Add
                </button>
              </div>
            ) : (
              // normal input for other widgets
              <div className="widget-input">
                <input
                  type="text"
                  value={newInputs[key]}
                  onChange={(e) =>
                    setNewInputs((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Add to ${key}`}
                />
                <button type="button" onClick={() => handleAdd(key)}>
                  Add
                </button>
              </div>
            )}
          </div>

        ))}
      </div>

      {/* === Timeline Preview === */}
      {SOP && (
        <div className="timeline-container">
          <table>
            <thead>
              <tr>
                <th className="sticky-col">Milestone</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m, idx) => (
                <tr key={idx}>
                  <td className="sticky-col">{m.name}</td>
                  <td>{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === Save Button === */}
      <div className="card full-width">
        <button className="save-btn" onClick={handleSubmit}>
          💾 Save All Data
        </button>
      </div>
    </div>
  );
}
