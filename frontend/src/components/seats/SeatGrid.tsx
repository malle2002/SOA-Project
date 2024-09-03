import React from 'react';
import Seat from './Seat';

interface SeatType {
    seatGroup: string;
    row: number;
    column: number;
    isTaken: boolean;
}

interface SeatGroupType {
    seatGroup: string;
    rows: number;
    columns: number;
    seats: SeatType[];
}

interface SeatGridProps {
    seatGroup: SeatGroupType;
    selectedSeats: SeatType[];
    onSelectSeat: (seat: SeatType) => void;
}

const SeatGrid: React.FC<SeatGridProps> = ({ seatGroup, selectedSeats, onSelectSeat }) => {
  const rows = Array.from({ length: seatGroup.rows }, (_, rowIndex) =>
    seatGroup.seats.filter(seat => seat.row === rowIndex + 1)
  );

  return (
    <div className="flex flex-col mb-5 lg:mb-0">
      <h1 className='text-2xl dark:text-white text-center'>{seatGroup.seatGroup}</h1>
      {rows.map((rowSeats, rowIndex) => (
        <div key={rowIndex} className="flex">
          {rowSeats.map((seat, seatIndex) => {
            const isSelected = selectedSeats.some(
              s => s.row === seat.row && s.column === seat.column && s.seatGroup === seat.seatGroup
            );
            
            return (
              <Seat
                key={`${seatGroup.seatGroup}-${seat.row}-${seat.column}`}
                seat={seat}
                onSelect={onSelectSeat}
                isSelected={isSelected}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SeatGrid