import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import TaskDetailsModal from "../components/tasks/TaskDetailsModal";
import EditTaskModal from "../components/tasks/EditTaskModal";
import { useAuth } from "../hooks/useAuth";
import { projectService } from "../services/project.service";
import { taskService } from "../services/task.service";
import type { Project } from "../types/project.types";
import type { Task, TaskPriority, TaskStatus } from "../types/task.types";

interface ProjectMemberOption {
  id: string;
  name: string;
}

interface EditTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string | null;
}

function TasksPage() {
  const { user, token } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberOption[]>(
    [],
  );

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditMembersLoading, setIsEditMembersLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const [tasksResponse, projectsResponse] = await Promise.all([
          taskService.getAll(token),
          projectService.getAll(token),
        ]);

        if (ignore) return;

        const rawTasks: Task[] = Array.isArray(tasksResponse.data?.tasks)
          ? tasksResponse.data.tasks
          : [];

        const allProjects: Project[] = Array.isArray(
          projectsResponse.data?.projects,
        )
          ? projectsResponse.data.projects
          : [];

        setTasks(rawTasks);
        setProjects(allProjects);
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [token]);

  const projectNameMap = useMemo(() => {
    return new Map(projects.map((project) => [project._id, project.name]));
  }, [projects]);

  const filteredTasks = useMemo(() => {
    const source =
      statusFilter === "all"
        ? tasks
        : tasks.filter((task) => task.status === statusFilter);

    return source.map((task) => {
      const projectName =
        typeof task.project === "string"
          ? projectNameMap.get(task.project) || "No Project"
          : task.project?.name || "No Project";

      const assignedToName =
        typeof task.assignedTo === "string"
          ? task.assignedTo || "Unassigned"
          : task.assignedTo?.name || "Unassigned";

      return {
        raw: task,
        id: task._id,
        title: task.title,
        projectName,
        assignedTo: assignedToName,
        status: task.status,
      };
    });
  }, [statusFilter, tasks, projectNameMap]);

  const getBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case "todo":
        return "secondary";
      case "in-progress":
        return "warning";
      case "done":
        return "success";
      default:
        return "secondary";
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const getProjectIdFromTask = (task: Task): string => {
    return typeof task.project === "string"
      ? task.project
      : task.project?._id || "";
  };

  const loadMembersForTaskProject = async (task: Task) => {
    if (!token) return [];

    const projectId = getProjectIdFromTask(task);
    if (!projectId) return [];

    const membersResponse = await projectService.getMembers(projectId, token);
    const members = Array.isArray(membersResponse.data?.members)
      ? membersResponse.data.members
      : [];

    return members.map((member) => ({
      id: member._id,
      name: member.name,
    }));
  };

  const handleOpenEdit = async () => {
    if (!selectedTask) return;

    try {
      setError("");
      setIsEditMembersLoading(true);

      const members = await loadMembersForTaskProject(selectedTask);
      setProjectMembers(members);

      setShowDetailsModal(false);
      setShowEditModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project members",
      );
    } finally {
      setIsEditMembersLoading(false);
    }
  };

  const handleUpdateTask = async (task: Task) => {
    try {
      setError("");
      setSelectedTask(task);
      setIsEditMembersLoading(true);

      const members = await loadMembersForTaskProject(task);
      setProjectMembers(members);

      setShowEditModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project members",
      );
    } finally {
      setIsEditMembersLoading(false);
    }
  };

  const handleOpenDelete = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleCloseDelete = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!token || !taskToDelete?._id) return;

    try {
      setError("");
      setIsDeleting(true);

      await taskService.delete(taskToDelete._id, token);

      setTasks((prev) => prev.filter((task) => task._id !== taskToDelete._id));

      if (selectedTask?._id === taskToDelete._id) {
        setSelectedTask(null);
        setShowDetailsModal(false);
        setShowEditModal(false);
      }

      setShowDeleteModal(false);
      setTaskToDelete(null);
      setProjectMembers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setProjectMembers([]);
  };

  const handleSaveTask = async (payload: EditTaskPayload) => {
    if (!token || !selectedTask?._id) return;

    try {
      setError("");

      await taskService.update(selectedTask._id, { ...payload }, token);

      const [tasksResponse, projectsResponse] = await Promise.all([
        taskService.getAll(token),
        projectService.getAll(token),
      ]);

      const updatedTasks: Task[] = Array.isArray(tasksResponse.data?.tasks)
        ? tasksResponse.data.tasks
        : [];

      const updatedProjects: Project[] = Array.isArray(
        projectsResponse.data?.projects,
      )
        ? projectsResponse.data.projects
        : [];

      setTasks(updatedTasks);
      setProjects(updatedProjects);
      setSelectedTask(
        updatedTasks.find((task) => task._id === selectedTask._id) || null,
      );
      setShowEditModal(false);
      setShowDetailsModal(false);
      setProjectMembers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tasks</h2>
          <p className="text-muted mb-0">
            View and track tasks across all projects here.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Status</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isLoading}
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted mb-3">
              {statusFilter === "all"
                ? "No tasks found"
                : "No tasks for this status"}
            </h5>
            <p className="text-muted mb-0">
              {statusFilter === "all"
                ? "Get started by creating your first task."
                : `No ${statusFilter.replace("-", " ")} tasks found.`}
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.projectName}</td>
                    <td>{task.assignedTo}</td>
                    <td>
                      <Badge
                        bg={getBadgeVariant(task.status)}
                        className="text-capitalize"
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          type="button"
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewTask(task.raw)}
                        >
                          View
                        </Button>

                        {(user?.role === "admin" ||
                          user?.role === "member") && (
                          <Button
                            type="button"
                            variant="outline-success"
                            size="sm"
                            onClick={() => void handleUpdateTask(task.raw)}
                            disabled={isEditMembersLoading}
                          >
                            {isEditMembersLoading ? "Loading..." : "Update"}
                          </Button>
                        )}

                        {user?.role === "admin" && (
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOpenDelete(task.raw)}
                            disabled={isDeleting}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <TaskDetailsModal
        show={showDetailsModal}
        onClose={handleCloseDetails}
        onEdit={() => void handleOpenEdit()}
        task={selectedTask}
        canEdit={user?.role === "admin" || user?.role === "member"}
      />

      <EditTaskModal
        key={selectedTask?._id || "edit-task-modal"}
        show={showEditModal}
        onClose={handleCloseEdit}
        onSave={handleSaveTask}
        task={selectedTask}
        userRole={user?.role}
        currentUserId={user?._id}
        projectMembers={projectMembers}
      />

      <Modal show={showDeleteModal} onHide={handleCloseDelete} centered>
        <Modal.Header closeButton={!isDeleting}>
          <Modal.Title>Delete Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>{taskToDelete?.title || "this task"}</strong>? This action
          cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDelete}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleConfirmDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TasksPage;
