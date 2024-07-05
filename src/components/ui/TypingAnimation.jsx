'use client'
import {useEffect, useState, useRef} from 'react'
import { marked } from 'marked';

export default function TypingAnimation({ text }) {
  const [content, setContent] = useState('');
  const chatEndRef = useRef(null);


  useEffect(() => {
    let isMounted = true;

    const animateText = async () => {
      for (let i = 0; i < text.length; i++) {
        if (!isMounted) return;
        await new Promise((resolve) => setTimeout(resolve, 2));
        if (isMounted) {
          setContent((prevContent) => prevContent + text.charAt(i));
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
      <p className=" rounded-xl text-base  font-normal" dangerouslySetInnerHTML={{ __html: marked(content) }} />
      <div ref={chatEndRef} />
    </>
  );
};

