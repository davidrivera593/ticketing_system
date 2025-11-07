import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

export default function BugReportPage() {
  const [form, setForm] = useState({ subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/bug-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
      setResult({ type: "success", msg: "Thanks! Your bug report was submitted." });
      setForm({ subject: "", description: "" });
    } catch (err) {
      setResult({ type: "error", msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3} maxWidth={720} mx="auto">
      <Typography variant="h4" gutterBottom>Report a Bug</Typography>
      {result && <Alert severity={result.type} sx={{ mb: 2 }}>{result.msg}</Alert>}
      <Box component="form" onSubmit={onSubmit} display="grid" gap={2}>
        <TextField label="Subject" name="subject" value={form.subject} onChange={onChange} required />
        <TextField label="Description" name="description" value={form.description} onChange={onChange}
                   multiline minRows={4} required />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Bug"}
        </Button>
      </Box>
    </Box>
  );
}
