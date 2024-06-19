const jwt = require('jsonwebtoken');

// Chave de API e segredo obtidos da API PDF Generator
const API_KEY = process.env.NEXT_PUBLIC_TOKEN_API_KEY;
const API_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

// Função para gerar o JWT
export function gerarJWT() {
  const claims = {
    iss: API_KEY,                   
    sub: '56089',// Identificador da aplicação
    exp: Math.floor(Date.now() / 1000) + (15 * 60)  // Tempo de expiração (15 minutos a partir de agora)
  };

  try {
    // Gerar o JWT com o algoritmo HS256 e seu segredo de API
    const token = jwt.sign(claims, API_SECRET, { algorithm: 'HS256' });
    return token;
  } catch (error) {
    console.error('Erro ao gerar JWT:', error);
    return null; // ou lance uma exceção, dependendo do tratamento de erros desejado
  }
}
