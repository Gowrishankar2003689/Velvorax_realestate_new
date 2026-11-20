import { useEffect,useState } from "react";
import Leads from "./components/Leads";
import CallHistory from "./components/CallHistory";
import FollowUps from "./components/FollowUps";
import HumanHandover from "./components/HumanHandover";
import Meetings from "./components/Meetings";
import SettingsPage from "./components/Settings";
import AIVoiceCalling from "./components/AIVoiceCalling";
import ManualCalling from "./components/ManualCalling";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  History,
  Headset,
  CalendarDays,
  ClipboardCheck,
  Settings,
  TrendingUp,
  Clock,
  PhoneIncoming,
  CalendarCheck,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import "./App.css";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Leads" },
  { icon: PhoneCall, label: "AI Voice Calling" },
  { icon: History, label: "Call History" },
  { icon: PhoneCall, label: "Manual Calling" },
  { icon: Headset, label: "Human Handover" },
  { icon: CalendarDays, label: "Meetings" },
  { icon: ClipboardCheck, label: "Follow-ups" },
  { icon: Settings, label: "Settings" },
];



function App() {
  const [currentUser, setCurrentUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);




useEffect(() => {
  async function checkSession() {
    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/me/",
        { credentials: "include" }
      );

      if (response.ok) {
        setCurrentUser(await response.json());
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Unable to check login session:", error);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  checkSession();
}, []);


  const [activePage, setActivePage] = useState("Dashboard");
  const [handoverCount, setHandoverCount] = useState(0);
  const [dashboardData, setDashboardData] = useState({
  totalLeads: 0,
  callsToday: 0,
  interestedLeads: 0,
  meetingsBooked: 0,
});
const [recentCalls, setRecentCalls] = useState([]);
const [pendingHandovers, setPendingHandovers] = useState([]);
const statistics = [
  {
    title: "Total Leads",
    value: dashboardData.totalLeads,
    description: "Leads in the CRM",
    icon: Users,
    color: "blue",
  },
  {
    title: "AI Calls Today",
    value: dashboardData.callsToday,
    description: "AI calls initiated today",
    icon: PhoneCall,
    color: "purple",
  },
  {
    title: "Interested Leads",
    value: dashboardData.interestedLeads,
    description: "Interested lead records",
    icon: TrendingUp,
    color: "green",
  },
  {
    title: "Meetings Booked",
    value: dashboardData.meetingsBooked,
    description: "Scheduled meetings",
    icon: CalendarCheck,
    color: "orange",
  },
];
  useEffect(() => {
  async function loadHandoverCount() {
    try {
      const response = await fetch(
        "http://localhost:8000/api/calling/history/"
      );

      if (!response.ok) {
        return;
      }

      const calls = await response.json();

      if (Array.isArray(calls)) {
        const count = calls.filter(
  (call) =>
    (call.transfer_status === "failed" ||
      call.transfer_status === "pending") &&
    !call.handover_resolved
).length;

setHandoverCount(count);
      }
    } catch (error) {
      console.error("Unable to load handover count:", error);
    }
  }

  loadHandoverCount();
}, [activePage, handoverCount]);

useEffect(() => {
  async function loadDashboardData() {
    try {
      const [leadsResponse, callsResponse, meetingsResponse] =
        await Promise.all([
          fetch("http://localhost:8000/api/leads/"),
          fetch("http://localhost:8000/api/calling/history/"),
          fetch("http://localhost:8000/api/meetings/"),
        ]);

      if (
        !leadsResponse.ok ||
        !callsResponse.ok ||
        !meetingsResponse.ok
      ) {
        throw new Error("Unable to load dashboard data.");
      }

      const [leads, calls, meetings] = await Promise.all([
        leadsResponse.json(),
        callsResponse.json(),
        meetingsResponse.json(),
      ]);

      const today = new Date().toLocaleDateString("en-CA");

      const callsToday = calls.filter((call) => {
        if (!call.is_ai_call || !call.created_at) return false;

        return (
          new Date(call.created_at).toLocaleDateString("en-CA") ===
          today
        );
      }).length;

      const interestedLeads = leads.filter(
        (lead) => lead.interest_level === "interested"
      ).length;

      const meetingsBooked = meetings.filter(
        (meeting) => meeting.status === "scheduled"
      ).length;

      setDashboardData({
        totalLeads: leads.length,
        callsToday,
        interestedLeads,
        meetingsBooked,
      });
    } catch (error) {
      console.error("Unable to load dashboard statistics:", error);
    }
  }

  loadDashboardData();
}, []);

useEffect(() => {
  async function loadRecentCalls() {
    try {
      const response = await fetch(
        "http://localhost:8000/api/calling/history/"
      );

      if (!response.ok) {
        throw new Error("Failed to load call history.");
      }

      const calls = await response.json();

      if (!Array.isArray(calls)) return;

      setRecentCalls(
        [...calls]
          .sort(
            (a, b) =>
              new Date(b.created_at) - new Date(a.created_at)
          )
          .slice(0, 5)
      );

      setPendingHandovers(
        calls.filter(
          (call) =>
            ["failed", "pending"].includes(call.transfer_status) &&
            !call.handover_resolved
        )
      );
    } catch (error) {
      console.error("Unable to load recent calls:", error);
    }
  }

  loadRecentCalls();
}, []);

  return (
     <>

    <div className="crm-layout">
{/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <img
            src="/velvorax-logo.jpeg"
            alt="Velvorax Logo"
            style={{
              width: "36px",
              height: "36px",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />

          <div>
            <h2>VELVORAX</h2>
            <span>AI CRM PLATFORM</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">A</div>

          <div>
            <strong>Admin Workspace</strong>
            <small>Development mode</small>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav className="navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
                onClick={() => setActivePage(item.label)}
              >
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>

                {item.label === "Human Handover" && (
  <span className="menu-count">{handoverCount}</span>
)}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="online-indicator" />
          <span>System ready for setup</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / </span>
            <strong>{activePage}</strong>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>

            <div>
              <strong>Administrator</strong>
<small>Admin account</small>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <>
              {/* Page heading */}
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">OVERVIEW</p>

                  <h1>Welcome to Velvorax CRM</h1>

                  <p className="page-description">
                    Manage your leads, AI calls, and customer relationships.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActivePage("Leads")}
                >
                  <Plus size={18} />
                  Manage Leads
                </button>
              </section>

              {/* Statistics */}
              <section className="statistics-grid">
                {statistics.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <article className="stat-card" key={stat.title}>
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon size={22} />
                      </div>

                      <p>{stat.title}</p>

                      <h2>{stat.value}</h2>

                      <small>{stat.description}</small>
                    </article>
                  );
                })}
              </section>

              {/* Activity and handover */}
              <section className="dashboard-grid">
                <article className="panel">
  <div className="panel-heading">
    <div>
      <h3>Recent Call Activity</h3>
      <p>Latest customer conversations</p>
    </div>

    <button
      className="text-button"
      onClick={() => setActivePage("Call History")}
    >
      View all <ArrowUpRight size={15} />
    </button>
  </div>

  {recentCalls.length === 0 ? (
    <div className="empty-state">
      <div className="empty-icon">
        <PhoneIncoming size={27} />
      </div>
      <h4>No calls recorded yet</h4>
      <p>Call records will appear here after they are saved.</p>
    </div>
  ) : (
    <div className="recent-calls-list">
      {recentCalls.map((call) => (
        <div className="recent-call-item" key={call.id}>
          <div className="recent-call-icon">
            <PhoneIncoming size={18} />
          </div>

          <div className="recent-call-details">
            <strong>{call.lead_name || "Unknown lead"}</strong>
            <span>
              {call.interest_level || "unknown"} ·{" "}
              {call.call_status || "unknown"}
            </span>
            <small>
              {call.created_at
                ? new Date(call.created_at).toLocaleString()
                : "Time unavailable"}
            </small>
          </div>
        </div>
      ))}
    </div>
  )}
</article>

                <article className="panel">
  <div className="panel-heading">
    <div>
      <h3>Human Handover Queue</h3>
      <p>Customers requiring human assistance</p>
    </div>

    <span className="queue-badge">
      {pendingHandovers.length} pending
    </span>
  </div>

  {pendingHandovers.length === 0 ? (
    <div className="empty-state">
      <div className="empty-icon">
        <Headset size={27} />
      </div>
      <h4>No pending handovers</h4>
      <p>Customers awaiting a telecaller will appear here.</p>
    </div>
  ) : (
    <div className="recent-calls-list">
      {pendingHandovers.slice(0, 5).map((call) => (
        <div className="recent-call-item" key={call.id}>
          <div className="recent-call-icon">
            <Headset size={18} />
          </div>

          <div className="recent-call-details">
            <strong>{call.lead_name || "Unknown lead"}</strong>
            <span>Transfer: {call.transfer_status}</span>
            <small>
              {call.lead_phone || "No phone number"}
            </small>
          </div>
        </div>
      ))}

      <button
        className="secondary-button"
        onClick={() => setActivePage("Human Handover")}
      >
        Open Handover Queue
      </button>
    </div>
  )}
</article>
              </section>

              {/* Quick actions */}
              <section className="panel quick-actions">
                <div className="panel-heading">
                  <div>
                    <h3>Quick Actions</h3>
                    <p>Navigate to the main CRM modules</p>
                  </div>
                </div>

                <div className="quick-actions-grid">
                  <button
                    onClick={() => setActivePage("Leads")}
                    className="quick-action"
                  >
                    <Users size={22} />
                    <strong>Manage Leads</strong>
                    <span>Create and organize leads</span>
                  </button>

                  <button
                    onClick={() => setActivePage("AI Voice Calling")}
                    className="quick-action"
                  >
                    <PhoneCall size={22} />
                    <strong>AI Voice Calling</strong>
                    <span>Prepare calling campaigns</span>
                  </button>

                  <button
                    onClick={() => setActivePage("Meetings")}
                    className="quick-action"
                  >
                    <CalendarDays size={22} />
                    <strong>Meetings</strong>
                    <span>Manage customer meetings</span>
                  </button>

                  <button
                    onClick={() => setActivePage("Follow-ups")}
                    className="quick-action"
                  >
                    <Clock size={22} />
                    <strong>Follow-ups</strong>
                    <span>Review upcoming tasks</span>
                  </button>
                </div>
              </section>
            </>

) : activePage === "Leads" ? (
  <Leads />
) : activePage === "Call History" ? (
  <CallHistory />
) : activePage === "Follow-ups" ? (
  <FollowUps />
) : activePage === "Meetings" ? (
  <Meetings />
) : activePage === "Human Handover" ? (
  <HumanHandover
    onHandoverResolved={() => {
      setHandoverCount((count) => Math.max(0, count - 1));
    }}
  />
) : activePage === "AI Voice Calling" ? (
  <AIVoiceCalling />
) : activePage === "Settings" ? (
  <SettingsPage />
) : activePage === "Manual Calling" ? (
  <ManualCalling />) : (
  <section className="panel module-placeholder">
    {(() => {
      const selected = menuItems.find(
        (item) => item.label === activePage
      );

      const Icon = selected?.icon || LayoutDashboard;

      return <Icon size={38} />;
    })()}

    <h2>{activePage}</h2>

    <p>
      This module will be implemented in the next development
      steps.
    </p>

    <button
      className="secondary-button"
      onClick={() => setActivePage("Dashboard")}
    >
      Back to Dashboard
    </button>
  </section>
)}


        </div>
      </main>

      </div>

  </>
);
}

export default App;