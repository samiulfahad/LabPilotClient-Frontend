// React Compiler active — no useCallback/useMemo
import PatientList from "./PatientList";

export const AdmittedPatients = () => (
  <PatientList
    status="admitted"
    title="Admitted Patients"
    subtitle="Currently in-ward"
  />
);

export const ReleasedPatients = () => (
  <PatientList
    status="released"
    title="Released Patients"
    subtitle="Discharged records"
  />
);