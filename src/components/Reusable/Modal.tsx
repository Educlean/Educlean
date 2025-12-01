import { ModalData } from "../../../lib/types";
import Image from "next/image";


export default function Modal({ text, title, isOpen, onClose, className }: ModalData) {
    if (!isOpen) return null;

    return (
        <div className={`modal max-w-sm m-auto border bg-white ${className}`}>
            <h2>{title}</h2>
            <Image src="/modal-image.png" alt="Modal Image" width={400} height={200} />
            <p>{text}</p>
            <button onClick={onClose}>Close</button>
        </div>
    );
}
