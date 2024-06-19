"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import '../globals.css'
import { useRouter } from 'next/navigation';
import withAuth from '../withAuth'
import { useState, useEffect, useRef } from "react";
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig'
import { marked } from 'marked';
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { HiMiniSpeakerXMark } from "react-icons/hi2";


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

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; 

const TypingAnimation = ({ text }) => {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      if (!text) return;  // Adicione esta verificação
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 55));
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
      <p className="rounded-xl text-base font-normal" dangerouslySetInnerHTML={{ __html: marked(content) }} />  
      <div ref={chatEndRef} />
    </>
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


function Congratulations() {

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastResponse, setLastResponse] = useState(''); // Novo estado para guardar a última resposta
  const [isSpeaking, setIsSpeaking] = useState(false); // Estado para controlar se está falando


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
    setLoading(true);
    
    const submitAnswers = async () => {
      const promptContent = `Crie uma mensagem curta e objetiva de agradecimento para o ${user} por usar a MentorIA. ##Seja muito criativo e comovente use palavras de afecto deixe o Aluno confortavel ao usar o MentorIA`;
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Você é um mentor e o seu nome é MentorIA e você tem que criar uma mensagem curta e objetiva para o aluno dizendo que você está muito grato por ele usar os nossos serviços. ## NÃO SE ESQUEÇA DE COLOCAR SEMPRE 2 EMOJIS, UM NO INÍCIO E UM NO FIM DE TODAS AS FRASES.",
              },
              {
                role: "user",
                content: promptContent,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao enviar respostas para correção");
        }

        const responseData = await response.json();
        const corrections = responseData.choices[0].message.content;
        setResults(corrections);
        setLastResponse(corrections); // Guarda a última resposta no estado
      } catch (error) {
        console.error("Erro ao corrigir respostas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      submitAnswers();
    } else {
      setLoading(false);
    }
  }, [user, apiKey]);

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


  
   const handleClick = () =>{
    router.push('/curso')
   }
  return (
    <Card className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-100  p-4 md:p-6">
      <div className="max-w-md w-full space-y-6 bg-white  rounded-lg shadow-lg p-6 md:p-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">MentorIA</h1>
          <div className="text-gray-500 ">
            {loading ?
              <div>
                <div className="max-w-xl space-y-2 animate-pulse ">
                  <p className="bg-gray-200 w-full h-4 rounded " />
                  <p className="bg-gray-200 w-full h-4 rounded" />
                  <p className="bg-gray-200 w-full h-4 rounded" />
                </div>
              </div>
              :
              <TypingAnimation text={results} />
              
              }
          </div>
        </div>
        <div className="flex items-center justify-center ">
          <Button
            className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-6 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            onClick={handleClick}
          >
            Ir para página de cursos
          </Button>
          <div onClick={handleSpeakClick} className="text-3xl text-gray-900 cursor-pointer font-extrabold ">
            {isSpeaking ? <HiMiniSpeakerWave /> : <HiMiniSpeakerXMark />}
          </div>
        </div>
      </div>
    </Card>
  )
}
export default withAuth(Congratulations)
