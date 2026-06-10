import { useEffect, useState } from 'react';

const greetings = ['Hello', 'Welcome', 'Namaste', 'Bonjour'];
const rotatingLines = [
  'Curated communities for engineers, creators, and technical teams.',
  'Professional event discovery, role-based control, and smarter engagement.',
  'A polished collaboration hub designed for focused technical growth.',
];

function AuthShowcase() {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [typedGreeting, setTypedGreeting] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const currentGreeting = greetings[greetingIndex];
    let characterIndex = 0;
    setTypedGreeting('');

    const typeTimer = setInterval(() => {
      characterIndex += 1;
      setTypedGreeting(currentGreeting.slice(0, characterIndex));
      if (characterIndex >= currentGreeting.length) {
        clearInterval(typeTimer);
      }
    }, 50);

    const greetingTimer = setTimeout(() => {
      setGreetingIndex((current) => (current + 1) % greetings.length);
    }, 2200);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(greetingTimer);
    };
  }, [greetingIndex]);

  useEffect(() => {
    const currentLine = rotatingLines[lineIndex];
    let characterIndex = 0;
    setTypedText('');

    const typeTimer = setInterval(() => {
      characterIndex += 1;
      setTypedText(currentLine.slice(0, characterIndex));
      if (characterIndex >= currentLine.length) {
        clearInterval(typeTimer);
      }
    }, 34);

    const lineTimer = setTimeout(() => {
      setLineIndex((current) => (current + 1) % rotatingLines.length);
    }, 3600);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(lineTimer);
    };
  }, [lineIndex]);

  
  return (
    <section className="auth-showcase">
      <h1 className="script-heading">{typedGreeting}</h1>
      <h2 className="auth-showcase-title">Welcome to CommunityConnect</h2>
      <p className="typing-line">{typedText}</p>
      <div className="highlight-list">
        <span>Priority-based updates</span>
        <span>Secure admin controls</span>
        <span>Professional event management</span>
      </div>
    </section>
  );
}

export default AuthShowcase;
