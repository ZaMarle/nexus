import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect");
  const responseType = params.get("response_type");
  const redirectUri = params.get("redirect_uri");
  const state = params.get("state");
  const codeChallenge = params.get("code_challenge");

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password, redirectUrl, responseType, redirectUri, state, codeChallenge }
          : { name, email, password, redirectUrl, responseType, redirectUri, state, codeChallenge };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 400) {
        setError("Sign in is not allowed from this application.");
        return;
      }
      if (res.status === 401) {
        setError("Invalid email or password.");
        return;
      }
      if (res.status === 409) {
        setError("An account with that email already exists.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();

      if (data.code && data.redirectUri) {
        const url = new URL(data.redirectUri);
        url.searchParams.set("code", data.code);
        if (data.state) url.searchParams.set("state", data.state);
        window.location.href = url.toString();
        return;
      }

      if (data.redirectUrl) {
        window.location.href = `${data.redirectUrl}?token=${encodeURIComponent(data.token)}`;
        return;
      }

      localStorage.setItem("nexus_token", data.token);
      setUser(data.user);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem("nexus_token");
    setUser(null);
    setName("");
    setEmail("");
    setPassword("");
  }

  if (user) {
    return (
      <Container maxWidth="xs">
        <Box
          sx={{
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 4, width: "100%", textAlign: "center" }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: 28,
                bgcolor: "primary.main",
                mx: "auto",
                mb: 2,
              }}
            >
              {user.name[0].toUpperCase()}
            </Avatar>
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {user.email}
            </Typography>
            <Button variant="outlined" fullWidth onClick={handleSignOut}>
              Sign out
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Avatar sx={{ mb: 1, bgcolor: "primary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Typography>

        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {mode === "signup" && (
              <TextField
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                fullWidth
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              fullWidth
            />

            {mode === "login" && (
              <Link href="#" variant="body2" sx={{ alignSelf: "flex-end" }}>
                Forgot password?
              </Link>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </Box>
        </Paper>

        <Typography variant="body2" sx={{ mt: 2 }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </Link>
            </>
          )}
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
