

"use client"
import { useState, useEffect } from "react";
import Link from "next/link"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import 'firebase/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig';
import { useRouter } from "next/navigation"
import '../globals.css'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CiMenuFries } from "react-icons/ci";
import SmoothScrollLink from '../../components/scroll/SmoothScrollLink';
import { v4 as uuidv4 } from 'uuid';
import {success, erro, mailIgual, campos, erro404, mail, confirmepass} from '../../components/Antd/sms'
import Logo from '../../../public/images/Logo.png';
import Image from "next/image";
import Odelice from '../../../public/images/Odelice.png'
import Neyze from '../../../public/images/Neyze.png'
import Dedy from '../../../public/images/Dedy.png'
import { LuGauge } from "react-icons/lu";
import { LuPuzzle } from "react-icons/lu";
import { GiRocketFlight } from "react-icons/gi";
import { Modal } from 'antd';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spin } from 'antd';



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



export default function Component() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [name, setName] = useState('')
  const [apelido, setApelido] = useState('')
  const [email, setEmail] = useState ('')
  const [password, setPassword] = useState ('')
  const [passwordConfirme, setPasswordConfrime] = useState('')
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataAPI, setUserDataAPI] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);


  const showModal = () => {
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };


  const saveDataToFirebase = async (userData) => {
    try {
        const { email, curso, nome, processo, turma } = userData.usuario;
        const Instituicao = userData.eventos[0].Instituição;

        // Realiza uma consulta para verificar se já existe um usuário com o mesmo email
        const userRef = firebase.database().ref('users');
        const snapshot = await userRef.orderByChild('email').equalTo(email).once('value');

        if (snapshot.exists()) {
          mailIgual();
            return; // Retorna sem salvar os dados novamente
        }

        // Se não existir um usuário com o mesmo email, procede com o salvamento
        const userId = uuidv4(); // Gera um ID único para o usuário usando uuidv4
        const login = 'false';
        const newUserRef = firebase.database().ref(`users/${userId}`);

        await newUserRef.set({
            nome,
            email,
            curso,
            turma,
            processo,
            Instituicao,
            login ,
            userId
        });

        success()
        localStorage.setItem('mailUser',email)
    } catch (error) {
        console.error('Erro ao salvar dados no Firebase: ', error);
       
    }
    router.push('/login')
};


  const handleCheckEmail = async (e) => {
    setIsLoading(true);
    e.preventDefault();

    if (!email) {
      campos()
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://verefication-login-ms.vercel.app/userData/${email}`);
  
      // Verifica se a resposta da requisição é bem-sucedida (status 200)
      if (response.ok) {
          const data = await response.json();
  
          // Verifica o campo 'status' no objeto retornado pela API
          if (data.status === 200) {
              // Status 200 indica que o email é válido para registro
              setUserData(data.data[0]);
              setUserDataAPI(data);
              localStorage.setItem('mailUser',email)
              showModal();
          } else if (data.status === 400) {
              // Status 400 indica que o email não é válido para registro
              mail()
              // Aqui você pode chamar uma função mail() ou realizar outra ação necessária
          }else if (data.status === 404) {
            // Status 400 indica que o email não é válido para registro
            erro404()
            // Aqui você pode chamar uma função mail() ou realizar outra ação necessária
        } else {
              // Outros status de resposta não esperados
              throw new Error('Erro ao verificar email: status inesperado recebido da API.');
          }
      } else {
          // Se a resposta não foi bem-sucedida, lança um erro com detalhes do status e mensagem
          throw new Error(`Erro ao verificar email: ${response.status} - ${response.statusText}`);
      }
  } catch (error) {
      // Captura e trata qualquer erro que ocorra durante a requisição ou processamento dos dados
      console.error('Erro ao processar requisição:', error.message);
      setError(error.message); // Define o erro no estado, se necessário
  } finally {
      // Finaliza o isLoading
      setIsLoading(false);
  }
  
  
  };
  
  useEffect(() => {
    // Verifica se a rota 'users' existe
    const checkUsersRoute = async () => {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.once('value');
      if (!snapshot.exists()) {
        // Se a rota 'users' não existir, cria ela
        await usersRef.set({});
      }
    };

    checkUsersRoute();
  }, []);

  /* const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!name || !apelido || !email || !password || !passwordConfirme) {
      campos();
      return;
    }
  
    if (password !== passwordConfirme) {
      confirmepass();
      return;
    }
  
    if (password.length < 6) {
      pass();
      return;
    }
  
    try {
      setLoading(true);
  
      const response = await fetch(`https://verefication-login-ms.vercel.app/userData/${email}`);
  
      if (!response.ok) {
        throw new Error(`Erro ao verificar email: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
  
      console.log('Resposta da API de verificação de email:', data);
  
      // Verifica se o email não é válido para registro
      if (data.status !== 200 || !data.data || data.data.length === 0) {
        throw new Error('O email não é válido para registro.');
      }
      
  
      // Se a verificação de email for bem-sucedida, criar o usuário
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      const userId = user.uid;
      const userRef = firebase.database().ref(`users/${userId}`);
      await userRef.set({
        name,
        apelido,
        email,
        userId,
      });
  
      success();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
    // Verifica se o erro é de email já em uso
    if (error.code === 'auth/email-already-in-use') {
      mailIgual();
      // Aqui você pode adicionar lógica para mostrar uma mensagem na UI se necessário
    } else {
      erro();
    }
    } finally {
      setLoading(false);
    }
  }; */

  /* const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email) {
      campos();
      return;
    }
  
    if (password !== passwordConfirme) {
      confirmepass();
      return;
    }
  
    if (password.length < 6) {
      pass();
      return;
    }
  
    try {
      setLoading(true);
  
      const response = await fetch(`https://verefication-login-ms.vercel.app/userData/${email}`);
  
      if (!response.ok) {
        throw new Error(`Erro ao verificar email: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
  
      console.log('Resposta da API de verificação de email:', userData);
  
      let userDataFromAPI;
      if (data.status === 200 && data.data.length > 0) {
        const userData = data.data[0].usuario;
  
        // Extrai os campos específicos da API
        const { curso, processo } = userData;
        const Instituição = data.data[0].eventos[0].Instituição; // Extrai Instituição do primeiro evento
  
        // Cria o usuário no Firebase com os dados necessários
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
  
        const userId = user.uid;
        const userRef = firebase.database().ref(`users/${userId}`);
        await userRef.set({
          name,
          apelido,
          email,
          userId,
          curso,
          processo,
          Instituição,
        });
  
        success();
      } else if (data.status === 400) {
        // Status 400 indica que o email não é válido para registro
        mail();
      } else {
        // Outros status de resposta não esperados
        throw new Error('Erro ao verificar email: status inesperado recebido da API.');
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
  
      // Verifica se o erro é de email já em uso
      if (error.code === 'auth/email-already-in-use') {
        mailIgual();
        // Aqui você pode adicionar lógica para mostrar uma mensagem na UI se necessário
      } else {
        erro();
      }
    } finally {
      setLoading(false);
    }
  }; */
  
  
  
  
  
  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
   
  const handleClick = () =>{
    router.push('/login')

  }

  const limparImput = () =>{
    setName('')
    setApelido('')
    setEmail('')
    setPassword('')
    setPasswordConfrime('')
  }

  

  return (
    <div className="flex flex-col min-h-[100dvh]">
    <header className="fixed top-0 z-50 w-full flex items-center justify-between h-16 px-4 border-b bg-transparent backdrop-filter backdrop-blur-md  shadow-md md:px-6">
      <Link href="#" className="flex items-center gap-2 text-lg font-semibold sm:text-base" >
        <Image
        alt="logo"
        src={Logo}
        className="h-12 w-12 "
        />
        <span className="text-xl text-gray-900 font-extrabold md:text-3xl">MentorIA</span>
      </Link>
      <nav className="hidden font-medium sm:flex flex-row items-center gap-5 text-sm lg:gap-6 ml-auto">
       <SmoothScrollLink href="/home#recursos" className="text-gray-500  hover:border-b-2 hover:border-blue-500 transition duration-300" >
          Recursos
        </SmoothScrollLink>
        <SmoothScrollLink href="/home#depoimentos" className="text-gray-500 hover:border-b-2 hover:border-blue-500 transition duration-300 " >
          Depoimentos
        </SmoothScrollLink>
      
        <SmoothScrollLink href="/home#login" className="text-gray-500  hover:border-b-2 hover:border-blue-500 transition duration-300" >
          Login
        </SmoothScrollLink>
      </nav>
   
       <div className="ml-auto flex items-center gap-2 sm:hidden ">
        <button onClick={toggleMenu} className="text-gray-500 focus:outline-none focus:text-gray-700">

          <CiMenuFries className="w-6 h-6"/>
        </button>
      </div>
      <nav
        className={`fixed top-0 left-0 h-screen bg-white p-12 shadow-md transition-transform duration-300 ease-in-out transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } sm:hidden z-50`}
        
      >
        <ul className="flex flex-col items-center p-4 mt-16 cursor-pointer list-none">
        <li className=" outline-none">
            <Link href="/home#recursos" onClick={toggleMenu} className="block py-2 text-gray-500  hover:border-b-2 hover:border-blue-500 transition duration-300">
              Recursos
            </Link>
          </li>
          <li>
            <Link href="/home#depoimentos" onClick={toggleMenu} className="block py-2 text-gray-500   hover:border-b-2 hover:border-blue-500 transition duration-300">
              Depoimentos
            </Link>
          </li>
         
           <li>
            <Link href="/home#login" onClick={toggleMenu} className="block py-2 text-gray-500  hover:border-b-2 hover:border-blue-500 transition duration-300">
              login
            </Link>
          </li> 
        </ul>
      </nav>
    </header>
      <main className="flex-1 bg-gray-100/40 mt-6 ">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10 ">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Aprendizagem Inteligente, Crescimento Exponencial
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                A MentorIA é uma plataforma de aprendizem inteligente que possibilita a recuperação de módulos em atraso
                com rescurso à inteligência artificial.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
            <SmoothScrollLink
                href="/home#login"
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 px-8 text-sm font-medium  shadow transition-colors hover:bg-gray-50 hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 "
              >
                Comece Agora
              </SmoothScrollLink>
              
              <SmoothScrollLink
                href="/home#recursos"
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Saiba Mais
              </SmoothScrollLink>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm " id="recursos">Recursos</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Recursos Inteligentes para Aprendizem Interativa
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed ">
                A MentorIA oferece recursos avançados de inteligência artificial para ajudar os alunos desenvolver conhecimento e possibiita a recuperação de módulos.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full mx-auto">
              <Card className="transition-all hover:shadow-2xl border-gray-200">
                <CardHeader className="flex flex-row items-center gap-2">
                  <LuGauge className="w-8 h-8 text-green-500" />
                  <div className="grid gap-1">
                    <CardTitle className="text-slate-700">Diagnóstico Inteligente</CardTitle>
                    <CardDescription >Avaliação diagnóstica.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <p>
                    O sistema de diagnóstico utiliza IA para identificar rapidamente as áreas em que o aluno precisa
                    de mais foco.
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-2xl border-gray-200">
                <CardHeader className="flex flex-row items-center gap-4">
                  <LuPuzzle className="w-8 h-8 text-yellow-500" />
                  <div className="grid gap-1">
                    <CardTitle className="text-slate-700">Planos de Recuperação</CardTitle>
                    <CardDescription>Percursos curriculares personalizados para o sucesso.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <p>
                    Com base no diagnóstico, a MentorIA gera planos de recuperação personalizados para cada aluno,
                    criando aprendizagens dinâmicas.
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-all hover:shadow-2xl border-gray-200">
                <CardHeader className="flex flex-row items-center gap-4">
                  <GiRocketFlight className="w-8 h-8 text-red-500" />
                  <div className="grid gap-1">
                    <CardTitle className="text-slate-700">Melhoria da aprendizagem</CardTitle>
                    <CardDescription>Conteúdo dinâmicos e focalizados.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <p>
                    Os algoritmos de IA adaptam o conteúdo e a metodologia de dinâmica de aprendizagem com foco em processos de melhoria contínua.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm " id="depoimentos">Depoimentos</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                O que os alunos dizem sobre a MentorIA
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Consulte o que os alunos dizem sobre a experiência de aprendizem com a MentorIA.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full mx-auto p-4">
              <Card className="bg-white rounded-lg shadow-md transition-all hover:shadow-2xl border-gray-200">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <Image src={Odelice} className="w-12 h-12 rounded-full object-cover" alt="Avatar" />
                    <div className="grid gap-1">
                      <div className="font-medium text-lg text-slate-900">Odelice Ceita</div>
                      <div className="text-sm text-gray-500">Estudante de Comércio</div>
                    </div>
                  </div>
                  <blockquote className="text-lg font-semibold leading-snug text-gray-700">
                    &ldquo;A MentorIA está a ajudar-me a recuperar os módulos atrasados de forma rápida e eficiente. Recomendo
                    fortemente!&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-lg shadow-md transition-all hover:shadow-2xl border-gray-200">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <Image src={Dedy} className="w-12 h-12 rounded-full object-cover" alt="Avatar" />
                    <div className="grid gap-1">
                      <div className="font-medium text-lg text-slate-900">Denilson Afonso</div>
                      <div className="text-sm text-gray-500">Estudante de Desenho e Contrução Civil</div>
                    </div>
                  </div>
                  <blockquote className="text-lg font-semibold leading-snug text-gray-700">
                    &ldquo;Graças à MentorIA, estou a recuperar os meus módulos atrasados com facilidade e melhorei o meu
                    desempenho acadêmico.&rdquo;
                  </blockquote>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-lg shadow-md transition-all hover:shadow-2xl border-gray-200">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <Image src={Neyze} className="w-12 h-12 rounded-full object-cover" alt="Avatar" />
                    <div className="grid gap-1">
                      <div className="font-medium text-lg text-slate-900">Neizy Santiago</div>
                      <div className="text-sm text-gray-500">Estudante de Desenho e Contrução Civil</div>
                    </div>
                  </div>
                  <blockquote className="text-lg font-semibold leading-snug text-gray-700">
                    &ldquo;A MentorIA é uma ferramenta incrível que me ajuda a superar minhas dificuldades e alcançar
                    meus objetivos acadêmicos.&rdquo;
                  </blockquote>
                </CardContent>
  
              </Card>
            </div>

          </div>
        </section>
        {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 ">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm "id="login">Comece Agora</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Transforme seu aprendizado com a MentorIA
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Inscreva-se agora e comece a aproveitar os benefícios da plataforma de aprendizado inteligente da
                MentorIA.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
            <Button
                onClick={handleClick}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              >
                Comece Agora
              </Button>
              
              <p className="text-xs text-gray-500 p-2">
                Ao clicar no botão Comece agora serás direcionado para a pagina de login
                 <Link href="#" className="underline underline-offset-2" prefetch={false}>
                  Termos de Uso
                </Link> 
                .
              </p>
            </div>
          </div>
        </section> */}
         <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 " id="login">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 lg:gap-10 ">
            <div className="space-y-3">
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm">Comece Agora</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Melhore dinâmicas de aprendizagem com a MentorIA
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Verifica se já tens registo no MentorIA.
              </p>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Se já estas registado na nossa plataforma clique <a onClick={handleClick} className="hover:text-blue-400 underline font-extrabold">aqui</a> para conectares.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2 mt-10">
      {/*       <div
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
  <div className="relative h-11 w-full min-w-[200px]">
      <input
      typeof="name"
      value={name}
      onChange={(e)=>setName(e.target.value)}
        placeholder=""
        className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
      />
      <label
        className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
      >
        Nome
      </label>
    </div>
    <div className="relative h-11 w-full min-w-[200px]">
      <input
      typeof="lastname"
      value={apelido}
      onChange={(e) => setApelido(e.target.value)}
        placeholder=""
        className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
      />
      <label
        className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
      >
        Apleido
      </label>
    </div>
    <div className="relative h-11 w-full min-w-[200px]">
      <input
      type="email"
      required 
      value={email}
      onChange={(e)=> setEmail(e.target.value)}
        placeholder=""
        className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
      />
      <label
        className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
      >
        Email
      </label>
    </div>
    <div className="relative h-11 w-full min-w-[200px]">
      <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
        placeholder=""
        className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
      />
      <label
        className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
      >
        Senha
      </label>
    </div>
    <div className="relative h-11 w-full min-w-[200px]">
      <input
      type="password"
      value={passwordConfirme}
      onChange={(e) => setPasswordConfrime(e.target.value)}
        placeholder=""
        className="peer h-full w-full rounded-md border border-blue-gray-200 border-t-transparent bg-transparent px-3 py-3 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-cyan-500 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
      />
      <label
        className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-cyan-500 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-cyan-500 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-cyan-500 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
      >
        Confirmar Senha
      </label>
    </div>
  </div>
  <div className="p-6 pt-0">
    <button
      onClick={handleSubmit}
      data-ripple-light="true"
      type="button"
      className="block w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
    >
      Criar conta
    </button>
     <p
      className="mt-6 flex justify-center font-sans text-sm font-light leading-normal text-inherit antialiased"
    >
    Já tens uma conta?
      <a
        className="ml-1 block font-sans text-sm font-bold leading-normal text-cyan-500 antialiased"
        onClick={handleClick}
      >
        Login
      </a>
    </p> 
   
  </div>
</div> */}
             {/*  <p className="text-xs text-gray-500 dark:text-gray-400">
                Ao se inscrever, você concorda com os
                <Link href="#" className="underline underline-offset-2" prefetch={false}>
                  Termos de Uso
                </Link>
                .
              </p> */}
            </div>
          </div>

          <>
        <div className="flex justify-center items-center  bg-gray-100">
          <div className="mx-auto w-full max-w-sm space-y-2 ">
            <div className="relative flex w-96 flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md">
              <div className="relative mx-4 -mt-6 mb-4 grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 bg-clip-border text-white shadow-lg shadow-cyan-500/40">
                <h3 className="block font-sans text-3xl font-semibold leading-snug tracking-normal text-white antialiased">
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
          <p className='text-salte-700'>Verifique o seu email</p>
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
                  onClick={handleCheckEmail}
                  disabled={isLoading}
                  type="button"
                  className="block mt-10 w-full select-none rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-cyan-500/20 transition-all hover:shadow-lg hover:shadow-cyan-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? <Spin size="small"/> : 'Verificar'}
                </Button>
              </div>
              <div className="p-6 pt-0">
  
     <p
      className="flex justify-center font-sans text-sm font-light leading-normal text-inherit antialiased"
    >
    Já verificaste?
      <a
        className="ml-1 block font-sans text-sm font-bold leading-normal hover:underline text-cyan-500 antialiased"
        onClick={handleClick}
      >
        Conectar
      </a>
    </p> 
   
  </div>
            </div>
          </div>
        </div>
        <AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent className="w-full max-w-lg mx-auto border rounded-lg shadow-lg bg-white p-6 sm:p-8">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-gray-800 font-bold text-2xl mb-4">
        Confirme seus Dados
      </AlertDialogTitle>
      <AlertDialogDescription>
        {userDataAPI && userDataAPI.data.length > 0 ? (
          <div className="text-gray-700 text-lg sm:text-base">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p className="mt-2">
                <strong className="mr-2">Nome:</strong> {userDataAPI.data[0].usuario.nome}
              </p>
              <p className="mt-2">
                <strong className="mr-2">Email:</strong> {userDataAPI.data[0].usuario.email}
              </p>
              <p className="mt-2">
                <strong className="mr-2">Curso:</strong> {userDataAPI.data[0].usuario.curso}
              </p>
              <p className="mt-2">
                <strong className="mr-2">Turma:</strong> {userDataAPI.data[0].usuario.turma}
              </p>
              <p className="mt-2 col-span-1 sm:col-span-2">
                <strong className="mr-2">Instituição:</strong> {userDataAPI.data[0].eventos[0].Instituição}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-700">Nenhum dado encontrado.</p>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter className="flex flex-cols-1 gap-4 p-2 justify-center mt-6">
  <AlertDialogCancel
    onClick={closeModal}
    className="col-span-1 bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-400 text-white shadow-sm shadow-cyan-400 border p-2 rounded-lg hover:bg-gradient-to-tr hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-200"
  >
    Fechar
  </AlertDialogCancel>
  <AlertDialogAction
    onClick={() => saveDataToFirebase(userData)}
    className="col-span-1 bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-400 text-white shadow-sm shadow-cyan-400 p-2 border rounded-lg hover:bg-gradient-to-tr hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 transition-all duration-200"
  >
    Confirmar
  </AlertDialogAction>
</AlertDialogFooter>

  </AlertDialogContent>
</AlertDialog>


      </>
    

        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2024 MentorIA. Todos os direitos reservados.</p>
      {/*   <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Termos de Uso
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacidade
          </Link>
        </nav> */}
      </footer>
    </div>
  )
}

