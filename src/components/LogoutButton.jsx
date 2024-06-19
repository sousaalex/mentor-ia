// components/LogoutButton.jsx
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { useRouter } from 'next/router';

const LogoutButton = ({ onLogout }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout(); // Chamando a função de logout passada como prop
      router.push("/"); // Redirecionando para a página de login
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogout}
      className="w-full bg-transparent shadow-md shadow-black  font-bold border border-slate-300 text-slate-800 hover:bg-gray-100 p-2 gap-2 focus:outline-none focus:ring focus:border-blue-300 transform transition-transform duration-300 hover:scale-105"
    >
      Logout
    </Button>
  );
};

export default LogoutButton;
