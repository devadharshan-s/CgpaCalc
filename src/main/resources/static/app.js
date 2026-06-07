(function () {
  const h = React.createElement;
  const useEffect = React.useEffect;
  const useMemo = React.useMemo;
  const useState = React.useState;

  const STORAGE_KEY = "cgpa-calc-active-user-id";

  function readStoredUserId() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  function saveStoredUserId(userId) {
    if (userId) {
      localStorage.setItem(STORAGE_KEY, String(userId));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        (payload && payload.message) ||
        (payload && payload.error) ||
        (typeof payload === "string" && payload.trim()) ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return payload;
  }

  function formatJson(value) {
    if (value === null || value === undefined) {
      return "No response yet";
    }
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  function App() {
    const [currentUserId, setCurrentUserId] = useState(readStoredUserId);
    const [busy, setBusy] = useState(false);
    const [response, setResponse] = useState({
      tone: "info",
      title: "Ready",
      message: "Create a user or enter an existing user id to start.",
      data: null,
    });

    const [userForm, setUserForm] = useState({
      userName: "",
      email: "",
    });

    const [semesterForm, setSemesterForm] = useState({
      semester: "",
      sgpa: "",
      credits: "",
    });

    const [updateForm, setUpdateForm] = useState({
      semester: "",
      sgpa: "",
      credits: "",
    });

    const [deleteSemesterId, setDeleteSemesterId] = useState("");
    const [profileId, setProfileId] = useState(readStoredUserId);
    const [targetForm, setTargetForm] = useState({
      targetCgpa: "",
      remainingCredits: "",
    });

    useEffect(() => {
      saveStoredUserId(currentUserId);
      setProfileId((value) => value || currentUserId);
    }, [currentUserId]);

    const responseClass = response.tone === "danger"
      ? "danger"
      : response.tone === "warning"
      ? "warning"
      : "";

    const parsedResponse = useMemo(() => response.data, [response.data]);

    async function runAction(title, fn) {
      setBusy(true);
      try {
        const data = await fn();
        setResponse({
          tone: "success",
          title,
          message: "Request completed successfully.",
          data,
        });
      } catch (error) {
        setResponse({
          tone: "danger",
          title: `${title} failed`,
          message: error.message || "Something went wrong.",
          data: null,
        });
      } finally {
        setBusy(false);
      }
    }

    async function createUser(event) {
      event.preventDefault();
      await runAction("User created", async () => {
        const data = await requestJson("/createUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: userForm.userName.trim(),
            email: userForm.email.trim(),
          }),
        });

        if (data && data.id) {
          setCurrentUserId(String(data.id));
          setProfileId(String(data.id));
        }

        return data;
      });
    }

    async function addSemester(event) {
      event.preventDefault();
      await runAction("Semester saved", async () => {
        if (!currentUserId) {
          throw new Error("Set an active user id first.");
        }

        return requestJson(`/users/${currentUserId}/semester`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            semester: Number(semesterForm.semester),
            sgpa: Number(semesterForm.sgpa),
            credits: Number(semesterForm.credits),
          }),
        });
      });
    }

    async function updateSemester(event) {
      event.preventDefault();
      await runAction("Semester updated", async () => {
        if (!currentUserId) {
          throw new Error("Set an active user id first.");
        }

        return requestJson(`/users/${currentUserId}/updateSemester`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            semester: Number(updateForm.semester),
            sgpa: Number(updateForm.sgpa),
            credits: Number(updateForm.credits),
          }),
        });
      });
    }

    async function deleteSemester(event) {
      event.preventDefault();
      await runAction("Semester deleted", async () => {
        if (!currentUserId) {
          throw new Error("Set an active user id first.");
        }

        return requestJson(`/users/${currentUserId}/deleteSemester`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Number(deleteSemesterId)),
        });
      });
    }

    async function loadProfile(event) {
      event.preventDefault();
      await runAction("Profile loaded", async () => {
        if (!profileId) {
          throw new Error("Enter a profile user id.");
        }

        return requestJson(`/users/${profileId}/cgpa`);
      });
    }

    async function calculateTargetCgpa(event) {
      event.preventDefault();
      await runAction("Target CGPA calculated", async () => {
        if (!profileId) {
          throw new Error("Enter a profile user id.");
        }

        const params = new URLSearchParams({
          targetCgpa: String(Number(targetForm.targetCgpa)),
          remainingCredits: String(Number(targetForm.remainingCredits)),
        });

        return requestJson(`/users/${profileId}/targetCgpa?${params.toString()}`);
      });
    }

    const currentCgpa = parsedResponse && typeof parsedResponse.cgpa === "number"
      ? parsedResponse.cgpa.toFixed(2)
      : null;

    const semesters = Array.isArray(parsedResponse && parsedResponse.semesters)
      ? parsedResponse.semesters
      : [];

    const targetSummary =
      parsedResponse &&
      Object.prototype.hasOwnProperty.call(parsedResponse, "requiredSgpa") &&
      Object.prototype.hasOwnProperty.call(parsedResponse, "possible")
        ? parsedResponse
        : null;

    return h("div", { className: "app-shell" }, [
      h("section", { className: "hero", key: "hero" }, [
        h("div", { className: "hero-panel", key: "headline" }, [
          h("div", { className: "eyebrow", key: "eyebrow" }, "CGPA calculator"),
          h("h1", { key: "title" }, "A glossy, lightweight dashboard for your college project."),
          h(
            "p",
            { key: "desc" },
            "Create users, add semester performance, view CGPA, and calculate the SGPA needed to hit a target. The UI stays in one file set and runs from Spring Boot static resources."
          ),
          h("div", { className: "chip-row", key: "chips" }, [
            h("span", { className: "chip", key: "c1" }, "React UI"),
            h("span", { className: "chip", key: "c2" }, "No build step"),
            h("span", { className: "chip", key: "c3" }, "Same-origin API"),
            h("span", { className: "chip", key: "c4" }, "Glassmorphism"),
          ]),
        ]),
        h("div", { className: "hero-stats", key: "stats" }, [
          h("div", { className: "glass-card stat-card", key: "s1" }, [
            h("div", { className: "stat-value" }, currentUserId || "0"),
            h("div", { className: "stat-label" }, "Active user id stored locally for quick reuse."),
          ]),
          h("div", { className: "glass-card stat-card", key: "s2" }, [
            h("div", { className: "stat-value" }, semesters.length ? String(semesters.length) : "0"),
            h("div", { className: "stat-label" }, "Semesters shown when you load a profile."),
          ]),
          h("div", { className: "glass-card stat-card", key: "s3" }, [
            h("div", { className: "stat-value" }, currentCgpa || "--"),
            h("div", { className: "stat-label" }, "Current CGPA from the active profile response."),
          ]),
        ]),
      ]),

      h("div", { className: "actions-grid", key: "grid" }, [
        h("section", { className: "glass-card span-6", key: "create" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Create user"),
            h("span", null, "Returns the generated id"),
          ]),
          h("form", { onSubmit: createUser }, [
            h("div", { className: "form-grid" }, [
              h("div", { className: "field full" }, [
                h("label", null, "Name"),
                h("input", {
                  value: userForm.userName,
                  onChange: (event) => setUserForm((current) => ({ ...current, userName: event.target.value })),
                  placeholder: "Enter student name",
                }),
              ]),
              h("div", { className: "field full" }, [
                h("label", null, "Email"),
                h("input", {
                  type: "email",
                  value: userForm.email,
                  onChange: (event) => setUserForm((current) => ({ ...current, email: event.target.value })),
                  placeholder: "student@example.com",
                }),
              ]),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn", type: "submit", disabled: busy }, busy ? "Working..." : "Create user"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-6", key: "profile" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Active user"),
            h("span", null, "Used for semester actions"),
          ]),
          h("div", { className: "form-grid" }, [
            h("div", { className: "field full" }, [
              h("label", null, "Current user id"),
              h("input", {
                value: currentUserId,
                onChange: (event) => setCurrentUserId(event.target.value.replace(/[^\d]/g, "")),
                placeholder: "Paste or create an id",
              }),
            ]),
            h("div", { className: "field full" }, [
              h("label", null, "Profile lookup id"),
              h("input", {
                value: profileId,
                onChange: (event) => setProfileId(event.target.value.replace(/[^\d]/g, "")),
                placeholder: "Load CGPA for a user id",
              }),
            ]),
          ]),
          h("div", { className: "button-row" }, [
            h("button", {
              className: "btn secondary",
              onClick: () => {
                setProfileId(currentUserId);
              },
              type: "button",
            }, "Use active id"),
          ]),
        ]),

        h("section", { className: "glass-card span-4", key: "add-semester" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Add semester"),
            h("span", null, "POST /users/{id}/semester"),
          ]),
          h("form", { onSubmit: addSemester }, [
            h("div", { className: "form-grid" }, [
              h("div", { className: "field" }, [
                h("label", null, "Semester"),
                h("input", {
                  type: "number",
                  min: "1",
                  value: semesterForm.semester,
                  onChange: (event) => setSemesterForm((current) => ({ ...current, semester: event.target.value })),
                }),
              ]),
              h("div", { className: "field" }, [
                h("label", null, "SGPA"),
                h("input", {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "10",
                  value: semesterForm.sgpa,
                  onChange: (event) => setSemesterForm((current) => ({ ...current, sgpa: event.target.value })),
                }),
              ]),
              h("div", { className: "field full" }, [
                h("label", null, "Credits"),
                h("input", {
                  type: "number",
                  min: "1",
                  value: semesterForm.credits,
                  onChange: (event) => setSemesterForm((current) => ({ ...current, credits: event.target.value })),
                }),
              ]),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn", type: "submit", disabled: busy || !currentUserId }, "Save semester"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-4", key: "update-semester" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Update semester"),
            h("span", null, "PATCH endpoint"),
          ]),
          h("form", { onSubmit: updateSemester }, [
            h("div", { className: "form-grid" }, [
              h("div", { className: "field" }, [
                h("label", null, "Semester"),
                h("input", {
                  type: "number",
                  min: "1",
                  value: updateForm.semester,
                  onChange: (event) => setUpdateForm((current) => ({ ...current, semester: event.target.value })),
                }),
              ]),
              h("div", { className: "field" }, [
                h("label", null, "SGPA"),
                h("input", {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "10",
                  value: updateForm.sgpa,
                  onChange: (event) => setUpdateForm((current) => ({ ...current, sgpa: event.target.value })),
                }),
              ]),
              h("div", { className: "field full" }, [
                h("label", null, "Credits"),
                h("input", {
                  type: "number",
                  min: "1",
                  value: updateForm.credits,
                  onChange: (event) => setUpdateForm((current) => ({ ...current, credits: event.target.value })),
                }),
              ]),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn secondary", type: "submit", disabled: busy || !currentUserId }, "Update semester"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-4", key: "delete-semester" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Delete semester"),
            h("span", null, "Sends raw semester id"),
          ]),
          h("form", { onSubmit: deleteSemester }, [
            h("div", { className: "field full" }, [
              h("label", null, "Semester record id"),
              h("input", {
                type: "number",
                min: "1",
                value: deleteSemesterId,
                onChange: (event) => setDeleteSemesterId(event.target.value),
                placeholder: "Internal semester row id",
              }),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn danger", type: "submit", disabled: busy || !currentUserId }, "Delete"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-6", key: "target" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Target CGPA"),
            h("span", null, "GET /users/{id}/targetCgpa"),
          ]),
          h("form", { onSubmit: calculateTargetCgpa }, [
            h("div", { className: "form-grid" }, [
              h("div", { className: "field" }, [
                h("label", null, "Target CGPA"),
                h("input", {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "10",
                  value: targetForm.targetCgpa,
                  onChange: (event) => setTargetForm((current) => ({ ...current, targetCgpa: event.target.value })),
                }),
              ]),
              h("div", { className: "field" }, [
                h("label", null, "Remaining credits"),
                h("input", {
                  type: "number",
                  min: "1",
                  value: targetForm.remainingCredits,
                  onChange: (event) => setTargetForm((current) => ({ ...current, remainingCredits: event.target.value })),
                }),
              ]),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn", type: "submit", disabled: busy || !profileId }, "Calculate"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-6", key: "profile-data" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, "Profile view"),
            h("span", null, "Loads CGPA and semesters"),
          ]),
          h("form", { onSubmit: loadProfile }, [
            h("div", { className: "field full" }, [
              h("label", null, "Profile user id"),
              h("input", {
                value: profileId,
                onChange: (event) => setProfileId(event.target.value.replace(/[^\d]/g, "")),
                placeholder: "Enter a user id to inspect",
              }),
            ]),
            h("div", { className: "button-row" }, [
              h("button", { className: "btn secondary", type: "submit", disabled: busy || !profileId }, "Load profile"),
            ]),
          ]),
        ]),

        h("section", { className: "glass-card span-12", key: "response" }, [
          h("div", { className: "card-title" }, [
            h("h2", null, response.title),
            h("span", null, response.message),
          ]),
          h("div", { className: "status-banner" }, [
            h("div", { className: `status-dot ${responseClass}` }),
            h("div", null, [
              h("p", { className: "status-title" }, busy ? "Processing request..." : "Latest API result"),
              h("p", { className: "status-message" }, response.message),
              h("pre", { className: "code-block" }, formatJson(response.data)),
            ]),
          ]),

          targetSummary
            ? h("div", { className: "profile-grid", style: { marginTop: "16px" } }, [
                h("div", { className: "mini-metric", key: "m1" }, [
                  h("div", { className: "label" }, "Required SGPA"),
                  h("div", { className: "value" }, String(targetSummary.requiredSgpa.toFixed ? targetSummary.requiredSgpa.toFixed(2) : targetSummary.requiredSgpa)),
                ]),
                h("div", { className: "mini-metric", key: "m2" }, [
                  h("div", { className: "label" }, "Possible"),
                  h("div", { className: "value" }, targetSummary.possible ? "Yes" : "No"),
                ]),
                h("div", { className: "mini-metric", key: "m3" }, [
                  h("div", { className: "label" }, "Current user"),
                  h("div", { className: "value" }, profileId || "--"),
                ]),
              ])
            : null,

          semesters.length
            ? h("div", { style: { marginTop: "16px" } }, [
                h("div", { className: "card-title" }, [
                  h("h2", null, "Semester list"),
                  h("span", null, `Loaded ${semesters.length} semesters`),
                ]),
                h(
                  "div",
                  { className: "semester-list" },
                  semesters.map((semester, index) =>
                    h("div", { className: "semester-row", key: `${semester.semester}-${index}` }, [
                      h("div", null, [
                        h("strong", null, `Semester ${semester.semester}`),
                        h("span", null, "Weighted entry from the profile endpoint"),
                      ]),
                      h("div", null, [
                        h("strong", null, `SGPA ${semester.sgpa}`),
                        h("span", null, "Grade point average"),
                      ]),
                      h("div", null, [
                        h("strong", null, `${semester.credits} credits`),
                        h("span", null, "Credit weight"),
                      ]),
                    ])
                  )
                ),
              ])
            : null,
        ]),
      ]),

      h("div", { className: "footer-note", key: "footer" }, [
        "This interface is intentionally kept single-file and same-origin so the Spring Boot backend can serve it directly without an extra frontend toolchain.",
      ]),
    ]);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
