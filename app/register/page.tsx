import AuthForm from "../components/AuthForm";
import { register } from "../actions";
import { getDict } from "@/lib/lang";
export default async function Page() { return <AuthForm d={await getDict()} mode="register" action={register} />; }
