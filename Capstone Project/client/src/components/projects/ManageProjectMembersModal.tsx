import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { projectService } from "../../services/project.service";
import { userService, type UserItem } from "../../services/user.service";

interface ExistingMember {
  id: string;
  name: string;
}

interface ManageProjectMembersModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
  existingMembers: ExistingMember[];
  token: string;
}

function ManageProjectMembersModal({
  show,
  onClose,
  onSuccess,
  projectId,
  projectName,
  existingMembers,
  token,
}: ManageProjectMembersModalProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show || !token) return;

    const loadUsers = async () => {
      try {
        setError("");
        setIsLoadingUsers(true);

        const response = await userService.getActiveUsers(token);
        const allUsers = Array.isArray(response.data?.users)
          ? response.data.users
          : [];

        setUsers(allUsers);
        setSelectedMemberIds(existingMembers.map((member) => member.id));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load active users",
        );
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [show, token, existingMembers]);

  const existingMemberIdSet = useMemo(
    () => new Set(existingMembers.map((member) => member.id)),
    [existingMembers],
  );

  const handleToggleMember = (userId: string) => {
    if (existingMemberIdSet.has(userId)) return;

    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setIsSubmitting(true);

      const newMemberIds = selectedMemberIds.filter(
        (id) => !existingMemberIdSet.has(id),
      );

      if (newMemberIds.length === 0) {
        onClose();
        return;
      }

      await projectService.addMembers(projectId, newMemberIds, token);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add members");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Manage Project Members</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted mb-3">
          Add active users to <strong>{projectName}</strong>.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        {isLoadingUsers ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted mb-0">No active users available.</p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {users.map((user) => {
              const checked = selectedMemberIds.includes(user._id);
              const alreadyAdded = existingMemberIdSet.has(user._id);

              return (
                <Form.Check
                  key={user._id}
                  type="checkbox"
                  id={`member-${user._id}`}
                  label={`${user.name} (${user.email})`}
                  checked={checked}
                  onChange={() => handleToggleMember(user._id)}
                  disabled={alreadyAdded}
                />
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isLoadingUsers || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Members"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ManageProjectMembersModal;
