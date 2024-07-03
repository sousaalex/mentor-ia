//pagina avaliacao
"use client";
import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig'
import "../globals.css";
import { Button } from "@/components/ui/button"
import { CardTitle, CardHeader, CardContent, Card, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      setContent(''); // Reset content when text changes
      if (text && text.length > 0) {
        for (let i = 0; i < text.length; i++) {
          if (!isMounted) return;
          await new Promise((resolve) => setTimeout(resolve, 35));
          if (isMounted) {
            setContent((prevContent) => prevContent + text.charAt(i));
          }
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
      <div className="text-display" dangerouslySetInnerHTML={{ __html: marked(content) }}/>
    </>
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
  const [certificadoStatus, setCertificadoStatus] = useState('');
  const [dia, setDia] = useState(null);



  useEffect(() => {
    const currentDate = new Date();
    const formatted = format(currentDate, 'dd/MM/yyyy HH:mm:ss');
    setDia(formatted);
  }, []);


 /*  useEffect(() => {
    const storedUfcdquestion = localStorage.getItem('chatHistory');
    setPergunta(storedUfcdquestion);
  }, []); */

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
    const storedUfcdquestion = localStorage.getItem('chatHistory');

    // Assegurando que generatedQuestions está definido
    let generatedQuestions = JSON.parse(localStorage.getItem('generatedQuestions')) || [];

    let promptContent = `De acordo com esta Aula "${DataAPI}" e esta conversa "${storedUfcdquestion}" se ela tiver conteudos relevantes de acordo a aula. Gere uma pergunta de quiz na com 4 opções de resposta somente de acordo com o conteudo que recebeste não podes desviar de forma alguma e não se esqueças o quizz têm que estar em português de portugal e muito robusto e difícil, sempre tens que fornecer emojis para as perguntas ficarem embelezadas na tela. ##As seguintes perguntas já foram geradas: ${JSON.stringify(generatedQuestions)} elas não podem ser reenviadas de forma alguma e nem perguntas idênticas a elas.`;

    setLoading(true);

    try {
        const response = await fetch("https://airequest1-5-pro-001.onrender.com/api/generate_quiz", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: promptContent }),
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar pergunta e opções de resposta");
        }

        const responseData = await response.json();
/*         console.log(responseData);
 */
        // Verifica se a resposta contém o campo response
        if (responseData.response) {
            // Extrai a pergunta do campo response usando regex
            const questionMatch = responseData.response.match(/question:\s*(.*?)(?:\n|$)/);
            const question = questionMatch ? questionMatch[1].trim() : null;

            // Extrai as opções do campo response usando regex
            const optionsMatch = responseData.response.match(/options:\s*([\s\S]*)/);
            /*             const optionsMatch = responseData.response.match(/options:\s*((?:\s*[a-d]\)\s.*?\n)+)/);
 */            let options = [];
            if (optionsMatch) {
                options = optionsMatch[1]
                    .split('\n')
                    .map(option => option.trim())
                    .filter(option => option.length > 0);
            }

            if (question && options.length === 4) {
               /*  console.log("Pergunta:", question);
                console.log("Opções:", options); */

                setGeneratedQuestions((prevQuestions) => {
                    const updatedQuestions = [...prevQuestions, question];
                    localStorage.setItem('generatedQuestions', JSON.stringify(updatedQuestions));
                    return updatedQuestions;
                });

                setQuestions((prevQuestions) => [
                    ...prevQuestions,
                    { question, options },
                ]);

                setCurrentQuestion({ question, options });
            } else {
                throw new Error("Resposta da API não contém uma pergunta válida ou não possui 4 opções");
            }
        } else {
            throw new Error("Resposta da API não contém campo response");
        }

        setLoading(false);
    } catch (error) {
        console.error("Erro ao carregar pergunta e opções de resposta:", error);
        setLoading(false);
    }
};

  

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

    if (currentQuestionIndex < 10) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      fetchQuestionAndOptionsFromOpenAI();
    } else {
      setShowQuestions(false);
      submitAnswers();
    }
  };

/* 
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
              content: `Você é um Mentor. Corrija as respostas de acordo com as perguntas originais, fornecça qual era a pergunta a reposta do Aluno ${user} e a correçao se necessaria some os pontos (4 pontos para cada resposta correta) ## Sejá muito atencioso na correção das respostas para que não haja problemas futuros. No final, mostre um campo "NOTA" e dê uma nota de 0 a 20. Se o campo "NOTA" for abaixo de 10, ofereça incentivo e apoio para tentar novamente. Em seguida mostre um campo "Permissão para certicado MentorIA" se o campo "NOTA" tiver um valor 10 ou abaixo de 10 neste campo será a sempre a palavra "Negada" e coloca um emogi correspondente. Se o campo "NOTA" tiver um valor acima dos 10 a palavra será sempre "Concedida" e coloca um emogi correspondente. Se o campo "NOTA" for entre 10 e 15, parabenize, mas sugira melhorias. Se o campo "NOTA" for de 15 a 20, celebre com palavras de incentivo e emojis encorajadores e aplavras bonitas. ##Não se esqueças de colocar markdown sempre na correção e nunca forneça correção dos teste em tabelas é inaceitavel`,
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
      processCertificationPermission(corrections);
    } catch (error) {
      console.error("Erro ao corrigir respostas:", error);
    }
  };
   */
  let Prompt = `corrija esta avaliação ${JSON.stringify(userAnswers)} do aluno ${user}`

  const submitAnswers = async () => {
    try {
      const response = await fetch("https://airequest1-5-pro-001.onrender.com/api/grade_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: Prompt,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Erro ao enviar respostas para correção");
      }
  
      const responseData = await response.json();
      const corrections = responseData.response;
/*       console.log(corrections);
 */      setResults(corrections);
      processCertificationPermission(corrections);
    } catch (error) {
      console.error("Erro ao corrigir respostas:", error);
    }
  };

  const removeEmojisAndToLowercase = (text) => {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}]/gu, '')
               .replace(/\*\*/g, '') 
               .toLowerCase();
  };
  
  const processCertificationPermission = (results) => {
    // Remove emojis and convert to lowercase
    const cleanedResults = removeEmojisAndToLowercase(results);
    // Regex to capture the certification permission
    const permissionRegex = /permissão para certificado mentoria: ([\w\s]*)/;
    const match = permissionRegex.exec(cleanedResults);
    if (match) {
      const permissionText = match[1].trim();
        const status = permissionText.includes("concedida") ? "Concedida" : "Negada";
          setCertificadoStatus(status)
    } else {
      console.log('Permissão para certificado MentorIA não encontrada.');
    }
  };
  
 

  /* funçao para recuperar ufcd */

  useEffect(() => {
    const storedUfcdName = localStorage.getItem('UFCD clicada');
    setUfcdName(storedUfcdName);
  }, []);


  const FormeDate = {
    name: user,
    modulo: ufcdName,
    correcao: results,
    dia: dia,
  }

 /*  const handlGgeneratePdf = async () => {
    setCarregando(true)
    
    try {
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
    }
    // Após 5 segundos, mudamos o estado e redirecionamos
    const timer = setTimeout(() => {
      setCarregando(false);
      router.push('/agradecimentos');
    }, 2000);

    // Limpa o timer caso o componente seja desmontado antes dos 5 segundos
    return () => clearTimeout(timer);

  }; */

  const handleGgeneratePdf = async () => {
    if (certificadoStatus === 'Concedida') {
      setCarregando(true);
      try {
        const response = await axios.post('/api/generate-pdf', FormeDate, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'MentorIA (correção).pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);  // Capture and display error details
      } finally {
        setCarregando(false);
      }
    } else {
      console.log('Certificado não concedido. Ação bloqueada.');
      return;
    }
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

  const handleModalOpen = () => {
    setModalOpen(true);
  }

  /* const handleExportPDF = () => {
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
  }; */

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
          <div className="border-t border-gray-300 pt-8">
            <div className="space-y-4">
            <div className="font-normal p-8 text-xl text-gray-800 text-center">
    {currentQuestion && currentQuestion.question && (
      <TypingAnimation text={currentQuestion.question} />
    )}
  </div>
  <div className="grid grid-cols-2 gap-4">
    {currentQuestion && currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
      <button
        key={index}
        className="text-blue-600 font-bold w-auto h-auto p-3 bg-transparent border border-blue-600 hover:bg-blue-600 hover:text-white rounded-lg"
        onClick={() => handleAnswerClick(option)}
      >
      <div className='text-blue-600'  dangerouslySetInnerHTML={{ __html: marked(option) }}/>
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
          </CardHeader>
          <CardContent >
            <ScrollArea id="capture-this" ref={contentRef} style={{ padding: 20 }} className=" h-full w-full rounded-md border ">
              <div className="p-4 text-sm">
                <div className="mt-4 leading-7">
                  <p className=" rounded-xl text-base  font-normal" dangerouslySetInnerHTML={{ __html: marked(results) }} />
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline"
              className="text-slate-800 border border-gray-700 rounded-md p-2 hover:bg-slate-100"
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
              Novo Teste
            </Button>
            <Button
        type="button"
        onClick={handleGgeneratePdf}
        className={`border rounded-md p-2 ${carregando ? 'bg-gray-500 cursor-not-allowed' : 'bg-slate-800 text-gray-50 hover:bg-transparent hover:border-slate-800 hover:text-slate-800'}`}
        disabled={carregando || certificadoStatus === 'Negada'}
      >
        {carregando ? 'Aguarde...' : 'Obter Certificado'}
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
