import Cookies from "js-cookie"; 
import Papa from "papaparse";
import { generateRandomPassword }  from "../generateRandomPass";

const baseURL = process.env.REACT_APP_API_BASE_URL; 
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

const getTeam = async (name) => {
  try {
    const token = Cookies.get("token");
    const responseTeam = await fetch(`${baseURL}/api/teams/name/${name}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const responseTeamData = await responseTeam.json();

    if (responseTeam.ok) {
        return { success: true, data: responseTeamData.team_id };
    } else {
        return { success: false, error: `Failed to fetch Team ID for name ${name}: ${responseTeamData?.message || responseTeam.statusText}` };
    }
  } catch (error) {
      console.error("An error occurred while fetching Team ID:", error);
      return { success: false, error: `Failed to fetch Team ID for name ${name}: ${error.message}` };
  }
};


const addTeamMember = async (team_id, user_id) => {
  try {
    const token = Cookies.get("token");
    const responseMember = await fetch(`${baseURL}/api/teammembers/team/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        team_id: team_id,
        user_id: user_id 
      }),
    });

    const responseMemberData = await responseMember.json();

    const createdFalse = responseMemberData?.created === false;
    const isConflict = responseMemberData.status === 409 || /unique|already exists|conflict/i.test(responseMemberData?.error || '');

    if (createdFalse || isConflict) { //check if member already existed
      return { success: true, exists: true, data: responseMemberData };
    }

    if (!responseMember.ok) { // failed to add team member
        return { success: false, error: `Failed to add Team Member for team ID ${team_id} and user ID ${user_id}: ${responseMemberData?.message || responseMember.statusText}` };
    }

    return { success: true, data: responseMemberData };

  } catch (error) {
      console.error("An error occurred while adding Team Member:", error);
      return { success: false, error: `Failed to add Team Member for team ID ${team_id} and user ID ${user_id}: ${error.message}` };
  }
};


const addStudent = async (name, email, password, section, team_id) => {
  try {
    const token = Cookies.get("token");
    //create user account for student
    const responseUser = await fetch(`${baseURL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        email: email, 
        password: password, 
        role: "student",
        must_change_password: true
      }),
    });

    const responseUserData = await responseUser.json();
    //console.log(responseUserData)
    const { user_id } = responseUserData.user;

    const createdFalse = responseUserData?.created === false;
    const isConflict = responseUserData.status === 409 || /unique|already exists|conflict/i.test(responseUserData?.error || '');

    if (createdFalse || isConflict) { //check if user already existed
      return { success: true, exists: true, data: responseUserData };
    }

    if (!responseUser.ok) {  // failed to create user
      return { 
        success: false, 
        error: `User Creation Failed for ${name}: ${responseUserData?.message || responseUserData?.error || responseUser.statusText}` 
      };
   
    } else { //user created successfully, create student data
      
      //console.log("Creating user with ID:", user_id, team_id, section);

      const responseSD = await fetch(`${baseURL}/api/studentdata/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify({
            user_id: user_id,
            team_id: team_id,
            section: section, 
        }),
      });

      const responseStudentData = await responseSD.json();
      //console.log(responseStudentData)

      const createdFalse = responseStudentData?.created === false;
      const isConflict = responseStudentData.status === 409 || /unique|already exists|conflict/i.test(responseStudentData?.error || '');

      if (createdFalse || isConflict) { //check if studentdata already existed
        return { success: true, exists: true, data: responseStudentData };
      }

      if (!responseSD.ok) { // failed to create student data
        return { 
          success: false,
          error: `Student Data Failed for ${user_id}: ${responseStudentData?.message || responseStudentData?.error || responseSD.statusText}` 
        };

      }   
      
      return { success: true, data: responseUserData };
    }
  } catch (error) {
    console.error("An error occurred during registration:", error);
    return { success: false, error: `Student account Failed for ${name}: ${error.message}` };
  }  
};


const createStudent = async (row) => {
  const userData = {};
  REQUIRED_HEADERS.forEach((k) => {
    userData[k] = (row[k] ?? "").toString().trim();
  });

  const name = (userData.name ?? "").replace(/,/g, "").trim();
  const email = `${userData.login_id}@asu.edu`;
  const password = generateRandomPassword();

  const section = userData.sections;
  const team_id = await getTeam(userData.group_name);

  if (team_id.success === false) { 
    return { success: false, error: `Failed to get team ID: ${team_id.error}` };
  }

  //create student user and student data
  const studentResult = await addStudent(name, email, password, section, team_id.data);

  if (!studentResult.success) { //failed to create student user/data
    return { success: false, error: `Failed to create student data: ${studentResult.error}` };

  } else if (studentResult.exists) { //student already existed
    return { success: true, exists: true, data: studentResult.data };

  } else { //since student was created succesfully, add them to teammembers
    const user_id = studentResult.data.user.user_id;
    const teamMemberResult = await addTeamMember(team_id.data, user_id);
    if (!teamMemberResult.success) {
      return { success: false, error: `Failed to add team member: ${teamMemberResult.error}` };
    }

    //TO-DO: email student with reset link?
    return { success: true, data: studentResult.data };
  }
};

export const generateStudentUsers = (file) => {
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
            const createPromises = rows.map((row) => createStudent(row)); // create all users in parallel and wait for all results
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