import React from "react";
 import { getAuth, onAuthStateChanged } from "firebase/auth";
import firebase from "firebase/compat/app";
import firebaseConfig from "../firebaseConfig";
import { GrCircleAlert } from "react-icons/gr";
import { Spin } from "antd";
import Link from "next/link";


// Inicialização do Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = getAuth(app); // Cria uma instância de auth

class WithAuth extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      isChecking: true,
    };
  }

  componentDidMount() {
    const { router } = this.props;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        this.setState({
          isChecking: false,
          isAuthenticated: !!user,
        });
        if (!user && router) {
           router.replace("/login");
         }
      },
      (error) => {
        console.error("Erro ao verificar autenticação:", error);
        this.setState({
          isChecking: false,
        });
      }
    );

    this.unsubscribe = unsubscribe;
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const { isChecking, isAuthenticated } = this.state;
    const { router, Component, ...props } = this.props; // Corrigindo aqui para passar o Component

    if (isChecking) {
      return (
        <div className="w-full h-full fixed top-0 left-0  flex justify-center items-center">
          <div className="flex justify-center items-center text-center space-x-2">
            <Spin size="small" />
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-200 bg-cover bg-center">
      <div className="flex flex-col items-center space-y-4">
        <GrCircleAlert className="h-16 w-16 text-red-500" />
        <h1 className="text-3xl font-bold text-center">404 - Pagina bloqueada</h1>
        <p className="text-gray-600 text-center">Para aproveitar todos os recursos da MentorIA, por favor conte-se a sua conta se já verificaste o seu email.</p>
        <Link
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 "
          href="/login"
        >
          Fazer login
        </Link>
      </div>
    </div>
      );
    }

    // Renderiza o componente filho passando as props
    return React.createElement(Component, props);
  }
}

export default function withAuth(Component) {
  return function WrappedWithAuth(props) {
    return <WithAuth {...props} Component={Component} />;
  };
}
