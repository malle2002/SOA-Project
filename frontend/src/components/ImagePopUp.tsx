import Image from "next/image";
import React, { useState,useEffect,useRef } from "react";

import ReactModal from "react-modal";

interface ImageProps {
    imageUrl:string;
    altText:string;
}
const ImagePopUp = ({ imageUrl, altText }:ImageProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  useEffect(() => {
    const handleClickOutside = (event:MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="object-cover w-full h-auto rounded-l-lg">
      <Image
        onClick={openModal}
        className="p-8 rounded-t-lg dark:text-white cursor-pointer w-full h-auto object-cover"
        src={imageUrl}
        alt={altText}
        width={1000}
        height={1000}
      />

      <ReactModal
        isOpen={isOpen}
        onRequestClose={closeModal}
        contentLabel="Cinema Image"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 p-4"
        appElement={document.getElementById('__next')??undefined}
      >
        <div className="relative bg-white p-2 rounded-lg" ref={modalRef}>
          <Image
            className="max-w-full max-h-full"
            src={imageUrl}
            alt={altText}
            width={600}
            height={600}
          />
        </div>
      </ReactModal>
    </div>
  );
};

export default ImagePopUp;
