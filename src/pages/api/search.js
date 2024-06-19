// pages/api/search.js
import { v4 as uuidv4 } from 'uuid';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import firebaseConfig from '../../firebaseConfig';

// Inicialização do Firebase
if (!firebase.apps.length) {
 firebase.initializeApp(firebaseConfig);
}

export default async function handler(req, res) {
 const { query: { courseName } } = req;

 if (!courseName) {
    return res.status(400).json({ error: 'Nome do curso não fornecido' });
 }

 try {
    const ref = firebase.database().ref('/ufcd');
    // Removido limitToFirst(1) para buscar todos os módulos relacionados ao curso
    const snapshot = await ref.orderByChild('Qualificação').equalTo(courseName).once('value');
    const data = snapshot.val();
    // Agora 'data' deve conter todos os módulos relacionados ao 'courseName'
    if (data) {
        // Retorna todos os módulos encontrados.
        return res.status(200).json(data);
        
    } else {
        // Retorna um erro se nenhum resultado for encontrado.
        return res.status(404).json({ error: 'Qualificação não encontrada' });
    }
 } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return res.status(500).json({ error: 'Erro ao buscar módulos' });
 }
}
