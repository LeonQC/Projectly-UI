import React from "react";

const previewLists = [
  { cards: 2 },
  { cards: 3 },
  { cards: 1 },
];

function BoardPreview() {
  return (
    <div className="board-preview" aria-hidden="true">
      {previewLists.map((list, listIndex) => (
        <div className="preview-list" key={listIndex}>
          <span className="preview-list-title" />
          {Array.from({ length: list.cards }).map((_, cardIndex) => (
            <span className="preview-card" key={cardIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default BoardPreview;
