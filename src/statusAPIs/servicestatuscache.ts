import { ServiceStatus } from "./statustypes";

let ServiceStatusMap: { [service: string]: ServiceStatus } = {}
let DependentCompanyServicesMap: { [dependentCompany: string]: string[] } = {}

export function setServiceStatus(serviceStatus: ServiceStatus[]) {
    
    ServiceStatusMap = serviceStatus.reduce((serviceMap, status) => ({
        ...serviceMap,
        [status.serviceName]: status

    }), {} as { [service: string]: ServiceStatus })
    
    DependentCompanyServicesMap = serviceStatus.reduce((dependentMap, status) => {
        return status.dependentCompanies.reduce((result, companyName) => ({
            ...result,
            [companyName]: [...(result[companyName] ?? []), status.serviceName]
        }), {} as { [dependentCompany: string]: string[] })
    }, {} as { [dependentCompany: string]: string[] })
}

export function getServiceStatus(serviceOrCompanyName: string): ServiceStatus | null {
  const serviceNames = Object.keys(ServiceStatusMap)
  const foundServiceName = serviceNames.find(name => serviceOrCompanyName.includes(name))
  return foundServiceName ? ServiceStatusMap[foundServiceName] : null
}
export function getDependentServiceStatuses(companyName: string): ServiceStatus[] | null {
  const companyNames = Object.keys(DependentCompanyServicesMap)
  const foundCompanyName = companyNames.find(name => companyName.includes(name))
  return foundCompanyName ? DependentCompanyServicesMap[foundCompanyName].map(serviceName => ServiceStatusMap[serviceName]) : null
}