import React, { BaseSyntheticEvent } from "react";

interface CardShellProps {
  id: string
  index: number;
  onFocus: (index: number) => void;
  getStyle: (index: number) => React.CSSProperties;
  onMouseOver: (index: number) => void
  onMouseOut: (index: number) => void
  className?: string
}
const CardShell: React.FC<CardShellProps> = ({
  id,
  index,
  onFocus,
  getStyle,
  onMouseOver,
  onMouseOut,
  className,
}) => {
  return (
    <div
      id={id}
      tabIndex={index}
      onFocus={() => onFocus(index)}
      className={className}
      style={getStyle(index)}
      onMouseOver={() => onMouseOver(index)}
      onMouseOut={() => onMouseOut(index)}
    ></div>
  );
};
export default CardShell;
