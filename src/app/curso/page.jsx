'use client'
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import '../globals.css'
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig'
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, getAuth, signOut, } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import withAuth from '../withAuth'
import axios from 'axios';
import { Spin } from 'antd';
import { CiUser } from "react-icons/ci";
import { AiOutlineLogout } from "react-icons/ai";
import { TfiEmail } from "react-icons/tfi";
import { MdOutlineSettings } from "react-icons/md";
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogTrigger, DialogTitle, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog-copy"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
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


const apiCache = {};

const keepAlive = async () => {
  try {
    await fetch('https://airequest.onrender.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pergunta: 'quem é vc?' }),
    });
  } catch (error) {
    console.error('Erro ao enviar keep-alive request:', error);
  }
};






function Curso({ qualificacao }) {
  const router = useRouter();
  const auth = getAuth();
  const [user, setUser] = useState('');
  const [cardsToShow, setCardsToShow] = useState(4);
  const [dados, setDados] = useState(null);
  const [startIndex, setStartIndex] = useState(0);
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true); // Adicione este estado
  const [loadingMore, setLoadingMore] = useState(false);
  const [courseData, setCourseData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar se o modal está aberto ou fechado
  const [searchTerm, setSearchTerm] = useState('');
  const [courseName, setCourseName] = useState(null);
  const [userName, setUserName] = useState(null)
  const [userSurname, setUserSurname] = useState(null)
  const [userMail, setUserMail] = useState(null)

  useEffect(() => {
    keepAlive();
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
              const email = user.email
              // Definir o nome no estado (ou use conforme necessário)
              setUserName(nome);
              setUserMail(email)
            });
          } else {
          }
        })
        .catch((error) => {
          console.error('Erro ao recuperar dados do Firebase:', error.message);
        });
    } else {
    }
  }, []);


  // Função para fechar o modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Função para lidar com o clique no botão "Ver mais"
  const handleShowMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setStartIndex(startIndex + 4);
      setLoadingMore(false);
    }, 2000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      }

    });

    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
    const ref = firebase.database().ref('/qualifications');

    const fetchData = async () => {
      ref.on('value', (snapshot) => {
        const firebaseData = snapshot.val();
        if (firebaseData) {
          setData(Object.values(firebaseData));
        }
        setLoading(false);
      });

    };

    fetchData();

    return () => ref.off('value');
  }, []);

  const handleFiltroChange = (event) => {
    setFiltro(event.target.value);
  };

  // Filtrar os dados com base no valor do filtro
  const normalizeString = str => {
    return str
      .toLowerCase() // Converte para minúsculas
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove os sinais diacríticos
      .replace(/[^a-z0-9\s]/g, ''); // Remove caracteres especiais, mantendo letras, números e espaços
  };

  const dadosFiltrados = data.filter(item => {
    // Verifica se o item e a propriedade 'Qualificação' não são nulos ou indefinidos
    if (item && item.Qualificação) {
      // Normaliza a propriedade 'Qualificação' e o 'filtro'
      const qualificacaoNormalizada = normalizeString(item.Qualificação);
      const filtroNormalizado = normalizeString(filtro);

      // Verifica se 'qualificacaoNormalizada' inclui 'filtroNormalizado'
      return qualificacaoNormalizada.includes(filtroNormalizado);
    }
    // Se o item ou a propriedade 'Qualificação' for nulo ou indefinido, não inclui no array filtrado
    return false;
  });


  //funçao para  enviar o nome do curso presente no  card selecionado para a API de busca no banco de dados 

  const handleCardClick = async (courseName) => {
    setModalOpen(true);
    try {
      setLoading(true);
      const response = await axios.get(`/api/search?courseName=${encodeURIComponent(courseName)}`);
      if (response.status !== 200) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      const data = response.data;
      localStorage.setItem('courseName', courseName);

      localStorage.setItem('courseData', JSON.stringify(data));

      setLoading(false);
    } catch (error) {
      if (error.response && error.response.status) {
        console.error(`Erro HTTP ${error.response.status}:`, error.response.data);
      } else {
        console.error('Erro ao buscar módulos:', error);
      }
      setLoading(false);
    }
    const storedData = localStorage.getItem('courseData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const coursesArray = Object.values(parsedData).map(course => course);
      setCourseData(coursesArray);
    }
    const storedCourseName = localStorage.getItem('courseName');
    setCourseName(storedCourseName);
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const filteredCourses = courseData.filter(course =>
    course['UFCD'].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para lidar com o clique em UFCD
  const handleUFCDClick = (selectedData) => {
    const [ufcd, id] = selectedData.split(' _ ');
    localStorage.setItem('UFCD clicada', ufcd);
    localStorage.setItem('id', id);

    preencherEspacoNoModulo(ufcd);
  };

  // Função para preencher o espaço no módulo
  const preencherEspacoNoModulo = async (ufcd) => {
    // Montar o prompt com informações sobre o módulo e pré-requisitos
    const promptContent = `Para o módulo ${ufcd}, diz em uma frase Sobre o Módulo e Pré-requisitos `;
    const storageKey = "dadosDaAPI";

    try {
      setLoading(true);
      // Enviar o prompt para a API
      const respostaAPI = await fetch('https://airequest.onrender.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pergunta: promptContent,
        }),
      });

      const data = await respostaAPI.json();
      if (data && data.resposta) {
        localStorage.setItem(storageKey, JSON.stringify(data.resposta));
      } else {
        console.error('Resposta da API mal formada:', data);
      }
    } catch (error) {
      console.error('Erro ao enviar prompt para a API:', error);
    }
    router.push('/modulos')
    setLoading(false);
  };

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
  }


  return (
    <div className="bg-slate-100 text-white min-h-screen overflow-y-hidden">
      <div className="p-4 flex flex-col justify-center items-center">
        <div className="w-full sm:w-auto  border-gray-200 flex items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center">
              <span className="h-5 w-5  text-gray-500 font-bold">
                Curso:
              </span>
            </div>
            <Input
              type="text"
              placeholder="Nome do Curso"
              className="w-full rounded-full bg-gray-100 px-20 sm:mt-0 mt-2 text-slate-600"
              onChange={handleFiltroChange}
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-slate-600 border-none p-0">
                    <MdOutlineSettings className="h-5 w-5 sm:mt-0 mt-2 text-gray-500 border-none hover:text-cyan-400 animate-spin" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem >
                    <CiUser className="mr-2 h-4 w-4 text-slate-800 " />
                    Nome: {userName} {userSurname}
                  </DropdownMenuItem>
                  <DropdownMenuItem >
                    <TfiEmail className="mr-2 h-4 w-4 text-slate-800 " />
                    Email: {userMail}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} >
                    <AiOutlineLogout className="mr-2 h-4 w-4 text-slate-800 " />
                    Sair
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <section className="py-8 md:py-16 lg:py-20 bg-gray-100 ">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <h2 className=" text-lg font-bold tracking-tight text-gray-900  sm:text-4xl sm:text-center   md:text-3xl mb-4">Bem-vindo {userName}, Fique avontade para Explorar os nossos cursos</h2>
            <p className="max-w-xl mx-auto text-gray-500 md:text-xl lg:text-base xl:text-xl  mb-8">Encontre o seu curso abaixo ou utilize a barra de pesquiza acima para encontra-lo.</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {loading || loadingMore ? (
                <div className="w-full h-full fixed top-0 left-0 bg-black bg-opacity-50 flex justify-center items-center">
                  <div className="flex justify-center items-center text-center space-x-2">
                    <Spin size="small" />

                  </div>
                </div>
              ) : (
                dadosFiltrados.slice(startIndex, startIndex + 4).map((item) => (
                  <div
                    key={uuidv4()}
                    onClick={() => handleCardClick(item.Qualificação)}
                    className="group flex flex-col rounded-lg border border-gray-200 bg-white p-6 transition-all hover:shadow-2xl cursor-pointer"
                  >

                    <div className='flex '>
                      <div className="h-1 w-1 p-2 animate-bounce mt-2 rounded-full bg-cyan-400 mr-2"></div>
                      <div className="">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-cyan-400  hover:underline">
                            {item.Qualificação}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">{item["Área de Formação"]}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        {!loading && !loadingMore && startIndex + 4 < dadosFiltrados.length && (
          <div className="flex justify-center">
            <button onClick={handleShowMore} className=" bg-slate-200 mt-4  hover:bg-gray-300 text-slate-700 font-bold py-2 px-4 rounded transition-colors">
              Ver mais
            </button>
          </div>
        )}
        <Dialog open={modalOpen} onClose={handleCloseModal}>
          <DialogTrigger asChild>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>

              <DialogTitle className='text-md text-gray-600 p-2'>Selecione um módulo relativamente ao curso {courseName || <Spin size="small" />}</DialogTitle>
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <span className="h-5 w-5  text-gray-500 font-bold">
                  Módulo:
                  </span>
                </div>
                <Input
                  type="text"
                  placeholder="nome da módulo"
                  className="w-full sm:mt-0 mt-2 rounded-full bg-gray-100 px-20  text-slate-600"
                  onChange={handleSearch}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <DropdownMenu>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem >
                        <CiUser className="mr-2 h-4 w-4" />
                        Nome: {userName} {userSurname}
                      </DropdownMenuItem>
                      <DropdownMenuItem >
                        <TfiEmail className="mr-2 h-4 w-4" />
                        Email: {userMail}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} >
                        <AiOutlineLogout className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <div className="p-4">
                {loading || loadingMore ? (
                  <div className="w-full h-full fixed top-0 left-0 bg-white bg-opacity-50 backdrop-blur-sm flex justify-center items-center">
                    <div className="flex justify-center items-center text-center space-x-2">
                      <Spin size="small" />
                      <p>Esta acção poderá tomar alguns minutos...</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course, index) => (
                        <div key={index}>
                          <p
                            className="font-bold text-base p-3 text-gray-800 hover:underline hover:text-cyan-400 cursor-pointer "
                            onClick={() => handleUFCDClick(`${course['UFCD']} _ ${course.id}`)}                          >
                            módulo: {course['UFCD']} {/* - {course.id} */}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum módulo encontrado</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <div>
                <Button variant="outline" onClick={handleCloseModal} className='text-gray-800 border border-gray-400 hover:bg-gray-200 p-2'>Fechar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
export default withAuth(Curso)
