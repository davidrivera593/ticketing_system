import Cookies from "js-cookie";

const baseURL = process.env.REACT_APP_API_BASE_URL;

const importBulk = async ({ projectRows, studentRows }) => {
  const token = Cookies.get("token");
  const response = await fetch(`${baseURL}/api/bulk-upload/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectRows, studentRows }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || "Bulk upload failed");
  }

  return data;
};

export default importBulk;