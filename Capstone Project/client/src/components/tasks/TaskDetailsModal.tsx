import { Badge, Button, Modal } from "react-bootstrap";
import type { Task, TaskStatus } from "../../types/task.types";

interface TaskDetailsModalProps {
  show: boolean;
  onClose: () => void;
  onEdit: () => void;
  task: Task | null;
  canEdit: boolean;
}

function TaskDetailsModal({
  show,
  onClose,
  onEdit,
  task,
  canEdit,
}: TaskDetailsModalProps) {
  const getBadgeVariant = (status?: TaskStatus) => {
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

  const projectName =
    typeof task?.project === "string"
      ? task.project
      : task?.project?.name || "No Project";

  const assignedToName =
    typeof task?.assignedTo === "string"
      ? task.assignedTo
      : task?.assignedTo?.name || "Unassigned";

  const createdByName =
    typeof task?.createdBy === "string"
      ? task.createdBy
      : task?.createdBy?.name || "Unknown";

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Task Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {task ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <div className="text-muted small">Title</div>
              <div className="fw-semibold">{task.title}</div>
            </div>

            <div>
              <div className="text-muted small">Description</div>
              <div>{task.description || "No description provided."}</div>
            </div>

            <div>
              <div className="text-muted small">Project</div>
              <div>{projectName}</div>
            </div>

            <div>
              <div className="text-muted small">Assigned To</div>
              <div>{assignedToName}</div>
            </div>

            <div>
              <div className="text-muted small">Created By</div>
              <div>{createdByName}</div>
            </div>

            <div>
              <div className="text-muted small">Priority</div>
              <div className="text-capitalize">
                {task.priority || "Not set"}
              </div>
            </div>

            <div>
              <div className="text-muted small mb-1">Status</div>
              <Badge
                bg={getBadgeVariant(task.status)}
                className="text-capitalize"
              >
                {task.status}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-muted">No task selected.</div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Close
        </Button>
        {canEdit && (
          <Button variant="primary" onClick={onEdit}>
            Edit Task
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default TaskDetailsModal;
