/* 'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import firebase from 'firebase/compat/app';
import firebaseConfig from '../../firebaseConfig';
import { Button } from "@/components/ui/button";
import '../globals.css';
import { RiLogoutCircleLine } from "react-icons/ri";
import { SlActionUndo } from "react-icons/sl";

import withAuth from '../withAuth';
import { Router } from 'lucide-react';

function Page() {
  const router = useRouter()
  const [user, setUser] = useState(null);
  
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    } else {
      firebase.app(); 
    }
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
  }

  const auth = getAuth();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        router.push("/login");
      })
      .catch((error) => {
        console.error("Erro ao fazer logout:", error);
      });
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };
  

  return (
   <div className='w-screen h-screen fixed top-0 left-0 bg-blue-500'>
   <div className="flex items-center justify-start mb-8 md:mb-10  p-6 md:p-8 ">
     <Button
       className="flex items-center justify-center text-white bg-transparent hover:bg-white hover:text-blue-500 px-4 py-2 focus:outline-none border  rounded-md transition duration-300"
       onClick={handleGoBack} 
     >
       <SlActionUndo  className="text-xl" />
       <span className="ml-2">Voltar</span>
     </Button>
   </div>
    <div className="flex justify-center items-center mt-40 md:mt-60">
   
   <Card className="w-full shadow-md shadow-black max-w-3xl mx-4 sm:mx-0">
     <CardContent className=" p-4 space-y-6">
       {user && (
         <div className="space-y-4">
           <div className="flex items-center space-x-6">
             {user.photoURL && (
               <div className="w-12 h-12 overflow-hidden rounded-full">
                 <img
                   alt="Avatar"
                   className="rounded-full"
                   height="48"
                   src={user.photoURL}
                   style={{
                     aspectRatio: "48/48",
                     objectFit: "cover",
                   }}
                   width="48"
                 />
               </div>
             )}
             <div className="space-y-1">
               <h1 className="text-2xl text-slate-900 font-bold">{user.displayName}</h1>
               <p className="text-sm text-gray-500 ">{user.email}</p>
             </div>
           </div>
         </div>
       )}
       {!user && <div className='text-3xl text-slate-900 flex p-2 justify-center font-bold'>Você não está logado</div>}
     </CardContent>
     {user ? (
       <div className="flex flex-col p-4 justify-center items-center">
         <Button
           type="button"
           onClick={handleLogout}
           className="w-8/12 justify-center text-md items-center flex bg-transparent shadow-md shadow-black  font-bold border border-slate-300 text-slate-800 hover:bg-blue-100 p-2 gap-2 focus:outline-none focus:ring focus:border-blue-300 transform transition-transform duration-300 hover:scale-105"
         >
           Logout
           <RiLogoutCircleLine />
         </Button>
       </div>
     ) : (
       <div className='text-md text-gray-500 flex p-2 justify-center font-semibold'>Você será direcionado para a página de login</div>
     )}
   </Card>
 </div>
 </div>
  );
}

export default withAuth(Page); */



import { gerarJWT } from '../../pages/api/jwtUtils';
function MinhaPagina() {
  const tokenJWT = gerarJWT();
  return (
    <div>
      <h1>Minha Página</h1>
      <p>JWT Gerado: {tokenJWT}</p>
    </div>
  );
}

export default MinhaPagina;