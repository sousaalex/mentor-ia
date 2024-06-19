import { notification } from 'antd';
import { message } from 'antd';

export const openInfoNotification = (placement) => {
  notification.info({
    message: `MentorIA`,
    description:
      'Um e-mail de redefinição de senha foi enviado para seu endereço de e-mail.',
    placement,
  });
};

export const successReset = () => {
  message.success('Logado com sucesso. Aguarde até ser direcionado para a página curso.');
};

export const errosReset = () => {
  message.error('Usuário não encontrado. Verifique o e-mail e tente novamente.');
};

export const warningReset = () => {
  message.warning('Preencha o campo Email.');
};
