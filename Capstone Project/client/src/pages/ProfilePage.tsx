import { Badge, Card, Col, Row } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <Row className="justify-content-center">
      <Col md={8} lg={6}>
        <Card className="shadow-sm border-0">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: "56px", height: "56px", fontSize: "20px" }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div>
                <h3 className="mb-1">{user?.name || "User"}</h3>
                <p className="text-muted mb-1">
                  {user?.email || "No email available"}
                </p>
                <Badge bg="secondary" className="text-capitalize">
                  {user?.role || "member"}
                </Badge>
              </div>
            </div>

            <hr />

            <p className="mb-2">
              <strong>User ID:</strong> {user?._id || "N/A"}
            </p>
            <p className="mb-0">
              <strong>Status:</strong> {user?.status || "active"}
            </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ProfilePage;
