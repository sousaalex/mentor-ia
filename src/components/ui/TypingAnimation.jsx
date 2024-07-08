'use client'
import { useEffect, useState, useRef } from 'react';

export default function TypingAnimation({ text }) {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 50)); // Ajuste o tempo para simular a digitação

        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));

          // Verificar se a API de vibração está disponível e vibrar o dispositivo móvel
          if ('vibrate' in navigator) {
            navigator.vibrate(10); // Vibra por 10 milissegundos (ajuste conforme necessário)
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
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <div ref={chatEndRef} />
    </>
  );
}
