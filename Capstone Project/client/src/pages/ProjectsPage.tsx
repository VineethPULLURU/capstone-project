import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { projectService } from "../services/project.service";
import type { Project } from "../types/project.types";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  membersCount: number;
}

function ProjectsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const response = await projectService.getAll(token);
        const rawProjects: Project[] = response.data?.projects || [];

        const projectItems: ProjectItem[] = rawProjects.map((project) => ({
          id: project._id,
          name: project.name,
          description: project.description || "No description available",
          membersCount: 0,
        }));

        const projectsWithMembers = await Promise.all(
          projectItems.map(async (project) => {
            try {
              const membersResponse = await projectService.getMembers(
                project.id,
                token,
              );

              return {
                ...project,
                membersCount: membersResponse.data.count || 0,
              };
            } catch {
              return project;
            }
          }),
        );

        setProjects(projectsWithMembers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load projects",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [token]);

  const handleOpenProjectTasks = (projectId: string) => {
    navigate(`/projects/${projectId}/tasks`);
  };

  const handleOpenCreateModal = () => {
    setProjectName("");
    setProjectDescription("");
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    if (!isCreating) {
      setShowCreateModal(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("You must be logged in");
      return;
    }

    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      const response = await projectService.create(
        {
          name: projectName.trim(),
          description: projectDescription.trim(),
        },
        token,
      );

      const createdProject = response.data;

      const newProject: ProjectItem = {
        id: createdProject._id,
        name: createdProject.name,
        description: createdProject.description || "No description available",
        membersCount: 1,
      };

      setProjects((prev) => [newProject, ...prev]);
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Projects</h2>
          <p className="text-muted mb-0">
            Open a project to view and manage its tasks.
          </p>
        </div>

        {user?.role === "admin" && (
          <Button variant="primary" onClick={handleOpenCreateModal}>
            Create Project
          </Button>
        )}
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
      ) : projects.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted mb-3">No projects found</h5>
          <p className="text-muted mb-4">
            Get started by creating your first project.
          </p>
          {user?.role === "admin" && (
            <Button variant="primary" onClick={handleOpenCreateModal}>
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <Row className="g-4">
          {projects.map((project) => (
            <Col md={6} lg={4} key={project.id}>
              <Card
                className="shadow-sm border-0 h-100"
                style={{ cursor: "pointer" }}
                onClick={() => handleOpenProjectTasks(project.id)}
              >
                <Card.Body>
                  <Card.Title className="fw-bold">{project.name}</Card.Title>
                  <Card.Text className="text-muted">
                    {project.description}
                  </Card.Text>

                  <div className="mb-3">
                    <strong>Members:</strong> {project.membersCount}
                  </div>

                  <Button
                    variant="outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProjectTasks(project.id);
                    }}
                  >
                    View Tasks
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered>
        <Form onSubmit={handleCreateProject}>
          <Modal.Header closeButton={!isCreating}>
            <Modal.Title>Create Project</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                disabled={isCreating}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseCreateModal}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default ProjectsPage;
