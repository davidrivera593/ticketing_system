import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import Cookies from "js-cookie";
import "./DeveloperDash.css";
import SideBar from "../../components/SideBar/SideBar";

const DeveloperDash = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBugReports = async () => {
      setLoading(true);
      setError("");

      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("No token found. Please log in again.");
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || ""}/api/bug-reports`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load bug reports: ${response.status}`);
        }

        const payload = await response.json();
        setBugReports(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err) {
        setError(err.message || "Failed to load bug reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchBugReports();
  }, []);

  const formatCreatedAt = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="developer-shell">
      <SideBar />

      <main className="developer-main">
        <h1>Developer Dashboard</h1>

        <section className="developer-report-card">
          <h2>Bug Reports</h2>
          <p>Bug report data from the bugreports table appears below.</p>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <table>
            <thead>
              <tr>
                <th>subject</th>
                <th>status</th>
                <th>severity</th>
                <th>reporter_id</th>
                <th>createdAt</th>
              </tr>
            </thead>

            <tbody>
              {!loading && bugReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="developer-empty-row">
                    No bug reports loaded yet.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="developer-empty-row">
                    Loading bug reports...
                  </td>
                </tr>
              )}

              {!loading &&
                bugReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.subject || "-"}</td>
                    <td>{report.status || "-"}</td>
                    <td>{report.severity || "-"}</td>
                    <td>{report.reporter_id ?? "-"}</td>
                    <td>{formatCreatedAt(report.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default DeveloperDash;