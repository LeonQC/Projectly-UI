import React, { useEffect, useState } from "react";
import {
  acceptInvitation,
  declineInvitation,
  markNotificationRead,
} from "../../lib/api.js";

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActorName(notification) {
  return notification.actor?.username || notification.actor?.email || "Projectly";
}

function getInvitationMessage(notification) {
  const invitation = notification.invitation;
  const targetLabel = invitation?.target_type === "workspace" ? "workspace" : "project";
  const inviterEmail = invitation?.inviter?.email || notification.actor?.email || getActorName(notification);
  const targetName = invitation?.target_name || `this ${targetLabel}`;
  return `${inviterEmail} invited you to join ${targetLabel} "${targetName}".`;
}

function InboxItem({
  isBusy,
  item,
  onAcceptInvitation,
  onDeclineInvitation,
  onOpenMention,
}) {
  const actorName = getActorName(item);
  const isUnread = !item.read_at;
  const isInvitation = item.type === "invitation" && item.invitation?.status === "pending";
  const isMention = item.type === "comment_mention" && item.comment_mention;

  return (
    <article className={`inbox-item ${isUnread ? "is-unread" : ""}`}>
      <div className="inbox-item-avatar">{actorName.charAt(0).toUpperCase()}</div>
      <div className="inbox-item-content">
        <div className="inbox-item-header">
          <strong>{item.title}</strong>
          <span>{formatNotificationTime(item.created_at)}</span>
        </div>
        <p>{isInvitation ? getInvitationMessage(item) : item.body}</p>
        <span className="inbox-item-meta">
          {isInvitation
            ? `${item.invitation.target_type} invitation`
            : "Comment mention"}
        </span>

        {isInvitation && (
          <div className="inbox-item-actions">
            <button
              className="small-action-button"
              type="button"
              disabled={isBusy}
              onClick={() => onAcceptInvitation(item.invitation.id)}
            >
              Accept
            </button>
            <button
              className="inbox-secondary-button"
              type="button"
              disabled={isBusy}
              onClick={() => onDeclineInvitation(item.invitation.id)}
            >
              Decline
            </button>
          </div>
        )}

        {isMention && (
          <div className="inbox-item-actions">
            <button
              className="small-action-button"
              type="button"
              disabled={isBusy}
              onClick={() => onOpenMention(item)}
            >
              Open card
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function InboxSection({ emptyText, isBusy, items, onAcceptInvitation, onDeclineInvitation, onOpenMention, title }) {
  return (
    <section className="inbox-section">
      <h2>{title}</h2>
      <div className="inbox-list">
        {items.length > 0 ? (
          items.map((item) => (
            <InboxItem
              isBusy={isBusy}
              item={item}
              onAcceptInvitation={onAcceptInvitation}
              onDeclineInvitation={onDeclineInvitation}
              onOpenMention={onOpenMention}
              key={item.id}
            />
          ))
        ) : (
          <p className="empty-state">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

function InboxPage({
  notifications = [],
  onInvitationChanged,
  onNotificationsChanged,
  onOpenCardMention,
  setNotifications,
}) {
  const [inboxError, setInboxError] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const mentions = notifications.filter((item) => item.type === "comment_mention");
  const invitations = notifications.filter((item) => item.type === "invitation" && item.invitation?.status === "pending");

  async function loadInbox() {
    setIsLoadingInbox(true);
    setInboxError("");
    try {
      await onNotificationsChanged?.();
    } catch (error) {
      setInboxError(error.message);
    } finally {
      setIsLoadingInbox(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  async function handleAcceptInvitation(invitationId) {
    setBusyId(`invitation-${invitationId}`);
    setInboxError("");
    try {
      await acceptInvitation(invitationId);
      await loadInbox();
      await onInvitationChanged?.();
    } catch (error) {
      setInboxError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeclineInvitation(invitationId) {
    setBusyId(`invitation-${invitationId}`);
    setInboxError("");
    try {
      await declineInvitation(invitationId);
      await loadInbox();
      await onInvitationChanged?.();
    } catch (error) {
      setInboxError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleOpenMention(notification) {
    const target = notification.comment_mention;

    if (!target) {
      return;
    }

    setBusyId(`notification-${notification.id}`);
    setInboxError("");
    try {
      await markNotificationRead(notification.id);
      setNotifications?.((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? { ...currentNotification, read_at: new Date().toISOString() }
            : currentNotification
        )
      );
      onOpenCardMention?.(target);
    } catch (error) {
      setInboxError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="app-content" aria-labelledby="inbox-title">
      <header className="page-header">
        <div>
          <h1 id="inbox-title">Inbox</h1>
        </div>
      </header>

      {inboxError && <p className="app-error">{inboxError}</p>}

      <div className="inbox-page">
        {isLoadingInbox ? (
          <section className="inbox-section">
            <p className="empty-state">Loading notifications...</p>
          </section>
        ) : (
          <>
            <InboxSection
              emptyText="No mentions yet."
              isBusy={Boolean(busyId)}
              items={mentions}
              onAcceptInvitation={handleAcceptInvitation}
              onDeclineInvitation={handleDeclineInvitation}
              onOpenMention={handleOpenMention}
              title="Mentions"
            />
            <InboxSection
              emptyText="No invitations yet."
              isBusy={Boolean(busyId)}
              items={invitations}
              onAcceptInvitation={handleAcceptInvitation}
              onDeclineInvitation={handleDeclineInvitation}
              onOpenMention={handleOpenMention}
              title="Invitations"
            />
          </>
        )}
      </div>
    </section>
  );
}

export default InboxPage;
