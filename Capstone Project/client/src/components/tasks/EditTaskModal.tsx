import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { Task, TaskPriority, TaskStatus } from "../../types/task.types";

interface ProjectMemberOption {
  id: string;
  name: string;
}

export interface EditTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string | null;
}

interface EditTaskModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (payload: EditTaskPayload) => Promise<void>;
  task: Task | null;
  userRole?: string;
  currentUserId?: string;
  projectMembers?: ProjectMemberOption[];
}

function EditTaskModal({
  show,
  onClose,
  onSave,
  task,
  userRole,
  currentUserId,
  projectMembers = [],
}: EditTaskModalProps) {
  const isAdmin = userRole === "admin";

  const assignedUserId =
    typeof task?.assignedTo === "string"
      ? task.assignedTo
      : task?.assignedTo?._id;

  const canEditStatusOnly = !isAdmin && assignedUserId === currentUserId;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [assignedTo, setAssignedTo] = useState(
    typeof task?.assignedTo === "string"
      ? task.assignedTo
      : (task?.assignedTo?._id ?? ""),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const allowedStatuses: TaskStatus[] = ["todo", "in-progress", "done"];

  const handleSubmit = async () => {
    if (!task) return;

    try {
      setError("");
      setIsSaving(true);

      if (isAdmin) {
        await onSave({
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          assignedTo: assignedTo || null,
        });
      } else if (canEditStatusOnly) {
        await onSave({ status });
      } else {
        setError("You are not allowed to edit this task.");
        return;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Task</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {!task ? (
          <div className="text-muted">No task selected.</div>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isAdmin}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={!isAdmin}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Assigned To</Form.Label>
              <Form.Select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={!isAdmin}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={!isAdmin && !canEditStatusOnly}
              >
                {allowedStatuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption === "todo"
                      ? "To Do"
                      : statusOption === "in-progress"
                        ? "In Progress"
                        : "Done"}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditTaskModal;
