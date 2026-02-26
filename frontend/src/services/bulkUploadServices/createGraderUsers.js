import Cookies from "js-cookie";
import Papa from "papaparse";
import {generateRandomPassword} from "../generateRandomPass";

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

const addGrader  = async (name, email, password) => {
    try {
        const token = Cookies.get("token");
        const response = await fetch(`${baseURL}/api/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: "grader",
                must_change_password: true
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
            return {
                success: false,
                error: `Account Creation Failed for ${name}: ${responseData?.message || response.statusText}` };
        }

        return { success: true, data: responseData };

    } catch (error) {
        console.error("An error occurred during registration:", error);
        return { success: false, error: `Account Creation Failed for ${name}: ${error.message}` };
    }
};

const createGraders = async (row) => {
    try {
        const userData = {};
        REQUIRED_HEADERS.forEach((k) => {
            userData[k] = (row[k] ?? "").toString().trim();
        });

        const name = userData.grader;
        const email = userData.grader_email;
        const password = generateRandomPassword();

        const result = await addGrader(name, email, password);

        return result;
    } catch (err) {
        return { success: false, error: err.message || String(err) };
    }
};

export const generateGraders = (file) => {
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
                //console.log("Parsed data:", results.data);
                const rows = results.data || [];
                // create all users in parallel and wait for all results
                const createPromises = rows.map((row) => createGraders(row));
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