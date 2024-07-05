'use client'
import { useEffect, useState } from 'react';
import { IoCheckmark } from "react-icons/io5";
import TypingAnimation from './TypingAnimation'
export default function Skeleton() {
    const [text, setText] = useState('Obtendo os dados...');
    const [fade, setFade] = useState(true);
    const texts = ['Dados obtidos com sucesso✔️', 'Por Favor aguarde...', 'Estamos preparando tudo😉',];
  
    useEffect(() => {
      const interval = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setText(prevText => {
            const currentIndex = texts.indexOf(prevText);
            const nextIndex = (currentIndex + 1) % texts.length;
            return texts[nextIndex];
          });
          setFade(true);
        }, 500); // Tempo da animação de fade
      }, 5000);
  
      return () => clearInterval(interval);
    }, [texts]);

  return (
    <div className="flex flex-col gap-6 p-6 rounded-lg max-w-xl  mt-2">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-4">
          <div className={`flex transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-gray-900 flex items-center space-x-1 space-y-1">
              <span className=" font-normal animate-pulse" >{text}</span>
{/*               <IoCheckmark className="text-green-500" />
 */}            </p>
          </div>
          <div className=" h-3 w-full bg-gradient-to-tr  rounded animate-pulse"></div>
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-gradient-to-tr  rounded"></div>
            <div className="h-3 bg-gradient-to-tr  rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
