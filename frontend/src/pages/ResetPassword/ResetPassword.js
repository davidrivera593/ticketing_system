import React from 'react';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import './ResetPassword.css';
import { passwordRequirementsText, validatePassword } from "../../utils/passwordValidator";

const ResetPassword = () => {
  let navigate = useNavigate();  
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const handleLogIn = () => {
    navigate('/login')
  }

  const changePassword = async (event) => {
    try {
      event.preventDefault();
      const nextPassword = event.target.password.value;
      if (!nextPassword) {
        setPasswordError(true);
        setPasswordErrorMessage("Password is required.");
        return;
      }

      const passwordCheck = validatePassword(nextPassword);
      if (!passwordCheck.valid) {
        setPasswordError(true);
        setPasswordErrorMessage(passwordCheck.errors.join(" "));
        return;
      }

      setPasswordError(false);
      setPasswordErrorMessage("");

      const response = await fetch(`${baseURL}/api/password-reset-tokens/validate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: new URLSearchParams(window.location.search).get("token"),
          password: nextPassword,
        }),
      });

      if (!response.ok) {
        console.log(response.statusText);
        const errorData = await response.json();
        setPasswordError(true);
        if (errorData?.error === "Password policy violation" && Array.isArray(errorData?.details)) {
          setPasswordErrorMessage(errorData.details.join(" "));
        } else {
          const msg = "Token Invalid or Expired";
          setPasswordErrorMessage(msg);
        }
        return;
      } else {
        setPasswordError(false);
        setPasswordErrorMessage("");
        alert("Password successfully updated.");
      }

    } catch (error) {
      console.error("Error during password reset:", error);
    }
  }

  return(
    <Stack className="signInContainer">
      <MuiCard className="card" variant="outlined">
        <Typography component="h1" variant="h4">
          Reset Password
        </Typography>
        <Box
          className="loginForm"
          component="form"
          noValidate
          onSubmit={changePassword}
        >
          <FormControl>
            <Box className="passwordControls">
              <FormLabel htmlFor="password">New Password</FormLabel>
            </Box>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage || passwordRequirementsText}
              name="password"
              placeholder="••••••"
              type={showPass ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={passwordError ? "error" : "primary"}
            /> 
              <label className="checkBoxLabel">
                <input 
                  type="checkbox"
                  id="showPassCheckBox"
                  onChange={e => setShowPass(e.target.checked)}
                  checked={showPass}
                  style={{ marginRight: '0px'}}
                />
                <span style={{ marginLeft: "0.5rem" }}>Show Password</span>
              </label>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
          >
            Reset
          </Button>
          <Typography sx={{ mt: 3 }}>
            Go to Login Page{' '}
            <span>
              <Link
                href=""
                variant="body2"
                onClick={handleLogIn}
              >
                Log In
              </Link>
            </span>
          </Typography>
        </Box>
      </MuiCard>
    </Stack>
  );
}

export default ResetPassword;