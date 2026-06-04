import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { authApi, getDashboardPath } from "../services/api";

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{ name: "", email: "", password: "", confirmPassword: "" }}
      validate={(values) => {
        const errors: Partial<Record<"name" | "email" | "password" | "confirmPassword", string>> = {};

        if (!values.name) {
          errors.name = "Required";
        }

        if (!values.email) {
          errors.email = "Required";
        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
          errors.email = "Invalid email address";
        }

        if (!values.password) {
          errors.password = "Required";
        } else if (values.password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }

        if (!values.confirmPassword) {
          errors.confirmPassword = "Required";
        } else if (values.password !== values.confirmPassword) {
          errors.confirmPassword = "Passwords must match";
        }

        return errors;
      }}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const session = await authApi.register({
            name: values.name,
            email: values.email,
            password: values.password,
          });
          navigate(getDashboardPath(session.user.role), { replace: true });
        } catch (error: any) {
          const backendMessage =
            error?.response?.data?.message ||
            error?.response?.data?.errors?.fieldErrors?.password?.[0] ||
            error?.response?.data?.errors?.fieldErrors?.email?.[0];
          setStatus(backendMessage || "Could not create the visitor account. Check the backend and try again.");
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
                <UserPlus size={26} />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">Create Visitor Account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your dashboard will only display passes linked to this visitor account.
              </p>
            </div>

            <Form className="space-y-4">
              {status && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {status}
                </div>
              )}

              {[
                { label: "Full name", name: "name", type: "text", placeholder: "Enter your name" },
                { label: "Email", name: "email", type: "email", placeholder: "visitor@example.com" },
                { label: "Password", name: "password", type: "password", placeholder: "Create password" },
                { label: "Confirm password", name: "confirmPassword", type: "password", placeholder: "Confirm password" },
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                    {field.label}
                  </label>
                  <Field
                    type={field.type}
                    name={field.name}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    placeholder={field.placeholder}
                  />
                  <div className="mt-1 min-h-5">
                    <ErrorMessage name={field.name} component="div" className="text-sm text-rose-600" />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus size={16} />
                {isSubmitting ? "Creating..." : "Create and open dashboard"}
              </button>

              <p className="text-center text-sm text-slate-600">
                Already registered?{" "}
                <a href="/signin" className="font-bold text-sky-700 hover:underline">
                  Login
                </a>
              </p>
            </Form>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default SignUp;
