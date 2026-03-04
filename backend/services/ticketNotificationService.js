const User = require("../models/User");
const Ticket = require("../models/Ticket");
const TaTicket = require("../models/TaTicket");
const TicketAssignment = require("../models/TicketAssignment");
const TaTicketAssignment = require("../models/TaTicketAssignment");
const sendEmail = require("./emailService");

const getUniqueNotifiableRecipients = (users, actorUserId) => {
  const seenUserIds = new Set();
  const seenEmails = new Set();

  return users.filter((user) => {
    if (!user || !user.user_id || !user.email) {
      return false;
    }

    if (actorUserId && user.user_id === actorUserId) {
      return false;
    }

    if (!user.notifications_enabled) {
      return false;
    }

    if (seenUserIds.has(user.user_id) || seenEmails.has(user.email)) {
      return false;
    }

    seenUserIds.add(user.user_id);
    seenEmails.add(user.email);
    return true;
  });
};

const deliverEmails = async (recipients, subject, body) => {
  if (!recipients.length) {
    return;
  }

  const sendResults = await Promise.allSettled(
    recipients.map((recipient) => sendEmail(recipient.email, subject, body))
  );

  sendResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to send notification email to ${recipients[index].email}:`,
        result.reason
      );
    }
  });
};

const getRegularTicketRecipients = async (ticket, actorUserId) => {
  const assignmentRows = await TicketAssignment.findAll({
    where: { ticket_id: ticket.ticket_id },
    attributes: ["user_id"],
  });

  const assignedUserIds = assignmentRows.map((row) => row.user_id);
  const userIds = [ticket.student_id, ...assignedUserIds];

  const users = await User.findAll({
    where: { user_id: userIds },
    attributes: ["user_id", "name", "email", "notifications_enabled"],
  });

  return getUniqueNotifiableRecipients(users, actorUserId);
};

const getTaTicketRecipients = async (ticket, actorUserId) => {
  const assignmentRows = await TaTicketAssignment.findAll({
    where: { ticket_id: ticket.ticket_id },
    attributes: ["user_id"],
  });

  const assignedUserIds = assignmentRows.map((row) => row.user_id);
  const admins = await User.findAll({
    where: { role: "admin" },
    attributes: ["user_id", "name", "email", "notifications_enabled"],
  });

  const directUsers = await User.findAll({
    where: { user_id: [ticket.ta_id, ...assignedUserIds] },
    attributes: ["user_id", "name", "email", "notifications_enabled"],
  });

  return getUniqueNotifiableRecipients([...directUsers, ...admins], actorUserId);
};

const notifyRegularTicketStatusChanged = async ({
  ticketId,
  previousStatus,
  currentStatus,
  actorUserId,
}) => {
  if (!currentStatus || previousStatus === currentStatus) {
    return;
  }

  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) {
    return;
  }

  const recipients = await getRegularTicketRecipients(ticket, actorUserId);
  const subject = `Ticket #${ticket.ticket_id} status updated`;
  const body = `Ticket #${ticket.ticket_id} status changed from "${previousStatus}" to "${currentStatus}".`;

  await deliverEmails(recipients, subject, body);
};

const notifyRegularTicketEscalationChanged = async ({
  ticketId,
  isEscalated,
  actorUserId,
}) => {
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) {
    return;
  }

  let recipients = await getRegularTicketRecipients(ticket, actorUserId);

  if (isEscalated) {
    const admins = await User.findAll({
      where: { role: "admin" },
      attributes: ["user_id", "name", "email", "notifications_enabled"],
    });

    recipients = getUniqueNotifiableRecipients(
      [...recipients, ...admins],
      actorUserId
    );
  }
  const subject = isEscalated
    ? `Ticket #${ticket.ticket_id} escalated`
    : `Ticket #${ticket.ticket_id} de-escalated`;
  const body = isEscalated
    ? `Ticket #${ticket.ticket_id} was escalated for additional review.`
    : `Ticket #${ticket.ticket_id} was de-escalated.`;

  await deliverEmails(recipients, subject, body);
};

const notifyTaTicketStatusChanged = async ({
  ticketId,
  previousStatus,
  currentStatus,
  actorUserId,
}) => {
  if (!currentStatus || previousStatus === currentStatus) {
    return;
  }

  const ticket = await TaTicket.findByPk(ticketId);
  if (!ticket) {
    return;
  }

  const recipients = await getTaTicketRecipients(ticket, actorUserId);
  const subject = `TA Ticket #${ticket.ticket_id} status updated`;
  const body = `TA Ticket #${ticket.ticket_id} status changed from "${previousStatus}" to "${currentStatus}".`;

  await deliverEmails(recipients, subject, body);
};

const notifyTaTicketEscalationChanged = async ({
  ticketId,
  isEscalated,
  actorUserId,
}) => {
  const ticket = await TaTicket.findByPk(ticketId);
  if (!ticket) {
    return;
  }

  const recipients = await getTaTicketRecipients(ticket, actorUserId);
  const subject = isEscalated
    ? `TA Ticket #${ticket.ticket_id} escalated`
    : `TA Ticket #${ticket.ticket_id} de-escalated`;
  const body = isEscalated
    ? `TA Ticket #${ticket.ticket_id} was escalated for additional review.`
    : `TA Ticket #${ticket.ticket_id} was de-escalated.`;

  await deliverEmails(recipients, subject, body);
};

module.exports = {
  notifyRegularTicketStatusChanged,
  notifyRegularTicketEscalationChanged,
  notifyTaTicketStatusChanged,
  notifyTaTicketEscalationChanged,
};
