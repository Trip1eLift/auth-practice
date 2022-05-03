import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

export default function App() {
  const [payload, setPayload] = useState();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(undefined);
  
  useEffect(() => {
    axios.get("http://localhost:8080/hello")
      .then((res) => {
        setPayload(res.data);
      })
      .catch((err) => {
        console.error(err)
      });
  }, []);

  useEffect(() => {
    const turnOffAlert = async () => {
      await new Promise(res => setTimeout(res, 2000));
      setAlert(undefined);
    }
    turnOffAlert();
  }, [alert]);

  function handleLogin(e) {
    if (id.length > 0 && password.length > 0) {
      axios.get("http://localhost:8080/login", { params: {id:id, password:password} })
        .then((res) => {
          if (res.data.login === true) {
            localStorage.setItem('x-access-token', res.headers['x-access-token']);
            setAlert({severity:"success", text: `ID: ${res.data.user.id}, Name: ${res.data.user.name}`});
          } else {
            setAlert({severity:"error", text: "Login failed."})
          }
        })
    }
  }

  function handleVerifyLogin(e) {
    axios.get("http://localhost:8080/login-verify", { headers: {'x-access-token': localStorage.getItem('x-access-token')} })
      .then((res) => {
        if (res.data.login === true) {
          localStorage.setItem('x-access-token', res.headers['x-access-token']);
          setAlert({severity:"success", text: `User is login, renew token.`});
        } else {
          setAlert({severity:"error", text: "User is not login."})
        } 
      });
  }

  return (
    <div className="App">
      {payload && <>
        <div>{payload.message}</div>
        <div>ID: {payload.rows[0].id}</div>
        <div>Name: {payload.rows[0].name}</div>
        <div>1. To test authentication, use id: master and password: hardpassword to login.</div>
        <div>2. To test authorization, press VERIFY LOGIN STATUS after login. The token expires in 10 second. Token is renewed when verifying.</div>
      </>}
      <Box sx={{ flexGrow: 1 }} style={{marginTop: "3rem"}}>
        <Grid container spacing={2} align="center" justify="center" direction="column">
          <Grid item xs={8}>
            <TextField onChange={(e)=>setId(e.target.value)} id="standard-basic" label="ID" variant="standard" />
          </Grid>
          <Grid item xs={8}>
            <TextField onChange={(e)=>setPassword(e.target.value)} id="standard-basic" label="Password" variant="standard" />
          </Grid>
          <Grid item xs={8}>
            <Button onClick={handleLogin} variant="contained">Login</Button>
          </Grid>
          <Grid item xs={8}>
            <Button onClick={handleVerifyLogin} variant="outlined">Verify Login Status</Button>
          </Grid>
        </Grid>
      </Box>
      {alert && <Alert severity={alert.severity} style={{position:"fixed", width:"20rem", left:"50%", top:"100%", transform:"translate(-50%,-100%)"}}>
        {alert.text}
      </Alert>}
    </div>
  )
}