import { useEffect, useState } from "react";
import axios from "axios";
import "./app.css";

function App() {
  const [apps, setApps] = useState([]);
  const [previousCVs, setPreviousCVs] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [form, setForm] = useState({
    company: "",
    position: "",
    link: "",
    status: "Must Apply",
    date_applied: "",
    location: "",
    cv_title: ""
  });
  const [cvFile, setCvFile] = useState(null);
  const [selectedExistingCV, setSelectedExistingCV] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchApps();
    fetchPreviousCVs();
  }, []);

  async function fetchApps() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/applications/");
      setApps(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPreviousCVs() {
    try {
      const res = await axios.get("http://127.0.0.1:8000/previous-cvs/");
      setPreviousCVs(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredApps = selectedFilter === "All" 
    ? apps 
    : apps.filter(app => app.status === selectedFilter);

  async function handleDelete(appId) {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/applications/${appId}`);
        fetchApps();
        fetchPreviousCVs();
      } catch (err) {
        console.error("Error deleting:", err);
        alert("Error deleting application");
      }
    }
  }

  function startEdit(app) {
    setEditingId(app.id);
    setForm({
      company: app.company,
      position: app.position,
      link: app.link,
      status: app.status,
      date_applied: app.date_applied,
      location: app.location,
      cv_title: app.cv_title || ""
    });
    setSelectedExistingCV(app.cv_filename || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      company: "",
      position: "",
      link: "",
      status: "Must Apply",
      date_applied: "",
      location: "",
      cv_title: ""
    });
    setCvFile(null);
    setSelectedExistingCV("");
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      let cvResponse = null;
      let cvFilename = selectedExistingCV;
      
      if (cvFile) {
        const fd = new FormData();
        fd.append("file", cvFile);
        cvResponse = await axios.post("http://127.0.0.1:8000/upload-cv/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        cvFilename = cvResponse.data.filename;
      }

      const payload = { 
        ...form,
        cv_filename: cvFilename,
        cv_title: form.cv_title || (cvFilename ? cvFilename.split('_').slice(2).join('_') : null)
      };

      await axios.put(`http://127.0.0.1:8000/applications/${editingId}`, payload);
      
      cancelEdit();
      fetchApps();
      fetchPreviousCVs();
      
    } catch (err) {
      console.error("Error updating:", err);
      alert("Error updating application");
    }
  }

  async function handleUploadAndCreate(e) {
    e.preventDefault();
    try {
      let cvResponse = null;
      let cvFilename = selectedExistingCV;
      
      if (cvFile) {
        const fd = new FormData();
        fd.append("file", cvFile);
        cvResponse = await axios.post("http://127.0.0.1:8000/upload-cv/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        cvFilename = cvResponse.data.filename;
      }

      const payload = { 
        ...form,
        cv_filename: cvFilename,
        cv_title: form.cv_title || (cvFilename ? cvFilename.split('_').slice(2).join('_') : null)
      };

      await axios.post("http://127.0.0.1:8000/applications/", payload);
      
      setForm({ 
        company: "", 
        position: "", 
        link: "", 
        status: "Must Apply", 
        date_applied: "", 
        location: "",
        cv_title: ""
      });
      setCvFile(null);
      setSelectedExistingCV("");
      
      fetchApps();
      fetchPreviousCVs();
    } catch (err) {
      console.error(err);
      alert("Error creating application");
    }
  }

  function handleExistingCVSelect(filename) {
    setSelectedExistingCV(filename);
    if (!form.cv_title) {
      const selectedCV = previousCVs.find(cv => cv.filename === filename);
      if (selectedCV) {
        setForm({...form, cv_title: selectedCV.title});
      }
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <div>
            <h1 className="app-title">TrackStar</h1>
            <p className="app-subtitle">Manage your job applications with ease</p>
          </div>
          <div className="app-counter">
            <span className="counter-label">Total Applications:</span>
            <span className="counter-value">{apps.length}</span>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="filter-section">
        <label className="filter-label">Filter by Status</label>
        <div className="filter-buttons">
          {["All", "Must Apply", "Applied", "Interview", "Rejected", "Offer"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`filter-button ${selectedFilter === status ? 'filter-button-active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Application Form */}
      <div className="form-card">
        <h2 className="form-title">
          {editingId ? "Edit Application" : "Add New Application"}
        </h2>
        
        <form onSubmit={editingId ? handleUpdate : handleUploadAndCreate} className="application-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Company *
              </label>
              <input 
                required 
                value={form.company} 
                onChange={e => setForm({...form, company: e.target.value})} 
                placeholder="Google, Apple..." 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Position *
              </label>
              <input 
                required 
                value={form.position} 
                onChange={e => setForm({...form, position: e.target.value})} 
                placeholder="Software Engineer..." 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Date Applied
              </label>
              <input 
                type="date"
                value={form.date_applied} 
                onChange={e => setForm({...form, date_applied: e.target.value})} 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Status
              </label>
              <select 
                value={form.status} 
                onChange={e => setForm({...form, status: e.target.value})} 
                className="form-input"
              >
                <option>Must Apply</option>
                <option>Applied</option>
                <option>Interview</option>
                <option>Rejected</option>
                <option>Offer</option>
              </select>
            </div>
          </div>

          <div className="form-grid-wide">
            <div className="form-group">
              <label className="form-label">
                Job Link
              </label>
              <input 
                value={form.link} 
                onChange={e => setForm({...form, link: e.target.value})} 
                placeholder="https://company.com/careers/..." 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Location
              </label>
              <input 
                value={form.location} 
                onChange={e => setForm({...form, location: e.target.value})} 
                placeholder="Johannesburg, Gauteng..." 
                className="form-input"
              />
            </div>
          </div>

          {/* CV Management Section */}
          <div className="cv-section">
            <h3 className="cv-title">CV Attachment</h3>
            
            <div className="cv-grid">
              {/* Use Existing CV Dropdown */}
              {previousCVs.length > 0 && (
                <div className="form-group">
                  <label className="form-label">
                    Use Existing CV
                  </label>
                  <select 
                    value={selectedExistingCV} 
                    onChange={e => handleExistingCVSelect(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select existing CV...</option>
                    {previousCVs.map(cv => (
                      <option key={cv.filename} value={cv.filename}>
                        {cv.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* CV Title Input */}
              <div className="form-group">
                <label className="form-label">
                  CV Title
                </label>
                <input 
                  value={form.cv_title} 
                  onChange={e => setForm({...form, cv_title: e.target.value})} 
                  placeholder="e.g., Software Engineer CV..."
                  className="form-input"
                />
              </div>
            </div>

            {/* Upload New CV */}
            <div className="upload-section">
              <label className="form-label">
                Or Upload New CV
              </label>
              <div className="upload-container">
                <input 
                  type="file" 
                  onChange={e => setCvFile(e.target.files[0])} 
                  className="file-input"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            {editingId ? (
              <>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Update Application
                </button>
                <button 
                  type="button"
                  onClick={cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Add Application
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Applications List */}
      <div className="applications-card">
        <div className="applications-header">
          <h2 className="applications-title">
            Applications ({filteredApps.length})
          </h2>
        </div>
        
        <div className="table-container">
          <table className="applications-table">
            <thead className="table-header">
              <tr>
                <th className="table-head">Company</th>
                <th className="table-head">Position</th>
                <th className="table-head">Status</th>
                <th className="table-head">Date</th>
                <th className="table-head">CV</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredApps.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="table-cell">
                    <div className="company-name">{a.company}</div>
                  </td>
                  <td className="table-cell">
                    <div className="position-name">{a.position}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge status-${a.status.toLowerCase().replace(' ', '-')}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="table-cell date-cell">
                    {a.date_applied || '-'}
                  </td>
                  <td className="table-cell">
                    {a.cv_filename ? (
                      <a 
                        href={`http://127.0.0.1:8000/static/cv_uploads/${a.cv_filename}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="cv-link"
                        title={a.cv_title || a.cv_filename}
                      >
                        <span className="cv-link-text">
                          {a.cv_title || a.cv_filename}
                        </span>
                      </a>
                    ) : (
                      <span className="no-cv">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="action-buttons">
                      <button 
                        onClick={() => startEdit(a)}
                        className="action-btn edit-btn"
                        title="Edit"
                      >
                        <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id)}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg className="empty-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="empty-text">
              No applications found {selectedFilter !== "All" ? `with status "${selectedFilter}"` : ""}
            </p>
            <p className="empty-subtext">
              {selectedFilter !== "All" ? "Try changing the filter or add a new application" : "Start by adding your first job application"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;