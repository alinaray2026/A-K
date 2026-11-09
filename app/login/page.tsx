import AuthForm from "../components/AuthForm";
import { login } from "../actions";
import { getDict } from "@/lib/lang";
export default async function Page() { return <AuthForm d={await getDict()} mode="login" action={login} />; }
