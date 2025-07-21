import React from 'react';

interface DilemmaProps {
  dilemmaText: string;
  options: string[];
  onSelectOption: (option: string) => void;
}

const Dilemma: React.FC<DilemmaProps> = ({ dilemmaText, options, onSelectOption }) => {
  return (
    <div>
      <h2>Dilema</h2>
      <p>{dilemmaText}</p>
      <div>
        {options.map((option, index) => (
          <button key={index} onClick={() => onSelectOption(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dilemma;
