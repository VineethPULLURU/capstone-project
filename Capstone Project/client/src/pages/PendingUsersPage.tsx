import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Spinner, Table } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { userService, type User } from "../services/user.service";

function PendingUsersPage() {
  const { user, token } = useAuth();

  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState("");

  useEffect(() => {
    const loadPendingUsers = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const response = await userService.getPendingUsers(token);
        const users: User[] = response.data?.users || [];
        setPendingUsers(users);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load pending users",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingUsers();
  }, [token]);

  const handleApproveUser = async (userId: string) => {
    if (!token) {
      setError("You must be logged in");
      return;
    }

    try {
      setActionUserId(userId);
      setError("");

      await userService.approveUser(userId, token);

      setPendingUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve user");
    } finally {
      setActionUserId("");
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!token) {
      setError("You must be logged in");
      return;
    }

    try {
      setActionUserId(userId);
      setError("");

      await userService.rejectUser(userId, token);

      setPendingUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setActionUserId("");
    }
  };

  if (user?.role !== "admin") {
    return (
      <Alert variant="danger" className="mb-0">
        Only admins can access this page.
      </Alert>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Pending Users</h2>
          <p className="text-muted mb-0">
            Review newly registered users and approve or reject access.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted mb-3">No pending users found</h5>
          <p className="text-muted mb-0">
            All user approval requests have been handled.
          </p>
        </div>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pendingUsers.map((pendingUser) => (
                  <tr key={pendingUser._id}>
                    <td>{pendingUser.name}</td>
                    <td>{pendingUser.email}</td>
                    <td className="text-capitalize">{pendingUser.role}</td>
                    <td>
                      <Badge bg="warning" text="dark">
                        {pendingUser.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={actionUserId === pendingUser._id}
                          onClick={() => handleApproveUser(pendingUser._id)}
                        >
                          {actionUserId === pendingUser._id
                            ? "Processing..."
                            : "Approve"}
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={actionUserId === pendingUser._id}
                          onClick={() => handleRejectUser(pendingUser._id)}
                        >
                          {actionUserId === pendingUser._id
                            ? "Processing..."
                            : "Reject"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default PendingUsersPage;
