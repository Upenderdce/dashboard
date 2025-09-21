// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CELL_WIDTH = 80;

// --- Helpers ---
function getAllMonths(startDate, endDate) {
  const months = [];
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  let current = new Date(start);
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

// --- Dashboard ---
export default function Dashboard() {
  const [projectName, setProjectName] = useState("Project");
  const [milestones, setMilestones] = useState([]);
  const [widgets, setWidgets] = useState({
    criticalIssues: [],
    feasibility: [],
    projectStatus: [],
    sourcingStatus: [],
    drgRelease: []
  });
  const [widgetOrder, setWidgetOrder] = useState([
    "criticalIssues",
    "sourcingStatus",
    "drgRelease",
    "feasibility",
    "projectStatus"
  ]);
  const [tableWidth, setTableWidth] = useState(1200);
  const [tableHeight, setTableHeight] = useState(200);

  const sensors = useSensors(useSensor(PointerSensor));

  // --- Load from localStorage ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboardData");
      if (!raw) return;

      const stored = JSON.parse(raw);
      if (stored.projectName) setProjectName(stored.projectName);
      if (stored.milestones) setMilestones(stored.milestones);
      if (stored.widgets) setWidgets(stored.widgets);
      if (stored.widgetOrder) setWidgetOrder(stored.widgetOrder);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    }
  }, []);

  // --- Timeline calculation ---
  const years = [...new Set(milestones.map(m => new Date(m.date).getFullYear()))];
  const allMonths =
    milestones.length > 0 && milestones[0].date
      ? getAllMonths(
          new Date(milestones[0].date),
          new Date(milestones[milestones.length - 1].date)
        )
      : [];

  const monthsByYear = {};
  allMonths.forEach((d) => {
    const y = d.getFullYear();
    if (!monthsByYear[y]) monthsByYear[y] = [];
    monthsByYear[y].push(d.getMonth() + 1);
  });

  return (
    <div>
      <h2>{projectName} - Dashboard</h2>
      <nav className="nav-bar"></nav>

      {/* Table Resize Controls */}
        <div className="resize-controls">
          <label>
            Table Width:
            <input
              type="range"
              min="800"
              max="3000"
              step="50"
              value={tableWidth}
              onChange={(e) => setTableWidth(Number(e.target.value))}
            />
            {tableWidth}px
          </label>
          <label style={{ marginLeft: "20px" }}>
            Table Height:
            <input
              type="range"
              min="150"
              max="800"
              step="10"
              value={tableHeight}
              onChange={(e) => setTableHeight(Number(e.target.value))}
            />
            {tableHeight}px
          </label>
        </div>


      {/* Timeline */}
      {milestones.length > 0 && (
        <div className="timeline-container" style={{ overflowX: "auto" }}>
          <table
            style={{
              minWidth: tableWidth + 120,
              width: `${tableWidth + 120}px`,
              height: `${tableHeight}px`
            }}
          >
            <thead>
              <tr>
                <th className="sticky-col">Year</th>
                {years.map((year, i) => (
                  <th key={i} colSpan={monthsByYear[year].length}>
                    {year}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky-col">Month</th>
                {allMonths.map((d, i) => {
                  const milestone = milestones.find(
                    (m) =>
                      new Date(m.date).getFullYear() === d.getFullYear() &&
                      new Date(m.date).getMonth() === d.getMonth()
                  );
                  const fontSize = Math.max(8, Math.min(14, tableWidth / allMonths.length / 2));
                  return (
                    <th key={i} style={{ fontSize: `${fontSize}px` }}>
                      {d.getMonth() + 1}
                      {milestone && (
                        <div className="tooltip">{milestone.name}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <TimelineRow
                milestones={milestones}
                projectName={projectName}
                allMonths={allMonths}
              />
            </tbody>
          </table>
        </div>
      )}

      {/* Widgets */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over) return;
          if (active.id !== over.id) {
            const oldIndex = widgetOrder.indexOf(active.id);
            const newIndex = widgetOrder.indexOf(over.id);
            setWidgetOrder(arrayMove(widgetOrder, oldIndex, newIndex));
          }
        }}
      >
        <SortableContext
          items={widgetOrder}
          strategy={horizontalListSortingStrategy}
        >
          <div className="dnd-container">
            {widgetOrder.map((id) => (
              <SortableWidget
                key={id}
                id={id}
                items={[...widgets[id]]}
                isChart={id === "sourcingStatus" || id === "drgRelease"}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// --- Timeline Row (read-only) ---
function TimelineRow({ milestones, projectName, allMonths }) {
  return (
    <tr>
      <td className="sticky-col">{projectName}</td>
      {allMonths.map((d, i) => {
        const milestone = milestones.find(
          (m) =>
            new Date(m.date).getFullYear() === d.getFullYear() &&
            new Date(m.date).getMonth() === d.getMonth()
        );
        return (
          <td key={i} className="project-cell">
            {milestone && (
              <div className="milestone-label">{milestone.name}</div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

// --- Sortable Widget ---
function SortableWidget({ id, items, isChart }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: "inline-block",
    marginRight: "10px",
    verticalAlign: "top",
    minWidth: "220px"
  };
  return (
    <div ref={setNodeRef} style={style}>
      {isChart ? (
        <NumericBarChart id={id} items={items} />
      ) : (
        <Widget id={id} items={items} {...attributes} {...listeners} />
      )}
    </div>
  );
}

// --- Widget (read-only) ---
function Widget({ id, items, attributes, listeners }) {
  return (
    <div className="widget">
      <h3 {...attributes} {...listeners} style={{ cursor: "grab" }}>
        {id}
      </h3>
      {items.length === 0 ? (
        <p className="empty">No entries yet.</p>
      ) : (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}


function NumericBarChart({ id, items }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!items || items.length === 0) {
      setChartData(null);
      return;
    }

    const latest = items[items.length - 1];

    setChartData({
      labels: [id === "sourcingStatus" ? "Sourcing" : "DRG Release"],
      datasets: [
        {
          label: id === "sourcingStatus" ? "Completed" : "Released",
          data: [Number(latest.done)],
          backgroundColor: "rgba(0,123,255,0.7)",
        },
        {
          label: "Pending",
          data: [Number(latest.pending)],
          backgroundColor: "rgba(220,53,69,0.7)",
        },
      ],
    });
  }, [items, id]); // Recompute whenever `items` changes

  if (!chartData) return <div className="widget">No data yet</div>;

  return (
    <div className="widget">
      <h3>{id}</h3>
      <Bar key={items.length} data={chartData} options={{ responsive: true }} />
    </div>
  );
}
