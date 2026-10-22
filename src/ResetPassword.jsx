import { useState } from "react";

export default function ResetPassword({ setShowResetPasswordScreen, supabase }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return setError("Passwords do not match.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    
    setBusy(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      // Kill the auto-login session
      await supabase.auth.signOut();
      localStorage.removeItem("is_resetting_password");
      
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Could not update password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#0F0F0F", display: "flex", justifyContent: "center", alignItems: "center", overflowY: "auto", padding: "20px" }}>
      <section style={{ width: "100%", maxWidth: "400px", padding: "24px", background: "#1C1C1C", borderRadius: "16px", border: "1px solid #303030" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <img src="/music-antenna-logo.png" alt="Music Antenna" style={{ width: "100%", maxWidth: "180px", height: "auto", objectFit: "contain", background: "#fff", padding: "12px", borderRadius: "12px" }} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: "8px", color: "#F1F1F1", fontSize: "20px" }}>Create New Password</h2>
        <p style={{ textAlign: "center", color: "#AAAAAA", marginBottom: "24px", fontSize: "14px" }}>Your old password has been invalidated. Please create a new password.</p>
        
        {error && <div style={{ padding: "12px", background: "rgba(255, 78, 69, 0.1)", color: "#FF4E45", border: "1px solid #FF4E45", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleUpdatePassword}>
          <label style={{ display: "block", marginBottom: "16px" }}>
            <span style={{ display: "block", color: "#F1F1F1", marginBottom: "8px", fontSize: "14px" }}>New Password</span>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#272727", border: "1px solid #303030", color: "#F1F1F1", outline: "none", boxSizing: "border-box" }} />
          </label>
          <label style={{ display: "block", marginBottom: "24px" }}>
            <span style={{ display: "block", color: "#F1F1F1", marginBottom: "8px", fontSize: "14px" }}>Confirm New Password</span>
            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm your new password" required minLength={6} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#272727", border: "1px solid #303030", color: "#F1F1F1", outline: "none", boxSizing: "border-box" }} />
          </label>
          <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px", background: "#FF0033", color: "#FFF", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Updating..." : "Update Password"}
          </button>
          <button type="button" onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem("is_resetting_password"); setShowResetPasswordScreen(false); window.location.href = "/"; }} style={{ width: "100%", marginTop: "16px", padding: "14px", borderRadius: "8px", background: "transparent", color: "#FF0033", fontWeight: "bold", fontSize: "15px", border: "1px solid #FF0033", cursor: "pointer" }}>
            Cancel & Return to Login
          </button>
        </form>
      </section>
    </main>
  );
}
