import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { TaskPriority, TaskStatus } from "../../types/task.types";

interface ProjectMember {
  id: string;
  name: string;
}

interface CreateTaskPayload {
  title: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
}

interface CreateTaskModalProps {
  show: boolean;
  onClose: () => void;
  onCreate: (taskData: CreateTaskPayload) => void | Promise<void>;
  projectName: string;
  projectMembers: ProjectMember[];
}

function CreateTaskModal({
  show,
  onClose,
  onCreate,
  projectName,
  projectMembers,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setAssignedTo("");
    setStatus("todo");
    setPriority("medium");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setError("");

    try {
      setIsSubmitting(true);

      await onCreate({
        title: title.trim(),
        assignedTo,
        status,
        priority,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create Task - {projectName}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Task Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={100}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assign To</Form.Label>
            <Form.Select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default CreateTaskModal;
