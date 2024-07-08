'use client'
import { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';

export default function TypingAnimation({ text }) {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 5)); // Ajuste o tempo para simular a digitação

        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));

          // Verificar se a API de vibração está disponível e vibrar o dispositivo móvel
          if ('vibrate' in navigator) {
            navigator.vibrate(50); // Vibra por 50 milissegundos
          }

          window.requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "instant" });
          });
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
      <p
        className="rounded-xl text-base font-normal"
        dangerouslySetInnerHTML={{ __html: marked(content) }}
        style={{ animation: 'fadeIn 0.5s ease-in-out' }} // Adiciona efeito de aparição
      />
      <div ref={chatEndRef} />
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            filter: blur(5px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        p {
          animation: fadeIn 0.5s ease-in-out; // Aplica a animação de fadeIn
        }
      `}</style>
    </>
  );
}
