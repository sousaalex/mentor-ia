/* import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, modulo, correcao} = req.body;
    try {
      const response = await axios.post(
        'https://us1.pdfgeneratorapi.com/api/v4/documents/generate',
        {
          template: {
            id: '1105609',
            data: {
              Name: name,
              Modulo: modulo,
              Correcao: correcao
            }
          },
          format: 'pdf',
          output: 'base64', // Alterado para base64 para enviar o conteúdo do PDF
          name: 'Certificate Mentor'
        },
        {
          headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjOTU0ODg0MTA4ZDU3YWNmZTBkYTg1YTc0NDRlOGUwN2MyM2QyM2ZjMDJkZTRlN2JhYzMyMzYwY2U2NGIzZWNkIiwic3ViIjoiNTYwODkiLCJleHAiOjE3MTg2MTcxNDQsImlhdCI6MTcxODYxNjI0NH0.VeTHaaaLiRiq-uUaNcghjDWCtl0J8xrz7dCQhLDFnqw"
            ,
            'Content-Type': 'application/json'
          }
        }
      );

      const pdfBuffer = Buffer.from(response.data.response, 'base64');
      res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error.response ? error.response.data : error.message);
      res.status(500).json({
        error: 'Error generating PDF',
        details: error.response ? error.response.data : error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} */
 

/* import axios from 'axios';

let accessToken = ''; // Variável para armazenar o token JWT temporário

// Função para obter um novo token JWT temporário
const fetchAccessToken = async () => {
  try {
    const response = await axios.post('https://us1.pdfgeneratorapi.com/api/v4/token', {
      lifetime: '15m' // Tempo de vida do token, por exemplo, 15 minutos
    });

    const newAccessToken = response.data.token;

    if (!newAccessToken) {
      throw new Error('Token JWT não recebido');
    }

    return newAccessToken;
  } catch (error) {
    console.error('Erro ao obter novo token:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao obter token');
  }
};

// Função para verificar se o token está expirado
const isAccessTokenExpired = (token) => {
  if (!token) return true; // Se não houver token, está expirado
  const decodedToken = JSON.parse(atob(token.split('.')[1]));
  const expiry = decodedToken.exp * 1000; // Convertendo para milissegundos
  const now = Date.now();
  return now > expiry;
};

// Função para obter o token, renovando-o se estiver expirado
const getValidToken = async () => {
  if (isAccessTokenExpired(accessToken)) {
    try {
      accessToken = await fetchAccessToken();
    } catch (error) {
      console.error('Erro ao renovar token:', error.message);
      throw new Error('Falha ao renovar token');
    }
  }
  return accessToken;
};

// Endpoint para gerar o PDF
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, modulo, correcao } = req.body;
    try {
      const validToken = await getValidToken();

      const response = await axios.post(
        'https://us1.pdfgeneratorapi.com/api/v4/documents/generate',
        {
          template: {
            id: '1105609',
            data: {
              Name: name,
              Modulo: modulo,
              Correcao: correcao
            }
          },
          format: 'pdf',
          output: 'base64',
          name: 'Certificate Mentor'
        },
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const pdfBuffer = Buffer.from(response.data.response, 'base64');
      res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error.response ? error.response.data : error.message);
      res.status(500).json({
        error: 'Erro ao gerar PDF',
        details: error.response ? error.response.data : error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
 */


import axios from 'axios';
import { gerarJWT } from '../../pages/api/jwtUtils'; // Importe a função gerarJWT do seu arquivo jwtUtils

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, curso, modulo, correcao, currentDate, nota} = req.body;
    
    try {
      // Gera o token JWT dinamicamente
      const tokenJWT = gerarJWT();            
      // Verifica se o tokenJWT foi gerado corretamente
      if (!tokenJWT) {
        throw new Error('Falha ao gerar token JWT');
      }

      // Faz a requisição para gerar o PDF
      const response = await axios.post(
        'https://us1.pdfgeneratorapi.com/api/v4/documents/generate',
        {
          template: {
            id: '1105609',
            data: {
              Dia:currentDate,
              Name: name,
              Nota: nota,
              Modulo: modulo,
              Curso: curso,
              Correcao: correcao
            }
          },
          format: 'pdf',
          output: 'base64', // Alterado para base64 para enviar o conteúdo do PDF
          name: 'Certificate Mentor'
        },
        {
          headers: {
            Authorization: `Bearer ${tokenJWT}`, // Utiliza o tokenJWT gerado dinamicamente aqui
            'Content-Type': 'application/json'
          }
        }
      );

      // Converte o PDF de base64 para um buffer e envia como resposta
      const pdfBuffer = Buffer.from(response.data.response, 'base64');
      res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error.response ? error.response.data : error.message);
      res.status(500).json({
        error: 'Erro ao gerar PDF',
        details: error.response ? error.response.data : error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
