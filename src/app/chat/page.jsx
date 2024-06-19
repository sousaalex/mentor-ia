
'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { PiChecks } from "react-icons/pi";
import { CiClock2 } from "react-icons/ci";
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FaTelegramPlane } from "react-icons/fa";
import { Textarea } from "@/components/ui/textarea"
import { TbPointFilled } from "react-icons/tb";
import '../globals.css'
import MentorIA from '../../../public/logo chat.jpg'
import Image from "next/image";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import firebase from 'firebase/compat/app';
import firebaseConfig from '../../firebaseConfig'
import 'firebase/compat/database';
import withAuth from '../withAuth'
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';



// Inicialize o Firebase se ainda não estiver inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
 }
 
 const db = firebase.database();



const TypingAnimation = ({ text }) => {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));
          window.requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        }
      }
    };

    animateText();

    return () => {
      isMounted = false;
    };
  }, [text]);

  return (
    <>
      <div className="p-4 rounded-xl text-base  font-normal" dangerouslySetInnerHTML={{ __html: marked(content) }} />
      <div ref={chatEndRef} />
    </>
  );
};

function Chat() {

  const [conversation, setConversation] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [isSending, setIsSending] = useState(false)
  const [conversationId, setConversationId] = useState('');  // Initialize here
  const chatEndRef = useRef(null);

  const handleUserMessageChange = (e) => {
    setUserMessage(e.target.value);
  };
 /*  const conversationId = uuidv4(); */

   // Gera um novo ID para cada nova conversa
   useEffect(() => {
    if (!conversationId) {
      setConversationId(uuidv4());  // Use the imported function
    }
  }, []);

  // Manipulador de envio de mensagem
  const handleSendMessage = async () => {
    setIsSending(true);
    setUserMessage('');
   
    const updatedConversation = [
       ...conversation,
       { type: 'user', text: userMessage },
    ];
   
    setConversation(updatedConversation);
   
    try {
       // Inclua o histórico completo da conversa na solicitação
       const apiResponse = await fetch('https://localhost:5000/request', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           pergunta: userMessage,
           // Inclua o histórico da conversa aqui
           historico: updatedConversation.map(msg => ({
             tipo: msg.type,
             texto: msg.text,
           })),
         }),
       });
       const data = await apiResponse.json();
   
       if (data && data.resposta) {
         setBotMessage(data.resposta);
   
         const updatedConversationWithBot = [
           ...updatedConversation,
           { type: 'bot', text: data.resposta },
         ];
   
         setConversation(updatedConversationWithBot);
   
         // Salvar a conversa no Firebase com o ID da conversa
         saveConversationToFirebase(conversationId, updatedConversationWithBot);
       } else {
         console.error('Resposta da API mal formada:', data);
       }
    } catch (error) {
       console.error('Erro ao enviar pergunta ou receber resposta:', error);
    }
   
    setIsSending(false);
   }; 
  
  // Função para salvar conversas no Firebase
const saveConversationToFirebase = async (conversationId, conversation) => {
  try {
     await db.ref('conversations').child(conversationId).set({
       id: conversationId,
       messages: conversation
     });
     console.log('Conversa salva com sucesso');
  } catch (error) {
     console.error('Erro ao salvar conversa:', error);
  }
};
 
 // Função para carregar conversas do Firebase
  /*  const loadConversationsFromFirebase = async () => {
    try {
      const snapshot = await db.ref('conversations').once('value');
      const conversations = snapshot.val();
      console.log(conversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  }; */


  //funçao para fazer o autoscrool
  useEffect(() => {
    const observer = new MutationObserver(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    observer.observe(document.querySelector('.grid'), { childList: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between h-[60px] px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <img
                alt="Avatar"
                className="rounded-full"
                height="40"
                src={"https://alta.com.ph/wp-content/uploads/2020/03/MAN_13-367x367.jpg"}
                style={{
                  aspectRatio: "40/40",
                  objectFit: "cover",
                }}
                width="40"
              />
            </Avatar>
            <div className="flex flex-col">
              <div className="text-sm font-medium">Welcome, User</div>
              <div className="flex">
                <span className="text-green-500"><TbPointFilled /></span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/*  <Button size="icon" variant="ghost">
              <span className="sr-only">Notifications</span>
            </Button>
            <Button size="icon" variant="ghost">
              <span className="sr-only">Search</span>
            </Button>
            <div>
              <div className="rounded-full overflow-hidden">
                <Avatar className="h-8 w-8 border-2">
                  <AvatarImage />
                  <AvatarFallback>J</AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-2 w-48 origin-top-right">
                <div />
                <div />
                <div />
                <div />
              </div>
            </div> */}
            <Image
              alt="MentorIA"
              className="rounded-full"
              height="40"
              src={MentorIA}
              style={{
                aspectRatio: "48/48",
                objectFit: "cover",
              }}
              width="40"
            />
          </div>
        </div>
      </header>
      <div className="flex items-center space-x-2">
        <h1 className="text-xl gap-4 px-4 p-4 sm:px-6 font-bold tracking-tight">Conversation with Support</h1>
        <Badge disabled={isSending} className='bg-slate-800 text-white'>
          {isSending ? 'gerando...' : 'AiRequest'}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="container flex flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="grid gap-4">
            {conversation.map((message, index) => (
              <div key={index} className="flex flex-col gap-2 mt-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <img
                      alt="Avatar"
                      className="rounded-full"
                      height="40"
                      src={message.type === 'user' ? 'https://alta.com.ph/wp-content/uploads/2020/03/MAN_13-367x367.jpg' : 'https://mentorai-pi.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo%20chat.8d15d714.jpg&w=48&q=75'}
                      style={{
                        aspectRatio: "40/40",
                        objectFit: "cover",
                      }}
                      width="40"
                    />
                  </Avatar>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5">
                      {/* <PiChecks className="h-4 w-4 text-green-500" />*/}
                      {/* <span className="text-xs text-gray-500 dark:text-gray-400">Read</span>*/}
                      <span className="text-md text-slate-900 font-bold dark:text-slate-900">{message.type === 'user' ? 'You' : 'AiRequest'}</span>
                    </div>
                    {/*  <div className="flex items-center space-x-1.5">
                      <CiClock2 className="h-4 w-4" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">2m ago</span>
                    </div> */}
                  </div>
                </div>
                <div className={`p-2 rounded-xl ${message.type === 'user' ? '' : ''}`}>
                  {message.type === 'bot' ? <TypingAnimation text={message.text} /> : <p className=" text-base font-normal" dangerouslySetInnerHTML={{ __html: marked(message.text) }} />}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-6 space-x-2 flex justify-center items-center">
        <Textarea
          className="peer p-4 bg-slate-200 rounded-2xl items-center justify-center h-100 sm:h-100 w-full sm:w-8/12 resize-none"
          placeholder="Type your message here."
          value={userMessage}
          onChange={handleUserMessageChange}
        />
        {/* <Button
          className="p-4 rounded flex bg-transparent"
          type="submit"
          onClick={handleSendMessage}
        >
          <FaTelegramPlane className="text-slate-900 w-10 h-10" />
        </Button> */}
        <Button
          type='submit'
          className="p-2  rounded flex  text-slate-900 pointer"
          onClick={handleSendMessage} disabled={isSending}>
          {isSending ? 'gerando...' : <FaTelegramPlane className="text-slate-900 w-10 h-10" />}
        </Button>
      </div>
    </div>
  )
}

export default withAuth(Chat);