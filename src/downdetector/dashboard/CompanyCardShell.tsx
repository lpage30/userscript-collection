import React from "react";

interface CompanyCardShellProps {
  id: string
  index: number;
  onFocus: (index: number) => void;
  getStyle: (index: number) => React.CSSProperties;
  onMouseOver: (index: number) => void
  onMouseOut: (index: number) => void
}

const CompanyCardShell: React.FC<CompanyCardShellProps> = ({
  id,
  index,
  onFocus,
  getStyle,
  onMouseOver,
  onMouseOut,
}) => {
  return (
    <>
      <div
        id={id}
        tabIndex={index}
        onFocus={() => onFocus(index)}
        style={getStyle(index)}
        onClick={(e) => { 
          if (e.currentTarget.firstElementChild) {
            const link = e.currentTarget.firstElementChild.querySelector('a')
            link.click()
          }
        }}
        onMouseOver={() => onMouseOver(index)}
        onMouseOut={() => onMouseOut(index)}
      ></div>
    </>
  );
};
export default CompanyCardShell;
