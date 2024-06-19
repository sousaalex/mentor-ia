//pagina avaliacao
"use client";
import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig'
import "../globals.css";
import { Button } from "@/components/ui/button"
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CardTitle, CardDescription, CardHeader, CardContent, Card, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
 import { useRouter } from 'next/navigation';
import withAuth from '../withAuth'
import { marked } from 'marked';
import axios from 'axios';
import { format } from 'date-fns';


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

const TypingAnimation = ({ text }) => {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      setContent(''); // Reset content when text changes
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 35));
        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));
          /* window.requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="text-display">{content}</div>
{/*       <div ref={chatEndRef} />
 */}    </>
  );
};
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; 


function Quiz() {
  const contentRef = useRef();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [response, setResponse] = useState("");
  const [results, setResults] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar se o modal está aberto ou fechado
  const [curso, setCurso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [ufcdName, setUfcdName] = useState(null);
  const [pergunta, setPergunta] = useState(null)
  const [dia, setDia] = useState(null);



  useEffect(() => {
    const currentDate = new Date();
    const formatted = format(currentDate, 'dd/MM/yyyy HH:mm:ss');
    setDia(formatted);
  }, []); 


  useEffect(() => {
    const storedUfcdquestion = localStorage.getItem('chatHistory');
    setPergunta(storedUfcdquestion);
  }, []);

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
              const curso = user.curso
              setUser(nome);
              setCurso(curso)
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




  const fetchQuestionAndOptionsFromOpenAI = async () => {
    let DataAPI = localStorage.getItem("RespostaAPI");
  /*   if (DataAPI) {
      DataAPI = preprocessText(DataAPI);
      setResponse(DataAPI);
      console.log(DataAPI);
    } */
    let promptContent = `De acordo com esta Aula "${DataAPI}" e esta conversa "${pergunta}" se ela tiver conteudos relevantes de acorodo a aula. Gere um quiz com 4 opções de resposta somente de acrdo com o conteudo que recebeste não podes desviar de forma alguma e não se esqueças o quizz têm que estar em português de portugal, sempre tens que  fornecer emogis para as perguntas ficarem embelezadas na tela. ##As seguintes perguntas já foram geradas: ${JSON.stringify(generatedQuestions)} elas não podem ser reenviadas de forma alguma e nem  perguntas identicas a elas.`;
  
    setLoading(true);
  
    try {
      const messages = [
        {
          role: "system",
          content: "Você é um Mentor, é essencial manter um foco estrito nos assuntos que o aluno quer durante as interações e Você só deve gerar os quizzes de acordo com o prompt enviado pelo user. O quiz deve ser muito robusto e as perguntas precisam ser variadas e difíceis. Gere uma pergunta por vez, sempre com quatro opções de escolhas, uma delas correta. Exemplo: pergunta:; em baixo as opções.",
        },
        { role: "user", content: promptContent },
        { role: "assistant", content: "Dê-me uma pergunta com quatro opções de resposta." },
      ];
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Erro ao carregar pergunta e opções de resposta");
      }
  
      const responseData = await response.json();
      const assistantResponse = responseData.choices[0].message.content;
  
      const responseLines = assistantResponse.split("\n").filter(Boolean);
      const question = responseLines[0]?.trim();
      let options = responseLines.slice(1, 5).map((line) => line.trim());
  
      if (options.length < 4) {
        options = Array(4 - options.length).fill("Não sei").concat(options);
      }
  
      if (!question || options.length!== 4) {
        throw new Error("Formato inesperado da resposta do assistente");
      }
  
      setGeneratedQuestions((prevQuestions) => [...prevQuestions, question]); // Atualiza o estado com a nova pergunta
  
      setQuestions((prevQuestions) => [
       ...prevQuestions,
        {
          question,
          options,
        },
      ]);
  
      setCurrentQuestion({ question, options });
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar pergunta e opções de resposta:", error);
      setLoading(false);
    }
  };

/*   console.log(generatedQuestions)
 */
  useEffect(() => {
    fetchQuestionAndOptionsFromOpenAI();
  }, []);

  const handleAnswerClick = (option) => {
    setUserAnswers((prevAnswers) => [
      ...prevAnswers,
      {
        question: currentQuestion.question,
        userAnswer: option,
      },
    ]);

    if (currentQuestionIndex < 5) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      fetchQuestionAndOptionsFromOpenAI();
    } else {
      setShowQuestions(false);
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
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
              content: `Você é um Mentor. Corrija as respostas de acordo com as perguntas originais,fornecça qual era a pergunta a reposta do Aluno ${user} e a correçao se necessaria some os pontos (4 pontos para cada resposta correta). No final, dê uma nota de 0 a 20. Se a nota for abaixo de 10, ofereça incentivo e apoio para tentar novamente. Se for entre 10 e 15, parabenize, mas sugira melhorias. Se for de 15 a 20, celebre com palavras de incentivo e emojis encorajadores. ##Não se esqueças de colocar markdown sempre na correção e  nunca forneça correção dos teste em tabelas é inaceitavel`,
            },
            {
              role: "user",
              content: JSON.stringify(userAnswers),
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
/*       localStorage.setItem('correcao',corrections)
 */    } catch (error) {
      console.error("Erro ao corrigir respostas:", error);
    }
  };

  function preprocessText(text) {
    let cleanText = text.replace(/[^\w\s]/gi, "");
    cleanText = cleanText.split(/\s+/).slice(0, 800).join(" ");
    return cleanText;
  }

  /* funçao para recuperar onome */

  useEffect(() => {
    const storedUfcdName = localStorage.getItem('UFCD clicada');
    setUfcdName(storedUfcdName);
  }, []);


/*  useEffect(() => {
  // Recuperar dados do localStorage se existirem
  const storedCorrecao = localStorage.getItem('correcao');
  setCorrecao(storedCorrecao)
}, []); */

const FormeDate = {
  name:user,
  modulo:ufcdName,
  correcao:results,
  dia:dia,
}
/* console.log(FormeDate);
 */

const handlGgeneratePdf = async () => {
  setCarregando(true)
/*   setError(null); // Reset error state
 */  try {
    const response = await axios.post('/api/generate-pdf', FormeDate, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MentorIA (correção).pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // Capture and display error details
/*     const errorMessage = await error.response.data.text();
 */   /*  console.error('Error generating PDF:', errorMessage); */
/*     setError(`Error generating PDF: ${errorMessage}`);
 */  }
// Após 5 segundos, mudamos o estado e redirecionamos
const timer = setTimeout(() => {
  setCarregando(false);
  router.push('/agradecimentos');
}, 2000);

// Limpa o timer caso o componente seja desmontado antes dos 5 segundos
return () => clearTimeout(timer);

};

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleModalOpen = () =>{
    setModalOpen(true);
  }
 


/*  const handleExportPDF = () => {
  const input = contentRef.current;

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('MentorIA(teste).pdf');
  });
  router.push('/agradecimentos')
}; 
 */

const handleExportPDF = () => {
  const input = contentRef.current;

  // Reduzir o tamanho da fonte do conteúdo
  input.style.fontSize = '10px'; // Ajuste este valor conforme necessário

  html2canvas(input).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // Largura A4 em mm
    const pageHeight = 295; // Altura A4 em mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('MentorIA(teste).pdf');

    // Restaurar o tamanho da fonte original após a captura
    input.style.fontSize = '';

    // Redirecionar para a página de agradecimentos após o PDF ser salvo
    router.push('/agradecimentos');
  });
};





  
  
  
    
   

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center ">
        <div className="spinner border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Aguarde enquanto geramos uma pergunta pra si...</p>
      </div>
    );
  }

  if (showQuestions) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100" style={{ padding: 20 }}>
        <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
          <h1 className=" text-lg md:text-2xl font-bold mb-4 text-blue-900 text-center">
            Avaliação: {ufcdName || 'Nenhum nome de módulo encontrado.'}
          </h1>
        {/*   <p className="text-gray-700 mb-8 text-center">
            Neste módulo, você aprenderá os conceitos básicos de programação, incluindo variáveis, estruturas de controle e funções.
          </p> */}
          <div className="border-t border-gray-300 pt-8">
{/*             <h2 className="text-2xl font-bold mb-4 text-blue-900 text-center">Responda a pergunta abaixo</h2>
 */}            <div className="space-y-4">
              <div className=" font-normal p-8 text-xl text-gray-800 text-center">
               {/*  {currentQuestion && <p>{currentQuestion.question}</p>} */}
               {currentQuestion && <TypingAnimation text={currentQuestion.question} />}

              </div>
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion &&
                  currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className="text-blue-600 font-bold p-3 bg-transparent border border-blue-600  hover:bg-blue-600 hover:text-white rounded-lg"
                      onClick={() => handleAnswerClick(option)}
                    >
                      {option}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } else if (results) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
       
        {/* <Dialog open={modalOpen} onClose={handleCloseModal}> 
      <DialogTrigger asChild>
     </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] mx-auto">
        <DialogHeader>
          <DialogTitle>Enviar Convite</DialogTitle>
          <DialogDescription>
            Insira os e-mails do aluno e do professor para enviar o convite.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="student-email">
              E-mail do Aluno
            </Label>
            <Input required className="col-span-3" id="student-email" placeholder="aluno@exemplo.com" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right" htmlFor="teacher-email">
              E-mail do Professor
            </Label>
            <Input required className="col-span-3" id="teacher-email" placeholder="professor@exemplo.com" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Enviar Teste</Button>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog> */}
    {/*  */}

    <Card className=" h-full w-full max-w-2xl">
      <CardHeader>
        <CardTitle className='text-slate-700 font-extrabold'>
        <div className="mb-4 p-4 bg-white shadow-md shadow-cyan-200 rounded-lg">
                  <h2 className="text-xl text-slate-800 font-semibold mb-2">
                    Correção do Teste do Aluno <span className="text-gray-600">{user}</span>
                  </h2>
                  <p className="text-base text-slate-600">
                    Curso: <span className="font-medium">{curso}</span>
                  </p>
                </div>
          </CardTitle>
{/*         <CardDescription>Veja abaixo o resultado da correção do seu teste.</CardDescription>
 */}      </CardHeader>
      <CardContent >
        <ScrollArea id="capture-this" ref={contentRef} style={{ padding: 20 }} className=" h-full w-full rounded-md border ">
          <div className="p-4 text-sm">
             

            <div className="mt-4 leading-7">
{/*             {results}
 */}            <p className=" rounded-xl text-base  font-normal" dangerouslySetInnerHTML={{ __html: marked(results) }} />

            </div>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline"
         className="text-slate-800 border rounded-md p-2 hover:bg-slate-100"
         onClick={() => {
          fetchQuestionAndOptionsFromOpenAI();
          setCurrentQuestionIndex(0);
          setScore(0);
          setQuestions([]);
          setShowQuestions(true);
          setResults(null);
          setUserAnswers([]);
        }}
        >
          Reiniciar
          </Button>
     {/*   <Button className=" bg-slate-800 text-gray-50 border rounded-md p-2 hover:bg-transparent hover:border-slate-800 hover:text-slate-800"  onClick={handleExportPDF}  disabled={carregando}>
          {carregando ? 'Converting...' : ' Gerar PDF'}
    </Button> */} 
    <Button
     type="button" 
     onClick={handlGgeneratePdf}
     className=" bg-slate-800 text-gray-50 border rounded-md p-2 hover:bg-transparent hover:border-slate-800 hover:text-slate-800"
     disabled={carregando}
     >
    {carregando ? 'Gerando...' : ' Gerar PDF'}
    </Button>

      </CardFooter>
     
    </Card>
  
      </main>
      
      

    );
  } else {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="spinner border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Carregando resultados do seu teste aguarde...</p>
      </div>
    );
  }
}

export default withAuth(Quiz)
