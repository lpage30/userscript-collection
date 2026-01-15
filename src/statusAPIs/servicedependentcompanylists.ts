
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
    'Meta',
    'Facebook',
    'Instagram',
    'Spectrum',
    'Verizon',
    'T-Mobile',
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
    'Unitedhealth',
    'Meta',
    'Facebook',
    'Instagram',
    'CVS',
    'Walgreens',
    'Spectrum',
    'AT&T',

].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const OCIDependentCompanies = [
    'Dropbox',
    'FedEx',
    'Experian',
    'Cognizant',
    'NationalGrid',
    'Zoom',
    'Uber',
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const IBMDependentCompanies = [
    'Infosys',
    'Deloitte',
    'Cognizant',
    'United Airlines',
    'Walmart',
    'Exxon',
    'Visa',
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
    'Apple',
    'Meta',
    'Facebook',
    'Instagram',
    'T-Mobile',
    'Discord',
    'Starlink',
    'Verizon',
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const CloudflareDependentCompanies = [
  'Amazon Web Services',
  'Amazon',
  'OpenAI',
  'X (Twitter)',
  'Spotify',
  'Shopify',
  ...AWSDependentCompanies,
  ...AzureDependentCompanies,
  ...GCPDependentCompanies,
  ...IBMDependentCompanies,
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const DigitalOceanDependentCompanies = [
    'WordPress',
    'GitLab',
    'GitHub',
    'Scribe',
    'Cheddar'
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const AkamaiDependentCompanies = [
    'Wayfair',
    'Amazon',
    'Walmart',
    'IBM',
    'Salesforce',
    'Intuit',
    'Oracle',
    'Rakuten',
    'mailchimp',

].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)

export const FastlyDependentCompanies = [
    'Wayfair',
    'Amazon',
    'GitHub',
    'Slack'
].sort().filter((company, index, array) => index === 0 || array[index - 1] !== company)
