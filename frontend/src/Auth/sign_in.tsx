import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { authApi, getDashboardPath } from "../services/api";

const SignIn = () => {
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ email: "ravi.kumar@example.com", password: "" }}
      validate={(values) => {
        const errors: Partial<Record<"email" | "password", string>> = {};

        if (!values.email) {
          errors.email = "Required";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
          errors.email = "Invalid email address";
        }

        if (!values.password) {
          errors.password = "Required";
        }

        return errors;
      }}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const session = await authApi.login(values.email, values.password);
          navigate(getDashboardPath(session.user.role), { replace: true });
        } catch (err: any) {
          const backendMessage = err?.response?.data?.message;
          const fallback = err?.message || "Login failed";
          setStatus(backendMessage || fallback || "Invalid login details or backend is not running.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <ShieldCheck size={26} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Visitor Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in as a visitor to see only your own pass requests and QR pass.
              </p>
            </div>

            <Form className="space-y-5">
              {status && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {status}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Visitor email
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  placeholder="visitor@example.com"
                />
                <div className="mt-1 min-h-5">
                  <ErrorMessage name="email" component="div" className="text-sm text-rose-600" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Password
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  placeholder="Enter your password"
                />
                <div className="mt-1 min-h-5">
                  <ErrorMessage name="password" component="div" className="text-sm text-rose-600" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn size={16} />
                {isSubmitting ? "Signing in..." : "Open my dashboard"}
              </button>

              <p className="text-center text-sm text-slate-600">
                New visitor?{" "}
                <a href="/signup" className="font-bold text-sky-700 hover:underline">
                  Create account
                </a>
              </p>
            </Form>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default SignIn;
