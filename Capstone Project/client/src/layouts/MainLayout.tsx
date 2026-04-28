import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            Mini Jira
          </Navbar.Brand>

          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/projects">
              Projects
            </Nav.Link>
            <Nav.Link as={Link} to="/tasks">
              Tasks
            </Nav.Link>
            {user?.role === "admin" && (
              <Nav.Link as={Link} to="/admin/users/pending">
                Pending Users
              </Nav.Link>
            )}
          </Nav>

          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              onClick={handleProfileClick}
              className="d-flex align-items-center gap-2 border-0 bg-transparent text-white"
              style={{ cursor: "pointer" }}
            >
              <div
                className="rounded-circle bg-primary d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: "36px",
                  height: "36px",
                  fontSize: "14px",
                }}
              >
                {userInitial}
              </div>

              <span>{user?.name || "User"}</span>
            </button>

            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container className="pb-4">
        <Outlet />
      </Container>
    </>
  );
}

export default MainLayout;
