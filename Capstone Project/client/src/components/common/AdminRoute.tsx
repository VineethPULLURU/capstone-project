import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../hooks/useAuth";

function AdminRoute() {
  const { user, token, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status === "pending") {
    return (
      <div className="py-4">
        <Alert variant="warning" className="mb-0">
          Your account is pending admin approval.
        </Alert>
      </div>
    );
  }

  if (user.status === "rejected") {
    return (
      <div className="py-4">
        <Alert variant="danger" className="mb-0">
          Your account has been rejected. Please contact an administrator.
        </Alert>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
