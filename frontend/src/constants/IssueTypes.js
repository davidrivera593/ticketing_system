/* THIS IS USED TO TRACK WHAT ISSUE IT IS BASED ON issueType variable*/

export const issueTypeDisplay = {
    sponsorIssue: "Issues communicating with the Sponsor",
    sponsorWorkingIssue: "Issues working with the Sponsor",
    teamIssue: "Issues within the Team",
    teamMemberIssue: "Issues with a team mate",
    gradeAppeal: "Grade Appeal",
    extensionRequest: "Extension request",
    accommodationRequest: "Accommodation request",
    generalQuestion: "General question about the course",
    FeatureRequest: "Feature Request",
    Question: "Question",
    other: "Other",
    default: "Unspecified Issue",
  };

// Mapping for ticket ID prefixes based on issue type
export const issueTypePrefixes = {
    sponsorIssue: "SP",
    sponsorWorkingIssue: "SP",
    teamIssue: "TM",
    teamMemberIssue: "TM",
    gradeAppeal: "GRD",
    extensionRequest: "EXT",
    accommodationRequest: "ACM",
    generalQuestion: "QU",
    FeatureRequest: "FR",
    Question: "QU",
    other: "OT",
    default: "TK", // Generic ticket prefix for unknown types
  };

// Helper function to generate ticket number with prefix
export const generateTicketNumber = (issueType, ticketId) => {
    const prefix = issueTypePrefixes[issueType] || issueTypePrefixes.default;
    return `${prefix}${String(ticketId).padStart(4, '0')}`;
  };