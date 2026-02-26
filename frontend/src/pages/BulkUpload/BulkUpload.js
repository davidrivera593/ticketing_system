import React, {useState } from "react";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from "react-dropzone";
import DownloadTemplate from "../../services/bulkUploadServices/downloadTemplate";
import Stack from "@mui/material/Stack";
import {
    Button,
    Typography,
    Box,
    IconButton,
} from "@mui/material";
import { verifyFileService } from "../../services/bulkUploadServices/verifyFile";
import { generateTAs } from "../../services/bulkUploadServices/createTaUsers";
import { generateTeams } from "../../services/bulkUploadServices/createTeams";
import { generateStudentUsers } from "../../services/bulkUploadServices/createStudentUsers";
import { generateGraders } from "../../services/bulkUploadServices/createGraderUsers";
import { useTheme } from "@mui/material/styles";
import {useNavigate} from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const BulkUpload = () => {
    const [studentFile, setStudentFile] = useState(null);
    const [projectFile, setProjectFile] = useState(null);
    const navigate = useNavigate();
    const theme = useTheme();

    const handleBack = () => {
        navigate(-1); 
    };

    const onDropStudent = React.useCallback((acceptedFiles) => {
        setStudentFile(acceptedFiles && acceptedFiles.length ? acceptedFiles[0] : null);
    }, []);

    const onDropInstructor = React.useCallback((acceptedFiles) => {
        setProjectFile(acceptedFiles && acceptedFiles.length ? acceptedFiles[0] : null);
    }, []);

    const studentDrop = useDropzone({
        onDrop: onDropStudent,
        accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false,
    });

    const instructorDrop = useDropzone({
        onDrop: onDropInstructor,
        accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
    });

    const handleUploadFiles = async () => {
        if (!studentFile || !projectFile) {
            alert("Please select both files to upload.");
            return;
        }
        
        try {
            const verifyProjectResult = await verifyFileService(projectFile, "project");
            if (!verifyProjectResult.valid) {
                console.error("Project file verification failed:", verifyProjectResult.errors);
                alert("Project file validation errors:\n" + verifyProjectResult.errors.join("\n"));
                return;
            }

            const genTaResult = await generateTAs(projectFile);
            if (!genTaResult.valid) {
                console.error("TA creation failed:", genTaResult.errors);
                alert("TA creation errors:\n" + genTaResult.errors.join("\n"));
                return;
            }
            
            const genTeamResult = await generateTeams(projectFile);
            if (!genTeamResult.valid) {
                console.error("Team creation failed:", genTeamResult.errors);
                alert("Team creation errors:\n" + genTeamResult.errors.join("\n"));
                return;
            }

            const verifyStudentResult = await verifyFileService(studentFile, "student");
            if (!verifyStudentResult.valid) {
                console.error("Student file verification failed:", verifyStudentResult.errors);
                alert("Student file validation errors:\n" + verifyStudentResult.errors.join("\n"));
                return;
            }
    
            const genStudentResult = await generateStudentUsers(studentFile);
            if (!genStudentResult.valid) {
                console.error("User creation failed:", genStudentResult.errors);
                alert("Student user creation errors:\n" + genStudentResult.errors.join("\n"));
                return;
            }
            const genGraderResult = await generateGraders(projectFile);
            if (!genGraderResult.valid) {
                console.error("Grader creation failed:", genGraderResult.errors);
                alert("Grader creation errors:\n" + genGraderResult.errors.join("\n"));
                return;
            }
            
            
            alert("Files processed successfully.");
            setStudentFile(null);
            setProjectFile(null);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed: " + err.message);
        }
    };


    return ( <>
        <Box
            sx={{
                minHeight: "calc(100vh - 60px)",
                backgroundColor: theme.palette.background.default,
                padding: "20px 0",
            }}
        >
            <Box
                sx={{
                    padding: 5,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    maxWidth: "800px",
                    margin: "40px auto",
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                    <IconButton
                        onClick={handleBack}
                        aria-label="back to admin settings"
                    >
                        <ArrowBackIosNewIcon sx={{ color: theme.palette.text.primary }} />
                    </IconButton>
                    <Typography
                        variant="h4"
                        sx={{
                            textAlign: "center",
                            fontWeight: "bold",
                            color: theme.palette.text.primary,
                            flexGrow: 1,
                        }}
                    >
                        Data Bulk Upload
                    </Typography>
                </Box>

                {/* Projects CSV dropzone */}
                <Box
                    sx={{
                    marginBottom: 5,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRadius: "10px",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    padding: 2.5,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                >
                     <Typography 
                        variant="h5" 
                        sx={{ 
                            marginBottom: 2.5, 
                            fontWeight: "bold",
                            color: (theme) => theme.palette.text.primary
                        }}
                        >
                        Projects file
                    </Typography>

                    <Box sx={{ mt: 2, p: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                        <Typography 
                            variant="h7" 
                            sx={{ 
                            fontWeight: "bold",
                            color: theme.palette.text.primary
                            }}
                        >
                            Find project template here:
                        </Typography>
                        <DownloadTemplate ftype={"project"} />
                        </Stack>
                    </Box> 


                    <Box
                        {...instructorDrop.getRootProps()}
                        sx={{
                            mt: 2,
                            border: (theme) => `2px dashed ${projectFile ? theme.palette.primary.main : theme.palette.divider}`,
                            borderRadius: 1,
                            p: 3,
                            textAlign: "center",
                            cursor: "pointer",
                        }}
                        >
                        <input {...instructorDrop.getInputProps()} />
                        <UploadFileIcon fontSize="large" sx={{ mb: 1 }} />
                        <Typography>Drop Project CSV here or click to select</Typography>
                        <Typography variant="caption">CSV, XLSX — max 10MB</Typography>
                    </Box>

                    {projectFile && (
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", p: 1, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Typography sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectFile.name}</Typography>
                        <Box>
                        <Button size="small" onClick={() => setProjectFile(null)}>Remove</Button>
                        </Box>
                    </Box>
                    )}
                </Box>


                {/* Student CSV dropzone */}
                <Box
                    sx={{
                    marginBottom: 5,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRadius: "10px",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    padding: 2.5,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <Typography 
                    variant="h5" 
                    sx={{ 
                        marginBottom: 2.5, 
                        fontWeight: "bold",
                        color: (theme) => theme.palette.text.primary
                    }}
                    >
                    Students file
                    </Typography>

                    <Box sx={{ mt: 2, p: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                        <Typography 
                            variant="h7" 
                            sx={{ 
                            fontWeight: "bold",
                            color: theme.palette.text.primary
                            }}
                        >
                            Find student template here:
                        </Typography>
                        <DownloadTemplate ftype={"student"}/>
                        </Stack>
                    </Box> 

   
                    <Box
                        {...studentDrop.getRootProps()}
                        sx={{
                            mt: 2,
                            border: (theme) => `2px dashed ${studentFile ? theme.palette.primary.main : theme.palette.divider}`,
                            borderRadius: 1,
                            p: 3,
                            textAlign: "center",
                            cursor: "pointer",
                        }}
                        >
                        <input {...studentDrop.getInputProps()} />
                        <UploadFileIcon fontSize="large" sx={{ mb: 1 }} />
                        <Typography>Drop Student CSV here or click to select</Typography>
                        <Typography variant="caption">CSV, XLSX — max 10MB</Typography>
                    </Box>

                    {studentFile && (
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", p: 1, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Typography sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{studentFile.name}</Typography>
                        <Box>
                        <Button size="small" onClick={() => setStudentFile(null)}>Remove</Button>
                        </Box>
                    </Box>
                    )}

                </Box>


                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button variant="contained" onClick={() => handleUploadFiles()} >Upload Files</Button>
                    <Button variant="outlined" onClick={() => { setStudentFile(null); setProjectFile(null); }}>Clear</Button>
                </Box>

            </Box>
        </Box>
      </>
    );
};

export default BulkUpload;