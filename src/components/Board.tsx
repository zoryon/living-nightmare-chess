import { BoardType } from "@/types";
import { useEffect, useState } from "react";

const Board = ({ board }: { board: BoardType | null }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (!board) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="space-y-3 text-center">
                    <div className="mx-auto w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`mx-auto bg-gray-800 rounded-lg overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            style={{
                aspectRatio: "1 / 1",
                maxWidth: "min(90vw, 90vh - 8rem)"
            }}
        >
            <div className="grid h-full w-full">
                {board.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-8">
                        {row.map((cell, colIdx) => {
                            const isDark = (rowIdx + colIdx) % 2 === 1;
                            return (
                                <div
                                    key={colIdx}
                                    className={`aspect-square flex justify-center items-center relative
                    ${isDark ? "bg-gray-700" : "bg-gray-800"}
                    transition-colors duration-150`}
                                >
                                    {cell && (
                                        <span className={`text-xl md:text-2xl font-medium ${cell.color === 'white'
                                                ? 'text-gray-100'
                                                : 'text-gray-900'
                                            }`}>
                                            {cell.type}
                                        </span>
                                    )}

                                    {/* Coordinates */}
                                    {rowIdx === 7 && (
                                        <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-500">
                                            {String.fromCharCode(97 + colIdx)}
                                        </span>
                                    )}
                                    {colIdx === 0 && (
                                        <span className="absolute top-0.5 left-1 text-[8px] text-gray-500">
                                            {8 - rowIdx}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Board;