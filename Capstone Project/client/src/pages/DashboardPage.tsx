import { useEffect, useState } from "react";
import { Alert, Card, Col, Row, Spinner } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { projectService } from "../services/project.service";
import { taskService } from "../services/task.service";
import type { Project } from "../types/project.types";
import type { Task } from "../types/task.types";

interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

function DashboardPage() {
  const { token, user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary>({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");

        const [projectsResponse, tasksResponse] = await Promise.all([
          projectService.getAll(token),
          taskService.getAll(token),
        ]);

        const projects: Project[] = projectsResponse.data.projects || [];
        const tasks: Task[] = tasksResponse.data.tasks || [];

        const pendingTasks = tasks.filter(
          (task) => task.status === "todo" || task.status === "in-progress",
        ).length;

        const completedTasks = tasks.filter(
          (task) => task.status === "done",
        ).length;

        setSummary({
          totalProjects: projects.length,
          totalTasks: tasks.length,
          pendingTasks,
          completedTasks,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  return (
    <>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Dashboard</h2>
        <p className="text-muted mb-0">
          Welcome back, {user?.name || "User"}. Here is a quick overview of your
          workspace.
        </p>
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
      ) : (
        <Row className="g-4">
          <Col md={6} lg={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Total Projects</Card.Title>
                <h3 className="fw-bold mb-0">{summary.totalProjects}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Total Tasks</Card.Title>
                <h3 className="fw-bold mb-0">{summary.totalTasks}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Pending Tasks</Card.Title>
                <h3 className="fw-bold mb-0">{summary.pendingTasks}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Completed Tasks</Card.Title>
                <h3 className="fw-bold mb-0">{summary.completedTasks}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}

export default DashboardPage;
