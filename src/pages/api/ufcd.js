 import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { v4 as uuidv4 } from 'uuid';
import  firebaseConfig  from '../../firebaseConfig';

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

const database = firebase.database();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const snapshot = await database.ref('/ufcd').once('value');
      const ufcdData = snapshot.val();
      
      if (ufcdData) {
        const updates = {};
        Object.keys(ufcdData).forEach(key => {
          updates[`/ufcd/${key}/id`] = uuidv4();  // Adiciona um ID único a cada item
        });

        await database.ref().update(updates);
        console.log('IDs added successfully');
        res.status(200).json({ message: 'IDs added successfully' });
      } else {
        console.log('No data found');
        res.status(200).json({ message: 'No data found' });
      }
    } catch (error) {
      console.error('Error updating data', error);
      res.status(400).json({ error: 'Error updating data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
 