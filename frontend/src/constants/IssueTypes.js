/* THIS IS USED TO TRACK WHAT ISSUE IT IS BASED ON issueType variable*/

export const issueTypeDisplay = {
    sponsorIssue: "Issues with Sponsor",
    teamIssue: "Issues within the Team",
    assignmentIssue: "Issues with Assignments",
    other: "Other",
    //account for inserted users
    Bug: "Bug",
    "Feature Request": "Feature Request",
    Question: "Question",
    default: "Unspecified Issue",
  };

// Mapping for ticket ID prefixes based on issue type
export const issueTypePrefixes = {
    sponsorIssue: "SP",
    teamIssue: "TM",
    assignmentIssue: "AS",
    other: "OT",
    Bug: "BG",
    "Feature Request": "FR",
    Question: "QU",
    default: "TK", // Generic ticket prefix for unknown types
  };

// Helper function to generate ticket number with prefix
export const generateTicketNumber = (issueType, ticketId) => {
    const prefix = issueTypePrefixes[issueType] || issueTypePrefixes.default;
    return `${prefix}${String(ticketId).padStart(4, '0')}`;
  };