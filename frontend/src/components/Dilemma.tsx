import React from 'react';

interface DilemmaProps {
  dilemmaText: string;
  options: string[];
  onSelectOption: (option: string) => void;
  isLoading: boolean; // Prop para deshabilitar botones
}

const Dilemma: React.FC<DilemmaProps> = ({ dilemmaText, options, onSelectOption, isLoading }) => {
  return (
    <div>
      <h2>Dilema</h2>
      <p>{dilemmaText}</p>
      <div>
        {options.map((option, index) => (
          <button key={index} onClick={() => onSelectOption(option)} disabled={isLoading}>
            {isLoading ? 'Procesando...' : option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dilemma;