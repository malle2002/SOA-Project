import React from 'react';

interface SeatType {
    seatGroup: string;
    row: number;
    column: number;
    isTaken: boolean;
}

interface SeatProps {
  seat: SeatType;
  onSelect: (seat: SeatType) => void;
  isSelected: boolean;
}

const Seat: React.FC<SeatProps> = ({ seat, onSelect, isSelected  }) => {
  const { row, column, isTaken } = seat;
  const isDisabled = isTaken;
  const seatClasses = `
    w-10 h-10 m-1 border rounded
    ${isDisabled ? 'bg-red-500 cursor-not-allowed' : (isSelected ? 'bg-green-400' : 'bg-gray-300 hover:bg-gray-400')}
  `;
  
  return (
    <button
      className={seatClasses}
      onClick={() => !isDisabled && onSelect(seat)}
      disabled={isDisabled}
    >
      {row}-{column}
    </button>
  );
};

export default Seat