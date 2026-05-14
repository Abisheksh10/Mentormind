// import React, { useMemo, useState } from "react";
// import PageHeader from "../layout/PageHeader";
// import Modal from "../common/Modal";
// import { Pencil, User, GraduationCap, Link as LinkIcon, IdCard } from "lucide-react";

// export default function Profile({ profile, setProfile }) {
//   const [openEdit, setOpenEdit] = useState(false);

//   const [name, setName] = useState(profile?.studentName || "");
//   const [studentId, setStudentId] = useState(profile?.studentId || "");
//   const [department, setDepartment] = useState(profile?.department || "");
//   const [major, setMajor] = useState(profile?.major || "");
//   const [year, setYear] = useState(profile?.academicYear || "");
//   const [bio, setBio] = useState(profile?.bio || "");
//   const [linkedin, setLinkedin] = useState(profile?.linkedinUrl || "");

//   const shortName = useMemo(() => {
//     const n = (profile?.studentName || "Student").trim();
//     return n.length > 18 ? n.slice(0, 18) + "…" : n;
//   }, [profile?.studentName]);

//   const onOpenEdit = () => {
//     setName(profile?.studentName || "");
//     setStudentId(profile?.studentId || "");
//     setDepartment(profile?.department || "");
//     setMajor(profile?.major || "");
//     setYear(profile?.academicYear || "");
//     setBio(profile?.bio || "");
//     setLinkedin(profile?.linkedinUrl || "");
//     setOpenEdit(true);
//   };

//   const onSave = () => {
//     if (!name.trim()) return alert("Student Name is required");

//     setProfile({
//       ...profile,
//       studentName: name.trim(),
//       studentId: studentId.trim(),
//       department: department.trim(),
//       major: major.trim(),
//       academicYear: year.trim(),
//       bio: bio.trim(),
//       linkedinUrl: linkedin.trim(),
//     });

//     setOpenEdit(false);
//   };

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Profile"
//         subtitle="Manage your personal information and academic details"
//         right={
//           <button onClick={onOpenEdit} className="mm-btn-primary">
//             <Pencil size={18} />
//             Edit Profile
//           </button>
//         }
//       />

//       {/* Cover Section like screenshot */}
//       <div className="mm-card px-0 overflow-hidden">
//         {/* Gradient top */}
//         <div className="h-[170px] w-full bg-[linear-gradient(90deg,rgba(47,107,255,0.55),rgba(109,75,255,0.55))]" />

//         {/* Profile card content */}
//         <div className="px-7 py-6 relative">
//           {/* Avatar */}
//           <div className="absolute -top-10 left-7 w-[82px] h-[82px] rounded-2xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
//             <User size={38} className="text-white/85" />
//           </div>

//           <div className="pt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Main Info */}
//             <div className="lg:col-span-2">
//               <p className="text-2xl font-bold">{profile?.studentName || "Student Name"}</p>
//               <p className="mm-muted mt-2 flex items-center gap-2">
//                 <GraduationCap size={16} className="text-white/60" />
//                 {(profile?.major || "Major")} • {(profile?.academicYear || "Year")}
//               </p>

//               <div className="mt-4 mm-card-deep px-5 py-4">
//                 <p className="text-sm font-semibold">Bio</p>
//                 <p className="text-sm mm-muted mt-2 leading-relaxed">
//                   {profile?.bio || "No bio added yet. Click Edit Profile to add details."}
//                 </p>
//               </div>
//             </div>

//             {/* Side Details */}
//             <div className="space-y-4">
//               <InfoCard
//                 icon={<IdCard size={18} className="text-[var(--mm-blue)]" />}
//                 title="Student ID"
//                 value={profile?.studentId || "Not Provided"}
//               />

//               <InfoCard
//                 icon={<GraduationCap size={18} className="text-[var(--mm-blue)]" />}
//                 title="Department"
//                 value={profile?.department || "Not Provided"}
//               />

//               <InfoCard
//                 icon={<LinkIcon size={18} className="text-[var(--mm-blue)]" />}
//                 title="LinkedIn"
//                 value={profile?.linkedinUrl || "Not Provided"}
//                 isLink={!!profile?.linkedinUrl}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Edit Profile Modal */}
//       <Modal
//         open={openEdit}
//         title="Edit Profile"
//         subtitle="Update your profile to improve personalization and accuracy."
//         onClose={() => setOpenEdit(false)}
//       >
//         <div className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <div>
//               <p className="text-xs mm-muted mb-2">Student Name</p>
//               <input
//                 className="mm-input"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Your name"
//               />
//             </div>

//             <div>
//               <p className="text-xs mm-muted mb-2">Student ID</p>
//               <input
//                 className="mm-input"
//                 value={studentId}
//                 onChange={(e) => setStudentId(e.target.value)}
//                 placeholder="e.g., 21CS1001"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <div>
//               <p className="text-xs mm-muted mb-2">Department</p>
//               <input
//                 className="mm-input"
//                 value={department}
//                 onChange={(e) => setDepartment(e.target.value)}
//                 placeholder="e.g., CSE / IT / AI & DS"
//               />
//             </div>

//             <div>
//               <p className="text-xs mm-muted mb-2">Major</p>
//               <input
//                 className="mm-input"
//                 value={major}
//                 onChange={(e) => setMajor(e.target.value)}
//                 placeholder="e.g., Computer Science"
//               />
//             </div>
//           </div>

//           <div>
//             <p className="text-xs mm-muted mb-2">Academic Year</p>
//             <input
//               className="mm-input"
//               value={year}
//               onChange={(e) => setYear(e.target.value)}
//               placeholder="e.g., Final Year (4th Year)"
//             />
//           </div>

//           <div>
//             <p className="text-xs mm-muted mb-2">Bio</p>
//             <textarea
//               className="mm-input min-h-[100px]"
//               value={bio}
//               onChange={(e) => setBio(e.target.value)}
//               placeholder="Write a short bio..."
//             />
//           </div>

//           <div>
//             <p className="text-xs mm-muted mb-2">LinkedIn URL</p>
//             <input
//               className="mm-input"
//               value={linkedin}
//               onChange={(e) => setLinkedin(e.target.value)}
//               placeholder="https://linkedin.com/in/yourprofile"
//             />
//           </div>

//           <div className="flex justify-end gap-3 pt-2">
//             <button className="mm-btn" onClick={() => setOpenEdit(false)}>
//               Cancel
//             </button>
//             <button className="mm-btn-primary" onClick={onSave}>
//               Save Changes
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }

// function InfoCard({ icon, title, value, isLink = false }) {
//   return (
//     <div className="mm-card-deep px-5 py-4">
//       <div className="flex items-center gap-3">
//         <div className="w-9 h-9 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
//           {icon}
//         </div>
//         <div className="flex-1">
//           <p className="text-sm font-semibold">{title}</p>

//           {isLink ? (
//             <a
//               className="text-sm text-[var(--mm-blue)] hover:underline"
//               href={value}
//               target="_blank"
//               rel="noreferrer"
//             >
//               {value}
//             </a>
//           ) : (
//             <p className="text-sm mm-muted mt-1">{value}</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useMemo, useState } from "react";
import PageHeader from "../layout/PageHeader";
import Modal from "../common/Modal";
import { Pencil, User, GraduationCap, Link as LinkIcon, IdCard } from "lucide-react";
import { useStudentProfile } from "../../hooks/useStudentProfile";

export default function Profile() {
  const { profile, saveProfile, loading, saving } = useStudentProfile();

  const [openEdit, setOpenEdit] = useState(false);

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const shortName = useMemo(() => {
    const n = (profile?.studentName || "Student").trim();
    return n.length > 18 ? n.slice(0, 18) + "…" : n;
  }, [profile?.studentName]);

  const onOpenEdit = () => {
    setName(profile?.studentName || "");
    setStudentId(profile?.studentId || "");
    setDepartment(profile?.department || "");
    setMajor(profile?.major || "");
    setYear(profile?.academicYear || "");
    setBio(profile?.bio || "");
    setLinkedin(profile?.linkedinUrl || "");
    setOpenEdit(true);
  };

  const onSave = async () => {
    if (!name.trim()) return alert("Student Name is required");

    await saveProfile({
      ...profile,
      studentName: name.trim(),
      studentId: studentId.trim(),
      department: department.trim(),
      major: major.trim(),
      academicYear: year.trim(),
      bio: bio.trim(),
      linkedinUrl: linkedin.trim()
    });

    setOpenEdit(false);
  };

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information and academic details"
        right={
          <button onClick={onOpenEdit} className="mm-btn-primary">
            <Pencil size={18} />
            Edit Profile
          </button>
        }
      />

      {/* Cover Section */}
      <div className="mm-card px-0 overflow-hidden">
        {/* Gradient top */}
        <div className="h-[170px] w-full bg-[linear-gradient(90deg,rgba(47,107,255,0.55),rgba(109,75,255,0.55))]" />

        {/* Profile card content */}
        <div className="px-7 py-6 relative">
          {/* Avatar */}
          <div className="absolute -top-10 left-7 w-[82px] h-[82px] rounded-2xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.18)] flex items-center justify-center shadow-[0_20px_70px_rgba(0,0,0,0.55)]">
            <User size={38} className="text-white/85" />
          </div>

          <div className="pt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <p className="text-2xl font-bold">{profile?.studentName || "Student Name"}</p>

              <p className="mm-muted mt-2 flex items-center gap-2">
                <GraduationCap size={16} className="text-white/60" />
                {(profile?.major || "Major")} • {(profile?.academicYear || "Year")}
              </p>

              <div className="mt-4 mm-card-deep px-5 py-4">
                <p className="text-sm font-semibold">Bio</p>
                <p className="text-sm mm-muted mt-2 leading-relaxed">
                  {profile?.bio || "No bio added yet. Click Edit Profile to add details."}
                </p>
              </div>
            </div>

            {/* Side Details */}
            <div className="space-y-4">
              <InfoCard
                icon={<IdCard size={18} className="text-[var(--mm-blue)]" />}
                title="Student ID"
                value={profile?.studentId || "Not Provided"}
              />

              <InfoCard
                icon={<GraduationCap size={18} className="text-[var(--mm-blue)]" />}
                title="Department"
                value={profile?.department || "Not Provided"}
              />

              <InfoCard
                icon={<LinkIcon size={18} className="text-[var(--mm-blue)]" />}
                title="LinkedIn"
                value={profile?.linkedinUrl || "Not Provided"}
                isLink={!!profile?.linkedinUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={openEdit}
        title="Edit Profile"
        subtitle="Update your profile to improve personalization and accuracy."
        onClose={() => setOpenEdit(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs mm-muted mb-2">Student Name</p>
              <input
                className="mm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <p className="text-xs mm-muted mb-2">Student ID</p>
              <input
                className="mm-input"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., 21CS1001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs mm-muted mb-2">Department</p>
              <input
                className="mm-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., CSE / IT / AI & DS"
              />
            </div>

            <div>
              <p className="text-xs mm-muted mb-2">Major</p>
              <input
                className="mm-input"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          <div>
            <p className="text-xs mm-muted mb-2">Academic Year</p>
            <input
              className="mm-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., Final Year (4th Year)"
            />
          </div>

          <div>
            <p className="text-xs mm-muted mb-2">Bio</p>
            <textarea
              className="mm-input min-h-[100px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio..."
            />
          </div>

          <div>
            <p className="text-xs mm-muted mb-2">LinkedIn URL</p>
            <input
              className="mm-input"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="mm-btn" onClick={() => setOpenEdit(false)} disabled={saving}>
              Cancel
            </button>
            <button className="mm-btn-primary" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ icon, title, value, isLink = false }) {
  return (
    <div className="mm-card-deep px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl border border-[var(--mm-border)] bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>

          {isLink ? (
            <a
              className="text-sm text-[var(--mm-blue)] hover:underline"
              href={value}
              target="_blank"
              rel="noreferrer"
            >
              {value}
            </a>
          ) : (
            <p className="text-sm mm-muted mt-1">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
