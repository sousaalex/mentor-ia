'use client'
import { useState } from 'react';
import { getAuth, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import firebaseConfig from '../../firebaseConfig';
import firebase from 'firebase/compat/app';
import { getDatabase, ref, get } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import '../globals.css';
import Image from 'next/image';
import { errosReset, warningReset, openInfoNotification } from '../../components/Antd/smsReset';
import Logo from '../../../public/images/Logo.png'

// Inicialização do Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app(); // Se já inicializado, use a instância existente
  }
} catch (error) {
  console.error("Erro ao inicializar o Firebase:", error);
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
        warningReset();
        return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const auth = getAuth();

    try {
        // Verifica se o email existe no Realtime Database
        const db = getDatabase();
        const snapshot = await get(ref(db, "users"));

        if (snapshot.exists()) {
            let emailExists = false;
            snapshot.forEach(childSnapshot => {
                if (childSnapshot.val().email === email) {
                    emailExists = true;
                }
            });

            if (!emailExists) {
              errosReset();
                setError("Usuário não encontrado. Verifique o e-mail e tente novamente.");
                setIsLoading(false);
                return;
            }
        } else {
          errosReset();
            setError("Usuário não encontrado. Verifique o e-mail e tente novamente.");
            setIsLoading(false);
            return;
        }
    } catch (error) {
        console.error("Erro ao verificar usuário no banco de dados:", error);
        setError("Erro ao verificar usuário. Tente novamente mais tarde.");
        setIsLoading(false);
        return;
    }

    // Se o e-mail existir no banco de dados, continua com o processo de redefinição de senha
    try {
        await sendPasswordResetEmail(auth, email);
        openInfoNotification('top');
    } catch (error) {
        console.error("Erro ao enviar e-mail de redefinição de senha:", error);
        errosReset();
        setIsLoading(false);
        return;
    } finally {
        // Limpa o estado e redireciona para a página de login, independentemente do resultado
       /*  signOut(auth).then(() => {
            console.log('Usuário deslogado');
        }).catch((error) => {
            console.error('Erro ao deslogar:', error);
        });
        setEmail(''); */
        router.push('/login');
    }
};


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="mx-auto w-full max-w-sm space-y-2 mt-10">
        <div
          className="relative flex w-96 flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md"
        >
          <div
            className="relative mx-4 -mt-6 mb-4 grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 bg-clip-border text-white shadow-lg shadow-cyan-500/40"
          >
            <h3
              className="block font-sans text-3xl font-semibold leading-snug tracking-normal text-white antialiased"
            >
              <div className="flex justify-center items-center mb-4">
                <Image
                  alt="logo"
                  src={Logo}
                  className="rounded-full h-20 w-20"
                />
              </div>
            </h3>
          </div>
          <div className=' flex mx-auto p-2 md:text-xl bg-transparent backdrop-filter backdrop-blur-md  shadow-md rounded-full font-extrabold text-xl'>
          <p className='text-salte-700'>Recuperar senha</p>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div className="relative h-11 w-full min-w-[200px]">
              <input
                id="email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              />
              <Label
                className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
              >
                Email
              </Label>
            </div>
          </div>
          <div className="p-6 pt-0">
            <Button
              data-ripple-light="true"
              onClick={handleResetPassword} disabled={isLoading}
              type="button"
              className="block mt-10 w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
