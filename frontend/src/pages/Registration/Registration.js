import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import "./Registration.css";
import { passwordRequirementsText, validatePassword } from "../../utils/passwordValidator";

export default function Registration() {
  let navigate = useNavigate();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  // const [asuIdError, setAsuIdError] = React.useState(false);
  // const [asuIdErrorMessage, setAsuIdErrorMessage] = React.useState("");
  const baseURL = process.env.REACT_APP_API_BASE_URL;


  const handleLogIn = () => {
    navigate('/login')
  }

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      if (emailError || passwordError) {
        return;
      }
      const data = new FormData(event.currentTarget);

      const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          // asu_id: data.get("asu_id"),
          role: "student",   // Assuming that only students are allowed to register through this portal as we have no way of verifying if someone is an instructor or admin
        }),
      });

      const responseData = await response.json();
      console.log(responseData)

      // Handele Response
      if (!response.ok) {
        if (responseData?.error === "Password policy violation" && Array.isArray(responseData?.details)) {
          setPasswordError(true);
          setPasswordErrorMessage(responseData.details.join(" "));
          return;
        }
        setNameError(true);
        setEmailError(true);
        setPasswordError(true);
        const errorMessage = "Account Creation Failed";
        setNameErrorMessage(errorMessage);
        setEmailErrorMessage(errorMessage);
        setPasswordErrorMessage(errorMessage);
        // setAsuIdErrorMessage(errorMessage);
        return;
      }
      else {
        navigate('/login')
      }


    } catch (error) {
      console.error("An error occurred during registration:", error);
      setEmailErrorMessage("Something went wrong. Please try again.");
    }
  };

  const validateInputs = () => {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const name = document.getElementById("name");
    // const asuId = document.getElementById("asu_id");
    let isValid = true;

    if (!email.value || !/^\S+@asu\.edu$/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter your ASU email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value) {
      setPasswordError(true);
      setPasswordErrorMessage("Password is required.");
      isValid = false;
    } else {
      const passwordCheck = validatePassword(password.value);
      if (!passwordCheck.valid) {
        setPasswordError(true);
        setPasswordErrorMessage(passwordCheck.errors.join(" "));
        isValid = false;
      } else {
        setPasswordError(false);
        setPasswordErrorMessage("");
      }
    }

    if (!name.value || name.value.length < 1) {
        setNameError(true);
        setNameErrorMessage("Please enter your name.");
        isValid = false;
      } else {
        setNameError(false);
        setNameErrorMessage("");
      }
    
    // if (!asuId.value || !/^\d{10}$/.test(asuId.value)) {
    //   setAsuIdError(true);
    //   setAsuIdErrorMessage("ASU ID must be exactly 10 digits.");
    //   isValid = false;
    // } else {
    //   setAsuIdError(false);
    //   setAsuIdErrorMessage("");
    // }


    return isValid;
  };

  return (
    <Stack className="signInContainer">
      <MuiCard className="card" variant="outlined">
        <Typography component="h1" variant="h4">
          Register
        </Typography>
        <Box
          className="loginForm"
          component="form"
          onSubmit={handleSubmit}
          noValidate
        >
         <FormControl>
            <FormLabel className="nameLabel" htmlFor="name">
              Full Name
            </FormLabel>
            <TextField
              error={nameError}
              helperText={nameErrorMessage}
              id="name"
              type="name"
              name="name"
              placeholder="Your Name"
              autoComplete="name"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={nameError ? "error" : "primary"}
            />
          </FormControl>
          <FormControl>
            <FormLabel className="emailLabel" htmlFor="email">
              Email
            </FormLabel>
            <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={emailError ? "error" : "primary"}
            />
          </FormControl>
          <FormControl>
            <Box className="passwordControls">
              <FormLabel htmlFor="password">Password</FormLabel>
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
          {/* <FormControl>
            <FormLabel className="asuIdLabel" htmlFor="asu_id">
              ASU ID
            </FormLabel>
            <TextField
              error={asuIdError}
              helperText={asuIdErrorMessage}
              id="asu_id"
              type="text"
              name="asu_id"
              placeholder="10-digit ASU ID"
              required
              fullWidth
              variant="outlined"
              inputProps={{ maxLength: 10 }}
              color={asuIdError ? "error" : "primary"}
            />
          </FormControl> */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            onClick={validateInputs}
          >
            Register
          </Button>
          <Typography>
            Already Have an Account?{' '}
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
