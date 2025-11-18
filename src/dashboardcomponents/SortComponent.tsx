import React, { useState } from "react";
import { ItemSort } from "./datatypes";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { toTitleCase } from "../common/functions";
import "../common/ui/styles.css";

interface SortComponentProps {
  sortFields: string[]
  initialSorting: ItemSort[];
  onSortChange: (sorting: ItemSort[]) => void;
  style?: React.CSSProperties
}

const SortComponent: React.FC<SortComponentProps> = ({
  sortFields,
  initialSorting,
  onSortChange,
  style,
}) => {
  const [sorting, setSorting] = useState<ItemSort[]>(initialSorting);
  const [selectedSortField, setSelectedSortField] = useState<string>(null);
  const sortFieldOptions = sortFields.map((field) => ({
    label: toTitleCase(field.split('_').join(' ')),
    value: field,
  }));

  const handleSortingChange = (
    field: string,
    ascendingCheckbox: boolean,
    checked: boolean,
  ) => {
    const newSorting = checked
      ? [
          ...sorting,
          { field, ascending: ascendingCheckbox } as ItemSort,
        ]
      : sorting.filter(
          (item) =>
            !(item.field === field && item.ascending === ascendingCheckbox),
        );
    setSorting(newSorting);
    onSortChange(newSorting);
  };
  const getSorting = (
    fieldName: string,
  ): { ascending: boolean; order: number } | null => {
    const index = sorting.findIndex(({ field }) => field === fieldName);
    return index < 0
      ? null
      : { ascending: sorting[index].ascending, order: index + 1 };
  };

  const isCheckboxDisabled = (
    field: string | null,
    ascendingCheckbox: boolean,
  ): boolean => {
    if (field === null) return true;
    const sorting = getSorting(field);
    if (sorting === null || sorting.ascending === ascendingCheckbox)
      return false;
    return true;
  };

  const isCheckboxChecked = (
    field: string | null,
    ascendingCheckbox: boolean,
  ): boolean => {
    if (field === null) return false;
    const sorting = getSorting(field);
    if (sorting !== null && sorting.ascending === ascendingCheckbox)
      return true;
    return false;
  };
  const render = () => {
    return (
      <table
        style={{
          tableLayout: "auto",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "0",
          marginBottom: "auto",
          width: "100%",
          ...(style ?? {}),
        }}
      >
        <tbody>
          <tr style={{ alignItems: "center", verticalAlign: "center" }}>
            <td className="text-center">
              <Dropdown
                options={sortFieldOptions}
                optionLabel={"label"}
                optionValue={"value"}
                value={selectedSortField}
                onChange={(e) => setSelectedSortField(e.value)}
                placeholder="Sortable Fields"
                highlightOnSelect={false}
                style={{ width: "100%" }}
                itemTemplate={(option) => {
                  const sorting = getSorting(option.value);
                  return (
                    <div className={sorting === null ? "" : "highlight"}>
                      {option.label}
                      {sorting === null
                        ? ""
                        : sorting.ascending
                          ? ` (asc)${sorting.order}`
                          : ` (desc)${sorting.order}`}
                    </div>
                  );
                }}
              />
            </td>
            <td>
              <div style={{ display: "flex", padding: "5px" }}>
                <Checkbox
                  inputId="ascending-choice"
                  variant="filled"
                  onChange={(e) =>
                    handleSortingChange(selectedSortField, true, e.checked)
                  }
                  checked={isCheckboxChecked(selectedSortField, true)}
                  disabled={isCheckboxDisabled(selectedSortField, true)}
                  className="p-checkbox-sm"
                  style={{ marginTop: "3px" }}
                ></Checkbox>
                &nbsp;
                <label htmlFor={"ascending-choice"} className="text-sm">
                  Ascending
                </label>
              </div>
            </td>
            <td>
              <div style={{ display: "flex", padding: "5px" }}>
                <Checkbox
                  inputId="descending-choice"
                  variant="filled"
                  onChange={(e) =>
                    handleSortingChange(selectedSortField, false, e.checked)
                  }
                  checked={isCheckboxChecked(selectedSortField, false)}
                  disabled={isCheckboxDisabled(selectedSortField, false)}
                  className="p-checkbox-sm"
                  style={{ marginTop: "3px" }}
                ></Checkbox>
                &nbsp;
                <label htmlFor={"descending-choice"} className="text-sm">
                  Descending
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };
  return render();
};

export default SortComponent;
