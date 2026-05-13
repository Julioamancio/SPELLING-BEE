import { useState, useEffect } from 'react';

export function useSpellCheck(word: string) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!word || word.trim().length < 2) {
      setIsValid(null);
      setSuggestions([]);
      return;
    }

    const checkWord = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(`https://api.languagetool.org/v2/check?language=en-US&text=${encodeURIComponent(word.trim())}`);
        if (response.ok) {
          const data = await response.json();
          const matches = data.matches || [];
          if (matches.length > 0) {
            // Found spelling errors
            setIsValid(false);
            const reps = matches[0].replacements?.slice(0, 3).map((r: any) => r.value) || [];
            setSuggestions(reps);
          } else {
            setIsValid(true);
            setSuggestions([]);
          }
        }
      } catch (error) {
        setIsValid(null); 
      } finally {
        setIsChecking(false);
      }
    };

    const debounceId = setTimeout(checkWord, 300);
    return () => clearTimeout(debounceId);
  }, [word]);

  return { isValid, suggestions, isChecking };
}
