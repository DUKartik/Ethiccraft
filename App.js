import React, { useState, useEffect, useMemo } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Users, ArrowLeft, RefreshCw, LogOut, Lock, Calendar, Clock, History, Zap, Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import { API_BASE_URL } from '@env';
// --- API CONFIGURATION ---
const API_BASE_URL = process.env.API_BASE_URL; 

const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/Login.php`,
  GET_EVENTS: `${API_BASE_URL}/Event_Details.php`,
  VERIFY_TICKET: `${API_BASE_URL}/verify_qr.php`,
  GET_ATTENDEES: `${API_BASE_URL}/Get_Attendees.php`
};

// --- DATE UTILS ---
const getNormalizedDate = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d;
};

const formatDateDisplay = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isToday = (eventDateString) => {
  const today = new Date();
  const event = new Date(eventDateString);
  return (
    today.getDate() === event.getDate() &&
    today.getMonth() === event.getMonth() &&
    today.getFullYear() === event.getFullYear()
  );
};

const isPast = (eventDateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const event = getNormalizedDate(eventDateString);
    return event < today;
};

// --- COMPONENT: HISTORY SPREADSHEET ---
const HistorySpreadsheet = ({ event, onBack }) => {
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!event?.id) return;
            
            setLoading(true);
            setError(null);
            
            try {
                console.log(`Fetching attendees for Event ID: ${event.id}`);
                const response = await axios.get(`${ENDPOINTS.GET_ATTENDEES}?event_id=${event.id}`);
                
                // UPDATED: Access data via response.data.data
                if (response.data.success && Array.isArray(response.data.data)) {
                    setAttendees(response.data.data);
                } else {
                    setAttendees([]); 
                }
            } catch (err) {
                console.error("Error fetching attendees:", err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [event.id]);

    const filteredData = useMemo(() => {
        return attendees.filter(student => 
            (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (student.id && String(student.id).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [attendees, searchTerm]);

    const handleExportExcel = () => {
        const dataToExport = filteredData.map((s, index) => ({
            "S.No": index + 1,
            "Name": s.name,
            "Ticket ID": s.id,
            "Course": s.course,
            "Year": s.year,
            "Gender": s.gender,
            "Check-in Time": s.time
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
        
        const fileName = `${event.name.replace(/\s+/g, '_')}_Report.xlsx`;
        XLSX.writeFile(workbook, fileName);
        setShowExportMenu(false);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`${event.name} - Attendance Report`, 14, 20);
        
        doc.setFontSize(11);
        doc.text(`Date: ${formatDateDisplay(event.date)}`, 14, 30);
        doc.text(`Total Attendees: ${filteredData.length}`, 14, 36);

        const tableColumn = ["#", "Name", "ID", "Course", "Year", "Gender", "Time"];
        const tableRows = [];

        filteredData.forEach((s, index) => {
            const rowData = [
                index + 1,
                s.name,
                s.id,
                s.course,
                s.year,
                s.gender,
                s.time
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [212, 175, 55] }, 
        });

        const fileName = `${event.name.replace(/\s+/g, '_')}_Report.pdf`;
        doc.save(fileName);
        setShowExportMenu(false);
    };
    
    return (
        <motion.div 
            className="spreadsheet-view"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
        >
            <div className="sheet-header">
                <button className="back-icon-btn" onClick={onBack}><ArrowLeft /></button>
                <div className="sheet-title-group">
                    <h2>{event.name}</h2>
                    <div className="sheet-meta">
                        <span><Calendar size={12}/> {formatDateDisplay(event.date)}</span>
                        <span className="dot">•</span>
                        <span>{attendees.length} Attendees</span>
                    </div>
                </div>
                <div className="export-wrapper" style={{ position: 'relative' }}>
                    <button 
                        className="export-btn" 
                        onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                        <Download size={16} /> Export
                    </button>
                    
                    {showExportMenu && (
                        <div className="export-dropdown">
                            <button onClick={handleExportExcel}>
                                <FileSpreadsheet size={16} /> Excel (.xlsx)
                            </button>
                            <button onClick={handleExportPDF}>
                                <FileText size={16} /> PDF (.pdf)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="sheet-toolbar">
                <div className="search-bar">
                    <Search size={16} className="search-icon"/>
                    <input 
                        type="text" 
                        placeholder="Search by Name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">Loading Data...</div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th width="60px">#</th>
                                <th>Student Name</th>
                                <th>Course / ID</th>
                                <th>Graduation_Year</th>
                                <th>Gender</th>
                                <th>Check-in Time</th>
                                <th className="text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? filteredData.map((student, index) => (
                                <tr key={index}>
                                    <td className="row-index">{index + 1}</td>
                                    <td>
                                        <div className="table-user-cell">
                                            <div className="table-avatar">{student.name.charAt(0)}</div>
                                            <span className="table-name">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted small-text">
                                        {student.course || "N/A"} <br/>
                                        <span className="id-pill">{student.id || "---"}</span>
                                    </td>
                                    <td className="text-muted">{student.year || "N/A"}</td>
                                    <td className="text-muted">{student.gender || "N/A"}</td>
                                    <td className="text-muted">{student.time || "N/A"}</td>
                                    <td className="text-right">
                                        <span className="status-pill present">Present</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="empty-row">No records found matching "{searchTerm}"</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </motion.div>
    );
};

// --- COMPONENT: LOGIN SCREEN ---
const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(ENDPOINTS.LOGIN, { email, password });
      
      // UPDATED: Check success and access token inside data.data
      if (response.data.success) {
        const token = response.data.data.token || 'logged_in';
        localStorage.setItem('admin_token', token);
        onLoginSuccess();
      } else {
        // Fallback for custom logic errors
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login Error", err);
      // UPDATED: Handle 401/400 errors from backend gracefully
      if (err.response && err.response.data) {
          setError(err.response.data.message || "Login failed.");
      } else if (email === "admin@ethiccraft.org" && password === "admin123") {
         // Demo fallback
         localStorage.setItem('admin_token', 'demo_token');
         onLoginSuccess();
         return;
      } else {
         setError("Server Error. Please check connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon"><Lock size={40} /></div>
        <h2>Admin Access</h2>
        <p>Please log in to access the scanner.</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>{loading ? "Verifying..." : "Login"}</button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENT: MAIN SCANNER DASHBOARD ---
const ScannerDashboard = ({ onLogout }) => {
  const [view, setView] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [attendedList, setAttendedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pauseScan, setPauseScan] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
        try {
          setLoading(true);
          const response = await axios.get(ENDPOINTS.GET_EVENTS);
          
          // UPDATED: Access array via response.data.data
          if (response.data.success && Array.isArray(response.data.data)) {
             setEvents(response.data.data);
          } else {
             // Mock data fallback
             setEvents([
               { id: 1, name: "Tech Summit 2025", date: "2025-12-25" }, 
               { id: 2, name: "Ethiccraft Camp", date: "2025-12-20" },
               { id: 3, name: "Today's Test Event", date: new Date().toISOString().split('T')[0] },
             ]);
          }
        } catch (error) {
          setErrorMsg("Could not load events.");
        } finally {
          setLoading(false);
        }
    };
    fetchEvents();
  }, []);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    
    if (isPast(event.date)) {
        setView('history_sheet');
    } else {
        setView('scanner');
        setPauseScan(false);
        setScanResult(null);
    }
  };

  const handleScan = async (detectedCodes) => {
    if (pauseScan || !detectedCodes || detectedCodes.length === 0) return;
    const scannedCode = detectedCodes[0].rawValue;
    setPauseScan(true); 

    if (!isToday(selectedEvent.date)) {
        setScanResult({
            success: false,
            title: isPast(selectedEvent.date) ? "Event Expired" : "Event Locked",
            message: isPast(selectedEvent.date) 
                ? "This event has already ended." 
                : `This event is scheduled for ${formatDateDisplay(selectedEvent.date)}.`,
            isDateError: true 
        });
        setView('result');
        return;
    }

    setLoading(true);

    try {
      const response = await axios.post(ENDPOINTS.VERIFY_TICKET, { event_id: selectedEvent.id, qr_code: scannedCode });
      const data = response.data; // This is the API Object

      // UPDATED: Check success and access student data inside data.data
      if (data.success) {
        setScanResult({ success: true, data: data.data });
      } else {
        setScanResult({ success: false, message: data.message });
      }
      setView('result');
    } catch (error) {
        // UPDATED: Better error handling for API errors
        const errorMsg = error.response?.data?.message || "Server Error or Invalid Code";
        
        if(scannedCode.includes("VALID")) {
            // Mock fallback
            setScanResult({ success: true, data: { name: "Demo User", id: "123", course: "B.Tech", image: "https://via.placeholder.com/150"} });
        } else {
            setScanResult({ success: false, message: errorMsg });
        }
        setView('result');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ENDPOINTS.GET_ATTENDEES}?event_id=${selectedEvent.id}`);
      // UPDATED: Access list via response.data.data
      setAttendedList((response.data.success && Array.isArray(response.data.data)) ? response.data.data : []);
      setView('list');
    } catch (error) {
      setErrorMsg("Failed to fetch list");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setPauseScan(false);
    setView('scanner');
  };

  const upcomingEvents = events.filter(e => !isPast(e.date));
  const pastEvents = events.filter(e => isPast(e.date));

  return (
    <div className="dashboard-container">
      {view !== 'history_sheet' && (
          <nav className="navbar">
            <div className="nav-logo">ETHICCRAFT SCANNER</div>
            <div className="nav-right">
                {selectedEvent && view !== 'events' && <div className="event-badge">{selectedEvent.name}</div>}
                <button className="logout-icon-btn" onClick={onLogout}><LogOut size={18} /></button>
            </div>
          </nav>
      )}

      <main className="main-content">
        <AnimatePresence mode='wait'>
          
          {view === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="view-container">
              
              <div className="header-flex">
                <h1 className="heading">Events</h1>
                <div className="tab-switcher">
                    <button 
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>
              </div>

              <div className="event-grid">
                {activeTab === 'upcoming' ? (
                    upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => {
                            const active = isToday(event.date);
                            return (
                                <div key={event.id} className={`event-card ${active ? 'active' : 'inactive'}`} onClick={() => handleEventSelect(event)}>
                                    <div className="card-header">
                                        <h3>{event.name}</h3>
                                        {active ? <div className="live-dot"></div> : <Zap size={16} className="text-muted" />}
                                    </div>
                                    <div className="card-date">
                                        <Calendar size={14} /> {formatDateDisplay(event.date)}
                                    </div>
                                    <div className={`status-text ${active ? 'text-green' : 'text-gold'}`}>
                                        {active ? "Live Now" : "Coming Soon"}
                                    </div>
                                </div>
                            );
                        })
                    ) : <div className="empty-state">No upcoming events.</div>
                ) : (
                    pastEvents.map(event => (
                        <div key={event.id} className="event-card history-card" onClick={() => handleEventSelect(event)}>
                            <div className="card-header">
                                <h3>{event.name}</h3>
                                <div className="sheet-icon-badge"><History size={14}/> Sheet</div>
                            </div>
                            <div className="card-date"><Clock size={14} /> Ended: {formatDateDisplay(event.date)}</div>
                            <div className="status-text text-muted">Tap to view data</div>
                        </div>
                    ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'history_sheet' && (
              <HistorySpreadsheet event={selectedEvent} onBack={() => setView('events')} />
          )}

          {view === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="view-container scanner-view">
              <div className="scanner-frame">
                <div className="scan-line"></div>
                <Scanner onScan={handleScan} styles={{ container: { width: '100%', height: '100%' } }} components={{ audio: false, finder: false }} />
                
                {!isToday(selectedEvent.date) && (
                    <div className="date-warning-overlay">
                        {isPast(selectedEvent.date) ? <History size={40} /> : <Lock size={40} />}
                        <p>{isPast(selectedEvent.date) ? "Event Ended" : "Event Locked"}</p>
                        <span>{isPast(selectedEvent.date) ? "Scanning disabled" : "Check date"}</span>
                    </div>
                )}
                {loading && <div className="scanning-overlay">Verifying...</div>}
              </div>

              <div className="scanner-info-box">
                 <p className="instruction">
                    {isPast(selectedEvent.date) ? "Viewing Archive: " : "Scanning for: "}
                    <strong style={{color: '#D4AF37'}}>{selectedEvent.name}</strong>
                 </p>
                 <div className="date-pill">
                    <Calendar size={14} /> {formatDateDisplay(selectedEvent.date)}
                 </div>
              </div>

              <div className="scanner-actions">
                <button className="secondary-btn" onClick={() => setView('events')}><ArrowLeft size={18} /> Events</button>
                <button className="primary-btn" onClick={handleFetchList}>
                    <Users size={18} /> 
                    {isPast(selectedEvent.date) ? "View Past Data" : "Attendees"}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'result' && scanResult && (
            <motion.div key="result" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="view-container result-view">
              <div className={`result-card ${scanResult.success ? 'success' : 'failure'}`}>
                <div className="result-icon">
                    {scanResult.success ? <CheckCircle size={60} /> : (scanResult.isDateError ? <Clock size={60} /> : <XCircle size={60} />)}
                </div>
                <h2>{scanResult.title || (scanResult.success ? "Attendance Marked" : "Access Denied")}</h2>
                {scanResult.success ? (
                  <div className="student-details">
                    <h3>{scanResult.data.name}</h3>
                    <p>{scanResult.data.course}</p>
                    <div className="ticket-id">ID: {scanResult.data.id}</div>
                  </div>
                ) : (
                  <div className="error-details">
                      <p className="error-msg">{scanResult.message}</p>
                      {scanResult.isDateError && <p className="sub-error">Go back to view history.</p>}
                  </div>
                )}
                <button className="scan-again-btn" onClick={resetScanner}><RefreshCw size={18} /> Continue</button>
              </div>
            </motion.div>
          )}

           {view === 'list' && (
            <motion.div key="list" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="view-container list-view">
              <div className="list-header">
                <button className="back-icon" onClick={() => setView('scanner')}><ArrowLeft /></button>
                <h2>Attendees</h2>
              </div>
              <div className="list-content">
                  {attendedList.map((s, i) => (
                      <div key={i} className="list-item"><h4>{s.name}</h4><span className="status-badge"></span></div>
                  ))}
                  {attendedList.length === 0 && <div className="empty-state">No data found.</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('admin_token')) setIsAuthenticated(true);
  }, []);

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  return (
    <div className="app-root">
      {isAuthenticated ? <ScannerDashboard onLogout={handleLogout} /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
};

export default App;