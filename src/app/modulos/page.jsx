'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DrawerTrigger, DrawerClose, DrawerHeader, DrawerFooter, DrawerContent, Drawer } from "@/components/ui/drawer"
import { PiSpinnerLight } from "react-icons/pi";
import { BsChatText } from "react-icons/bs";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { HiMiniSpeakerXMark } from "react-icons/hi2";
import '../globals.css'
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig'
import { onAuthStateChanged, getAuth, signOut, } from 'firebase/auth';
import withAuth from '../withAuth'
import { marked } from 'marked';
import { HiArrowSmUp } from "react-icons/hi";





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


const storageKey = "dadosDaAPI";

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
            chatEndRef.current?.scrollIntoView({ behavior: "instant" });
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
      <p  className=" rounded-xl text-base  font-normal"  dangerouslySetInnerHTML={{ __html: marked(content) }} />
      <div ref={chatEndRef} />
    </>
  );
};

const TypingAnimationHeader = ({ text }) => {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);


  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 60));
        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));
         /*  window.requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "instant" });
          }); */
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
      <div /* className=" rounded-xl text-base  font-normal" */ dangerouslySetInnerHTML={{ __html: marked(content) }} />
{/*       <div ref={chatEndRef} />
 */}    </>
  );
};

// Função para remover caracteres indesejados
const cleanText = (text) => {
  // Expressão regular para remover asteriscos, emojis e outros caracteres especiais
  return text.replace(/[*]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
};

// Função para converter texto em fala
const handleTextToSpeech = (text) => {
  const cleanTextToSpeak = cleanText(text); // Limpa o texto antes de falar
  const utterance = new SpeechSynthesisUtterance(cleanTextToSpeak);
  utterance.lang = 'pt-PT'; // Define o idioma para português europeu
  window.speechSynthesis.speak(utterance);
};

const Skeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="flex-1 space-y-4 py-1">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);
function Ufcd() {
  const router = useRouter();
  const chatEndRef = useRef(null);

  const auth = getAuth();
  const [user, setUser] = useState('');
  const [cardsToShow, setCardsToShow] = useState(4);
  const [startIndex, setStartIndex] = useState(0);
  const [courseData, setCourseData] = useState({});
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatResponses, setChatResponses] = useState([]); // Certifique-se de que este estado esteja definido aqui
  const [newQuestion, setNewQuestion] = useState('');
  const [allChatHistory, setAllChatHistory] = useState([]); // Variável para armazenar todas as conversas do chat
  const [courseName, setCourseName] = useState(null);
  const [ufcdName, setUfcdName] = useState(null);
  const [ufcdID, setUfcdID] = useState('')
  const [response, setResponse] = useState([]);
  const [matchingUfcds, setMatchingUfcds] = useState([]);
  const [lastResponse, setLastResponse] = useState(''); // Novo estado para guardar a última resposta
  const [isSpeaking, setIsSpeaking] = useState(false); // Estado para controlar se está falando
  const [open, setOpen] = useState(false);
  /* novo */
  const [userMessageInput, setUserMessageInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollAreaRef = useRef(null);



  const showModal = () => {
    setOpen(true);
    setChatHistory([]);

  };

  const closeModal = () => {
    setOpen(false);
  };

  useEffect(() => {
    const userEmailFromLocalStorage = localStorage.getItem('mailUser');
    if (userEmailFromLocalStorage) {
      const database = firebase.database();
      const dataRef = database.ref('users');

      // Consultar o banco de dados para encontrar chaves onde o valor do campo "email" é igual ao email do usuário
      dataRef.orderByChild('email').equalTo(userEmailFromLocalStorage).once('value')
        .then(async (snapshot) => {
          if (snapshot.exists()) {
            // Iterar sobre os resultados encontrados
            snapshot.forEach((childSnapshot) => {
              // Obter o nome e o apelido do usuário do snapshot
              const user = childSnapshot.val();
              const nome = user.nome;
              setUser(nome);
            });
          } else {
            console.log('Nenhum dado encontrado com o email do usuário.');
          }
        })
        .catch((error) => {
          console.error('Erro ao recuperar dados do Firebase:', error.message);
        });
    } else {
      console.log('Email do usuário não encontrado no localStorage.');
    }
  }, []);


  useEffect(() => {
    // Recuperar os dados do localStorage quando o componente é montado
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      setResponse(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    // Cancela qualquer fala em andamento quando a página carrega
    window.speechSynthesis.cancel();
  }, []);

  // Recuperar o id do localStorage e faz comparaçao do ids no banco quando o componente é montado
  useEffect(() => {
    const storedUfcdCode = localStorage.getItem('id');
    setUfcdID(storedUfcdCode);
/*     console.log(storedUfcdCode)
 */
    if (storedUfcdCode) {
      const database = firebase.database();
      const dataRef = database.ref('ufcd');

      dataRef.orderByChild('id').equalTo(storedUfcdCode).once('value')
        .then((snapshot) => {
          if (snapshot.exists()) {
            const matchingUfcdArray = [];

            snapshot.forEach((childSnapshot) => {
              // Correção aqui: Usando a notação de colchetes para acessar a propriedade
              if (childSnapshot.val()['id'] === storedUfcdCode) {
                matchingUfcdArray.push(childSnapshot.val());
              }
            });

            setMatchingUfcds(matchingUfcdArray);
           } else {
             console.log('Nenhum dado encontrado com ao ID fornecido.');
           }
        })
        .catch((error) => {
          console.error('Erro ao recuperar dados do Firebase:', error.message);
        });
    } else {
/*       console.log('ID não encontrada no localStorage.');
 */    }

    // Função de limpeza, caso seja necessário
    return () => {
      // Aqui você pode adicionar qualquer limpeza necessária
    };
  }, []); // Dependências vazias indicam que esse useEffect será executado apenas na montagem


  // Função para abrir o diálogo
  const openDialog = () => {
    setIsDialogOpen(true);
  };

  // Função para fechar o diálogo
  const closeDialog = () => {
    setAllChatHistory([])
    setIsDialogOpen(false);

  };

/*   //funçao para pegar as infos dos users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [auth]);
 */
/* 
  // Função para de logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        router.push("/login");
      })
      .catch((error) => {
        console.error("Erro ao fazer logout:", error);
      });
  } */

  /* const handleTextToSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT'; // Define o idioma para português europeu
    window.speechSynthesis.speak(utterance);
  }; */


  const handleCardClick = async () => {
    setIsDialogOpen(true);
    setCarregando(true);

    let promptContent = `Olá, Eu sou ${user} podes dar uma aula muito produtiva em que tu abordaras todos os tópicos e explicaras de uma maneira ampla e aberta. Quero uma aula com conteúdo, exemplos e exercícios baseados no conteúdo e matéria que abordare e tudo que tem direito a ter numa aula para uma turma de ${courseName} com a UFCD "${ufcdName}" com os seguintes tópicos:\n\n`;

    promptContent += `Aula:\n`;
    promptContent += `Objetivos de Aprendizagem:\n`;
    promptContent += `Introdução:\n`;
    promptContent += `Desenvolvimento:\n`;
    promptContent += `Conclusão:\n`;

    try {
      const response = await fetch('https://airequest.onrender.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: promptContent,
        }),
      });

      const data = await response.json();
      if (data && data.resposta) {
        localStorage.setItem('RespostaAPI', data.resposta);
        const newMessage = { message: data.resposta, sender: 'bot', timestamp: Date.now() };
        setAllChatHistory(prevHistory => [...prevHistory, newMessage]);

        const dbRef = firebase.database().ref('allChatHistory');
        dbRef.push(newMessage);

        setLastResponse(data.resposta); // Guarda a última resposta no estado
      } else {
        console.error('Resposta da API mal formada:', data);
      }
    } catch (error) {
      console.error('Erro ao enviar pergunta ou receber resposta:', error);
    }

    setCarregando(false);
    setNewQuestion('');
  };

  const handleSpeakClick = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Interrompe a fala
    } else {
      if (lastResponse) {
        handleTextToSpeech(lastResponse); // Fala a última resposta quando o botão é clicado
      } else {
        console.error('Nenhuma resposta disponível para falar.');
      }
    }
    setIsSpeaking(!isSpeaking); // Alterna o estado de isSpeaking
  };



  // Função sendMessage para envio de mensagem pelo usuário
  const sendMessage = async () => {
    if (!userMessageInput.trim()) return; // Evita envio de mensagens vazias

    setIsLoading(true);
    try {
      
      // Adicionar a mensagem do usuário ao histórico total do chat
      const userMessage = { message: userMessageInput, sender: 'user', timestamp: Date.now() };
      setChatHistory(prevHistory => [...prevHistory, userMessage]);

      // Enviar os dados para o Realtime Database
      const dbRef = firebase.database().ref('allChatHistory');
      dbRef.push(userMessage);

      // Enviar mensagem para o servidor e receber resposta
      const response = await fetch('https://airequest.onrender.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: userMessageInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      const data = await response.json();

      // Adicionar a resposta do bot ao histórico total do chat
      const botMessage = { message: data.resposta, sender: 'bot', timestamp: Date.now() };
      setChatHistory(prevHistory => {
        const updatedHistory = [...prevHistory, botMessage];
        // Armazenar o histórico completo do chat no localStorage
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });
      dbRef.push(botMessage);
      } catch (error) {
        console.error('Erro ao enviar pergunta ou receber resposta:', error);
      }
    setUserMessageInput(''); // Limpar o campo de entrada após enviar a mensagem

    setIsLoading(false);
  };

  useEffect(() => {
    // Scroll para o final do chat quando há novas mensagens
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTop = chatScrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (newQuestion.trim() !== '') {
      setChatResponses(prevResponses => [...prevResponses, newQuestion]);
      setNewQuestion('');
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('courseData');
    if (storedData) {
      setCourseData(JSON.parse(storedData));
    }
  }, []);

  const courseKeys = Object.keys(courseData);

  useEffect(() => {
    const storedCourseName = localStorage.getItem('courseName');
    setCourseName(storedCourseName);
  }, []);

  useEffect(() => {
    const storedUfcdName = localStorage.getItem('UFCD clicada');
    setUfcdName(storedUfcdName);
  }, []);



  // Função para fazer o autoscrool instantâneo
  useEffect(() => {
    const observer = new MutationObserver(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "instant" }); // Alterado para 'instant'
    });

    observer.observe(document.querySelector('.grid'), { childList: true });

    return () => observer.disconnect();
  }, []);
  /* funçao para obter o mail do user no localstore e em seguida pegar o nomde dele no banco  */
  /* useEffect(() => {
    if (storedUfcdName) {
      const database = firebase.database();
      const dataRef = database.ref('ufcd');
  
      // Consultar o banco de dados para encontrar chaves onde o valor do campo "email" é igual ao email do usuário
      dataRef.orderByChild('UFCD').equalTo(storedUfcdName).once('value')
        .then((snapshot) => {
          if (snapshot.exists()) {
            // Iterar sobre os resultados encontrados
            snapshot.forEach((childSnapshot) => {
              // Obter o nome do usuário do snapshot e definir no estado
              setUserName(childSnapshot.val().name);
            });
          } else {
            }
        })
        .catch((error) => {
          console.error('Erro ao recuperar dados do Firebase:', error.message);
        });
    } else {
      }
  }, []);  */


  function handleRouter() {
    router.push('/avaliacao')
  }

  return (
    <div className="bg-slate-100 text-white min-h-screen">
      <Drawer open={isDialogOpen} onClose={closeDialog}>
        <DrawerTrigger asChild />
        <DrawerContent className=" w-full">
          <DrawerHeader className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold tracking-tight">Resumo dos elementos em estudo</h1>
            <DrawerClose asChild>
              {/*  <Button className="text-gray-500 hover:text-gray-900">
          <CloseIcon className="h-6 w-6" />
        </Button> */}
            </DrawerClose>
          </DrawerHeader>
          <ScrollArea className="flex flex-col h-96 overflow-y-auto border-b border-gray-200">
          {carregando ? (
               // Renderiza múltiplos esqueletos para simular carregamento de várias mensagens
               <>
               <Skeleton />
               <Skeleton />
               <Skeleton />
             </>
     
        
      ) : (
        allChatHistory.map((message, index) => (
          <div key={index} className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-3">
              {message.sender === "user" ? (
                // Mensagem do usuário
                <>
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg p-3 bg-gray-100">
                    <TypingAnimation text={message.message} />
                  </div>
                </>
              ) : (
                // Mensagem do bot
                <div className="rounded-lg p-3">
                  <TypingAnimation text={message.message} />
                  <div className="flex space-x-4">
                    {/* <div onClick={handleCardClick} className="text-sm text-gray-900 cursor-pointer font-extrabold">
                      <SlRefresh />
                    </div> */}
                    <div onClick={handleSpeakClick} className="text-3xl text-gray-900 cursor-pointer font-extrabold">
                      {isSpeaking ? <HiMiniSpeakerWave /> : <HiMiniSpeakerXMark />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
          </ScrollArea>
          <DrawerFooter className="flex justify-center items-center p-4">
        
            
            <div className="flex items-center space-x-3">
              {/* <Textarea
          className="peer p-2 border border-gray-600 bg-slate-200 rounded-2xl items-center justify-center h-100 sm:h-100 max-w-md w-full sm:w-8/12 resize-none"
          placeholder="Submeta a sua pergunta..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <Button
          size="icon"
          type="submit"
          variant="ghost"
          disabled={carregando}
          onClick={() => {4
            sendMessage(newQuestion);
            setNewQuestion(''); // Limpar o campo de texto após enviar
          }}
        >
          {carregando ? 'gerando... ' : <FaTelegramPlane className="text-slate-900 w-10 h-10" />}
        </Button>
      */}
              <Button
                className="inline-flex h-9 items-center justify-center rounded-md shadow-md shadow-cyan-400 bg-gradient-to-tr from-purple-400 via-blue-400 to-cyan-400 text-white px-4 text-sm font-medium"
                onClick={!carregando ? showModal : null}
                disabled={carregando}
              >
               {/*  {carregando ? (
                  <>
                    Gerando...
                    <PiSpinnerLight className="h-4 w-4 animate-spin ml-1" />
                  </>
                ) : (
                  
                   'Gerar Novamente' 
                )} */}
                Duvidas
              </Button>
              <Button
                className="inline-flex h-9 items-center justify-center rounded-md shadow-md shadow-cyan-400 bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-400 text-white px-4 text-sm font-medium"
                onClick={!carregando ? handleRouter : null}
                disabled={carregando}
              >
                Prosseguir para o Teste
              </Button>
              {/* <Button 
                className="inline-flex h-9 items-center justify-center rounded-md shadow-md shadow-cyan-400 bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-400 text-white px-4 text-sm font-medium"
               onClick={!carregando ? showModal : null}
                >
                 duvidas
                </Button> */}

             {/*  {message && (
            <Button
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-blue-600/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => handleTextToSpeech(message)}
            >
              Ouvir Resposta
            </Button>
          )} */}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* modal */}
      
    <Dialog  open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:w-[600px]  rounded-md ">
        <div className="flex flex-col h-[500px]">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle>Coloca as tuas duvidas sobre a temática aqui</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto py-2">
            {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 mb-4 ${
              chat.sender === 'user' ? 'justify-end' : ''
            }`}
          >
            <div className="bg-muted rounded-lg p-3 max-w-[70%]">
              <div className="text-sm">
              <TypingAnimation text={chat.message} />
              </div>
            </div>
          </div>
        ))}
            
          </ScrollArea>
          <div className="border-t px-4 py-3">
            <div className="relative">
              <Textarea
                placeholder="insira a sua duvida..."
                name="message"
                id="message"
                rows={1}
                value={userMessageInput}
                onChange={(e) => setUserMessageInput(e.target.value)}      
                className="min-h-[48px] rounded-2xl resize-none p-4 border border-neutral-400 shadow-sm pr-16"
              />
              <Button type="submit" size="icon" className="absolute w-8 h-8 top-3 right-3">
                <div className="p-2 bg-blue-100 rounded-full">
                
                 {isLoading ? (
                  <>
                    <PiSpinnerLight className="h-4 w-4 animate-spin ml-1 text-center" />
                  </>
                ) : (
                  
                  <HiArrowSmUp
                  className="w-6 h-6 "
                  /* onClick={sendMessage} */
                  onClick={() => {
                    sendMessage()
                    setUserMessageInput(''); // Limpar o campo de texto após enviar
                  }}
                  disabled={isLoading}
                  />
                )}
                </div>
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-12">
          <div>
            <div className="space-y-4  ">
              <h1 className=" text-lg font-bold tracking-tight md:text-3xl text-gray-900">
                                
                 <TypingAnimationHeader className='text-lg font-bold tracking-tight md:text-3xl text-gray-900' text={ `Módulo de ${ufcdName || 'Nenhum nome de módulo encontrado.'}` } />
              </h1>
              <p className="flex text-base text-gray-500">
                Aprendizagem dos conceitos associados a {ufcdName || 'Nenhum nome de módulo encontrado.'}
              </p>
            </div>
            <div className="mt-8">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-between">
                  <div className="flex items-center">
                    {/* <MailQuestionIcon className="h-12 w-12 text-gray-500" /> */}
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-800">Vamos trabalhar em conjunto.</h3>
                      <p className="text-base text-gray-700">Eu sou o MentorIA e estou aqui para te acompanhar na aprendizagem.</p>
                    </div>
                  </div>
                  <button
                    className="inline-flex h-9 items-center justify-center rounded-md shadow-md shadow-cyan-400 bg-gradient-to-tr from-cyan-400 via-blue-400 to-purple-400 text-white px-4 text-sm font-medium"
                    onClick={handleCardClick} 
                  >
                    <BsChatText />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 space-y-4 w-full md:max-w-xl mx-auto">
            <h2 className="text-base md:text-2xl font-extrabold text-gray-900 mb-4">Informações Gerais</h2>
            {matchingUfcds.length > 0 ? (
              matchingUfcds.map((ufcd, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-500">Carga Horária:</span>
                    <span className="text-gray-500">{ufcd['Carga Horária UFCD']}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-500">Componente:</span>
                    <span className="text-gray-500">{ufcd['Componente']}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-500">Formação:</span>
                    <span className="text-gray-500">{ufcd['Designação Área de Formação']}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between">
                    <span className="text-gray-500">Nível QNQ:</span>
                    <span className="text-gray-500">{ufcd['Nível QNQ']}</span>
                  </div>
                  {/* <div className="flex flex-wrap items-center justify-between">
          <span className="text-gray-500">Curso:</span>
          <span className="text-gray-500">{ufcd['Qualificação']}</span>
        </div> */}
                </div>
              ))
            ) : (
              <div className="animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-gray-200 w-24 h-4 rounded" />
                <span className="bg-gray-200 w-16 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-gray-200 w-24 h-4 rounded" />
                <span className="bg-gray-200 w-16 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="bg-gray-200 w-24 h-4 rounded" />
                <span className="bg-gray-200 w-24 h-4 rounded" />
              </div>
             {/*  <div className="bg-gray-200 dark:bg-gray-700 w-full h-4 rounded" />
              <div className="bg-gray-200 dark:bg-gray-700 w-full h-4 rounded" /> */}
            </div>
            )}
            <div className="space-y-8">
              <h3 className="text-base md:text-2xl font-semibold mt-20 text-gray-900">Sobre o Módulo</h3>
              <div className="text-gray-500">
                {response ? (
                  response
                ) : (
                  <>
                      <div className="animate-pulse space-y-2">
                        <div className="bg-gray-200 w-full h-4 rounded"></div>
                        <div className="bg-gray-200 w-full h-4 rounded"></div>
                      </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

  )
}
export default withAuth(Ufcd)




