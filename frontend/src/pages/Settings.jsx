import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PageHeader,
  Card,
  Spinner,
  Field,
  TextInput,
  FieldGroup,
  ErrorMsg,
} from "../components/ui";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profMsg, setProfMsg] = useState("");
  const [profErr, setProfErr] = useState("");
  const [profLoad, setProfLoad] = useState(false);

  // Delete account
  const [delEmail, setDelEmail] = useState("");
  const [delErr, setDelErr] = useState("");
  const [delLoad, setDelLoad] = useState(false);
  const [showDelConfirm, setShowDel] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/settings/profile")
      .then((r) => {
        setName(r.data.UserName || r.data.userName || "");
        setPhone(r.data.PhoneNumber || r.data.phoneNumber || "");
        setEmail(r.data.Email || r.data.email || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfErr("");
    setProfMsg("");
    if (!name.trim()) return setProfErr("Full name is required.");
    setProfLoad(true);
    try {
      await api.patch("/settings/profile", {
        userName: name,
        phoneNumber: phone || null,
      });
      updateUser({ UserName: name, PhoneNumber: phone });
      setProfMsg("✓ Profile updated successfully.");
    } catch (err) {
      setProfErr(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setProfLoad(false);
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    setDelErr("");
    if (!delEmail.trim())
      return setDelErr("Please enter your email to confirm.");
    setDelLoad(true);
    try {
      await api.delete("/settings/account", { data: { email: delEmail } });
      logout();
      navigate("/login");
    } catch (err) {
      setDelErr(
        err.response?.data?.detail ||
          "Deletion failed. Check your email and try again.",
      );
    } finally {
      setDelLoad(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-7 space-y-5 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      {/* Profile section */}
      <Card>
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold text-gray-800">
            Profile Information
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Update your display name and phone number
          </p>
        </div>
        <form onSubmit={saveProfile} className="px-6 pb-6 pt-4">
          <FieldGroup>
            <Field label="Email address">
              <TextInput
                value={email}
                onChange={() => {}}
                disabled
                placeholder="—"
              />
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </Field>
            <Field label="Full name">
              <TextInput
                value={name}
                onChange={setName}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Phone number">
              <TextInput
                value={phone}
                onChange={setPhone}
                placeholder="09xxxxxxxx"
              />
            </Field>
            {profErr && <ErrorMsg msg={profErr} />}
            {profMsg && <p className="text-green-600 text-xs">{profMsg}</p>}
            <div className="pt-1">
              <button
                type="submit"
                disabled={profLoad}
                className="h-10 px-6 bg-[#5E548E] hover:bg-[#5E548E]/70 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {profLoad ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </FieldGroup>
        </form>
      </Card>

      {/* Account info */}
      <Card>
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold text-gray-800">Account</h3>
        </div>
        <div className="px-6 pb-6 pt-0 space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">Logged in as</p>
              <p className="text-xs text-gray-400 mt-0.5">{email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            These actions are permanent and cannot be undone
          </p>
        </div>
        <div className="px-6 pb-6 pt-3">
          {!showDelConfirm ? (
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Delete Account
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => setShowDel(true)}
                className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <form
              onSubmit={deleteAccount}
              className="border border-red-200 rounded-xl p-5 bg-red-50/50 space-y-4"
            >
              <div>
                <p className="text-sm font-bold text-red-700">
                  Confirm account deletion
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This will permanently delete your account, all transactions,
                  accounts, goals, and budgets. Type your email{" "}
                  <span className="font-semibold text-gray-700">{email}</span>{" "}
                  to confirm.
                </p>
              </div>
              <Field label="Your email address">
                <TextInput
                  value={delEmail}
                  onChange={setDelEmail}
                  placeholder={email}
                  type="email"
                />
              </Field>
              <ErrorMsg msg={delErr} />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDel(false);
                    setDelErr("");
                    setDelEmail("");
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={delLoad}
                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {delLoad ? "Deleting…" : "Yes, delete my account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
