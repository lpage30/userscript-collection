
export const AWSDependentCompanies = [
    'Netflix',
    'Hulu',
    'Max',
    'Peacock',
    'Snapchat',
    'Signal',
    'Roblox',
    'Twitch',
    'LinkedIn',
    'Adobe',
    'Airbnb',
    'Epic Systems',
    'Claude AI',
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const AzureDependentCompanies = [
    'Microsoft Teams',
    'Microsoft Store',
    'Microsoft Outlook',
    'Microsoft 365',
    'Epic Systems',
    'Adobe',
    'Autodesk',
    'Claude AI',
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const OCIDependentCompanies = [
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const IBMDependentCompanies = [
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const GCPDependentCompanies = [
    'Google', 
    'Google Gemini',
    'Gmail',
    'YouTube',
    'Google Maps',
    'Google Drive',
    'Waze',
    'Spotify',
    'Claude AI',
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const CloudflareDependentCompanies = [
  'Amazon Web Services',
  'Amazon',
  'OpenAI',
  'X (Twitter)',
  ...AWSDependentCompanies,
  ...AzureDependentCompanies,
  ...GCPDependentCompanies,
  ...IBMDependentCompanies,
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)