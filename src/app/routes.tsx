import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientRegistrationPage } from "./pages/PatientRegistrationPage";
import { PatientListPage } from "./pages/PatientListPage";
import { PatientDetailPage } from "./pages/PatientDetailPage";
import { ClinicInfoPage } from "./pages/ClinicInfoPage";
import { RecoveryGuidePage } from "./pages/RecoveryGuidePage";
import { MedicationListPage } from "./pages/MedicationListPage";
import { ProcedureListPage } from "./pages/ProcedureListPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "patients", Component: PatientListPage },
      { path: "patients/:id", Component: PatientDetailPage },
      { path: "register", Component: PatientRegistrationPage },
      { path: "clinic-info", Component: ClinicInfoPage },
      { path: "recovery-guide", Component: RecoveryGuidePage },
      { path: "medications", Component: MedicationListPage },
      { path: "procedure-types", Component: ProcedureListPage },
    ],
  },
]);
