import { Outlet } from "react-router-dom";

export default function Dashboard_Layout() {
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Notice there is no <Header /> or <Footer /> here! */}
      <Outlet />
    </div>
  );
}