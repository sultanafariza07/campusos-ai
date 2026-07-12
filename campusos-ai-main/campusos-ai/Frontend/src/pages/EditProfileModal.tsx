import { useState, useEffect } from "react";
import {
  HiOutlineX,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlinePhotograph,
} from "react-icons/hi";

interface UserProfileData {
  name: string;
  branch: string;
  year: string;
  avatar: string | null;
}

interface EditProfileModalProps {
  initialData: UserProfileData;
  onSave: (updatedData: UserProfileData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

const BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export default function EditProfileModal({
  initialData,
  onSave,
  onCancel,
  loading,
  error,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<UserProfileData>(initialData);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For simplicity, let's assume direct URL input for now.
    // A real implementation would involve file upload to a storage service.
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file); // Or upload to a service and get URL
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.branch || formData.branch === "Not set")
      errors.branch = "Branch is required.";
    if (!formData.year || formData.year === "Not set")
      errors.year = "Year is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave(formData);
  };

  const inputCls = (hasError: boolean): string =>
    `w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#3B4558] outline-none transition-colors focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 ${
      hasError ? "border-red-500/60" : "border-white/10"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#16161F] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-white">Edit Profile</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#64748B] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] rounded-full"
            aria-label="Close"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#6C63FF]/40">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {formData.name ? formData.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "S"}
                  </span>
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                title="Change avatar"
              >
                <HiOutlinePhotograph className="w-6 h-6 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-[#64748B]">Click to change avatar</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={inputCls(!!formErrors.name)}
              />
              <HiOutlineUser className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            </div>
            {formErrors.name && (
              <p className="mt-1.5 text-xs text-red-400">{formErrors.name}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label htmlFor="branch" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Branch
            </label>
            <div className="relative">
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={
                  inputCls(!!formErrors.branch) +
                  " appearance-none pr-9 cursor-pointer" +
                  (!formData.branch || formData.branch === "Not set" ? " text-[#3B4558]" : "")
                }
              >
                <option value="Not set" disabled hidden>
                  Select your branch
                </option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <HiOutlineAcademicCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            </div>
            {formErrors.branch && (
              <p className="mt-1.5 text-xs text-red-400">{formErrors.branch}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="mb-1.5 block text-xs font-medium text-[#94A3B8]">
              Year
            </label>
            <div className="relative">
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className={
                  inputCls(!!formErrors.year) +
                  " appearance-none pr-9 cursor-pointer" +
                  (!formData.year || formData.year === "Not set" ? " text-[#3B4558]" : "")
                }
              >
                <option value="Not set" disabled hidden>
                  Select your year
                </option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <HiOutlineCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            </div>
            {formErrors.year && (
              <p className="mt-1.5 text-xs text-red-400">{formErrors.year}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2">
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-[#6C63FF] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C63FF]/20 transition-all hover:bg-[#7C6FFF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}