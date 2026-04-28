import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import CreateTaskModal from "../components/tasks/CreateTaskModal";
import ManageProjectMembersModal from "../components/projects/ManageProjectMembersModal";
import TaskDetailsModal from "../components/tasks/TaskDetailsModal";
import EditTaskModal from "../components/tasks/EditTaskModal";
import {
  projectService,
  type ProjectMember,
} from "../services/project.service";
import { taskService } from "../services/task.service";
import type { Project } from "../types/project.types";
import type { Task, TaskPriority, TaskStatus } from "../types/task.types";

interface ModalProjectMember {
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

function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, token } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalInstanceKey, setModalInstanceKey] = useState(0);

  const [projectName, setProjectName] = useState("Project");
  const [projectMembers, setProjectMembers] = useState<ModalProjectMember[]>(
    [],
  );
  const [tasks, setTasks] = useState<Task[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!token || !projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        const [projectResponse, membersResponse, tasksResponse] =
          await Promise.all([
            projectService.getById(projectId, token),
            projectService.getMembers(projectId, token),
            taskService.getByProjectId(projectId, token),
          ]);

        if (ignore) return;

        const project: Project = projectResponse.data;

        const membersData: ProjectMember[] = Array.isArray(
          membersResponse.data?.members,
        )
          ? membersResponse.data.members
          : [];

        const rawTasks: Task[] = Array.isArray(tasksResponse.data?.tasks)
          ? tasksResponse.data.tasks
          : [];

        setProjectName(project?.name || "Unknown Project");

        setProjectMembers(
          membersData.map((member) => ({
            id: member._id,
            name: member.name,
          })),
        );

        setTasks(rawTasks);
      } catch (err) {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : "Failed to load project tasks",
        );
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
  }, [projectId, token, reloadKey]);

  const memberNameMap = useMemo(() => {
    return new Map(projectMembers.map((member) => [member.id, member.name]));
  }, [projectMembers]);

  const filteredTasks = useMemo(() => {
    const source =
      statusFilter === "all"
        ? tasks
        : tasks.filter((task) => task.status === statusFilter);

    return source.map((task) => {
      const assignedToName =
        typeof task.assignedTo === "string"
          ? memberNameMap.get(task.assignedTo) || "Unassigned"
          : task.assignedTo?.name || "Unassigned";

      return {
        raw: task,
        id: task._id,
        title: task.title,
        assignedTo: assignedToName,
        status: task.status,
      };
    });
  }, [statusFilter, tasks, memberNameMap]);

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

  const handleCreateTask = async (taskData: {
    title: string;
    assignedTo: string;
    status: TaskStatus;
    priority: TaskPriority;
  }) => {
    if (!token || !projectId) return;

    try {
      setError("");

      await taskService.createInProject(
        projectId,
        {
          title: taskData.title,
          status: taskData.status,
          priority: taskData.priority,
          ...(taskData.assignedTo ? { assignedTo: taskData.assignedTo } : {}),
        },
        token,
      );

      setShowCreateModal(false);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    }
  };

  const handleOpenCreateModal = () => {
    setModalInstanceKey((prev) => prev + 1);
    setShowCreateModal(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleOpenEdit = () => {
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleUpdateTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTask = async (payload: EditTaskPayload) => {
    if (!token || !selectedTask?._id) return;

    try {
      setError("");

      await taskService.update(selectedTask._id, { ...payload }, token);

      const [projectResponse, membersResponse, tasksResponse] =
        await Promise.all([
          projectService.getById(projectId || "", token),
          projectService.getMembers(projectId || "", token),
          taskService.getByProjectId(projectId || "", token),
        ]);

      const project: Project = projectResponse.data;

      const membersData: ProjectMember[] = Array.isArray(
        membersResponse.data?.members,
      )
        ? membersResponse.data.members
        : [];

      const updatedTasks: Task[] = Array.isArray(tasksResponse.data?.tasks)
        ? tasksResponse.data.tasks
        : [];

      setProjectName(project?.name || "Unknown Project");
      setProjectMembers(
        membersData.map((member) => ({
          id: member._id,
          name: member.name,
        })),
      );
      setTasks(updatedTasks);
      setSelectedTask(
        updatedTasks.find((task) => task._id === selectedTask._id) || null,
      );
      setShowEditModal(false);
      setShowDetailsModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  };

  const handleCloseDetails = () => setShowDetailsModal(false);
  const handleCloseEdit = () => setShowEditModal(false);

  return (
    <>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/dashboard" }}>
          Dashboard
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/projects" }}>
          Projects
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{projectName}</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{projectName} Tasks</h2>
          <p className="text-muted mb-0">
            View and manage tasks for this project.
          </p>
        </div>

        <div className="d-flex gap-2">
          {user?.role === "admin" && (
            <Button
              variant="outline-primary"
              onClick={() => setShowManageMembersModal(true)}
              disabled={isLoading}
            >
              Manage Members
            </Button>
          )}

          {(user?.role === "admin" || user?.role === "member") && (
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              disabled={isLoading}
            >
              Create Task
            </Button>
          )}
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
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
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
                              onClick={() => handleUpdateTask(task.raw)}
                            >
                              Update
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">
                      No tasks found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <CreateTaskModal
        key={modalInstanceKey}
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTask}
        projectName={projectName}
        projectMembers={projectMembers}
      />

      <ManageProjectMembersModal
        show={showManageMembersModal}
        onClose={() => setShowManageMembersModal(false)}
        onSuccess={() => setReloadKey((prev) => prev + 1)}
        projectId={projectId || ""}
        projectName={projectName}
        existingMembers={projectMembers}
        token={token || ""}
      />

      <TaskDetailsModal
        show={showDetailsModal}
        onClose={handleCloseDetails}
        onEdit={handleOpenEdit}
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

export default ProjectTasksPage;
