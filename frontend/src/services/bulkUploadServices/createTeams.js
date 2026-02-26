import Cookies from "js-cookie"; 
import Papa from "papaparse";

const baseURL = process.env.REACT_APP_API_BASE_URL; 
const REQUIRED_HEADERS = [
  "project", 
  "sponsor", 
  "sponsor_email", 
  "instructor", 
  "instructor_email",
  "grader",
  "grader_email"
]; 

const getTaIDByEmail = async (email) => {
    try {
        const token = Cookies.get("token");
        const response = await fetch(`${baseURL}/api/users/email/${encodeURIComponent(email)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const responseData = await response.json();
        //console.log(responseData);

        if (response.ok) {
            return { success: true, data: responseData.user_id };
        } else {
            return { success: false, error: `Failed to fetch TA ID for email ${email}: ${responseData?.message || response.statusText}` };
        }
    } catch (error) {
        console.error("An error occurred while fetching TA ID:", error);
        return { success: false, error: `Failed to fetch TA ID for email ${email}: ${error.message}` };
    }
};

const addTeam = async (project, sponsor, sponsor_email, taID, grader, grader_email) => {
    try {
        const token = Cookies.get("token");
        const response = await fetch(`${baseURL}/api/teams/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            team_name: project,
            instructor_user_id: taID,
            sponsor_name: sponsor,
            sponsor_email: sponsor_email,
            grader_name: grader,
            grader_email: grader_email,
          }),
        });

        const responseData = await response.json();
        //console.log(responseData)

        const createdFalse = responseData?.created === false;
        const isConflict = responseData.status === 409 || /unique|already exists|conflict/i.test(responseData?.error || '');

        if (createdFalse || isConflict) { //check if user already existed
          return { success: true, exists: true, data: responseData };
        }

        if (!response.ok) {
        return { success: false, error: `Team Creation Failed for ${project}: ${responseData?.message || response.statusText}` };
        }

        return { success: true, data: responseData };

    } catch (error) {
        console.error("An error occurred during registration:", error);
        return { success: false, error: `Team Creation Failed for ${project}: ${error.message}` };
    }
};

const createTeams = async (row) => {
    const userData = {};
    REQUIRED_HEADERS.forEach((k) => {
        userData[k] = (row[k] ?? "").toString().trim();
    });

    const team_name = userData.project;
    const sponsor_name = userData.sponsor;
    const sponsor_email = userData.sponsor_email;
    const grader_name = userData.grader;
    const grader_email = userData.grader_email;
    const taID = await getTaIDByEmail(userData.instructor_email);
    if (!taID.success) {
        return { success: false, error: `Could not find TA with email ${userData.instructor_email}: ${taID.error}` };
    }

    const result = await addTeam(team_name, sponsor_name, sponsor_email, taID.data, grader_name, grader_email);
    return result;
};

export const generateTeams = (file) => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        quoteChar: '"',
        escapeChar: '"',
        quotes: true,
        delimiter: ',',
        encoding: "UTF-8",
        dynamicTyping: false,
        beforeFirstChunk: (chunk) => chunk.replace(/\r\n?/g, '\n'),
        transformHeader: (h) => (h || "")
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^\w_]/g, ""),
        transform: (value) => (typeof value === "string" ? value.trim() : value),
        complete: (results) => {
          const rows = results.data || [];
          // create all users in parallel and wait for all results
          const createPromises = rows.map((row) => createTeams(row));
          Promise.all(createPromises)
            .then((results) => {
              const errors = results
                .map((r, i) => ({ r, i }))
                .filter(x => !x.r.success)
                .map(x => `Row ${x.i + 2}: ${x.r.error}`);
              resolve({ valid: errors.length === 0, errors, rows });
            })
            .catch((err) => {
              resolve({ valid: false, errors: [String(err)], rows });
            });
        },
        error: (err) => {
          resolve({ valid: false, errors: [String(err)], rows: [] });
        },
      });
  });
};
