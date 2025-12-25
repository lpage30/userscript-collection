import React, {BaseSyntheticEvent} from "react";

interface CardShellProps {
  id: string
  index: number;
  onFocus: (index: number) => void;
  getStyle: (index: number) => React.CSSProperties;
  onMouseOver: (index: number) => void
  onMouseOut: (index: number) => void
  className?: string
  ignoreClickEvent?: (e: BaseSyntheticEvent) => boolean
}

const CardShell: React.FC<CardShellProps> = ({
  id,
  index,
  onFocus,
  getStyle,
  onMouseOver,
  onMouseOut,
  className,
  ignoreClickEvent,
}) => {
  return (
    <div
      id={id}
      tabIndex={index}
      onFocus={() => onFocus(index)}
      className={className}
      style={getStyle(index)}
      onClick={(e) => {
        if (ignoreClickEvent && ignoreClickEvent(e)) {
          return
        }
        if (e.currentTarget.firstElementChild) {
          const link = e.currentTarget.firstElementChild.querySelector('a')
          link.click()
        }
      }}
      onMouseOver={() => onMouseOver(index)}
      onMouseOut={() => onMouseOut(index)}
    ></div>
  );
};
export default CardShell;
