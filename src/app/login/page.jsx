'use client'
import { useEffect, useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import 'firebase/storage'; // Importa o módulo de armazenamento do Firebase
import { getDatabase, ref, child, get } from 'firebase/database'; // Importe as funções necessárias do Firebase Realtime Database
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import Image from 'next/image';
import Logo from '../../../public/images/Logo.png';
import Link from 'next/link';
import '../globals.css';
import { successo, warning, erroslogin, campos, mail, erro404, pass, camposemailesenha } from '../../components/Antd/smslogin';

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

const db = firebase.database();
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createpassword, setCreatepassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [visible, setVisible] = useState(true);

  const handleClick = () => {
    setVisible(false);
  };

  const handleCreateUserWithEmailVerification = async (e) => {
    setIsLoading(true);
    e.preventDefault();

    if (!email || !createpassword) {
      camposemailesenha();
      setIsLoading(false);
      return;
    }

    if (createpassword.length < 6) {
      pass();
      setIsLoading(false);
      return;
    }

    try {
      // Verifica se o email existe usando a API
      const response = await fetch(`https://verefication-login-ms.vercel.app/userData/${email}`);

      // Verifica se a resposta da requisição é bem-sucedida (status 200)
      if (response.ok) {
        const data = await response.json();
        if (data.status === 200) {
          const auth = getAuth();
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, createpassword);
            successo();
            localStorage.setItem('mailUser', email);
            router.push('/curso');
          } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
              setError("Email já está em uso. Tente outro email.");
              warning();
            } else {
              console.error('Erro ao criar usuário:', error);
              setError(error.message);
            }
          }
        } else if (data.status === 400) {
          mail();
        } else if (data.status === 404) {
          erro404();
        } else {
          throw new Error('Erro ao verificar email: status inesperado recebido da API.');
        }
      } else {
        throw new Error(`Erro ao verificar email: ${response.status} - ${response.statusText}`);
      }

    } catch (error) {
      console.error('Erro ao processar requisição:', error.message);
      setError(error.message);
    } finally {
      // Finaliza o isLoading
      setIsLoading(false);
    }
  };

  const handleEnter = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      camposemailesenha()
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // Verifica se o email existe no Realtime Database
      const dbRef = ref(firebase.database());
      const snapshot = await get(child(dbRef, `users`));

      if (snapshot.exists()) {
        let emailExists = false;
        snapshot.forEach(childSnapshot => {
          if (childSnapshot.val().email === email) {
            emailExists = true;
          }
        });

        if (!emailExists) {
          setError("Usuário não encontrado. Verifique o e-mail e tente novamente.");
          erroslogin();
          setIsLoading(false);
          return;
        }
      } else {
        erroslogin();
        setError("Usuário não encontrado. Verifique o e-mail e tente novamente.");
        setIsLoading(false);
        return;
      }

      // Tenta fazer login com o Firebase Authentication
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        successo();
        localStorage.setItem('mailUser', userCredential.user.email);
        router.push('/curso');
      } catch (error) {
        if (error.code === 'auth/invalid-credential') {
          setError("Senha incorreta. Tente novamente.");
          warning();
        } else {
          erroslogin();
          console.error('Erro ao fazer login:', error);
          setError(error.message);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar usuário no banco de dados:", error);
      setError("Erro ao verificar usuário. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };



  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email) {
      campos()
      return;
    }


    const emailLowerCase = email.toLowerCase();
    setError(null);
    setIsLoading(true);

    try {
      // Verifica se o email existe no Realtime Database na rota 'users'
      const dbRef = firebase.database().ref('users');
      const snapshot = await dbRef.orderByChild('email').equalTo(emailLowerCase).once('value');

      if (!snapshot.exists()) {
        setError("Usuário não encontrado. Verifique o e-mail e tente novamente.");
        erroslogin()
        setIsLoading(false);
        return;
      }

      let foundUser = null;
      snapshot.forEach(childSnapshot => {
        foundUser = childSnapshot.val();
      });

      if (!foundUser || foundUser.login === undefined) {
        console.log('Campo login não definido corretamente.');
        return;
      }

      setLoginStatus(foundUser.login);
      setVisible(false);


      if (foundUser.login === 'false') {
        const userKey = Object.keys(snapshot.val())[0]; // Obtém a chave do usuário no banco de dados
        await dbRef.child(userKey).update({ login: 'true' });
      } else if (foundUser.login === 'true') {
      }

    } catch (error) {
      console.error("Erro ao verificar usuário no banco de dados:", error);
      setError("Erro ao verificar usuário. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (loginStatus === 'false') {

      return (

        <div className="relative w-full min-w-[200px]">
          <div className="flex justify-end mb-2 ">

          </div>
          <input
            id="createpassword"
            required
            type="password"
            value={createpassword}
            onChange={(e) => setCreatepassword(e.target.value)}
            placeholder=""
            className="peer mt-0 h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
          />
          <label
            className="before:content[' '] after:content[' '] sm:mt-2 mt-0 pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
          >
            Criar Senha
          </label>

          <div className="p-6 w-full pt-0">
            <Button
              data-ripple-light="true"
              type="button"
              onClick={handleCreateUserWithEmailVerification} disabled={isLoading}
              className="block mt-10 w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? <Spin size="small" /> : 'Criar Senha'}
            </Button>
            <p
              className="mt-6 flex justify-center font-sans text-sm font-light leading-normal text-inherit antialiased"
            >
              Já verificaste?
              <Link
                className="ml-1 block font-sans text-sm font-bold leading-normal text-cyan-500 antialiased"
                href='/home#login'
              >
                Verificar
              </Link>
            </p>
          </div>
        </div>


      );

    } else if (loginStatus === 'true') {
      return (

        <div className="relative  w-full min-w-[200px]">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleNewPass}
              className="text-sm font-medium underline bg-transparent text-cyan-600 hover:bg-transparent underline-offset-2 hover:text-blue-400"
            >
              Esqueceu sua senha?
            </button>
          </div>
          <input
            id="password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
            className="peer mt-0 h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
          />
          <label
            className="before:content[' '] after:content[' '] mt-7 pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
          >
            Senha
          </label>
          <div className="p-6 pt-0">
            <Button
              data-ripple-light="true"
              type="button"
              onClick={handleEnter} disabled={isLoading}
              className="block mt-10 w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? <Spin size="small" /> : 'Entrar'}
            </Button>
            <p
              className="mt-6 flex justify-center font-sans text-sm font-light leading-normal text-inherit antialiased"
            >
              Já verificaste?

              <Link
                className="ml-1 block font-sans text-sm font-bold leading-normal text-cyan-500 antialiased"
                href='/home#login'
              >
                Verificar
              </Link>
            </p>
          </div>
        </div>


      );
    } else {
      return null;
    }
  };

  const getUserByEmail = async (auth, email) => {
    try {
      const userRecord = await getUser(auth, email);
      return userRecord ? userRecord.toJSON() : null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  };


  const handleNewPass = () => {
    router.push('/resetar-senha')
  }
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
          <div className="flex flex-col gap-4 p-6">

            <div className=' flex mx-auto p-2 md:text-xl bg-transparent backdrop-filter backdrop-blur-md  shadow-md rounded-full font-extrabold text-xl'>
              <p className='text-salte-700'>Conecte-se</p>
            </div>

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
            <div className="relative h-0 w-full min-w-[200px]">

            </div>
          </div>
          <div className='p-6'>
            {renderContent()}
          </div>
          <div className="p-6 mt-0 pt-0">

            {visible && (
              <Button
                onClick={handleLogin} disabled={isLoading}

                className="block mt-10 w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? <Spin size="small" /> : 'Proximo'}
              </Button>
            )}
          </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  );
}