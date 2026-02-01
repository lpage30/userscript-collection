import React from 'react'
import { CompanyMetadata } from './CompanyTypes'

interface CompanyDownDetectorCardProps {
  id: string
  company: CompanyMetadata
}

export const CompanyDownDetectorCard: React.FC<CompanyDownDetectorCardProps> = ({
  id,
  company
}) => {
  const companyDivMetadata = company.companyDiv

  return (<div id={id} style={{
    position: 'relative',
    paddingRight: '15px',
    paddingLeft: '15px',
    marginBottom: 'var(--spacing-md)',
    flex: '0 0 auto',
    width: '33.33333333%'
  }}>
    <div style={{
      textAlign: 'center',
      borderRadius: '.25rem',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border-color)',
      padding: 'var(--spacing-xs)'
    }}>
      <a
        href={companyDivMetadata.href}
        title={companyDivMetadata.name}
        style={{ display: 'block' }}>
        <div>
          <img
            src={companyDivMetadata.titleImage.src}
            title={companyDivMetadata.name}
            alt={companyDivMetadata.name}
            height={companyDivMetadata.titleImage.height}
            width={companyDivMetadata.titleImage.width}
            className={companyDivMetadata.titleImage.class} />
        </div>
        <div>
          <h5>{companyDivMetadata.name}</h5>
          {company.graphSvgSparkline()}
        </div>
      </a>
    </div>
  </div >)
}