import { StatusLevel } from "../statusService"
export const CompanyHealthLevelTypeInfoMap = {
    danger: { rank: 1, bgColor: 'red', fgColor: 'white', displayName: 'Major Impact', statusLevel: StatusLevel.MajorOutage },
    warning: { rank: 2, bgColor: 'orange', fgColor: 'black', displayName: 'Minor Impact', statusLevel: StatusLevel.MinorOutage },
    success: { rank: 3, bgColor: 'green', fgColor: 'white', displayName: 'No Impact', statusLevel: StatusLevel.Operational }
}