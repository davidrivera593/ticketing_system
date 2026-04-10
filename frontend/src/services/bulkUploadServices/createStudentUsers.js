import Cookies from "js-cookie";
import Papa from "papaparse";
import { generateRandomPassword } from "../generateRandomPass";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const normalizeTeamName = (value) =>
    String(value ?? "")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const readJsonOrThrow = async (response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        const snippet = text.slice(0, 160).replace(/\s+/g, " ");
        throw new Error(`Expected JSON but could not parse response: ${snippet}`);
    }
};

const REQUIRED_HEADERS = [
    "name",
    "canvas_user_id",
    "user_id",
    "login_id",
    "sections",
    "group_name",
    "canvas_group_id",
    "sponsor"
];

/** * Fetches team ID by name
 */
const getTeam = async (name) => {
    try {
        const apiBase = (baseURL || "").toString().trim().replace(/\/+$/, "");
        const token = Cookies.get("token");
        const normalizedName = normalizeTeamName(name);
        const response = await fetch(`${apiBase}/api/teams/by-name?name=${encodeURIComponent(normalizedName)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await readJsonOrThrow(response);
        return response.ok
            ? { success: true, data: data.team_id }
            : { success: false, error: data?.message || response.statusText };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const updateStudent = async (user_id, name, section, team_id) => {
    const token = Cookies.get("token");

    try {
        // 1. Update User Record
        // Note: Use PUT because your userRoutes.js defines router.put("/:user_id", ...)
        const resUser = await fetch(`${baseURL}/api/users/${user_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name }),
        });

        // 2. Update Student Metadata
        // Check your studentDataRoutes.js! If the route is "/api/studentdata/:user_id",
        // make sure it is ALSO a PUT or POST, not a PATCH.
        const resSD = await fetch(`${baseURL}/api/studentdata/${user_id}`, {
            method: "PUT", // Change this to match whatever is in your studentDataRoutes.js
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ section, team_id }),
        });

        if (!resUser.ok || !resSD.ok) {
            console.error("Update error details:", {
                userStatus: resUser.status,
                sdStatus: resSD.status
            });
            return { success: false, error: `User: ${resUser.status}, SD: ${resSD.status}` };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/** * Registers or retrieves existing student
 */
const addStudent = async (name, email, password, section, team_id) => {
    try {
        const token = Cookies.get("token");
        const responseUser = await fetch(`${baseURL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                name, email, password,
                role: "student",
                must_change_password: true
            }),
        });

        const responseUserData = await responseUser.json();
        const isConflict = responseUser.status === 409 || responseUserData?.created === false;

        // If user exists, return existing data for comparison
        if (isConflict) {
            return { success: true, exists: true, data: responseUserData };
        }

        if (!responseUser.ok) {
            return { success: false, error: responseUserData?.message || "Registration failed" };
        }

        // New user created, now create student data
        const user_id = responseUserData.user.user_id;
        const responseSD = await fetch(`${baseURL}/api/studentdata/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id, team_id, section }),
        });

        return responseSD.ok
            ? { success: true, data: responseUserData }
            : { success: false, error: "User created, but Student Data failed" };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const addTeamMember = async (team_id, user_id) => {
    try {
        const token = Cookies.get("token");
        const response = await fetch(`${baseURL}/api/teammembers/team/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ team_id, user_id }),
        });
        const data = await response.json();
        return (response.ok || response.status === 409)
            ? { success: true }
            : { success: false, error: data?.message };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

const createOrUpdateStudent = async (row) => {
    const userData = {};
    REQUIRED_HEADERS.forEach((k) => {
        userData[k] = (row[k] ?? "").toString().replace(/\u00A0/g, " ").trim();
    });

    const name = (userData.name ?? "").replace(/,/g, "").trim();
    const email = `${userData.login_id}@asu.edu`;
    const section = (userData.sections ?? "").toString().trim();
    const teamLookup = await getTeam(userData.group_name);

    if (!teamLookup.success) {
        return { success: false, error: `Team not found: ${userData.group_name}` };
    }

    const targetTeamId = teamLookup.data;
    const password = generateRandomPassword();

    // Attempt to create
    const result = await addStudent(name, email, password, section, targetTeamId);

    if (!result.success) return result;

    const user_id = result.data.user.user_id;

    if (result.exists) {
        // DIFF CHECK: Compare incoming CSV data with existing DB data
        const existingUser = result.data.user;
        const existingSD = result.data.studentData; // Assumes backend returns this on conflict

        const needsUpdate =
            existingUser.name !== name ||
            existingSD?.section !== section ||
            existingSD?.team_id !== targetTeamId;

        if (needsUpdate) {
            const updateRes = await updateStudent(user_id, name, section, targetTeamId);
            if (!updateRes.success) return updateRes;
            return { success: true, action: "updated" };
        }
        return { success: true, action: "no_change" };
    }

    // If new user, add to team members
    await addTeamMember(targetTeamId, user_id);
    return { success: true, action: "created" };
};

export const generateStudentUsers = (file) => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, ""),
            complete: async (results) => {
                const rows = results.data || [];
                const finalResults = [];
                const errors = [];

                // Sequential processing to avoid API/DB flooding
                for (let i = 0; i < rows.length; i++) {
                    try {
                        const res = await createOrUpdateStudent(rows[i]);
                        if (!res.success) {
                            errors.push(`Row ${i + 2}: ${res.error}`);
                        }
                        finalResults.push(res);
                    } catch (err) {
                        errors.push(`Row ${i + 2}: Unexpected Error: ${err.message}`);
                    }
                }

                resolve({
                    valid: errors.length === 0,
                    errors,
                    rows,
                    stats: {
                        created: finalResults.filter(r => r.action === "created").length,
                        updated: finalResults.filter(r => r.action === "updated").length,
                        unchanged: finalResults.filter(r => r.action === "no_change").length
                    }
                });
            },
            error: (err) => resolve({ valid: false, errors: [String(err)], rows: [] }),
        });
    });
};