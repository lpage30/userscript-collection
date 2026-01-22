import React, { useState, JSX } from "react";
import { ItemSort } from "./datatypes";
import { Checkbox } from "primereact/checkbox";
import { PickList, PickOption } from "../common/ui/picklist"
import { toTitleCase } from "../common/functions";
import "../common/ui/styles.scss";

interface SortComponentProps {
  sortFields: string[]
  initialSorting: ItemSort[];
  registerGetSorting: (getSorting: () => ItemSort[]) => void;
  style?: React.CSSProperties
  trailingComponent?: JSX.Element
}
const toFieldOption = (field: string): PickOption<string> => ({
  label: toTitleCase(field.split('_').join(' ')),
  value: field,
})
const SortComponent: React.FC<SortComponentProps> = ({
  sortFields,
  initialSorting,
  registerGetSorting,
  style,
  trailingComponent,
}) => {
  const [sorting, setSorting] = useState<ItemSort[]>(initialSorting);
  const [selectedSortField, setSelectedSortField] = useState<string>(null);
  const sortFieldOptions: PickOption<string>[] = sortFields.map(toFieldOption);
  if (registerGetSorting) registerGetSorting(() => sorting)
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
          <tr style={{ alignItems: "center", verticalAlign: "top" }}>
            <td>
              <PickList
                options={sortFieldOptions}
                value={selectedSortField ? toFieldOption(selectedSortField) : undefined}
                onChange={(field: string) => setSelectedSortField(field)}
                placeholder="Sortable Fields"
                itemTemplate={(option) => {
                  const sorting = getSorting(option.value);
                  return (
                    <div style={{ display: 'flex' }} className={sorting === null ? "" : "highlight"}>
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
              <div style={{ display: "flex", padding: "2px", marginTop: '10px' }}>
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
                &nbsp;&nbsp;
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
                {trailingComponent && <div style={{ display: 'flex', float: 'right', marginTop: '-10px' }}>&nbsp;&nbsp;{trailingComponent}</div>}
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
