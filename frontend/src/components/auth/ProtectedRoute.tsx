import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const userStr = localStorage.getItem('user');
  const location = useLocation();
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.id || !user.role) {
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }

    // Role-based route protection
    const isPatientRoute = location.pathname.startsWith('/patient');
    const isPathologyRoute = location.pathname.startsWith('/pathology');

    if (isPatientRoute && user.role !== 'patient') {
      return <Navigate to="/login" replace />;
    }

    if (isPathologyRoute && user.role !== 'lab') {
      return <Navigate to="/login" replace />;
    }

  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
