import React, { useMemo, useState } from "react";
import PageHeader from "../layout/PageHeader";
import Modal from "../common/Modal";
import { Plus, Award, GraduationCap, CheckCircle } from "lucide-react";
import { computeCumulativeGPA } from "../../utils/academicUtils";
import { useStudentProfile } from "../../hooks/useStudentProfile";

export default function AcademicProgress() {
  const { profile, saveProfile, loading, saving } = useStudentProfile();

  const semesters = profile?.semesterStats || [];
  const certs = profile?.certifications || [];

  const [openSemModal, setOpenSemModal] = useState(false);
  const [openCertModal, setOpenCertModal] = useState(false);

  // Form state - Semester
  const [semTerm, setSemTerm] = useState("");
  const [semGpa, setSemGpa] = useState("");
  const [semCredits, setSemCredits] = useState("");

  // Form state - Certification
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certIssued, setCertIssued] = useState("");
  const [certExpiry, setCertExpiry] = useState("");

  const totalCredits = useMemo(() => {
    return semesters.reduce((sum, s) => sum + Number(s.credits || 0), 0);
  }, [semesters]);

  const gpa = useMemo(() => {
    return computeCumulativeGPA(semesters);
  }, [semesters]);

  const certCount = useMemo(() => certs.length, [certs]);

  const onAddSemester = () => {
    setSemTerm("");
    setSemGpa("");
    setSemCredits("");
    setOpenSemModal(true);
  };

  const onSaveSemester = async () => {
    const term = semTerm.trim();
    const gpaVal = Number(semGpa);
    const credVal = Number(semCredits);

    if (!term) return alert("Please enter Term (e.g., Semester 1)");
    if (Number.isNaN(gpaVal) || gpaVal < 0 || gpaVal > 10)
      return alert("GPA should be between 0 and 10");
    if (Number.isNaN(credVal) || credVal <= 0)
      return alert("Credits must be a positive number");

    const newSem = {
      id: `sem_${Date.now()}`,
      term,
      gpa: gpaVal,
      credits: credVal,
      status: "Completed"
    };

    const updatedSemesters = [...semesters, newSem];

    await saveProfile({
      ...profile,
      semesterStats: updatedSemesters,
      creditsEarned: updatedSemesters.reduce((s, x) => s + Number(x.credits || 0), 0),
      gpa: computeCumulativeGPA(updatedSemesters)
    });

    setOpenSemModal(false);
  };

  const onAddCertification = () => {
    setCertName("");
    setCertIssuer("");
    setCertIssued("");
    setCertExpiry("");
    setOpenCertModal(true);
  };

  const onSaveCertification = async () => {
    const name = certName.trim();
    const issuer = certIssuer.trim();
    const issued = certIssued.trim();

    if (!name) return alert("Enter certification name");
    if (!issuer) return alert("Enter issuer");
    if (!issued) return alert("Select issue date");

    const newCert = {
      id: `cert_${Date.now()}`,
      name,
      issuer,
      dateIssued: issued,
      expiryDate: certExpiry ? certExpiry : null
    };

    await saveProfile({
      ...profile,
      certifications: [newCert, ...certs]
    });

    setOpenCertModal(false);
  };

  if (loading && !profile) {
    return (
      <div className="mm-card px-6 py-5">
        <p className="mm-muted">Loading academic progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Progress"
        subtitle="Track your courses, grades, and professional certifications"
        right={
          <>
            <button onClick={onAddSemester} className="mm-btn" disabled={saving}>
              <Plus size={18} />
              Add Semester
            </button>

            <button onClick={onAddCertification} className="mm-btn-primary" disabled={saving}>
              <Award size={18} />
              Add Certification
            </button>
          </>
        }
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Cumulative GPA" value={gpa.toFixed(2)} subtitle="Out of 10.0" />
        <StatCard title="Total Credits" value={totalCredits} subtitle="Credit hours completed" />
        <StatCard title="Certifications" value={certCount} subtitle="Professional credentials" />
      </div>

      {/* Semester Performance Table */}
      <div className="mm-card px-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)]">
          <p className="text-lg font-semibold">Semester Performance</p>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-4 text-sm mm-muted py-3 border-b border-[var(--mm-border)]">
            <div>Term</div>
            <div>GPA</div>
            <div>Credits</div>
            <div>Status</div>
          </div>

          {semesters.length === 0 ? (
            <div className="py-10 text-center mm-muted">
              No semester data yet. Add a semester to track overall progress.
            </div>
          ) : (
            <div className="divide-y divide-[var(--mm-border)]">
              {semesters.map((s) => (
                <div key={s.id} className="grid grid-cols-4 py-4 items-center">
                  <div className="font-semibold">{s.term}</div>
                  <div className="mm-muted">{Number(s.gpa).toFixed(2)}</div>
                  <div className="mm-muted">{s.credits}</div>

                  <div className="flex items-center justify-end">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.25)] inline-flex items-center gap-2">
                      <CheckCircle size={14} />
                      {s.status || "Completed"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certifications Table */}
      <div className="mm-card px-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--mm-border)] bg-[rgba(255,255,255,0.03)] flex items-center gap-3">
          <Award className="text-[var(--mm-blue)]" size={18} />
          <p className="text-lg font-semibold">Professional Certifications</p>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-4 text-sm mm-muted py-3 border-b border-[var(--mm-border)]">
            <div>Certification Name</div>
            <div>Issuer</div>
            <div>Date Issued</div>
            <div>Status</div>
          </div>

          {certs.length === 0 ? (
            <div className="py-10 text-center mm-muted">No certifications tracked yet.</div>
          ) : (
            <div className="divide-y divide-[var(--mm-border)]">
              {certs.map((c) => (
                <div key={c.id} className="grid grid-cols-4 py-4 items-center">
                  <div className="font-semibold">{c.name}</div>

                  <div className="mm-muted flex items-center gap-2">
                    <GraduationCap size={16} className="text-[rgba(234,240,255,0.5)]" />
                    {c.issuer}
                  </div>

                  <div className="mm-muted">{c.dateIssued}</div>

                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.25)]">
                      Active
                    </span>
                    {c.expiryDate ? (
                      <span className="text-xs mm-muted mt-1">Expires: {c.expiryDate}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Add Semester Modal */}
      <Modal
        open={openSemModal}
        title="Add Semester"
        subtitle="Enter term, GPA and credits. This updates your GPA & progress."
        onClose={() => setOpenSemModal(false)}
      >
        <div className="space-y-3">
          <input
            className="mm-input"
            placeholder="Term (e.g., Semester 1 / 2025 - Fall)"
            value={semTerm}
            onChange={(e) => setSemTerm(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="mm-input"
              placeholder="GPA (0 - 10)"
              value={semGpa}
              onChange={(e) => setSemGpa(e.target.value)}
            />
            <input
              className="mm-input"
              placeholder="Credits"
              value={semCredits}
              onChange={(e) => setSemCredits(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="mm-btn" onClick={() => setOpenSemModal(false)} disabled={saving}>
              Cancel
            </button>
            <button className="mm-btn-primary" onClick={onSaveSemester} disabled={saving}>
              {saving ? "Saving..." : "Save Semester"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ✅ Add Certification Modal */}
      <Modal
        open={openCertModal}
        title="Add Certification"
        subtitle="Add a professional credential to your profile."
        onClose={() => setOpenCertModal(false)}
      >
        <div className="space-y-3">
          <input
            className="mm-input"
            placeholder="Certification Name"
            value={certName}
            onChange={(e) => setCertName(e.target.value)}
          />

          <input
            className="mm-input"
            placeholder="Issuer (e.g., AWS, Cisco, Coursera)"
            value={certIssuer}
            onChange={(e) => setCertIssuer(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs mm-muted mb-2">Date Issued</p>
              <input
                type="date"
                className="mm-input"
                value={certIssued}
                onChange={(e) => setCertIssued(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs mm-muted mb-2">Expiry Date (optional)</p>
              <input
                type="date"
                className="mm-input"
                value={certExpiry}
                onChange={(e) => setCertExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="mm-btn" onClick={() => setOpenCertModal(false)} disabled={saving}>
              Cancel
            </button>
            <button className="mm-btn-primary" onClick={onSaveCertification} disabled={saving}>
              {saving ? "Saving..." : "Save Certification"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="mm-card px-6 py-5">
      <p className="text-sm mm-muted">{title}</p>
      <p className="text-[34px] font-bold mt-2">{value}</p>
      <p className="text-sm mm-muted mt-2">{subtitle}</p>
    </div>
  );
}
