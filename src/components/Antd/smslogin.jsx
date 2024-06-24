// messageHandlers.js
import { message } from 'antd';

export const successo = () => {
  message.success('Entrada efectuada com sucesso.');
};

export const erroslogin = () => {
  message.error('Usuário não encontrado. Verifique o e-mail e tente novamente.');
};

export const warning = () => {
  message.warning('Senha incorreta. Tente novamente.');
};

export const campos = () => {
    message.warning('Preencha o campo Email');
  };

  export const camposemailesenha = () => {
    message.warning('Preencha todos os campos');
  };

  export const erro404 = ()=>{
    message.warning('Nenhum dado encontrado para o e-mail fornecido contactar administração')
  }
 
  export const pass = () => {
    message.warning('A senha deve ter pelo menos 6 caracteres');
  };

  export const mail = () => {
    message.warning('Email invalido');
  }
 