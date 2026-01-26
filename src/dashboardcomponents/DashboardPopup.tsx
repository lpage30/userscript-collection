import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dashboard, DashboardProps } from './Dashboard';

interface DashboardPopupProps {
    dashboardShortName: string
    dashboardProps: DashboardProps
}

export const DashboardPopup: React.FC<DashboardPopupProps> = ({
    dashboardShortName,
    dashboardProps,
}) => {
  const [visible, setVisible] = useState<boolean>(false)

  const toggleDashboard = () => {
    setVisible(!visible)
  }
  const render = () => {

    return (<>
      <Button
        className={'app-button'}
        onClick={toggleDashboard}
      >Toggle {dashboardShortName}</Button>
      {visible && <Dashboard
        title={dashboardProps.title}
        getCards={dashboardProps.getCards}
        cardLoadingAPI={dashboardProps.cardLoadingAPI}
        onCardsLoaded={dashboardProps.onCardsLoaded}
        onDisplayedCards={dashboardProps.onDisplayedCards}
        onCardSelected={dashboardProps.onCardSelected}
        style={dashboardProps.style}
        modal={dashboardProps.modal}
        contentLayout={dashboardProps.contentLayout}
        registerVisibleFunction={dashboardProps.registerVisibleFunction}
        registerLoadFunction={dashboardProps.registerLoadFunction}
        registerRerenderFunction={dashboardProps.registerRerenderFunction}
        registerSetFocusFunction={dashboardProps.registerSetFocusFunction}
        onVisibleChange={dashboardProps.onVisibleChange}
        onClose={() => {
            setVisible(false)
            if (dashboardProps.onClose) dashboardProps.onClose()
        }}
        addedHeaderComponents={dashboardProps.addedHeaderComponents}
        closeable={dashboardProps.closeable}
        features={dashboardProps.features}
      />}
    </>)
  }
  return render()
}