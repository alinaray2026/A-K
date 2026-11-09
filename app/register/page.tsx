import AuthForm from "../components/AuthForm";
import { register } from "../actions";
export default function Page() { return <AuthForm mode="register" action={register} />; }
