import { ServiceStatus } from "./statustypes";

let globalServiceStatusMap: { [service: string]: ServiceStatus } = {}
let globalDependentCompanyServicesMap: { [dependentCompany: string]: string[] } = {}

export function setServiceStatus(serviceStatus: ServiceStatus[]) {
    
    globalServiceStatusMap = serviceStatus.reduce((serviceMap, status) => ({
        ...serviceMap,
        [status.serviceName]: status

    }), {} as { [service: string]: ServiceStatus })
    
    globalDependentCompanyServicesMap = serviceStatus.reduce((dependentMap, status) => {
        return status.dependentCompanies.reduce((result, companyName) => ({
            ...result,
            [companyName]: [...(result[companyName] ?? []), status.serviceName]
        }), dependentMap)
    }, {} as { [dependentCompany: string]: string[] })
}

export function getServiceStatus(serviceOrCompanyName: string): ServiceStatus | null {
  const serviceNames = Object.keys(globalServiceStatusMap)
  const foundServiceName = serviceNames.find(name => serviceOrCompanyName.includes(name))
  return foundServiceName ? globalServiceStatusMap[foundServiceName] : null
}
export function getDependentServiceStatuses(companyName: string): ServiceStatus[] | null {
  const companyNames = Object.keys(globalDependentCompanyServicesMap)
  const companyAsService = getServiceStatus(companyName)
  const foundCompanyName = companyNames.find(name => companyName.includes(name))
  let result: ServiceStatus[] | null = null
  if(foundCompanyName || companyAsService) {
    result = [
      companyAsService, 
      ...(globalDependentCompanyServicesMap[foundCompanyName] ?? [])
        .map(serviceName => globalServiceStatusMap[serviceName])
    ].filter(e => e != null)
    if (0 === result.length) {
      result = null
    }
  }
  return result
}